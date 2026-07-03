export function todayStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function formatDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export function monthRange(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthStr = String(month + 1).padStart(2, '0');
  const days = new Date(year, month + 1, 0).getDate();
  return {
    year,
    month,
    from: `${year}-${monthStr}-01`,
    to: `${year}-${monthStr}-${String(days).padStart(2, '0')}`,
    days
  };
}

export function dateOnly(value) {
  return value ? String(value).slice(0, 10) : '';
}

export function dateFromParts(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function addDays(dateStr, days) {
  const date = new Date(`${dateStr}T12:00:00`);
  date.setDate(date.getDate() + days);
  return dateFromParts(date);
}

export function daysInclusive(startDate, endDate) {
  if (!startDate || !endDate || endDate < startDate) return 0;
  const from = new Date(`${startDate}T12:00:00`);
  const to = new Date(`${endDate}T12:00:00`);
  return Math.round((to - from) / 86400000) + 1;
}
