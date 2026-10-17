export type Mode = 'time' | 'landings' | 'duration';

/** Longest digit string accepted on the keypad (9999:59 or 999999 landings). */
export const MAX_DIGITS = 6;

/** Clock times are entered as HHMM. */
export const CLOCK_DIGITS = 4;

const MINUTES_PER_DAY = 24 * 60;

/**
 * Parse keypad digits into a value.
 * Time mode: digits are H…HMM, e.g. "120" → 80 minutes (1:20). Minutes ≥ 60
 * overflow into hours, so "95" → 1:35.
 * Landings mode: plain integer count.
 * Time and duration values are stored as total minutes.
 */
export function parseInput(input: string, mode: Mode): number {
  if (!input) return 0;
  const value = parseInt(input, 10);
  if (mode === 'landings') return value;
  const hours = Math.floor(value / 100);
  const minutes = value % 100;
  return hours * 60 + minutes;
}

export function formatValue(value: number, mode: Mode): string {
  if (mode === 'landings') return String(value);
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${hours}:${String(minutes).padStart(2, '0')}`;
}

/** Turn a stored value back into keypad digits for editing. */
export function valueToInput(value: number, mode: Mode): string {
  if (mode === 'landings') return String(value);
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return String(hours * 100 + minutes);
}

export function total(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0);
}

/** Decimal hours, as some logbooks and airlines record time (e.g. 1:20 → 1.33). */
export function formatDecimalHours(minutes: number): string {
  return (minutes / 60).toFixed(2);
}

export function appendDigit(input: string, digit: string): string {
  if (input.length >= MAX_DIGITS) return input;
  if (input === '0') return digit;
  return input + digit;
}

/** Parse HHMM digits as a time of day in minutes since midnight, or null if not a valid clock time. */
export function parseClock(input: string): number | null {
  if (!input) return null;
  const value = parseInt(input, 10);
  const hours = Math.floor(value / 100);
  const minutes = value % 100;
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** Show HHMM digits as a clock time while typing, e.g. "815" → "08:15". */
export function formatClockInput(input: string): string {
  const value = parseInt(input || '0', 10);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(value / 100))}:${pad(value % 100)}`;
}

export function formatClock(minutesOfDay: number): string {
  return formatClockInput(clockToInput(minutesOfDay));
}

export function clockToInput(minutesOfDay: number): string {
  const value = Math.floor(minutesOfDay / 60) * 100 + (minutesOfDay % 60);
  return String(value).padStart(CLOCK_DIGITS, '0');
}

/** Minutes from one clock time to another; an end before the start is taken as the next day. */
export function durationBetween(from: number, to: number): number {
  return (to - from + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}
