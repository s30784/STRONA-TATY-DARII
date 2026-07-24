const RESEND_API_URL = 'https://api.resend.com/emails';

type AdminEmailInput = {
  subject: string;
  replyTo?: string;
  text: string;
};

function envValue(name: string) {
  return String(Deno.env.get(name) || '').trim();
}

export async function sendAdminEmail({ subject, replyTo, text }: AdminEmailInput) {
  const apiKey = envValue('RESEND_API_KEY');
  const to = envValue('ADMIN_NOTIFICATION_EMAIL');
  const from = envValue('MAIL_FROM');

  if (!apiKey || !to || !from) {
    console.warn('admin notification email skipped: missing Resend configuration');
    return false;
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        text,
        reply_to: replyTo || undefined
      })
    });

    if (!response.ok) {
      console.error('admin notification email failed', {
        status: response.status
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error('admin notification email failed', error instanceof Error ? error.message : error);
    return false;
  }
}
