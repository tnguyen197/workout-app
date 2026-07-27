import { freshState, DAY_PALETTE } from './seed';

const KEY = 'gym-log-v1';

export function loadState() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.exercises || !parsed.days) return freshState();
    const merged = {
      ...freshState(),
      ...parsed,
      settings: { ...freshState().settings, ...(parsed.settings || {}) },
    };
    // Data saved before per-day colours existed has no colour field.
    merged.days = merged.days.map((d, i) => ({
      ...d,
      color: d.color || DAY_PALETTE[i % DAY_PALETTE.length],
    }));
    return merged;
  } catch {
    return freshState();
  }
}

export function saveState(state) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Quota or private-mode failure. The in-memory state still works
    // for this session; nothing useful to do here.
  }
}

/** Hex to rgba, for tinted fills built from a day's colour. */
export function tint(hex, alpha) {
  const h = (hex || '#F0B429').replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

// --- dates -----------------------------------------------------------------

export function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Monday-based week start
export function weekStart(d = new Date()) {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - dow);
  return copy;
}

export function weekDays(offset = 0) {
  const start = weekStart();
  start.setDate(start.getDate() + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export function relativeDay(key) {
  if (!key) return 'never';
  const then = parseKey(key);
  const now = new Date();
  const days = Math.round(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()) - then) / 86400000
  );
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return 'last week';
  return `${Math.floor(days / 7)} weeks ago`;
}

// --- derived ---------------------------------------------------------------

/** Which day templates use this exercise, excluding the one given. */
export function otherDaysUsing(days, exerciseId, exceptDayId) {
  return days
    .filter((d) => d.id !== exceptDayId && d.exerciseIds.includes(exerciseId))
    .map((d) => d.name);
}

export function lastSessionFor(sessions, dayId) {
  const matching = sessions
    .filter((s) => s.dayId === dayId)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  return matching[0] || null;
}

/** Chronological weight history for one exercise variant. */
export function historyFor(sessions, exerciseId, variantId) {
  return sessions
    .filter((s) => s.weights?.[exerciseId]?.[variantId] != null)
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map((s) => ({ date: s.date, weight: s.weights[exerciseId][variantId] }));
}

export function trainedDates(sessions) {
  return new Set(sessions.map((s) => s.date));
}
