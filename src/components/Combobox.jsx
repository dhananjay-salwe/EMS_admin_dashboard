import React, { useState, useRef, useEffect } from 'react';

const IconChevron = (props) => (
  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" {...props}>
    <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * A styled, searchable dropdown that allows free text (so new values like a
 * brand-new state or LGA can still be typed) while suggesting existing
 * options. Replaces <input list="..."> + <datalist>, whose suggestion popup
 * is rendered by the browser/OS and can't be restyled with CSS.
 */
export default function Combobox({
  value,
  onChange,
  options = [],
  placeholder = '',
  disabled = false,
  required = false,
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = value
    ? options.filter(o => o.toLowerCase().includes(value.toLowerCase()))
    : options;

  const selectOption = (opt) => {
    onChange(opt);
    setOpen(false);
  };

  return (
    <div className={`combobox ${disabled ? 'disabled' : ''}`} ref={wrapRef}>
      <input
        type="text"
        className="form-control combobox-input"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onKeyDown={e => { if (e.key === 'Escape') setOpen(false); }}
      />
      <button
        type="button"
        className="combobox-toggle"
        tabIndex={-1}
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        aria-label="Toggle options"
      >
        <IconChevron className={open ? 'combobox-chevron open' : 'combobox-chevron'} />
      </button>

      {open && !disabled && (
        <div className="combobox-panel">
          {filtered.length > 0 ? (
            filtered.map(opt => (
              <button
                type="button"
                key={opt}
                className={`combobox-option ${opt === value ? 'selected' : ''}`}
                onClick={() => selectOption(opt)}
              >
                {opt}
              </button>
            ))
          ) : (
            <div className="combobox-empty">
              {value ? `No match — "${value}" will be saved as new` : 'No options yet'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
