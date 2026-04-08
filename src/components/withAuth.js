/**
 * withAuth — HOC that protects any page requiring authentication.
 *
 * Usage:
 *   export default withAuth(MyPage);
 *
 * Behaviour:
 *   - While auth state is loading   → shows full-screen warm spinner
 *   - If user is not signed in      → redirects to /founder-space
 *   - If user is signed in          → renders the wrapped component
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

// ── Spinner ───────────────────────────────────

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#fdf6e8',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      fontFamily: "'DM Mono', monospace",
    }}>
      {/* Warm spinning ring */}
      <div style={{
        width: '36px',
        height: '36px',
        border: '3px solid rgba(44,31,14,0.12)',
        borderTop: '3px solid #c4963a',
        borderRadius: '50%',
        animation: 'fs-spin 0.8s linear infinite',
      }} />
      <span style={{ fontSize: '11px', letterSpacing: '0.2em', color: '#7a5c3a', textTransform: 'uppercase' }}>
        Loading
      </span>
      <style>{`@keyframes fs-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── HOC ──────────────────────────────────────

export function withAuth(Component) {
  return function AuthGuard(props) {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
      if (!loading && !user) {
        navigate('/founder-space', { replace: true });
      }
    }, [user, loading, navigate]);

    if (loading) return <LoadingScreen />;
    if (!user)   return null; // redirect is in flight

    return <Component {...props} />;
  };
}

export default withAuth;
