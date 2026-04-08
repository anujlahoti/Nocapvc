/**
 * UserProfileCard — Polaroid-aesthetic profile card for Founder Space.
 *
 * Props:
 *   profile  {object}  — Firestore user document
 *   tilt     {number}  — optional CSS rotate degrees (default: -1)
 *   size     "sm"|"md"|"lg"  (default: "md")
 *   onClick  {function} — optional click handler
 */

import React from 'react';

// ── Role badge colours ────────────────────────
const ROLE_STYLES = {
  founder:     { bg: '#fef3cd', color: '#92610a', label: 'Founder'     },
  investor:    { bg: '#d4edda', color: '#1a5c33', label: 'Investor'    },
  talent:      { bg: '#d1ecf1', color: '#0c5460', label: 'Talent'      },
  enthusiast:  { bg: '#e8d5fb', color: '#5a2d82', label: 'Enthusiast'  },
};

// ── Initials avatar ───────────────────────────
function InitialsAvatar({ name, size }) {
  const px = size === 'sm' ? 48 : size === 'lg' ? 88 : 64;
  const fs = size === 'sm' ? 16 : size === 'lg' ? 28 : 22;
  const initials = (name || 'F')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div style={{
      width: px, height: px, borderRadius: '50%',
      background: 'linear-gradient(135deg, #c4963a 0%, #2c1f0e 100%)',
      color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: fs, fontWeight: 700,
      fontFamily: "'Playfair Display', serif",
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// ── LinkedIn icon ─────────────────────────────
function LinkedInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

// ── Twitter / X icon ──────────────────────────
function XIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

// ── Main component ────────────────────────────

export default function UserProfileCard({ profile, tilt = -1, size = 'md', onClick }) {
  if (!profile) return null;

  const avatarPx  = size === 'sm' ? 48 : size === 'lg' ? 88 : 64;
  const roleMeta  = ROLE_STYLES[profile.role] || ROLE_STYLES.enthusiast;
  const isClickable = typeof onClick === 'function';

  // Polaroid sizing
  const cardPad   = size === 'sm' ? '14px 14px 28px' : size === 'lg' ? '24px 24px 48px' : '18px 18px 36px';
  const nameSize  = size === 'sm' ? 15 : size === 'lg' ? 22 : 18;
  const titleSize = size === 'sm' ? 11 : size === 'lg' ? 14 : 12;
  const bodySize  = size === 'sm' ? 12 : size === 'lg' ? 15 : 13;

  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        borderRadius: '4px',
        padding: cardPad,
        boxShadow: '0 4px 28px rgba(44,31,14,0.13), 0 1px 4px rgba(44,31,14,0.07)',
        border: '1px solid rgba(44,31,14,0.07)',
        transform: `rotate(${tilt}deg)`,
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        cursor: isClickable ? 'pointer' : 'default',
        maxWidth: size === 'sm' ? 220 : size === 'lg' ? 340 : 280,
        width: '100%',
      }}
      onMouseEnter={e => {
        if (!isClickable) return;
        e.currentTarget.style.transform = 'rotate(0deg) scale(1.02)';
        e.currentTarget.style.boxShadow = '0 12px 48px rgba(44,31,14,0.18), 0 2px 8px rgba(44,31,14,0.1)';
      }}
      onMouseLeave={e => {
        if (!isClickable) return;
        e.currentTarget.style.transform = `rotate(${tilt}deg)`;
        e.currentTarget.style.boxShadow = '0 4px 28px rgba(44,31,14,0.13), 0 1px 4px rgba(44,31,14,0.07)';
      }}
    >
      {/* Avatar + Name row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        {profile.photoURL
          ? <img
              src={profile.photoURL}
              alt={profile.name}
              style={{
                width: avatarPx, height: avatarPx,
                borderRadius: '50%', objectFit: 'cover',
                border: '2px solid rgba(44,31,14,0.08)',
                flexShrink: 0,
              }}
            />
          : <InitialsAvatar name={profile.name} size={size} />
        }
        <div>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: nameSize,
            fontWeight: 700,
            color: '#2c1f0e',
            lineHeight: 1.2,
            marginBottom: '3px',
          }}>
            {profile.name}
          </div>
          {profile.title && (
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: titleSize,
              color: '#7a5c3a',
              lineHeight: 1.4,
            }}>
              {profile.title}
            </div>
          )}
        </div>
      </div>

      {/* Role badge */}
      <div style={{ marginBottom: '10px' }}>
        <span style={{
          display: 'inline-block',
          background: roleMeta.bg,
          color: roleMeta.color,
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          padding: '3px 10px',
          borderRadius: '100px',
        }}>
          {roleMeta.label}
        </span>
      </div>

      {/* Divider */}
      <div style={{
        height: '1px',
        background: 'rgba(44,31,14,0.07)',
        margin: '10px 0',
      }} />

      {/* What I'm building */}
      {profile.whatImBuilding && (
        <div style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: bodySize,
          color: '#3d2810',
          lineHeight: 1.6,
          marginBottom: '14px',
        }}>
          {profile.whatImBuilding}
        </div>
      )}

      {/* Social links + Contact */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {profile.linkedin && (
          <a
            href={profile.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 30, height: 30, borderRadius: '50%',
              background: 'rgba(44,31,14,0.06)',
              color: '#2c1f0e',
              textDecoration: 'none',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(44,31,14,0.14)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(44,31,14,0.06)'}
            title="LinkedIn"
          >
            <LinkedInIcon />
          </a>
        )}
        {profile.twitter && (
          <a
            href={profile.twitter}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 30, height: 30, borderRadius: '50%',
              background: 'rgba(44,31,14,0.06)',
              color: '#2c1f0e',
              textDecoration: 'none',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(44,31,14,0.14)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(44,31,14,0.06)'}
            title="X / Twitter"
          >
            <XIcon />
          </a>
        )}
        {profile.contactEmail && (
          <a
            href={`mailto:${profile.contactEmail}`}
            onClick={e => e.stopPropagation()}
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.08em',
              color: '#2c1f0e',
              textDecoration: 'none',
              padding: '5px 12px',
              border: '1.5px solid rgba(44,31,14,0.2)',
              borderRadius: '100px',
              transition: 'border-color 0.15s, background 0.15s',
              background: 'transparent',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#2c1f0e';
              e.currentTarget.style.color = '#fdf6e8';
              e.currentTarget.style.borderColor = '#2c1f0e';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#2c1f0e';
              e.currentTarget.style.borderColor = 'rgba(44,31,14,0.2)';
            }}
          >
            Contact →
          </a>
        )}
      </div>
    </div>
  );
}
