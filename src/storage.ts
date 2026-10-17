import type { Mode } from './calc';

export interface Entry {
  id: number;
  value: number;
}

export interface SavedState {
  mode: Mode;
  entries: Record<Mode, Entry[]>;
}

const KEY = 'logcalc:v1';

export function loadState(): SavedState {
  const empty: SavedState = { mode: 'time', entries: { time: [], landings: [] } };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<SavedState>;
    const valid = (list: unknown): Entry[] =>
      Array.isArray(list)
        ? list.filter((e): e is Entry => typeof e?.id === 'number' && Number.isInteger(e?.value) && e.value >= 0)
        : [];
    return {
      mode: parsed.mode === 'landings' ? 'landings' : 'time',
      entries: { time: valid(parsed.entries?.time), landings: valid(parsed.entries?.landings) },
    };
  } catch {
    return empty;
  }
}

export function saveState(state: SavedState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable (private mode); the calculator still works for this session.
  }
}
