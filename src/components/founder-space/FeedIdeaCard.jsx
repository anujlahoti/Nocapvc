/**
 * FeedIdeaCard — investigation board card for the Founder Space feed.
 *
 * Props:
 *   idea    {object}  — Firestore idea document
 *   author  {object}  — Firestore user profile of the author
 *   onClick {fn}      — navigation handler
 */

import React from 'react';

// ── Node config (same tack colors as the submission form) ────────────────────
const NODE_CONFIG = [
  { key: 'problem',  number: 1, label: 'The Villain', color: '#e8391e', rotation: -2   },
  { key: 'reveal',   number: 2, label: 'The Reveal',  color: '#c4a882', rotation: 1.5  },
  { key: 'solution', number: 3, label: 'The Hero',    color: '#2c8a4e', rotation: -1   },
  { key: 'market',   number: 4, label: 'The Stakes',  color: '#1a6bb5', rotation: 2    },
  { key: 'ask',      number: 5, label: 'The Ask',     color: '#f5c842', rotation: -1.5 },
];

// ── Relative date ─────────────────────────────────────────────────────────────
function relDays(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function MiniAvatar({ profile }) {
  const initials = (profile?.name || 'F')
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  if (profile?.photoURL) {
    return (
      <img
        src={profile.photoURL} alt={profile.name}
        style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #c4963a 0%, #2c1f0e 100%)',
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 10, fontFamily: "'Playfair Display', serif", fontWeight: 700,
    }}>
      {initials}
    </div>
  );
}

// ── Mini polaroid strip ───────────────────────────────────────────────────────
function MiniPolaroidStrip({ idea }) {
  return (
    <div style={{
      display: 'flex', gap: 4,
      overflowX: 'auto', paddingBottom: 2,
      // hide scrollbar
      scrollbarWidth: 'none',
    }}>
      {NODE_CONFIG.map(node => {
        const title    = idea[`${node.key}Title`] || '';
        const photoURL = idea[`${node.key}PhotoURL`] || '';
        const filled   = title.trim().length > 0;

        return (
          <div
            key={node.key}
            style={{
              width: 64, minWidth: 64,
              background: '#fff',
              borderRadius: 6,
              border: '1px solid rgba(44,31,14,0.12)',
              padding: '6px 5px 14px',
              position: 'relative',
              transform: `rotate(${node.rotation}deg)`,
              boxShadow: '1px 2px 0 #e0d4c0',
              flexShrink: 0,
            }}
          >
            {/* Tack dot */}
            <div style={{
              position: 'absolute', top: -4, left: '50%',
              transform: 'translateX(-50%)',
              width: 7, height: 7, borderRadius: '50%',
              background: node.color,
              boxShadow: `0 1px 3px ${node.color}88`,
            }} />

            {/* Photo or number */}
            <div style={{
              width: '100%', height: 32,
              background: filled ? 'rgba(44,31,14,0.04)' : '#f5ece0',
              borderRadius: 3, marginBottom: 3,
              overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {photoURL ? (
                <img src={photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 16, fontWeight: 900,
                  color: filled ? 'rgba(44,31,14,0.14)' : '#e0d4c0',
                }}>
                  {node.number}
                </span>
              )}
            </div>

            {/* Node title */}
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 7, fontWeight: 700,
              color: filled ? '#2c1f0e' : '#c4a882',
              lineHeight: 1.25, wordBreak: 'break-word',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {filled ? title : node.label}
            </div>

            {/* Label at bottom */}
            <div style={{
              position: 'absolute', bottom: 3, left: 3, right: 3,
              fontFamily: "'DM Mono', monospace",
              fontSize: 6, color: node.color,
              textAlign: 'center', letterSpacing: '0.1em',
              textTransform: 'uppercase', fontWeight: 700,
            }}>
              {String(node.number).padStart(2, '0')}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── FeedIdeaCard ─────────────────────────────────────────────────────────────

export default function FeedIdeaCard({ idea, author, onClick }) {
  const avg     = idea.avgOverall     || 0;
  const ratings = idea.ratingCount    || 0;
  const views   = idea.viewCount      || 0;
  const wants   = idea.wantToWorkCount || 0;

  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        borderRadius: 18,
        border: '1px solid rgba(44,31,14,0.1)',
        padding: '18px 18px 16px',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s, transform 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(44,31,14,0.14)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'none';
      }}
    >
      {/* Mini polaroid investigation strip */}
      <MiniPolaroidStrip idea={idea} />

      {/* Startup name */}
      <div style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 20, fontWeight: 900,
        color: '#2c1f0e', letterSpacing: '-0.02em',
        marginTop: 14, marginBottom: 4,
        lineHeight: 1.2,
      }}>
        {idea.ideaTitle || 'Untitled'}
      </div>

      {/* Tagline */}
      {idea.tagline && (
        <div style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 13, color: '#b09878',
          fontStyle: 'italic', lineHeight: 1.55,
          marginBottom: 10,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {idea.tagline}
        </div>
      )}

      {/* Category + stage badges */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {idea.category && (
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 8, fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            background: '#2c1f0e', color: '#f5c842',
            padding: '3px 9px', borderRadius: 20,
          }}>
            {idea.category}
          </span>
        )}
        {idea.stage && (
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 8, fontWeight: 600,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            background: 'rgba(44,31,14,0.07)', color: '#7a5c3a',
            padding: '3px 9px', borderRadius: 20,
          }}>
            {idea.stage}
          </span>
        )}
        {(idea.branchNodes?.length || 0) > 0 && (
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 8, color: '#c4a882',
            padding: '3px 9px', borderRadius: 20,
            border: '1px solid #e8dcc8',
          }}>
            +{idea.branchNodes.length} notes
          </span>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(44,31,14,0.06)', marginBottom: 10 }} />

      {/* Founder row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MiniAvatar profile={author} />
          <div>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10, fontWeight: 600,
              color: '#2c1f0e',
            }}>
              {author?.name || 'Founder'}
            </div>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 8, color: '#c4a882', marginTop: 1,
            }}>
              {relDays(idea.publishedAt)}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex', gap: 12, alignItems: 'center',
        }}>
          {ratings > 0 && (
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9, color: '#c4963a',
              display: 'flex', alignItems: 'center', gap: 3,
            }}>
              <span style={{ fontSize: 11 }}>★</span>
              <span>{avg.toFixed(1)}</span>
              <span style={{ color: '#c4a882' }}>({ratings})</span>
            </div>
          )}
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 9, color: '#c4a882',
            display: 'flex', alignItems: 'center', gap: 3,
          }}>
            <span style={{ fontSize: 10 }}>◎</span>
            <span>{views}</span>
          </div>
          {wants > 0 && (
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9, color: '#7a5c3a',
              display: 'flex', alignItems: 'center', gap: 3,
            }}>
              <span style={{ fontSize: 10 }}>↑</span>
              <span>{wants}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── FeedIdeaCardSkeleton ──────────────────────────────────────────────────────

export function FeedIdeaCardSkeleton() {
  const pulse = {
    background: '#e8dcc8',
    borderRadius: 4,
    animation: 'feed-pulse 1.8s ease-in-out infinite',
  };

  return (
    <div style={{
      background: '#fff', borderRadius: 18,
      border: '1px solid rgba(44,31,14,0.1)',
      padding: '18px 18px 16px',
    }}>
      {/* Mini strip skeleton */}
      <div style={{ display: 'flex', gap: 4 }}>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} style={{
            ...pulse, width: 64, height: 58, borderRadius: 6,
            transform: `rotate(${(i % 2 === 0 ? -1 : 1) * 1.5}deg)`,
          }} />
        ))}
      </div>
      {/* Name */}
      <div style={{ ...pulse, height: 22, width: '60%', marginTop: 14, marginBottom: 8 }} />
      {/* Tagline */}
      <div style={{ ...pulse, height: 14, width: '85%', marginBottom: 4 }} />
      <div style={{ ...pulse, height: 14, width: '70%', marginBottom: 12 }} />
      {/* Badges */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <div style={{ ...pulse, height: 18, width: 56, borderRadius: 20 }} />
        <div style={{ ...pulse, height: 18, width: 72, borderRadius: 20 }} />
      </div>
      {/* Founder row */}
      <div style={{ ...pulse, height: 1, marginBottom: 10, borderRadius: 1 }} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ ...pulse, width: 28, height: 28, borderRadius: '50%' }} />
        <div>
          <div style={{ ...pulse, height: 10, width: 80, marginBottom: 4 }} />
          <div style={{ ...pulse, height: 8, width: 52 }} />
        </div>
      </div>
      <style>{`
        @keyframes feed-pulse {
          0%,100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
