/**
 * Professional Journey Feed
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
import './FounderSpace.css';

// ─────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────

const NODE_CONFIG = [
  { key: 'origin',    label: 'Origin',    tackColor: '#7c3aed' },
  { key: 'expertise', label: 'Craft',     tackColor: '#0d9488' },
  { key: 'impact',    label: 'Proof',     tackColor: '#d97706' },
  { key: 'now',       label: 'Now',       tackColor: '#2563eb' },
  { key: 'next',      label: 'Seek',      tackColor: '#db2777' },
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
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
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
      background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.floor(size * 0.35),
      fontFamily: "'Playfair Display', serif", fontWeight: 700,
    }}>
      {initials}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Journey Card
// ─────────────────────────────────────────────

function JourneyCard({ journey, author, onClick }) {
  const views = journey.viewCount || 0;

  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff', borderRadius: 18,
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
      {/* Mini node strip */}
      <div style={{
        display: 'flex', gap: 4, overflowX: 'auto',
        paddingBottom: 2, scrollbarWidth: 'none',
      }}>
        {NODE_CONFIG.map((node, i) => {
          const rotations = [-2, 1.5, -1, 2, -1.5];
          const title  = journey[`${node.key}Title`] || '';
          const photo  = journey[`${node.key}PhotoURL`] || '';
          const filled = title.trim().length > 0;
          return (
            <div key={node.key} style={{
              width: 64, minWidth: 64,
              background: '#fff', borderRadius: 6,
              border: '1px solid rgba(44,31,14,0.12)',
              padding: '6px 5px 14px',
              position: 'relative',
              transform: `rotate(${rotations[i]}deg)`,
              boxShadow: '1px 2px 0 #e0d4c0',
              flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute', top: -4, left: '50%',
                transform: 'translateX(-50%)',
                width: 7, height: 7, borderRadius: '50%',
                background: node.tackColor,
                boxShadow: `0 1px 3px ${node.tackColor}88`,
              }} />
              <div style={{
                width: '100%', height: 32,
                background: filled ? 'rgba(44,31,14,0.04)' : '#f5ece0',
                borderRadius: 3, marginBottom: 3,
                overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {photo ? (
                  <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 16, fontWeight: 900,
                    color: filled ? 'rgba(44,31,14,0.14)' : '#e0d4c0',
                  }}>
                    {i + 1}
                  </span>
                )}
              </div>
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 7, fontWeight: 700,
                color: filled ? '#2c1f0e' : '#c4a882',
                lineHeight: 1.25, wordBreak: 'break-word',
                display: '-webkit-box',
                WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {filled ? title : node.label}
              </div>
              <div style={{
                position: 'absolute', bottom: 3, left: 3, right: 3,
                fontFamily: "'DM Mono', monospace",
                fontSize: 6, color: node.tackColor,
                textAlign: 'center', letterSpacing: '0.1em',
                textTransform: 'uppercase', fontWeight: 700,
              }}>
                {node.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Headline */}
      <div style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 18, fontWeight: 900,
        color: '#2c1f0e', letterSpacing: '-0.01em',
        marginTop: 14, marginBottom: 4, lineHeight: 1.2,
      }}>
        {journey.headline || 'Professional Journey'}
      </div>

      {/* Origin title preview */}
      {journey.originTitle && (
        <div style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 12, color: '#b09878',
          fontStyle: 'italic', lineHeight: 1.5,
          marginBottom: 10,
          display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {journey.originTitle}
        </div>
      )}

      {/* Tags */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {journey.industry && (
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 8, fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            background: '#2c1f0e', color: '#a78bfa',
            padding: '3px 9px', borderRadius: 20,
          }}>
            {journey.industry}
          </span>
        )}
        {journey.experience && (
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 8, fontWeight: 600,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            background: 'rgba(44,31,14,0.07)', color: '#7a5c3a',
            padding: '3px 9px', borderRadius: 20,
          }}>
            {journey.experience}
          </span>
        )}
        {journey.location && (
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 8, color: '#c4a882',
            padding: '3px 9px', borderRadius: 20,
            border: '1px solid #e8dcc8',
          }}>
            {journey.location}
          </span>
        )}
      </div>

      <div style={{ height: 1, background: 'rgba(44,31,14,0.06)', marginBottom: 10 }} />

      {/* Author row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar profile={author || { name: journey.authorName, photoURL: journey.authorPhoto }} size={28} />
          <div>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10, fontWeight: 600, color: '#2c1f0e',
            }}>
              {author?.name || journey.authorName || 'Professional'}
            </div>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 8, color: '#c4a882', marginTop: 1,
            }}>
              {relDays(journey.publishedAt)}
            </div>
          </div>
        </div>
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 9, color: '#c4a882',
          display: 'flex', alignItems: 'center', gap: 3,
        }}>
          <span style={{ fontSize: 10 }}>◎</span>
          <span>{views}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Skeleton
// ─────────────────────────────────────────────

function JourneyCardSkeleton() {
  const pulse = {
    background: '#e8dcc8', borderRadius: 4,
    animation: 'feed-pulse 1.8s ease-in-out infinite',
  };
  return (
    <div style={{
      background: '#fff', borderRadius: 18,
      border: '1px solid rgba(44,31,14,0.1)',
      padding: '18px 18px 16px',
    }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{
            ...pulse, width: 64, height: 58, borderRadius: 6,
            transform: `rotate(${(i % 2 === 0 ? -1 : 1) * 1.5}deg)`,
          }} />
        ))}
      </div>
      <div style={{ ...pulse, height: 20, width: '70%', marginTop: 14, marginBottom: 8 }} />
      <div style={{ ...pulse, height: 14, width: '90%', marginBottom: 4 }} />
      <div style={{ ...pulse, height: 14, width: '65%', marginBottom: 12 }} />
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <div style={{ ...pulse, height: 18, width: 56, borderRadius: 20 }} />
        <div style={{ ...pulse, height: 18, width: 72, borderRadius: 20 }} />
      </div>
      <div style={{ ...pulse, height: 1, marginBottom: 10, borderRadius: 1 }} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ ...pulse, width: 28, height: 28, borderRadius: '50%' }} />
        <div>
          <div style={{ ...pulse, height: 10, width: 80, marginBottom: 4 }} />
          <div style={{ ...pulse, height: 8, width: 52 }} />
        </div>
      </div>
      <style>{`@keyframes feed-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
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
      border: active ? 'none' : '1px solid rgba(44,31,14,0.15)',
      background: active ? '#2c1f0e' : '#fff',
      color: active ? '#a78bfa' : '#7a5c3a',
      fontFamily: "'DM Mono', monospace",
      fontSize: 10, fontWeight: active ? 700 : 400,
      letterSpacing: '0.06em', cursor: 'pointer',
      transition: 'all 0.15s', flexShrink: 0,
    }}>
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────
//  Main FeedPage
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

  const [industry, setIndustry] = useState('All');
  const [journeys, setJourneys] = useState([]);
  const [authors,  setAuthors]  = useState({});
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);
  const [lastDoc,  setLastDoc]  = useState(null);
  const [hasMore,  setHasMore]  = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

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

      const snap  = await getDocs(q);
      const docs  = snap.docs.slice(0, PAGE_SIZE).map(d => ({ id: d.id, ...d.data() }));

      const filtered = docs.filter(j =>
        industry === 'All' || j.industry === industry
      );

      if (!afterDoc) setJourneys(filtered);
      else           setJourneys(prev => [...prev, ...filtered]);

      setHasMore(snap.docs.length > PAGE_SIZE);
      setLastDoc(snap.docs[Math.min(snap.docs.length - 1, PAGE_SIZE - 1)] || null);

      // Fetch author profiles
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

  // ─── Render ────────────────────────────────

  return (
    <div className="fs-page" style={{ paddingBottom: 60 }}>

      {/* Nav */}
      <nav className="fs-nav">
        <Link to="/founder-space/journey/feed" className="fs-nav-logo">
          <span className="fs-nav-dot" style={{ background: '#7c3aed' }} />
          Professional Journey
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link
            to="/founder-space/feed"
            style={{
              fontFamily: "'DM Mono', monospace", fontSize: 10,
              color: '#7a5c3a', textDecoration: 'none', letterSpacing: '0.06em',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#2c1f0e'}
            onMouseLeave={e => e.currentTarget.style.color = '#7a5c3a'}
          >
            Startup ideas
          </Link>
          {!authLoading && (
            user ? (
              <Link
                to="/founder-space/journey/submit"
                style={{
                  padding: '8px 16px', borderRadius: 8,
                  background: '#7c3aed', color: '#fff',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                  textDecoration: 'none',
                }}
              >
                + Pin journey
              </Link>
            ) : (
              <button
                onClick={handleSignIn}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: 'none',
                  background: '#7c3aed', color: '#fff',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                  cursor: 'pointer',
                }}
              >
                Join
              </button>
            )
          )}
        </div>
      </nav>

      {/* Header */}
      <div style={{ textAlign: 'center', padding: '40px 24px 28px' }}>
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase',
          color: '#c4a882', marginBottom: 10,
        }}>
          Professional Journey
        </div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 900,
          color: '#2c1f0e', letterSpacing: '-0.02em',
          margin: '0 0 8px', lineHeight: 1.1,
        }}>
          Every career has a story.
        </h1>
        <p style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 16, fontStyle: 'italic', color: '#b09878',
          margin: '0 0 24px',
        }}>
          Professionals who stopped hiding behind LinkedIn titles.
        </p>
        {!authLoading && (
          user ? (
            <Link
              to="/founder-space/journey/submit"
              style={{
                padding: '12px 28px', borderRadius: 10, border: 'none',
                background: '#7c3aed', color: '#fff',
                fontFamily: "'DM Mono', monospace",
                fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                textDecoration: 'none',
              }}
            >
              Pin your journey →
            </Link>
          ) : (
            <button
              onClick={handleSignIn}
              style={{
                padding: '14px 32px', borderRadius: 12, border: 'none',
                background: '#7c3aed', color: '#fff',
                fontFamily: "'DM Mono', monospace",
                fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
                cursor: 'pointer',
              }}
            >
              Join — it's free
            </button>
          )
        )}
      </div>

      {/* Filter bar */}
      <div style={{
        background: 'rgba(253,246,232,0.96)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(44,31,14,0.1)',
        padding: '10px 24px',
        position: 'sticky', top: 0, zIndex: 40,
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

      {/* Main content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* Error */}
        {error && !loading && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 20, fontWeight: 700, color: '#2c1f0e', marginBottom: 10,
            }}>
              Couldn't load journeys.
            </div>
            <button onClick={() => fetchJourneys(null)} style={{
              padding: '10px 24px', borderRadius: 8, border: 'none',
              background: '#2c1f0e', color: '#f5c842',
              fontFamily: "'DM Mono', monospace",
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
            }}>Retry</button>
          </div>
        )}

        {/* Skeletons */}
        {loading && !error && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
          }}>
            {Array.from({ length: 6 }).map((_, i) => <JourneyCardSkeleton key={i} />)}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && journeys.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 22, fontWeight: 900, color: '#2c1f0e', marginBottom: 10,
            }}>
              {industry !== 'All' ? `No journeys in ${industry} yet.` : 'No journeys pinned yet.'}
            </div>
            <p style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 14, color: '#7a5c3a', marginBottom: 24,
            }}>
              {industry !== 'All' ? 'Try a different industry.' : 'Be the first to tell your story.'}
            </p>
            {user && (
              <Link to="/founder-space/journey/submit" style={{
                padding: '12px 24px', borderRadius: 10, border: 'none',
                background: '#7c3aed', color: '#fff',
                fontFamily: "'DM Mono', monospace",
                fontSize: 11, fontWeight: 700, textDecoration: 'none',
              }}>
                Pin your journey →
              </Link>
            )}
          </div>
        )}

        {/* Grid */}
        {!loading && !error && journeys.length > 0 && (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 20,
            }}>
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
                    padding: '14px 0', borderRadius: 12,
                    border: '1.5px solid rgba(44,31,14,0.15)',
                    background: '#fff', color: '#2c1f0e',
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
                    cursor: loadingMore ? 'wait' : 'pointer',
                    opacity: loadingMore ? 0.6 : 1,
                  }}
                >
                  {loadingMore ? 'Loading…' : 'Load more journeys'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .fs-nav { padding: 14px 20px; }
        }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
