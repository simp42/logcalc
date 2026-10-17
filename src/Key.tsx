import type { ReactNode } from 'react';
import { useState } from 'react';

interface Props {
  children: ReactNode;
  onPress: () => void;
  className?: string;
  label?: string;
  disabled?: boolean;
}

/**
 * Keypad button that fires on pointer down, so fast typing never loses a tap
 * to the browser's click heuristics. Keyboard activation still works via click.
 */
export function Key({ children, onPress, className = '', label, disabled }: Props) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      type="button"
      className={`key ${className} ${pressed ? 'pressed' : ''}`}
      aria-label={label}
      disabled={disabled}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        setPressed(true);
        onPress();
      }}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      onClick={(e) => {
        if (e.detail === 0) onPress();
      }}
    >
      {children}
    </button>
  );
}
