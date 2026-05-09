import React, { useRef, useEffect } from 'react';

/**
 * ScoreInput — Input numérico estilizado (0-99) con efecto glow al focus.
 */
export default function ScoreInput({ value, onChange, disabled = false, id }) {
  const inputRef = useRef(null);

  function handleChange(e) {
    const raw = e.target.value;
    if (raw === '') {
      onChange('');
      return;
    }
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num >= 0 && num <= 99) {
      onChange(num);
    }
  }

  function handleKeyDown(e) {
    // Arrow keys to increment/decrement
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const current = value === '' ? -1 : value;
      if (current < 99) onChange(current + 1);
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const current = value === '' ? 1 : value;
      if (current > 0) onChange(current - 1);
    }
  }

  return (
    <div className={`score-input-wrapper ${disabled ? 'score-input-disabled' : ''}`}>
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        className="score-input"
        value={value === '' ? '' : value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        maxLength={2}
        placeholder="—"
        autoComplete="off"
      />
    </div>
  );
}
