/**
 * Founder Space — Landing / Sign-In page
 * Route: /founder-space
 *
 * Two states:
 *   1. Not signed in → shows hero + Google sign-in button
 *   2. Already signed in → auto-redirects to /feed or /onboarding
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import './FounderSpace.css';

// ── Google icon ───────────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

// ── Decorative polaroid stack ─────────────────
function PolaroidStack() {
  const cards = [
    { tilt: -4, top: 20, color: '#e8d9c4', label: '₹4.25L Cr opportunity hidden in plain sight' },
    { tilt: 2,  top: 0,  color: '#f5e9d0', label: 'Democratizing stock lending for retail India' },
    { tilt: 6,  top: 14, color: '#fdf6e8', label: 'The pitch nobody else had the guts to make' },
  ];

  return (
    <div style={{ position: 'relative', height: 280, width: 260, margin: '0 auto' }}>
      {cards.map((c, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: i * 12,
            top: c.top,
            width: 220,
            background: c.color,
            borderRadius: 4,
            padding: '16px 16px 36px',
            boxShadow: '0 4px 20px rgba(44,31,14,0.14)',
            transform: `rotate(${c.tilt}deg)`,
            border: '1px solid rgba(44,31,14,0.08)',
            zIndex: 3 - i,
          }}
        >
          <div style={{
            height: 100,
            background: 'rgba(44,31,14,0.07)',
            borderRadius: 2,
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 28,
              opacity: 0.25,
            }}>✦</span>
          </div>
          <div style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 11,
            color: '#2c1f0e',
            lineHeight: 1.5,
            opacity: 0.7,
          }}>
            {c.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────

export default function FounderSpaceLanding() {
  const { user, userProfile, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Already signed in → redirect
  useEffect(() => {
    if (!loading && user) {
      if (userProfile) navigate('/founder-space/feed', { replace: true });
      else navigate('/founder-space/onboarding', { replace: true });
    }
  }, [user, userProfile, loading, navigate]);

  async function handleSignIn() {
    setSigningIn(true);
    setAuthError(null);
    try {
      const result = await signIn();
      if (!result) return; // popup closed
      if (result.hasProfile) navigate('/founder-space/feed');
      else navigate('/founder-space/onboarding');
    } catch (err) {
      setAuthError('Sign-in failed. Please try again.');
    } finally {
      setSigningIn(false);
    }
  }

  if (loading) {
    return (
      <div className="fs-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="fs-spinner" />
      </div>
    );
  }

  return (
    <div className="fs-page">
      {/* Nav */}
      <nav className="fs-nav">
        <Link to="/" className="fs-nav-logo">
          <span className="fs-nav-dot" />
          NoCap VC
        </Link>
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.2em',
          color: 'var(--fs-muted)',
          textTransform: 'uppercase',
        }}>
          Founder Space
        </span>
      </nav>

      {/* Hero */}
      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '80px 48px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 80,
        alignItems: 'center',
      }}>
        {/* Left: copy */}
        <div>
          <div className="fs-section-label" style={{ marginBottom: 20 }}>
            Founder Space · Beta
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(36px, 5vw, 58px)',
            fontWeight: 700,
            color: 'var(--fs-text)',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            margin: '0 0 20px',
          }}>
            Put your startup idea<br />
            <em style={{ color: 'var(--fs-accent)' }}>into the world.</em>
          </h1>
          <p style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 18,
            color: 'var(--fs-muted)',
            lineHeight: 1.7,
            margin: '0 0 32px',
            maxWidth: 440,
          }}>
            Founder Space is where Indian founders post their startup ideas, attract co-founders,
            early customers, and investors — before a single line of code is written.
          </p>

          {/* Feature chips */}
          {['Post your idea in 5 mins', 'Get rated by the community', 'Find your co-founder'].map(f => (
            <div key={f} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 10,
              fontFamily: "'DM Mono', monospace",
              fontSize: 12,
              color: 'var(--fs-text)',
            }}>
              <span style={{
                width: 20, height: 20, borderRadius: '50%',
                background: 'rgba(196,150,58,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, color: 'var(--fs-accent)', fontWeight: 700,
              }}>✓</span>
              {f}
            </div>
          ))}

          <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320 }}>
            <button
              className="fs-btn-primary"
              onClick={handleSignIn}
              disabled={signingIn}
              style={{ justifyContent: 'center', gap: 12, fontSize: 13, padding: '16px 28px' }}
            >
              {signingIn
                ? <span className="fs-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                : <GoogleIcon />
              }
              {signingIn ? 'Signing in…' : 'Continue with Google'}
            </button>
            {authError && (
              <p style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: '#c0392b',
                margin: 0,
              }}>
                {authError}
              </p>
            )}
            <p style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              color: 'var(--fs-muted)',
              margin: 0,
              lineHeight: 1.6,
            }}>
              Free forever. No pitch deck required.<br />
              Your idea, your story.
            </p>
          </div>
        </div>

        {/* Right: polaroid stack */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <PolaroidStack />
        </div>
      </div>

      {/* Stats bar */}
      <div style={{
        borderTop: '1px solid var(--fs-border)',
        padding: '32px 48px',
        display: 'flex',
        justifyContent: 'center',
        gap: 80,
      }}>
        {[
          { num: '8.5 Cr', label: 'Retail investors waiting' },
          { num: '₹4.25L Cr', label: 'In idle demat accounts' },
          { num: '0', label: 'Products solving it' },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 28,
              fontWeight: 700,
              color: 'var(--fs-text)',
              marginBottom: 4,
            }}>
              {s.num}
            </div>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              color: 'var(--fs-muted)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 768px) {
          .fs-landing-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
