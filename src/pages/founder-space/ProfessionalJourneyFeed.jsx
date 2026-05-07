/**
 * Professional Journey Feed  (dark orbital theme)
 * Route: /founder-space/journey/feed
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  collection, query, where, orderBy, limit,
  getDocs, doc, getDoc, startAfter,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../lib/auth';

// ─────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────

const NODE_CONFIG = [
  { key: 'origin',    label: 'Origin', tackColor: '#8b5cf6' },
  { key: 'expertise', label: 'Craft',  tackColor: '#0d9488' },
  { key: 'impact',    label: 'Proof',  tackColor: '#f59e0b' },
  { key: 'now',       label: 'Now',    tackColor: '#3b82f6' },
  { key: 'next',      label: 'Seek',   tackColor: '#ec4899' },
];

const INDUSTRIES = [
  'All', 'Fintech', 'Edtech', 'Healthtech', 'SaaS', 'Ecommerce', 'Deeptech',
  'Consulting', 'Finance', 'Engineering', 'Design', 'Marketing', 'Operations', 'Other',
];

const PAGE_SIZE = 12;

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

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

function Avatar({ profile, size = 28 }) {
  const initials = (profile?.name || 'P').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  if (profile?.photoURL) {
    return (
      <img src={profile.photoURL} alt={profile.name || ''}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.floor(size * 0.35),
      fontFamily: "'Syne', sans-serif", fontWeight: 800,
    }}>
      {initials}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Dark journey card
// ─────────────────────────────────────────────

function JourneyCard({ journey, author, onClick }) {
  const views = journey.viewCount || 0;
  const ROTATIONS = [-2, 1.5, -1, 2, -1.5];

  return (
    <div
      onClick={onClick}
      style={{
        background: '#13131f',
        borderRadius: 14,
        border: '1px solid rgba(139,92,246,0.1)',
        padding: '16px 16px 14px',
        cursor: 'pointer',
        transition: 'border-color 0.2s, transform 0.15s, box-shadow 0.2s',
        position: 'relative', overflow: 'hidden',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)';
        e.currentTarget.style.transform   = 'translateY(-2px)';
        e.currentTarget.style.boxShadow   = '0 8px 32px rgba(139,92,246,0.08)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(139,92,246,0.1)';
        e.currentTarget.style.transform   = 'none';
        e.currentTarget.style.boxShadow   = 'none';
      }}
    >
      {/* Purple top accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, #8b5cf6, transparent)',
        opacity: 0.5,
      }} />

      {/* Mini node strip */}
      <div style={{ display: 'flex', gap: 4, paddingBottom: 2, scrollbarWidth: 'none', overflowX: 'auto' }}>
        {NODE_CONFIG.map((node, i) => {
          const title  = journey[`${node.key}Title`] || '';
          const photo  = journey[`${node.key}PhotoURL`] || '';
          const filled = title.trim().length > 0;
          return (
            <div key={node.key} style={{
              width: 60, minWidth: 60,
              background: '#1e1e30',
              borderRadius: 5,
              border: '1px solid rgba(255,255,255,0.06)',
              padding: '6px 4px 12px',
              position: 'relative',
              transform: `rotate(${ROTATIONS[i]}deg)`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute', top: -4, left: '50%',
                transform: 'translateX(-50%)',
                width: 6, height: 6, borderRadius: '50%',
                background: node.tackColor,
                boxShadow: `0 0 6px ${node.tackColor}`,
              }} />
              <div style={{
                width: '100%', height: 28,
                background: filled ? 'rgba(139,92,246,0.06)' : 'rgba(255,255,255,0.03)',
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
                    color: filled ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.08)',
                  }}>
                    {i + 1}
                  </span>
                )}
              </div>
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 6, fontWeight: 700,
                color: filled ? 'rgba(232,232,240,0.7)' : 'rgba(232,232,240,0.2)',
                lineHeight: 1.3, wordBreak: 'break-word',
                display: '-webkit-box',
                WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {filled ? title : node.label}
              </div>
              <div style={{
                position: 'absolute', bottom: 2, left: 2, right: 2,
                fontFamily: "'DM Mono', monospace",
                fontSize: 5, color: node.tackColor,
                textAlign: 'center', letterSpacing: '0.08em',
                textTransform: 'uppercase', fontWeight: 700, opacity: 0.7,
              }}>
                {node.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Signal label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, marginBottom: 6 }}>
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 7, fontWeight: 700, letterSpacing: '0.2em',
          textTransform: 'uppercase', color: '#8b5cf6',
          background: 'rgba(139,92,246,0.12)',
          padding: '2px 7px', borderRadius: 3,
        }}>
          TRAJECTORY
        </span>
        {journey.industry && (
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 7, fontWeight: 600, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: 'rgba(232,232,240,0.35)',
          }}>
            {journey.industry}
          </span>
        )}
      </div>

      {/* Headline */}
      <div style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 17, fontWeight: 800,
        color: '#e8e8f0', letterSpacing: '-0.02em',
        marginBottom: 4, lineHeight: 1.2,
      }}>
        {journey.headline || 'Professional Journey'}
      </div>

      {/* Origin preview */}
      {journey.originTitle && (
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 11, color: 'rgba(232,232,240,0.4)',
          lineHeight: 1.5, marginBottom: 10,
          display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {journey.originTitle}
        </div>
      )}

      {/* Meta tags */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {journey.experience && (
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 8, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
            background: 'rgba(255,255,255,0.05)', color: 'rgba(232,232,240,0.4)',
            padding: '2px 8px', borderRadius: 4,
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
            {journey.experience}
          </span>
        )}
        {journey.location && (
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 8, color: 'rgba(232,232,240,0.3)',
            padding: '2px 8px', borderRadius: 4,
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
            {journey.location}
          </span>
        )}
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', marginBottom: 10 }} />

      {/* Author row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar profile={author || { name: journey.authorName, photoURL: journey.authorPhoto }} size={26} />
          <div>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9, fontWeight: 600, color: 'rgba(232,232,240,0.75)',
            }}>
              {author?.name || journey.authorName || 'Professional'}
            </div>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 7, color: 'rgba(232,232,240,0.25)', marginTop: 1,
            }}>
              {relDays(journey.publishedAt)}
            </div>
          </div>
        </div>
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 9, color: 'rgba(232,232,240,0.25)',
          display: 'flex', alignItems: 'center', gap: 2,
        }}>
          ◎ {views}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Skeleton
// ─────────────────────────────────────────────

function JourneyCardSkeleton() {
  const pulse = {
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    animation: 'orb-journey-pulse 1.8s ease-in-out infinite',
  };
  return (
    <div style={{
      background: '#13131f', borderRadius: 14,
      border: '1px solid rgba(139,92,246,0.07)',
      padding: '16px 16px 14px',
    }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{
            ...pulse, width: 60, height: 50, borderRadius: 5,
            transform: `rotate(${(i % 2 === 0 ? -1 : 1) * 1.5}deg)`,
          }} />
        ))}
      </div>
      <div style={{ ...pulse, height: 7, width: 56, marginBottom: 8 }} />
      <div style={{ ...pulse, height: 18, width: '65%', marginBottom: 5 }} />
      <div style={{ ...pulse, height: 11, width: '80%', marginBottom: 3 }} />
      <div style={{ ...pulse, height: 11, width: '55%', marginBottom: 10 }} />
      <div style={{ ...pulse, height: 1, marginBottom: 10 }} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ ...pulse, width: 26, height: 26, borderRadius: '50%' }} />
        <div>
          <div style={{ ...pulse, height: 9, width: 70, marginBottom: 4 }} />
          <div style={{ ...pulse, height: 7, width: 44 }} />
        </div>
      </div>
      <style>{`@keyframes orb-journey-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Filter pill
// ─────────────────────────────────────────────

function FilterPill({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '5px 14px', borderRadius: 20, whiteSpace: 'nowrap',
      border: active ? '1.5px solid rgba(139,92,246,0.5)' : '1px solid rgba(255,255,255,0.08)',
      background: active ? 'rgba(139,92,246,0.12)' : 'transparent',
      color: active ? '#8b5cf6' : 'rgba(232,232,240,0.4)',
      fontFamily: "'DM Mono', monospace",
      fontSize: 10, fontWeight: active ? 700 : 400,
      letterSpacing: '0.06em', cursor: 'pointer',
      transition: 'all 0.15s', flexShrink: 0,
    }}>
      {active && <span style={{ marginRight: 5, fontSize: 6 }}>●</span>}
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────
//  Main
// ─────────────────────────────────────────────

export default function ProfessionalJourneyFeed() {
  const { user, signIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  async function handleSignIn() {
    try {
      const result = await signIn();
      if (!result) return;
      if (!result.hasProfile) navigate('/founder-space/onboarding');
    } catch (err) { console.error('Sign-in error:', err); }
  }

  const [industry,     setIndustry]     = useState('All');
  const [journeys,     setJourneys]     = useState([]);
  const [authors,      setAuthors]      = useState({});
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(false);
  const [lastDoc,      setLastDoc]      = useState(null);
  const [hasMore,      setHasMore]      = useState(false);
  const [loadingMore,  setLoadingMore]  = useState(false);

  const fetchJourneys = useCallback(async (afterDoc = null) => {
    if (afterDoc) setLoadingMore(true);
    else { setLoading(true); setError(false); }

    try {
      const q = afterDoc
        ? query(
            collection(db, 'journeys'),
            where('status', '==', 'published'),
            orderBy('publishedAt', 'desc'),
            limit(PAGE_SIZE + 1),
            startAfter(afterDoc)
          )
        : query(
            collection(db, 'journeys'),
            where('status', '==', 'published'),
            orderBy('publishedAt', 'desc'),
            limit(PAGE_SIZE + 1)
          );

      const snap     = await getDocs(q);
      const docs     = snap.docs.slice(0, PAGE_SIZE).map(d => ({ id: d.id, ...d.data() }));
      const filtered = docs.filter(j => industry === 'All' || j.industry === industry);

      if (!afterDoc) setJourneys(filtered);
      else           setJourneys(prev => [...prev, ...filtered]);

      setHasMore(snap.docs.length > PAGE_SIZE);
      setLastDoc(snap.docs[Math.min(snap.docs.length - 1, PAGE_SIZE - 1)] || null);

      const uids = [...new Set(filtered.map(j => j.authorUid).filter(Boolean))];
      const newAuthors = {};
      await Promise.all(uids.map(async uid => {
        try {
          const s = await getDoc(doc(db, 'users', uid));
          if (s.exists()) newAuthors[uid] = { uid: s.id, ...s.data() };
        } catch {}
      }));
      setAuthors(prev => ({ ...prev, ...newAuthors }));

    } catch (err) {
      console.error('Journey feed error:', err);
      if (!afterDoc) setError(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [industry]);

  useEffect(() => {
    setLastDoc(null);
    fetchJourneys(null);
  }, [industry]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh', paddingBottom: 60 }}>

      {/* ── Nav ─────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(10,10,15,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(139,92,246,0.1)',
        padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/founder-space/journey/feed" style={{
            fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 800,
            color: '#e8e8f0', textDecoration: 'none', letterSpacing: '-0.02em',
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#8b5cf6', boxShadow: '0 0 8px #8b5cf680' }} />
            TRAJECTORY
          </Link>
          <Link to="/founder-space/feed" style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10, letterSpacing: '0.1em',
            color: 'rgba(232,232,240,0.3)', textDecoration: 'none',
            textTransform: 'uppercase',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(232,232,240,0.6)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(232,232,240,0.3)'}
          >
            Ideas ↗
          </Link>
        </div>
        {!authLoading && (
          user ? (
            <Link
              to="/founder-space/journey/submit"
              style={{
                padding: '8px 16px', borderRadius: 7,
                background: '#8b5cf6', color: '#fff',
                fontFamily: "'DM Mono', monospace",
                fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
                textDecoration: 'none',
              }}
            >
              + Pin journey
            </Link>
          ) : (
            <button
              onClick={handleSignIn}
              style={{
                padding: '8px 16px', borderRadius: 7, border: 'none',
                background: '#8b5cf6', color: '#fff',
                fontFamily: "'DM Mono', monospace",
                fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
                cursor: 'pointer',
              }}
            >
              Join
            </button>
          )
        )}
      </nav>

      {/* ── Hero ────────────────────────────── */}
      <div style={{
        textAlign: 'center', padding: '48px 24px 36px',
        borderBottom: '1px solid rgba(139,92,246,0.07)',
        background: 'linear-gradient(180deg, rgba(139,92,246,0.04) 0%, transparent 100%)',
      }}>
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase',
          color: '#8b5cf6', marginBottom: 12,
          display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
        }}>
          <div style={{ height: 1, width: 24, background: 'rgba(139,92,246,0.4)' }} />
          Professional Journey
          <div style={{ height: 1, width: 24, background: 'rgba(139,92,246,0.4)' }} />
        </div>
        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 900,
          color: '#e8e8f0', letterSpacing: '-0.03em',
          margin: '0 0 10px', lineHeight: 1.05,
        }}>
          Every career has a story.
        </h1>
        <p style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 12, color: 'rgba(232,232,240,0.35)',
          margin: '0 0 28px', letterSpacing: '0.04em',
        }}>
          Professionals who stopped hiding behind LinkedIn titles.
        </p>
        {!authLoading && (
          user ? (
            <Link
              to="/founder-space/journey/submit"
              style={{
                display: 'inline-block',
                padding: '11px 28px', borderRadius: 9,
                background: '#8b5cf6', color: '#fff',
                fontFamily: "'DM Mono', monospace",
                fontSize: 11, fontWeight: 800, letterSpacing: '0.06em',
                textDecoration: 'none',
              }}
            >
              Pin your journey →
            </Link>
          ) : (
            <button
              onClick={handleSignIn}
              style={{
                padding: '12px 28px', borderRadius: 9, border: 'none',
                background: '#8b5cf6', color: '#fff',
                fontFamily: "'DM Mono', monospace",
                fontSize: 11, fontWeight: 800, letterSpacing: '0.06em',
                cursor: 'pointer',
              }}
            >
              Join — it's free
            </button>
          )
        )}
      </div>

      {/* ── Filter bar ──────────────────────── */}
      <div style={{
        background: 'rgba(10,10,15,0.95)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(139,92,246,0.07)',
        padding: '10px 24px',
        position: 'sticky', top: 49, zIndex: 40,
      }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'flex', gap: 6,
          overflowX: 'auto', scrollbarWidth: 'none',
        }}>
          {INDUSTRIES.map(ind => (
            <FilterPill key={ind} label={ind} active={industry === ind} onClick={() => setIndustry(ind)} />
          ))}
        </div>
      </div>

      {/* ── Grid ────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px' }}>

        {error && !loading && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 18, fontWeight: 800, color: '#e8e8f0', marginBottom: 10,
            }}>
              Signal lost.
            </div>
            <button onClick={() => fetchJourneys(null)} style={{
              padding: '10px 24px', borderRadius: 8, border: 'none',
              background: '#8b5cf6', color: '#fff',
              fontFamily: "'DM Mono', monospace",
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
            }}>
              Retry
            </button>
          </div>
        )}

        {loading && !error && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => <JourneyCardSkeleton key={i} />)}
          </div>
        )}

        {!loading && !error && journeys.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <div style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 20, fontWeight: 800, color: '#e8e8f0', marginBottom: 8,
            }}>
              {industry !== 'All' ? `No trajectories in ${industry} yet.` : 'No trajectories pinned yet.'}
            </div>
            <p style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11, color: 'rgba(232,232,240,0.3)', marginBottom: 24,
            }}>
              {industry !== 'All' ? 'Try a different industry.' : 'Be the first to tell your story.'}
            </p>
            {user && (
              <Link to="/founder-space/journey/submit" style={{
                display: 'inline-block', padding: '10px 24px', borderRadius: 8,
                background: '#8b5cf6', color: '#fff',
                fontFamily: "'DM Mono', monospace",
                fontSize: 11, fontWeight: 700, textDecoration: 'none',
              }}>
                Pin your journey →
              </Link>
            )}
          </div>
        )}

        {!loading && !error && journeys.length > 0 && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 }}>
              {journeys.map(journey => (
                <JourneyCard
                  key={journey.id}
                  journey={journey}
                  author={authors[journey.authorUid]}
                  onClick={() => navigate(`/founder-space/journey/${journey.id}`)}
                />
              ))}
            </div>

            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: 32 }}>
                <button
                  onClick={() => fetchJourneys(lastDoc)}
                  disabled={loadingMore}
                  style={{
                    width: '100%', maxWidth: 360,
                    padding: '14px 0', borderRadius: 10,
                    border: '1px solid rgba(139,92,246,0.2)',
                    background: 'transparent', color: 'rgba(232,232,240,0.5)',
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
                    cursor: loadingMore ? 'wait' : 'pointer',
                    opacity: loadingMore ? 0.6 : 1,
                    transition: 'border-color 0.15s, color 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'; e.currentTarget.style.color = '#8b5cf6'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)'; e.currentTarget.style.color = 'rgba(232,232,240,0.5)'; }}
                >
                  {loadingMore ? 'Loading…' : 'Load more trajectories'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
