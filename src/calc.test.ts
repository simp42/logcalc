import { describe, expect, it } from 'vitest';
import {
  appendDigit,
  clockToInput,
  durationBetween,
  formatClock,
  formatClockInput,
  formatDecimalHours,
  formatValue,
  parseClock,
  parseInput,
  total,
  valueToInput,
} from './calc';

describe('time mode', () => {
  it('parses H:MM digits', () => {
    expect(parseInput('120', 'time')).toBe(80);
    expect(parseInput('5', 'time')).toBe(5);
    expect(parseInput('1005', 'time')).toBe(605);
    expect(parseInput('', 'time')).toBe(0);
  });

  it('overflows minutes ≥ 60 into hours', () => {
    expect(formatValue(parseInput('95', 'time'), 'time')).toBe('1:35');
    expect(formatValue(parseInput('199', 'time'), 'time')).toBe('2:39');
  });

  it('formats totals', () => {
    const values = ['120', '045', '1230'].map((s) => parseInput(s, 'time'));
    expect(formatValue(total(values), 'time')).toBe('14:35');
    expect(formatValue(0, 'time')).toBe('0:00');
  });

  it('round-trips through edit input', () => {
    expect(valueToInput(parseInput('1230', 'time'), 'time')).toBe('1230');
    expect(valueToInput(parseInput('95', 'time'), 'time')).toBe('135');
    expect(valueToInput(5, 'time')).toBe('5');
  });

  it('formats decimal hours', () => {
    expect(formatDecimalHours(80)).toBe('1.33');
  });
});

describe('landings mode', () => {
  it('parses integers', () => {
    expect(parseInput('12', 'landings')).toBe(12);
    expect(formatValue(total([3, 4, 1]), 'landings')).toBe('8');
    expect(valueToInput(7, 'landings')).toBe('7');
  });
});

describe('appendDigit', () => {
  it('limits length and drops a leading zero', () => {
    expect(appendDigit('0', '5')).toBe('5');
    expect(appendDigit('123456', '7')).toBe('123456');
    expect(appendDigit('12', '0')).toBe('120');
  });
});

describe('duration mode', () => {
  it('parses clock times', () => {
    expect(parseClock('0815')).toBe(495);
    expect(parseClock('815')).toBe(495);
    expect(parseClock('0')).toBe(0);
    expect(parseClock('2359')).toBe(1439);
    expect(parseClock('2400')).toBeNull();
    expect(parseClock('0860')).toBeNull();
    expect(parseClock('')).toBeNull();
  });

  it('formats clock times', () => {
    expect(formatClockInput('815')).toBe('08:15');
    expect(formatClockInput('')).toBe('00:00');
    expect(formatClock(495)).toBe('08:15');
    expect(clockToInput(495)).toBe('0815');
    expect(clockToInput(0)).toBe('0000');
  });

  it('computes the duration between two times', () => {
    expect(formatValue(durationBetween(parseClock('0815')!, parseClock('1032')!), 'duration')).toBe('2:17');
    expect(formatValue(durationBetween(parseClock('2250')!, parseClock('0115')!), 'duration')).toBe('2:25');
    expect(durationBetween(600, 600)).toBe(0);
  });
});
