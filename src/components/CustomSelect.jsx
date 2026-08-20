import React, { useState, useRef, useEffect } from 'react';

const IconChevron = (props) => (
  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" {...props}>
    <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function CustomSelect({
  value,
  onChange,
  options = [],
  className = '',
  placeholder = 'Select option...',
  disabled = false,
  isClearable = false,
  style = {}
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    if (disabled) return;
    onChange({ target: { value: val } });
    setOpen(false);
  };

  // Find selected option
  const selectedOpt = options.find(o => {
    if (typeof o === 'object' && o !== null) {
      return String(o.value) === String(value);
    }
    return String(o) === String(value);
  });

  const displayLabel = selectedOpt
    ? (typeof selectedOpt === 'object' ? (selectedOpt.label || selectedOpt.text || selectedOpt.value) : selectedOpt)
    : placeholder;

  // Check if we should render clear button
  const showClear = isClearable && value && !disabled;

  return (
    <div
      className={`custom-select-container ${className}`}
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'inline-block',
        width: '100%',
        ...style
      }}
    >
      <div
        className={`form-control ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && setOpen(!open)}
        style={{
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          userSelect: 'none',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          paddingRight: showClear ? '48px' : '30px', // leave room for clear button + chevron
          background: disabled ? '#f5f6f8' : '#fff'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayLabel}
        </span>
        <span style={{
          position: 'absolute',
          right: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#8f95a0'
        }}>
          {showClear && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear selection"
              onClick={(e) => {
                e.stopPropagation(); // prevent opening dropdown
                onChange({ target: { value: '' } });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  onChange({ target: { value: '' } });
                }
              }}
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2px',
                borderRadius: '50%',
                background: '#f1f2f6',
                color: '#6c757d',
                fontSize: '11px',
                fontWeight: 'bold',
                width: '16px',
                height: '16px',
                lineHeight: 1
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#e4e6eb'; e.currentTarget.style.color = '#333'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f2f6'; e.currentTarget.style.color = '#6c757d'; }}
            >
              &times;
            </span>
          )}
          <IconChevron style={{
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
            pointerEvents: 'none'
          }} />
        </span>
      </div>

      {open && (
        <div
          className="custom-select-dropdown"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 9999,
            background: '#fff',
            border: '1px solid #dfe2e8',
            borderRadius: '7px',
            marginTop: '4px',
            boxShadow: '0 4px 12px rgba(56, 65, 74, 0.12)',
            maxHeight: '220px',
            overflowY: 'auto'
          }}
        >
          {options.map((opt, i) => {
            const val = typeof opt === 'object' && opt !== null ? opt.value : opt;
            const label = typeof opt === 'object' && opt !== null ? (opt.label || opt.text || opt.value) : opt;
            const isSelected = String(val) === String(value);

            return (
              <div
                key={i}
                className={`custom-select-option ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelect(val)}
                style={{
                  padding: '10px 14px',
                  cursor: 'pointer',
                  background: isSelected ? 'var(--primary-soft, #f0f4ff)' : 'transparent',
                  color: isSelected ? 'var(--primary, #556ee6)' : 'var(--text-dark, #2b303a)',
                  fontSize: '13.5px',
                  fontWeight: isSelected ? '600' : 'normal',
                  textAlign: 'left',
                  transition: 'background 0.15s ease',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = '#fafbfe';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                {label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
