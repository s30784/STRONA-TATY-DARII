const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function trimValue(value) {
  return String(value || '').trim();
}

export function isValidEmail(value) {
  return EMAIL_RE.test(trimValue(value));
}

export function isPositiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0;
}

export function field(form, name) {
  return trimValue(form.get(name));
}

export function validateRequired(value, label) {
  if (!trimValue(value)) return `${label} jest wymagane.`;
  return null;
}

export function validateEmail(value) {
  if (!trimValue(value)) return 'Email jest wymagany.';
  if (!isValidEmail(value)) return 'Podaj poprawny adres email.';
  return null;
}

export function validatePhone(value) {
  if (!trimValue(value)) return 'Telefon jest wymagany.';
  return null;
}

export function validateSeats(value) {
  if (!isPositiveInteger(value)) return 'Liczba miejsc musi być większa od 0.';
  return null;
}
