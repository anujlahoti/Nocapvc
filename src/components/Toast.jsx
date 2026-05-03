/**
 * Toast notification system
 *
 * Usage:
 *   const { showToast } = useToast();
 *   showToast('Saved!', 'success');        // success | error | info
 *
 *   Also add <ToastContainer /> once to App.js (below AuthProvider).
 */

import React, { useState, useCallback, useRef, createContext, useContext } from 'react';

// ─────────────────────────────────────────────
//  Context
// ─────────────────────────────────────────────

const ToastContext = createContext(null);

// ─────────────────────────────────────────────
//  Individual Toast
// ─────────────────────────────────────────────

const DOT_COLOR = {
  success: '#2c8a4e',
  error:   '#e8391e',
  info:    '#c4963a',
};

function Toast({ id, message, type, onClose }) {
  const [exiting, setExiting] = React.useState(false);

  function handleClose() {
    setExiting(true);
    setTimeout(() => onClose(id), 150);
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: '#fff',
        border: '1px solid rgba(44,31,14,0.1)',
        borderRadius: 12,
        padding: '12px 14px',
        boxShadow: '0 4px 20px rgba(44,31,14,0.12)',
        minWidth: 220,
        maxWidth: 340,
        transform: exiting ? 'translateX(120%)' : 'translateX(0)',
        opacity: exiting ? 0 : 1,
        transition: 'transform 0.15s ease, opacity 0.15s ease',
        animation: 'toast-in 0.2s ease',
      }}
    >
      {/* Colored dot */}
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: DOT_COLOR[type] || DOT_COLOR.info,
        flexShrink: 0,
      }} />

      {/* Message */}
      <span style={{
        flex: 1,
        fontFamily: "'DM Mono', monospace",
        fontSize: 12,
        color: '#2c1f0e',
        lineHeight: 1.5,
      }}>
        {message}
      </span>

      {/* Close */}
      <button
        onClick={handleClose}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#c4a882', fontSize: 14, padding: '0 2px',
          lineHeight: 1, flexShrink: 0,
        }}
      >
        ×
      </button>

      <style>{`
        @keyframes toast-in {
          from { transform: translateX(80px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
//  ToastProvider + Container
// ─────────────────────────────────────────────

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counterRef = useRef(0);

  const showToast = useCallback((message, type = 'info') => {
    const id = ++counterRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
    // Auto-remove after 3 s
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  function removeToast(id) {
    setToasts(prev => prev.filter(t => t.id !== id));
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Fixed container — bottom-right */}
      <div style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'all' }}>
            <Toast
              id={t.id}
              message={t.message}
              type={t.type}
              onClose={removeToast}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ─────────────────────────────────────────────
//  useToast hook
// ─────────────────────────────────────────────

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>.');
  return ctx;
}
