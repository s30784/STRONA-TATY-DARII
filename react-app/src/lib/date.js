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
