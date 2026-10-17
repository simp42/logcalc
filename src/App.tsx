import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Mode } from './calc';
import {
  appendDigit,
  CLOCK_DIGITS,
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
import type { Entry } from './storage';
import { loadState, saveState } from './storage';
import { EntryRow } from './EntryRow';
import { Key } from './Key';

interface Undo {
  message: string;
  mode: Mode;
  entries: Entry[];
}

type ClockField = 'from' | 'to';

interface Clock {
  from: string;
  to: string;
  field: ClockField;
}

const MODE_LABELS: Record<Mode, string> = { time: 'Time', landings: 'Landings', duration: 'Duration' };
const EMPTY_CLOCK: Clock = { from: '', to: '', field: 'from' };

export default function App() {
  const [initial] = useState(loadState);
  const [mode, setMode] = useState<Mode>(initial.mode);
  const [entries, setEntries] = useState<Record<Mode, Entry[]>>(initial.entries);
  const [input, setInput] = useState('');
  const [clock, setClock] = useState<Clock>(EMPTY_CLOCK);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [openRowId, setOpenRowId] = useState<number | null>(null);
  const [undo, setUndo] = useState<Undo | null>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const scrollToEnd = useRef(false);

  const list = entries[mode];
  const sum = total(list.map((e) => e.value));
  const editingIndex = list.findIndex((e) => e.id === editingId);
  const isClock = mode === 'duration';

  const from = parseClock(clock.from);
  const to = parseClock(clock.to);
  const duration = from !== null && to !== null ? durationBetween(from, to) : null;
  const activeClockInput = clock[clock.field];
  const activeClockValid = parseClock(activeClockInput) !== null;

  useEffect(() => saveState({ mode, entries }), [mode, entries]);

  useEffect(() => {
    if (!undo) return;
    const t = setTimeout(() => setUndo(null), 6000);
    return () => clearTimeout(t);
  }, [undo]);

  useLayoutEffect(() => {
    if (scrollToEnd.current && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
      scrollToEnd.current = false;
    }
  }, [list]);

  const setList = useCallback(
    (update: (prev: Entry[]) => Entry[]) => setEntries((prev) => ({ ...prev, [mode]: update(prev[mode]) })),
    [mode],
  );

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setInput('');
    setClock(EMPTY_CLOCK);
  }, []);

  const pressDigit = useCallback(
    (d: string) => {
      if (!isClock) {
        setInput((s) => appendDigit(s, d));
        return;
      }
      setClock((c) => {
        const current = c[c.field];
        // Leading zeros count towards HHMM ("0815"). A full field (e.g. loaded for
        // editing) is overwritten rather than ignored.
        const next = current.length >= CLOCK_DIGITS ? d : current + d;
        const advance = c.field === 'from' && next.length === CLOCK_DIGITS && parseClock(next) !== null;
        return { ...c, [c.field]: next, field: advance ? 'to' : c.field };
      });
    },
    [isClock],
  );

  const pressBackspace = useCallback(() => {
    if (!isClock) {
      setInput((s) => s.slice(0, -1));
      return;
    }
    setClock((c) => {
      // Backspace in an empty "to" field steps back into "from".
      if (c.field === 'to' && !c.to) return { ...c, from: c.from.slice(0, -1), field: 'from' };
      return { ...c, [c.field]: c[c.field].slice(0, -1) };
    });
  }, [isClock]);

  const pressClear = cancelEdit;

  const selectField = useCallback((field: ClockField) => setClock((c) => ({ ...c, field })), []);

  const commit = useCallback(
    (fields: Omit<Entry, 'id'>) => {
      if (editingId !== null) {
        setList((prev) => prev.map((e) => (e.id === editingId ? { id: e.id, ...fields } : e)));
        setEditingId(null);
      } else {
        scrollToEnd.current = true;
        setList((prev) => [...prev, { id: Date.now() + Math.random(), ...fields }]);
      }
    },
    [editingId, setList],
  );

  const pressEnter = useCallback(() => {
    if (!isClock) {
      if (!input) return;
      commit({ value: parseInput(input, mode) });
      setInput('');
      return;
    }
    if (clock.field === 'from') {
      if (from !== null) setClock((c) => ({ ...c, field: 'to' }));
      return;
    }
    if (to === null) return;
    if (from === null) {
      setClock((c) => ({ ...c, field: 'from' }));
      return;
    }
    commit({ value: durationBetween(from, to), from, to });
    setClock(EMPTY_CLOCK);
  }, [isClock, input, mode, clock.field, from, to, commit]);

  const editRow = (entry: Entry) => {
    setOpenRowId(null);
    if (entry.id === editingId) {
      cancelEdit();
      return;
    }
    setEditingId(entry.id);
    if (isClock) {
      setClock({
        from: entry.from !== undefined ? clockToInput(entry.from) : '',
        to: entry.to !== undefined ? clockToInput(entry.to) : '',
        field: 'from',
      });
    } else {
      setInput(valueToInput(entry.value, mode));
    }
  };

  const deleteRow = (entry: Entry) => {
    const index = list.indexOf(entry);
    setUndo({ message: `Deleted #${index + 1} (${formatValue(entry.value, mode)})`, mode, entries: list });
    setList((prev) => prev.filter((e) => e.id !== entry.id));
    setOpenRowId(null);
    if (entry.id === editingId) cancelEdit();
  };

  const clearAll = () => {
    if (!list.length) {
      cancelEdit();
      return;
    }
    setUndo({ message: `Cleared ${list.length} ${list.length === 1 ? 'entry' : 'entries'}`, mode, entries: list });
    setList(() => []);
    setOpenRowId(null);
    cancelEdit();
  };

  const restore = () => {
    if (!undo) return;
    setEntries((prev) => ({ ...prev, [undo.mode]: undo.entries }));
    setMode(undo.mode);
    setUndo(null);
  };

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    setOpenRowId(null);
    cancelEdit();
  };

  // Hardware keyboard support (iPad keyboard, desktop).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^[0-9]$/.test(e.key)) pressDigit(e.key);
      else if (e.key === 'Backspace') pressBackspace();
      else if (e.key === 'Enter' || e.key === '=' || e.key === '+') pressEnter();
      else if (e.key === 'Escape' || e.key === 'Delete' || e.key.toLowerCase() === 'c') pressClear();
      else if (e.key === 'Tab' && isClock) selectField(e.shiftKey ? 'from' : 'to');
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pressDigit, pressBackspace, pressEnter, pressClear, selectField, isClock]);

  let enterLabel = editingId !== null ? 'Update' : 'Enter';
  let enterDisabled = !input;
  if (isClock) {
    enterDisabled = !activeClockValid;
    if (clock.field === 'from') enterLabel = 'Next';
  }

  const hint = editingId !== null ? `Editing #${editingIndex + 1}` : mode === 'time' ? 'H:MM' : 'Landings';
  let running = 0;

  return (
    <div className={`app mode-${mode}`} onPointerDown={() => openRowId !== null && setOpenRowId(null)}>
      <header className="topbar">
        <div className="segmented" role="tablist" aria-label="Mode">
          {(Object.keys(MODE_LABELS) as Mode[]).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={m === mode}
              className={m === mode ? 'active' : ''}
              onClick={() => switchMode(m)}
            >
              {MODE_LABELS[m]}
              {entries[m].length > 0 && <span className="badge">{entries[m].length}</span>}
            </button>
          ))}
        </div>
        <button className="clear-all" onClick={clearAll}>
          Clear All
        </button>
      </header>

      <section className="entries" aria-label="Entries">
        {list.length === 0 ? (
          <div className="empty">
            {mode === 'time' && (
              <>
                Type a time as digits and press <b>Enter</b>.
                <br />
                <span className="example">
                  1 2 0 → 1:20 &nbsp;·&nbsp; 9 5 → 1:35
                </span>
              </>
            )}
            {mode === 'landings' && (
              <>
                Type the number of landings and press <b>Enter</b>.
              </>
            )}
            {mode === 'duration' && (
              <>
                Type the start and end times (off/on block or takeoff/landing).
                <br />
                <span className="example">0 8 1 5 · 1 0 3 2 → 2:17</span>
              </>
            )}
          </div>
        ) : (
          <ol className="list" ref={listRef}>
            {list.map((entry, i) => {
              running += entry.value;
              return (
                <EntryRow
                  key={entry.id}
                  index={i}
                  value={formatValue(entry.value, mode)}
                  detail={
                    isClock && entry.from !== undefined && entry.to !== undefined
                      ? `${formatClock(entry.from)} – ${formatClock(entry.to)}`
                      : undefined
                  }
                  running={formatValue(running, mode)}
                  editing={entry.id === editingId}
                  open={entry.id === openRowId}
                  onOpen={() => setOpenRowId(entry.id)}
                  onClose={() => setOpenRowId(null)}
                  onTap={() => editRow(entry)}
                  onDelete={() => deleteRow(entry)}
                />
              );
            })}
          </ol>
        )}
        <div className="total" aria-live="polite">
          <span className="total-label">
            Total
            <small>
              {list.length} {list.length === 1 ? 'entry' : 'entries'}
            </small>
          </span>
          <span className="total-value">
            {formatValue(sum, mode)}
            {mode !== 'landings' && <small>{formatDecimalHours(sum)} h</small>}
          </span>
        </div>
      </section>

      <section className="pad" aria-label="Keypad">
        {isClock ? (
          <div className={`display clock ${editingId !== null ? 'editing' : ''}`}>
            {(['from', 'to'] as const).map((field) => {
              const value = clock[field];
              const invalid =
                value !== '' &&
                parseClock(value) === null &&
                (value.length === CLOCK_DIGITS || clock.field !== field);
              return (
                <button
                  key={field}
                  type="button"
                  className={`clock-field ${clock.field === field ? 'active' : ''} ${invalid ? 'invalid' : ''}`}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    selectField(field);
                  }}
                  onClick={(e) => e.detail === 0 && selectField(field)}
                >
                  <span className="display-hint">{field === 'from' ? 'From' : 'To'}</span>
                  <span className={`clock-value ${value ? '' : 'placeholder'}`}>
                    {value ? formatClockInput(value) : '--:--'}
                  </span>
                </button>
              );
            })}
            <div className="clock-result">
              <span className="display-hint">{editingId !== null ? `Editing #${editingIndex + 1}` : 'Duration'}</span>
              <span className={`clock-value ${duration === null ? 'placeholder' : ''}`}>
                {duration === null ? '–:––' : formatValue(duration, mode)}
              </span>
              {duration !== null && to! < from! && <span className="overnight">+1 day</span>}
            </div>
          </div>
        ) : (
          <div className={`display ${editingId !== null ? 'editing' : ''}`}>
            <span className="display-hint">{hint}</span>
            <span className={`display-value ${input ? '' : 'placeholder'}`}>
              {formatValue(parseInput(input, mode), mode)}
            </span>
          </div>
        )}
        <div className="keys">
          {['7', '8', '9', '4', '5', '6', '1', '2', '3', '0'].map((d) => (
            <Key key={d} onPress={() => pressDigit(d)}>
              {d}
            </Key>
          ))}
          <Key className="fn" onPress={pressClear} label={editingId !== null ? 'Cancel edit' : 'Clear input'}>
            C
          </Key>
          <Key className="fn" onPress={pressBackspace} label="Backspace">
            ⌫
          </Key>
          <Key className="enter" onPress={pressEnter} disabled={enterDisabled}>
            {enterLabel}
          </Key>
        </div>
      </section>

      {undo && (
        <div className="toast" role="status">
          <span>{undo.message}</span>
          <button onClick={restore}>Undo</button>
        </div>
      )}
    </div>
  );
}
