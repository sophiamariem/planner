export function defaultDayTitle(index, total) {
  if (index === 0) return 'Arrival';
  if (index === total - 1) return 'Departure';
  return `Day ${index + 1}`;
}

export function normalizeDayTitle(title, index, total) {
  const raw = String(title || '').trim();
  if (!raw || /^day\s+nan$/i.test(raw)) return defaultDayTitle(index, total);
  return raw;
}

export function parseIsoDate(value) {
  const s = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function shortDow(date) {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
}

export function shortMonth(date) {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
}

export function getDayNavLabel(day, index) {
  const dow = String(day?.dow || '').trim();
  const date = String(day?.date || '').trim();
  if (dow && date) return `${dow} ${date}`;
  if (date) return date;
  const iso = parseIsoDate(day?.isoDate);
  if (iso) return `${shortDow(iso)} ${iso.getDate()} ${shortMonth(iso)}`;
  return `Day ${index + 1}`;
}

export function toIsoDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseFlightDateCandidates(text, fallbackYear) {
  const monthMap = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
  const src = String(text || '');
  const parsed = [];
  const withYear = [...src.matchAll(/(\d{1,2})\s*([A-Za-z]{3,9})\s*(20\d{2})/g)];
  for (const m of withYear) {
    const day = Number(m[1]);
    const month = monthMap[m[2].slice(0, 3).toLowerCase()];
    const year = Number(m[3]);
    if (month === undefined || !Number.isFinite(day) || !Number.isFinite(year)) continue;
    const d = new Date(year, month, day);
    if (!Number.isNaN(d.getTime())) parsed.push(d);
  }
  if (parsed.length) return parsed;

  const year = Number.isFinite(fallbackYear) ? fallbackYear : new Date().getFullYear();
  const withoutYear = [...src.matchAll(/(\d{1,2})\s*([A-Za-z]{3,9})/g)];
  for (const m of withoutYear) {
    const day = Number(m[1]);
    const month = monthMap[m[2].slice(0, 3).toLowerCase()];
    if (month === undefined || !Number.isFinite(day)) continue;
    const d = new Date(year, month, day);
    if (!Number.isNaN(d.getTime())) parsed.push(d);
  }
  return parsed;
}

function parseDayLabelDate(label, cursorDate, fallbackYear) {
  const monthMap = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
  const m = String(label || '').trim().match(/(\d{1,2})\s+([A-Za-z]{3,9})/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = monthMap[m[2].slice(0, 3).toLowerCase()];
  if (!Number.isFinite(day) || month === undefined) return null;
  const year = Number.isFinite(fallbackYear) ? fallbackYear : (cursorDate ? cursorDate.getFullYear() : new Date().getFullYear());
  let d = new Date(year, month, day);
  if (cursorDate && d < cursorDate) d = new Date(year + 1, month, day);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function normalizeDaysWithInferredDates(days = [], flights = [], calendarYear) {
  const result = [];
  const candidates = flights.flatMap((f) => parseFlightDateCandidates(f?.date, calendarYear));
  candidates.sort((a, b) => a.getTime() - b.getTime());
  let cursor = candidates[0] ? new Date(candidates[0]) : null;

  for (let i = 0; i < days.length; i += 1) {
    const day = { ...(days[i] || {}) };
    const explicit = parseIsoDate(day.isoDate);
    let resolved = explicit ? new Date(explicit) : null;
    if (!resolved) resolved = parseDayLabelDate(day.date, cursor, calendarYear);
    if (!resolved && cursor) resolved = new Date(cursor);
    if (!resolved && candidates[0]) {
      resolved = new Date(candidates[0]);
      resolved.setDate(resolved.getDate() + i);
    }
    if (resolved) {
      day.isoDate = toIsoDate(resolved);
      day.dow = shortDow(resolved);
      day.date = `${resolved.getDate()} ${shortMonth(resolved)}`;
      cursor = new Date(resolved);
      cursor.setDate(cursor.getDate() + 1);
    }
    result.push(day);
  }
  return result;
}

export function formatStartDate(days) {
  const start = (days || []).map((d) => d.isoDate).filter(Boolean).sort()[0];
  if (!start) return null;
  const date = new Date(`${start}T00:00:00`);
  if (Number.isNaN(date.getTime())) return start;
  return date.toDateString();
}
