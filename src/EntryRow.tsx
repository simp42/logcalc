import { useRef, useState } from 'react';

interface Props {
  index: number;
  value: string;
  /** Secondary text shown after the value, e.g. the from–to clock times. */
  detail?: string;
  running: string;
  editing: boolean;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onTap: () => void;
  onDelete: () => void;
}

const ACTION_WIDTH = 88;

/** List row: tap to edit, swipe left to reveal Delete (or swipe far to delete). */
export function EntryRow({ index, value, detail, running, editing, open, onOpen, onClose, onTap, onDelete }: Props) {
  const [dragX, setDragX] = useState<number | null>(null);
  const start = useRef<{ x: number; y: number; base: number } | null>(null);
  const dragged = useRef(false);
  const rowRef = useRef<HTMLLIElement>(null);

  const offset = dragX ?? (open ? -ACTION_WIDTH : 0);

  return (
    <li
      ref={rowRef}
      className={`row ${editing ? 'editing' : ''}`}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button className="row-delete" tabIndex={open ? 0 : -1} onClick={onDelete}>
        Delete
      </button>
      <div
        className={`row-content ${dragX === null ? 'animate' : ''}`}
        style={{ transform: `translateX(${offset}px)` }}
        role="button"
        tabIndex={0}
        aria-label={`Entry ${index + 1}: ${value}${detail ? ` (${detail})` : ''}. Tap to edit.`}
        onKeyDown={(e) => {
          if (e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            onTap();
          }
        }}
        onPointerDown={(e) => {
          start.current = { x: e.clientX, y: e.clientY, base: open ? -ACTION_WIDTH : 0 };
          dragged.current = false;
          if (!open) onClose();
        }}
        onPointerMove={(e) => {
          const s = start.current;
          if (!s) return;
          const dx = e.clientX - s.x;
          const dy = e.clientY - s.y;
          if (!dragged.current) {
            if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
            dragged.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
          }
          setDragX(Math.min(0, s.base + dx));
        }}
        onPointerUp={() => {
          const s = start.current;
          start.current = null;
          if (!s) return;
          if (!dragged.current) {
            if (open) onClose();
            else onTap();
            return;
          }
          const x = dragX ?? 0;
          const width = rowRef.current?.offsetWidth ?? 400;
          setDragX(null);
          if (x < -width * 0.6) onDelete();
          else if (x < -ACTION_WIDTH / 2) onOpen();
          else onClose();
        }}
        onPointerCancel={() => {
          start.current = null;
          setDragX(null);
        }}
      >
        <span className="row-index">{index + 1}</span>
        <span className="row-value">
          {value}
          {detail && <span className="row-detail">{detail}</span>}
        </span>
        <span className="row-running">{running}</span>
      </div>
    </li>
  );
}
