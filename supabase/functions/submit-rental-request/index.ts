import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendAdminEmail } from '../_shared/sendAdminEmail.ts';

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const RATE_LIMIT_MESSAGE = 'Wysłano zbyt wiele zapytań. Spróbuj ponownie później albo zadzwoń: 663 063 364.';
const TURNSTILE_FAILED_MESSAGE = 'Nie udało się potwierdzić zabezpieczenia antyspamowego. Spróbuj ponownie.';
const ADMIN_PANEL_URL = 'https://busyjaroslaw.pl/admin';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
}

function normalizedText(value: unknown) {
  return String(value || '').trim();
}

function normalizeEmail(value: unknown) {
  return normalizedText(value).toLowerCase();
}

function required(value: unknown) {
  return normalizedText(value).length > 0;
}

function displayValue(value: unknown) {
  return normalizedText(value) || '-';
}

function requestIdFrom(data: unknown) {
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object' && 'id' in data) {
    return String((data as { id?: unknown }).id || '');
  }
  return data ? String(data) : '';
}

function buildRentalMessage(fields: {
  customerName: string;
  phone: string;
  email: string;
  busId: string;
  startDate: string;
  endDate: string;
  passengerCount: string;
  routeDescription: string;
  rentalPurpose: string;
  customerMessage: string;
}) {
  return [
    `Imię i nazwisko: ${displayValue(fields.customerName)}`,
    `Telefon: ${displayValue(fields.phone)}`,
    `Email: ${displayValue(fields.email)}`,
    `Bus: ${displayValue(fields.busId)}`,
    `Data od: ${displayValue(fields.startDate)}`,
    `Data do: ${displayValue(fields.endDate)}`,
    `Liczba osób: ${displayValue(fields.passengerCount)}`,
    `Trasa / plan: ${displayValue(fields.routeDescription)}`,
    `Cel wynajmu: ${displayValue(fields.rentalPurpose)}`,
    `Wiadomość klienta: ${displayValue(fields.customerMessage)}`
  ].join('\n');
}

function buildAdminEmailText(type: string, requestId: string, message: string) {
  return [
    `Typ zapytania: ${type}`,
    `ID zapytania: ${displayValue(requestId)}`,
    '',
    message,
    '',
    `Panel admina: ${ADMIN_PANEL_URL}`
  ].join('\n');
}

function requestIp(request: Request) {
  return normalizedText(request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')).split(',')[0];
}

async function verifyTurnstile(token: string, request: Request) {
  const secret = Deno.env.get('TURNSTILE_SECRET_KEY');
  if (!secret) return { ok: false, status: 500 };

  const params = new URLSearchParams();
  params.set('secret', secret);
  params.set('response', token);
  const ip = requestIp(request);
  if (ip) params.set('remoteip', ip);

  const response = await fetch(TURNSTILE_VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });

  if (!response.ok) return { ok: false, status: 403 };
  const payload = await response.json().catch(() => null);
  return { ok: payload?.success === true, status: payload?.success === true ? 200 : 403 };
}

function supabaseAdmin() {
  const url = Deno.env.get('EDGE_SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('EDGE_SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceRoleKey) throw new Error('missing_edge_supabase_config');

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

async function countRecent(
  supabase: ReturnType<typeof supabaseAdmin>,
  table: string,
  column: string,
  value: string,
  sinceIso: string
) {
  if (!value) return 0;
  const { count, error } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq(column, value)
    .gte('created_at', sinceIso);

  if (error) throw error;
  return count || 0;
}

async function isRateLimited(supabase: ReturnType<typeof supabaseAdmin>, email: string, phone: string) {
  const now = Date.now();
  const hourAgo = new Date(now - 60 * 60 * 1000).toISOString();
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  const [emailHour, phoneHour, emailDay, phoneDay] = await Promise.all([
    countRecent(supabase, 'rental_requests', 'email', email, hourAgo),
    countRecent(supabase, 'rental_requests', 'phone', phone, hourAgo),
    countRecent(supabase, 'rental_requests', 'email', email, dayAgo),
    countRecent(supabase, 'rental_requests', 'phone', phone, dayAgo)
  ]);

  return emailHour >= 3 || phoneHour >= 3 || emailDay >= 10 || phoneDay >= 10;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse(405, { success: false, message: 'Metoda nie jest obsługiwana.' });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return jsonResponse(400, { success: false, message: 'Niepoprawne dane formularza.' });
    }

    const turnstileToken = normalizedText(body.turnstileToken);
    const p_bus_id = normalizedText(body.p_bus_id);
    const p_start_date = normalizedText(body.p_start_date);
    const p_end_date = normalizedText(body.p_end_date);
    const p_phone = normalizedText(body.p_phone);
    const p_email = normalizeEmail(body.p_email);
    const customer_name = normalizedText(body.customer_name);
    const route_description = normalizedText(body.route_description);
    const passenger_count = normalizedText(body.passenger_count);
    const rental_purpose = normalizedText(body.rental_purpose);
    const customerMessage = normalizedText(body.p_message);

    if (!required(turnstileToken) || !required(p_bus_id) || !required(p_start_date) || !required(p_end_date) || !required(p_phone) || !required(p_email) || !required(customer_name) || !required(route_description) || !required(passenger_count)) {
      return jsonResponse(400, { success: false, message: 'Uzupełnij wymagane pola formularza.' });
    }

    if (!(Number(passenger_count) > 0)) {
      return jsonResponse(400, { success: false, message: 'Liczba osób musi być większa od zera.' });
    }

    const turnstile = await verifyTurnstile(turnstileToken, request);
    if (turnstile.status === 500) {
      return jsonResponse(500, { success: false, message: 'Nie udało się wysłać zapytania. Spróbuj ponownie.' });
    }
    if (!turnstile.ok) {
      return jsonResponse(403, { success: false, message: TURNSTILE_FAILED_MESSAGE });
    }

    const supabase = supabaseAdmin();
    if (await isRateLimited(supabase, p_email, p_phone)) {
      return jsonResponse(429, { success: false, message: RATE_LIMIT_MESSAGE });
    }

    const finalMessage = buildRentalMessage({
      customerName: customer_name,
      phone: p_phone,
      email: p_email,
      busId: p_bus_id,
      startDate: p_start_date,
      endDate: p_end_date,
      passengerCount: passenger_count,
      routeDescription: route_description,
      rentalPurpose: rental_purpose,
      customerMessage
    });

    const { data, error } = await supabase.rpc('create_rental_request', {
      p_bus_id,
      p_start_date,
      p_end_date,
      p_phone,
      p_email,
      p_message: finalMessage
    });

    if (error) {
      console.error('create_rental_request failed', error);
      return jsonResponse(400, { success: false, message: `Nie udało się wysłać zapytania: ${error.message}` });
    }

    const requestId = requestIdFrom(data);
    const emailSent = await sendAdminEmail({
      subject: 'Nowe zapytanie o wynajem busa — Busy Jarosław',
      replyTo: p_email,
      text: buildAdminEmailText('Wynajem busa', requestId, finalMessage)
    });

    return jsonResponse(200, { success: true, request_id: requestId || data, email_sent: emailSent });
  } catch (error) {
    console.error('submit-rental-request failed', error);
    return jsonResponse(500, { success: false, message: 'Nie udało się wysłać zapytania. Spróbuj ponownie.' });
  }
});
