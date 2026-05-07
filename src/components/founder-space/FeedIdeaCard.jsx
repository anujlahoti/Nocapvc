/**
 * FeedIdeaCard — ORB1T dark theme feed card.
 */

import React, { useCallback } from 'react';

const STAGE_DOT = {
  idea:    '#f5c842',
  mvp:     '#ff6b35',
  live:    '#4ade80',
  scaling: '#8b5cf6',
};

// ── Node config ───────────────────────────────────────────────────────────────
const NODE_CONFIG = [
  { key: 'problem',  number: 1, label: 'Villain', color: '#ff4444',  rotation: -2   },
  { key: 'reveal',   number: 2, label: 'Reveal',  color: '#c4a882',  rotation: 1.5  },
  { key: 'solution', number: 3, label: 'Hero',    color: '#4ade80',  rotation: -1   },
  { key: 'market',   number: 4, label: 'Stakes',  color: '#60a5fa',  rotation: 2    },
  { key: 'ask',      number: 5, label: 'Ask',     color: '#f5c842',  rotation: -1.5 },
];

function relDays(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return '1d ago';
  if (days < 30)  return `${days}d ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1mo ago' : `${months}mo ago`;
}

function MiniAvatar({ profile }) {
  const initials = (profile?.name || 'F').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  if (profile?.photoURL) {
    return (
      <img src={profile.photoURL} alt={profile.name}
        style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  return (
    <div style={{
      width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #f5c842 0%, #ff6b35 100%)',
      color: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 9, fontFamily: "'Syne', sans-serif", fontWeight: 800,
    }}>
      {initials}
    </div>
  );
}

function MiniPolaroidStrip({ idea }) {
  return (
    <div style={{ display: 'flex', gap: 5, paddingBottom: 2, scrollbarWidth: 'none', overflowX: 'auto' }}>
      {NODE_CONFIG.map(node => {
        const title  = idea[`${node.key}Title`] || '';
        const photo  = idea[`${node.key}PhotoURL`] || '';
        const filled = title.trim().length > 0;

        return (
          <div key={node.key} style={{
            width: 60, minWidth: 60,
            background: '#1e1e30',
            borderRadius: 5,
            border: '1px solid rgba(255,255,255,0.07)',
            padding: '6px 4px 12px',
            position: 'relative',
            transform: `rotate(${node.rotation}deg)`,
            boxShadow: `0 2px 8px rgba(0,0,0,0.4)`,
            flexShrink: 0,
          }}>
            {/* Tack dot */}
            <div style={{
              position: 'absolute', top: -4, left: '50%',
              transform: 'translateX(-50%)',
              width: 6, height: 6, borderRadius: '50%',
              background: node.color,
              boxShadow: `0 0 6px ${node.color}`,
            }} />

            {/* Photo or number */}
            <div style={{
              width: '100%', height: 28,
              background: filled ? 'rgba(245,200,66,0.05)' : 'rgba(255,255,255,0.03)',
              borderRadius: 3, marginBottom: 3,
              overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {photo ? (
                <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 14, fontWeight: 800,
                  color: filled ? 'rgba(245,200,66,0.2)' : 'rgba(255,255,255,0.08)',
                }}>
                  {node.number}
                </span>
              )}
            </div>

            {/* Node title */}
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 6, fontWeight: 700,
              color: filled ? 'rgba(232,232,240,0.7)' : 'rgba(232,232,240,0.2)',
              lineHeight: 1.3, wordBreak: 'break-word',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {filled ? title : node.label}
            </div>

            {/* Label at bottom */}
            <div style={{
              position: 'absolute', bottom: 2, left: 2, right: 2,
              fontFamily: "'DM Mono', monospace",
              fontSize: 5, color: node.color,
              textAlign: 'center', letterSpacing: '0.08em',
              textTransform: 'uppercase', fontWeight: 700,
              opacity: 0.7,
            }}>
              {String(node.number).padStart(2, '0')}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function useShare() {
  return useCallback(async (url, title, e) => {
    e.stopPropagation();
    if (navigator.share) {
      try { await navigator.share({ title, url }); return; } catch {}
    }
    try { await navigator.clipboard.writeText(url); } catch {}
  }, []);
}

// ── FeedIdeaCard ─────────────────────────────────────────────────────────────

export default function FeedIdeaCard({ idea, author, onClick }) {
  const share   = useShare();
  const avg     = idea.avgOverall      || 0;
  const ratings = idea.ratingCount     || 0;
  const views   = idea.viewCount       || 0;
  const wants   = idea.wantToWorkCount || 0;

  return (
    <div
      onClick={onClick}
      style={{
        background: '#13131f',
        borderRadius: 14,
        border: '1px solid rgba(245,200,66,0.08)',
        padding: '16px 16px 14px',
        cursor: 'pointer',
        transition: 'border-color 0.2s, transform 0.15s, box-shadow 0.2s',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(245,200,66,0.22)';
        e.currentTarget.style.transform   = 'translateY(-2px)';
        e.currentTarget.style.boxShadow   = '0 8px 32px rgba(245,200,66,0.06)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(245,200,66,0.08)';
        e.currentTarget.style.transform   = 'none';
        e.currentTarget.style.boxShadow   = 'none';
      }}
    >
      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, #f5c842, transparent)',
        opacity: 0.5,
      }} />

      {/* Mini polaroid strip */}
      <MiniPolaroidStrip idea={idea} />

      {/* Signal type label */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, marginBottom: 6,
      }}>
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 7, fontWeight: 700, letterSpacing: '0.2em',
          textTransform: 'uppercase', color: '#f5c842',
          background: 'rgba(245,200,66,0.1)',
          padding: '2px 7px', borderRadius: 3,
        }}>
          IDEA
        </span>
        {idea.category && (
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 7, fontWeight: 600, letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(232,232,240,0.4)',
          }}>
            {idea.category}
          </span>
        )}
      </div>

      {/* Title */}
      <div style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 18, fontWeight: 800,
        color: '#e8e8f0', letterSpacing: '-0.02em',
        marginBottom: 5, lineHeight: 1.2,
      }}>
        {idea.ideaTitle || 'Untitled'}
      </div>

      {/* Tagline */}
      {idea.tagline && (
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 11, color: 'rgba(232,232,240,0.45)',
          lineHeight: 1.55, marginBottom: 12,
          display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {idea.tagline}
        </div>
      )}

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', marginBottom: 10 }} />

      {/* Author + stats row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MiniAvatar profile={author} />
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontFamily: "'DM Mono', monospace",
              fontSize: 9, fontWeight: 600, color: 'rgba(232,232,240,0.75)',
            }}>
              {author?.name || 'Builder'}
              {author?.builderStage && STAGE_DOT[author.builderStage] && (
                <span style={{
                  display: 'inline-block', width: 5, height: 5, borderRadius: '50%',
                  background: STAGE_DOT[author.builderStage], flexShrink: 0,
                }} title={author.builderStage} />
              )}
            </div>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 7, color: 'rgba(232,232,240,0.25)', marginTop: 1,
            }}>
              {relDays(idea.publishedAt)}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {ratings > 0 && (
            <span style={{
              fontFamily: "'DM Mono', monospace", fontSize: 9,
              color: '#f5c842', display: 'flex', alignItems: 'center', gap: 2,
            }}>
              ★ {avg.toFixed(1)}
              <span style={{ color: 'rgba(232,232,240,0.25)', fontSize: 8 }}>({ratings})</span>
            </span>
          )}
          <span style={{
            fontFamily: "'DM Mono', monospace", fontSize: 9,
            color: 'rgba(232,232,240,0.3)', display: 'flex', alignItems: 'center', gap: 2,
          }}>
            ◎ {views}
          </span>
          {wants > 0 && (
            <span style={{
              fontFamily: "'DM Mono', monospace", fontSize: 9,
              color: '#4ade80', display: 'flex', alignItems: 'center', gap: 2,
            }}>
              ↑ {wants}
            </span>
          )}
          <button
            onClick={e => share(
              `${window.location.origin}/founder-space/ideas/${idea.id}`,
              idea.ideaTitle || 'Startup idea', e
            )}
            title="Copy link"
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '2px 4px', fontFamily: "'DM Mono', monospace",
              fontSize: 11, color: 'rgba(232,232,240,0.2)',
              transition: 'color 0.15s', lineHeight: 1,
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#f5c842'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(232,232,240,0.2)'}
          >
            ↗
          </button>
        </div>
      </div>
    </div>
  );
}

// ── FeedIdeaCardSkeleton ──────────────────────────────────────────────────────

export function FeedIdeaCardSkeleton() {
  const pulse = {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 4,
    animation: 'orb-feed-pulse 1.8s ease-in-out infinite',
  };

  return (
    <div style={{
      background: '#13131f', borderRadius: 14,
      border: '1px solid rgba(245,200,66,0.06)',
      padding: '16px 16px 14px',
    }}>
      <div style={{ display: 'flex', gap: 5, marginBottom: 12 }}>
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{
            ...pulse, width: 60, height: 52, borderRadius: 5,
            transform: `rotate(${(i % 2 === 0 ? -1 : 1) * 1.5}deg)`,
          }} />
        ))}
      </div>
      <div style={{ ...pulse, height: 8, width: 48, marginBottom: 8, borderRadius: 3 }} />
      <div style={{ ...pulse, height: 20, width: '65%', marginBottom: 6 }} />
      <div style={{ ...pulse, height: 11, width: '80%', marginBottom: 3 }} />
      <div style={{ ...pulse, height: 11, width: '60%', marginBottom: 12 }} />
      <div style={{ ...pulse, height: 1, marginBottom: 10, borderRadius: 1 }} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ ...pulse, width: 26, height: 26, borderRadius: '50%' }} />
        <div>
          <div style={{ ...pulse, height: 9, width: 72, marginBottom: 4 }} />
          <div style={{ ...pulse, height: 7, width: 44 }} />
        </div>
      </div>
      <style>{`
        @keyframes orb-feed-pulse {
          0%,100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
