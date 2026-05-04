/**
 * Founder Space — Main Feed
 * Route: /founder-space/feed
 *
 * Client-side Firestore fetching with category/stage/sort filters.
 * Sidebar: real-time updates ticker + top founders.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  collection, collectionGroup, query, where, orderBy, limit,
  getDocs, doc, getDoc, onSnapshot, startAfter,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../lib/auth';
import FeedIdeaCard, { FeedIdeaCardSkeleton } from '../../components/founder-space/FeedIdeaCard';
import './FounderSpace.css';

// ─────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────

const CATEGORIES = ['All', 'Fintech', 'Edtech', 'Healthtech', 'SaaS', 'Ecommerce', 'Deeptech', 'Other'];
const STAGES     = ['All', 'Idea stage', 'MVP built', 'Early stage', 'Growth stage'];
const SORTS      = [
  { value: 'newest',  label: 'Newest'         },
  { value: 'rated',   label: 'Highest rated'  },
  { value: 'wanted',  label: 'Most wanted'    },
];

const PAGE_SIZE = 12;

const TAG_STYLES = {
  Launched:  { bg: '#d4edda', color: '#1a5c33', dot: '#2c8a4e' },
  Funding:   { bg: '#fef3cd', color: '#92610a', dot: '#f5c842' },
  Milestone: { bg: '#d1ecf1', color: '#0c5460', dot: '#1a6bb5' },
  Marketing: { bg: '#e8d5fb', color: '#5a2d82', dot: '#8b5cf6' },
  Pivot:     { bg: '#f8d7da', color: '#721c24', dot: '#e8391e' },
  Other:     { bg: '#f0e8d8', color: '#7a5c3a', dot: '#c4a882' },
};

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

function relTime(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function Avatar({ profile, size = 28 }) {
  const initials = (profile?.name || 'F').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
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
      background: 'linear-gradient(135deg, #c4963a 0%, #2c1f0e 100%)',
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.floor(size * 0.35),
      fontFamily: "'Playfair Display', serif", fontWeight: 700,
    }}>
      {initials}
    </div>
  );
}

// ─────────────────────────────────────────────
//  FilterPill
// ─────────────────────────────────────────────

function FilterPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 14px', borderRadius: 20, whiteSpace: 'nowrap',
        border: active ? 'none' : '1px solid rgba(44,31,14,0.15)',
        background: active ? '#2c1f0e' : '#fff',
        color: active ? '#f5c842' : '#7a5c3a',
        fontFamily: "'DM Mono', monospace",
        fontSize: 10, fontWeight: active ? 700 : 400,
        letterSpacing: '0.06em', cursor: 'pointer',
        transition: 'all 0.15s',
        flexShrink: 0,
      }}
    >
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────
//  Real-time updates ticker (sidebar)
// ─────────────────────────────────────────────

function UpdatesTicker() {
  const [updates, setUpdates]           = useState([]);
  const [ideaNames, setIdeaNames]       = useState({});

  useEffect(() => {
    const q = query(
      collectionGroup(db, 'updates'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsub = onSnapshot(q, async snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUpdates(docs);

      // Batch-fetch idea names
      const ideaIds = [...new Set(docs.map(d => d.ideaId).filter(Boolean))];
      const names = {};
      await Promise.all(ideaIds.map(async id => {
        try {
          const ideaSnap = await getDoc(doc(db, 'ideas', id));
          if (ideaSnap.exists()) names[id] = ideaSnap.data().ideaTitle || 'Untitled';
        } catch {}
      }));
      setIdeaNames(prev => ({ ...prev, ...names }));
    }, () => {
      // silently ignore if collection doesn't exist yet
    });

    return () => unsub();
  }, []);

  if (updates.length === 0) {
    return (
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 10, color: '#c4a882', letterSpacing: '0.08em',
        padding: '12px 0', textAlign: 'center',
      }}>
        No moves yet — be the first.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {updates.map(u => {
        const tag = TAG_STYLES[u.tag] || TAG_STYLES.Other;
        return (
          <div key={u.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: tag.dot, flexShrink: 0, marginTop: 4,
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
                {u.ideaId && ideaNames[u.ideaId] && (
                  <Link
                    to={`/founder-space/ideas/${u.ideaId}`}
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 12, fontWeight: 700, color: '#2c1f0e',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                  >
                    {ideaNames[u.ideaId]}
                  </Link>
                )}
                <span style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 7, fontWeight: 700, letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  background: tag.bg, color: tag.color,
                  padding: '1px 6px', borderRadius: 3,
                }}>
                  {u.tag}
                </span>
                <span style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 8, color: 'rgba(44,31,14,0.3)',
                }}>
                  {relTime(u.createdAt)}
                </span>
              </div>
              {u.body && (
                <div style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 11, color: '#7a5c3a', lineHeight: 1.5,
                  overflow: 'hidden', display: '-webkit-box',
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>
                  {u.body}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Top founders (sidebar)
// ─────────────────────────────────────────────

function TopFounders() {
  const [founders, setFounders] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        // Fetch recently-joined founders who have at least 1 published idea
        const ideasSnap = await getDocs(
          query(
            collection(db, 'ideas'),
            where('status', '==', 'published'),
            orderBy('publishedAt', 'desc'),
            limit(20)
          )
        );
        // Unique authorUids (preserve order = most recently published)
        const seenUids = [];
        const uids = [];
        ideasSnap.docs.forEach(d => {
          const uid = d.data().authorUid;
          if (uid && !seenUids.includes(uid)) {
            seenUids.push(uid);
            uids.push({ uid, ideaCount: 1 });
          } else if (uid) {
            const entry = uids.find(u => u.uid === uid);
            if (entry) entry.ideaCount += 1;
          }
        });

        // Fetch profiles for top 5 unique founders
        const top5 = uids.slice(0, 5);
        const profiles = await Promise.all(
          top5.map(async ({ uid, ideaCount }) => {
            const snap = await getDoc(doc(db, 'users', uid));
            return snap.exists() ? { uid, ideaCount, ...snap.data() } : null;
          })
        );
        setFounders(profiles.filter(Boolean));
      } catch {}
    }
    load();
  }, []);

  if (founders.length === 0) {
    return (
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 10, color: '#c4a882', textAlign: 'center', padding: '12px 0',
      }}>
        Be the first builder here.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {founders.map(f => (
        <Link
          key={f.uid}
          to={`/founder-space/profile/${f.uid}`}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            textDecoration: 'none',
            padding: '6px 0',
            borderBottom: '1px solid rgba(44,31,14,0.05)',
          }}
        >
          <Avatar profile={f} size={32} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 13, fontWeight: 700, color: '#2c1f0e',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {f.name}
            </div>
            {f.title && (
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9, color: '#7a5c3a',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {f.title}
              </div>
            )}
          </div>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 9, color: '#c4963a',
            background: 'rgba(196,150,58,0.1)',
            padding: '2px 7px', borderRadius: 10, flexShrink: 0,
          }}>
            {f.ideaCount} idea{f.ideaCount !== 1 ? 's' : ''}
          </span>
        </Link>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Upcoming events (sidebar)
// ─────────────────────────────────────────────

const EVENT_TACK = {
  book_club:      '#f5c842',
  project_sprint: '#2c8a4e',
  meetup:         '#e8391e',
  open_collab:    '#1a6bb5',
};

const EVENT_ICON = {
  book_club:      '📚',
  project_sprint: '⚡',
  meetup:         '☕',
  open_collab:    '◈',
};

function fmtEventDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  const now = new Date();
  const diffMs = d - now;
  const diffDays = Math.floor(diffMs / 86400000);
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(' ', ' ').toUpperCase().replace(':00', '');
  if (diffDays === 0) return `Today, ${time} IST`;
  if (diffDays === 1) return `Tomorrow, ${time} IST`;
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) + `, ${time} IST`;
}

function UpcomingEvents() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, 'events'),
      where('status', '==', 'upcoming'),
      orderBy('startDateTime', 'asc'),
      limit(3)
    );

    const unsub = onSnapshot(q, snap => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});

    return () => unsub();
  }, []);

  if (events.length === 0) {
    return (
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 10, color: '#c4a882', textAlign: 'center', padding: '12px 0',
      }}>
        No upcoming events yet.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {events.map(ev => (
        <Link
          key={ev.id}
          to={`/founder-space/events/${ev.id}`}
          style={{
            display: 'flex', gap: 10, alignItems: 'flex-start',
            padding: '8px 0', borderBottom: '1px solid rgba(44,31,14,0.06)',
            textDecoration: 'none',
          }}
        >
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            background: `${EVENT_TACK[ev.type] || '#c4963a'}22`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15,
          }}>
            {EVENT_ICON[ev.type] || '◈'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11, fontWeight: 700, color: '#2c1f0e',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              marginBottom: 2,
            }}>
              {ev.title}
            </div>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9, color: '#7a5c3a',
            }}>
              {fmtEventDate(ev.startDateTime)}
            </div>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9, color: '#c4963a', marginTop: 2,
            }}>
              {ev.attendeeCount || 0} going{ev.capacity ? ` · ${ev.capacity - (ev.attendeeCount || 0)} spots left` : ''}
            </div>
          </div>
        </Link>
      ))}
      <Link
        to="/founder-space/events"
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 9, fontWeight: 700, color: '#2c8a4e',
          textDecoration: 'none', letterSpacing: '0.08em',
          textAlign: 'center', paddingTop: 4,
        }}
      >
        All events →
      </Link>
    </div>
  );
}

// ─────────────────────────────────────────────
//  SidebarCard
// ─────────────────────────────────────────────

function SidebarCard({ label, children }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16,
      border: '1px solid rgba(44,31,14,0.1)',
      padding: '18px 16px', marginBottom: 16,
    }}>
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 8, fontWeight: 700,
        letterSpacing: '0.22em', textTransform: 'uppercase',
        color: '#c4963a', marginBottom: 14,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#e8391e' }} />
        {label}
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Main FeedPage
// ─────────────────────────────────────────────

export default function FeedPage() {
  const { user, userProfile, signIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  async function handleSignIn() {
    try {
      const result = await signIn();
      if (!result) return;
      if (!result.hasProfile) navigate('/founder-space/onboarding');
    } catch (err) { console.error('Sign-in error:', err); }
  }

  // ── Filters ───────────────────────────────
  const [category, setCategory] = useState('All');
  const [stage,    setStage]    = useState('All');
  const [sort,     setSort]     = useState('newest');

  // ── Feed data ─────────────────────────────
  const [ideas,     setIdeas]     = useState([]);
  const [authors,   setAuthors]   = useState({});  // uid → profile
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(false);
  const [lastDoc,   setLastDoc]   = useState(null);
  const [hasMore,   setHasMore]   = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // ── Build Firestore query ─────────────────
  const buildQuery = useCallback((afterDoc = null) => {
    const sortField = sort === 'newest' ? 'publishedAt'
      : sort === 'rated'  ? 'avgOverall'
      : 'wantToWorkCount';

    let q = query(
      collection(db, 'ideas'),
      where('status', '==', 'published'),
      orderBy(sortField, 'desc'),
      limit(PAGE_SIZE + 1)
    );

    if (afterDoc) q = query(q, startAfter(afterDoc));
    return q;
  }, [sort]);

  // ── Fetch ideas ───────────────────────────
  const fetchIdeas = useCallback(async (afterDoc = null) => {
    if (afterDoc) setLoadingMore(true);
    else { setLoading(true); setError(false); }

    try {
      const q = buildQuery(afterDoc);
      const snap = await getDocs(q);
      const docs = snap.docs.slice(0, PAGE_SIZE).map(d => ({ id: d.id, ...d.data() }));

      // Client-side filter (avoids composite index requirements)
      const filtered = docs.filter(idea => {
        const catOk   = category === 'All' || idea.category === category;
        const stageOk = stage    === 'All' || idea.stage    === stage;
        return catOk && stageOk;
      });

      if (!afterDoc) {
        setIdeas(filtered);
      } else {
        setIdeas(prev => [...prev, ...filtered]);
      }

      setHasMore(snap.docs.length > PAGE_SIZE);
      setLastDoc(snap.docs[snap.docs.length - 1] || null);

      // Fetch author profiles
      const uids = [...new Set(filtered.map(i => i.authorUid).filter(Boolean))];
      const newAuthors = {};
      await Promise.all(uids.map(async uid => {
        try {
          const snap = await getDoc(doc(db, 'users', uid));
          if (snap.exists()) newAuthors[uid] = { uid: snap.id, ...snap.data() };
        } catch {}
      }));
      setAuthors(prev => ({ ...prev, ...newAuthors }));

    } catch (err) {
      console.error('Feed load error:', err);
      if (!afterDoc) setError(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [buildQuery, category, stage]);

  // ── Re-fetch when filters/sort change ────
  useEffect(() => {
    setLastDoc(null);
    fetchIdeas(null);
  }, [category, stage, sort]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─────────────────────────────────────────
  //  Render
  // ─────────────────────────────────────────

  return (
    <div className="fs-page" style={{ paddingBottom: 60 }}>

      {/* ── Nav ──────────────────────────── */}
      <nav className="fs-nav">
        <Link to="/founder-space" className="fs-nav-logo">
          <span className="fs-nav-dot" />Founder Space
        </Link>
        {!authLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link
              to="/founder-space/journey/feed"
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10, color: '#7a5c3a',
                textDecoration: 'none', letterSpacing: '0.06em',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#7c3aed'}
              onMouseLeave={e => e.currentTarget.style.color = '#7a5c3a'}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c3aed', display: 'inline-block' }} />
              Professional Journey
            </Link>
            <Link
              to="/founder-space/events"
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10, color: '#7a5c3a',
                textDecoration: 'none', letterSpacing: '0.06em',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#2c8a4e'}
              onMouseLeave={e => e.currentTarget.style.color = '#7a5c3a'}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2c8a4e', display: 'inline-block' }} />
              Events
            </Link>
            {user ? (
              <>
                <Link
                  to={userProfile ? `/founder-space/profile/${user.uid}` : '/founder-space/onboarding'}
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10, color: '#7a5c3a',
                    textDecoration: 'none', letterSpacing: '0.06em',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#2c1f0e'}
                  onMouseLeave={e => e.currentTarget.style.color = '#7a5c3a'}
                >
                  {userProfile?.name || 'Complete profile'}
                </Link>
                <Link
                  to="/founder-space/submit"
                  style={{
                    padding: '8px 16px', borderRadius: 8, border: 'none',
                    background: '#2c1f0e', color: '#f5c842',
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                    textDecoration: 'none', cursor: 'pointer',
                  }}
                >
                  + Pin idea
                </Link>
              </>
            ) : (
              <button
                onClick={handleSignIn}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: 'none',
                  background: '#2c1f0e', color: '#f5c842',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                  cursor: 'pointer',
                }}
              >
                Join Founder Space
              </button>
            )}
          </div>
        )}
      </nav>

      {/* ── Page header ──────────────────── */}
      <div style={{ textAlign: 'center', padding: '40px 24px 28px' }}>
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase',
          color: '#c4a882', marginBottom: 10,
        }}>
          Founder Space
        </div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 900,
          color: '#2c1f0e', letterSpacing: '-0.02em',
          margin: '0 0 8px', lineHeight: 1.1,
        }}>
          The investigation board.
        </h1>
        <p style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 16, fontStyle: 'italic', color: '#b09878',
          margin: '0 0 24px',
        }}>
          Where startup ideas stop being secrets.
        </p>
        {!authLoading && (
          user ? (
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                to="/founder-space/submit"
                style={{
                  padding: '12px 24px', borderRadius: 10, border: 'none',
                  background: '#2c1f0e', color: '#f5c842',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                  textDecoration: 'none',
                }}
              >
                Pin your first idea →
              </Link>
              <Link
                to={userProfile ? `/founder-space/profile/${user.uid}` : '/founder-space/onboarding'}
                style={{
                  padding: '12px 24px', borderRadius: 10,
                  border: '1.5px solid rgba(44,31,14,0.15)',
                  background: '#fff', color: '#2c1f0e',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
                  textDecoration: 'none',
                }}
              >
                {userProfile ? 'My profile' : 'Complete profile →'}
              </Link>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              style={{
                padding: '14px 32px', borderRadius: 12, border: 'none',
                background: '#2c1f0e', color: '#f5c842',
                fontFamily: "'DM Mono', monospace",
                fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
                cursor: 'pointer',
              }}
            >
              Join Founder Space — it's free
            </button>
          )
        )}
      </div>

      {/* ── Sticky filter bar ─────────────── */}
      <div style={{
        background: 'rgba(253,246,232,0.96)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(44,31,14,0.1)',
        padding: '10px 24px',
        position: 'sticky', top: 0, zIndex: 40,
      }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'flex', gap: 16, alignItems: 'center',
          overflowX: 'auto', scrollbarWidth: 'none',
        }}>
          {/* Category */}
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {CATEGORIES.map(c => (
              <FilterPill key={c} label={c} active={category === c} onClick={() => setCategory(c)} />
            ))}
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 20, background: 'rgba(44,31,14,0.12)', flexShrink: 0 }} />

          {/* Stage */}
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {STAGES.map(s => (
              <FilterPill key={s} label={s === 'All' ? 'All stages' : s} active={stage === s} onClick={() => setStage(s)} />
            ))}
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 20, background: 'rgba(44,31,14,0.12)', flexShrink: 0 }} />

          {/* Sort */}
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {SORTS.map(s => (
              <FilterPill key={s.value} label={s.label} active={sort === s.value} onClick={() => setSort(s.value)} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Main layout ──────────────────── */}
      <div style={{
        maxWidth: 1100, margin: '0 auto',
        padding: '32px 24px',
        display: 'flex', gap: 28, alignItems: 'flex-start',
      }}>

        {/* ── FEED ─────────────────────── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Error state */}
          {error && !loading && (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 20, fontWeight: 700, color: '#2c1f0e', marginBottom: 10,
              }}>
                Couldn't load the board.
              </div>
              <p style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 13, color: '#7a5c3a', marginBottom: 20,
              }}>
                Refresh to try again.
              </p>
              <button
                onClick={() => fetchIdeas(null)}
                style={{
                  padding: '10px 24px', borderRadius: 8, border: 'none',
                  background: '#2c1f0e', color: '#f5c842',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11, fontWeight: 700, cursor: 'pointer',
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading skeletons */}
          {loading && !error && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 20,
            }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <FeedIdeaCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && ideas.length === 0 && (
            <div style={{ textAlign: 'center', padding: '64px 0' }}>
              <div style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 22, fontWeight: 900, color: '#2c1f0e', marginBottom: 10,
              }}>
                No investigation boards here yet.
              </div>
              <p style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 14, color: '#7a5c3a', marginBottom: 24,
              }}>
                {category !== 'All' || stage !== 'All'
                  ? 'Try a different filter.'
                  : 'Be the first to pin one.'}
              </p>
              {user && (
                <Link
                  to="/founder-space/submit"
                  style={{
                    padding: '12px 24px', borderRadius: 10, border: 'none',
                    background: '#2c1f0e', color: '#f5c842',
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11, fontWeight: 700, textDecoration: 'none',
                  }}
                >
                  Submit your idea →
                </Link>
              )}
            </div>
          )}

          {/* Ideas grid */}
          {!loading && !error && ideas.length > 0 && (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 20,
              }}>
                {ideas.map(idea => (
                  <FeedIdeaCard
                    key={idea.id}
                    idea={idea}
                    author={authors[idea.authorUid]}
                    onClick={() => navigate(`/founder-space/ideas/${idea.id}`)}
                  />
                ))}
              </div>

              {/* Load more */}
              {hasMore && (
                <div style={{ textAlign: 'center', marginTop: 32 }}>
                  <button
                    onClick={() => fetchIdeas(lastDoc)}
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
                    {loadingMore ? 'Loading…' : 'Load more ideas'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── SIDEBAR ──────────────────── */}
        <div className="feed-sidebar" style={{ width: 272, flexShrink: 0 }}>

          <SidebarCard label="Latest moves">
            <UpdatesTicker />
          </SidebarCard>

          <SidebarCard label="Most active builders">
            <TopFounders />
          </SidebarCard>

          {/* Upcoming Events */}
          <SidebarCard label="Build together">
            <UpcomingEvents />
          </SidebarCard>

          {/* Professional Journey CTA */}
          <div style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
            borderRadius: 16, padding: '20px 16px',
            marginBottom: 16,
          }}>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 8, fontWeight: 700,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.6)', marginBottom: 8,
            }}>
              Also in Founder Space
            </div>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 15, fontWeight: 900, color: '#fff',
              marginBottom: 4,
            }}>
              Professional Journey
            </div>
            <div style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 11, color: 'rgba(255,255,255,0.75)',
              marginBottom: 12, lineHeight: 1.4,
            }}>
              Not a founder? Tell your career story on a polaroid board.
            </div>
            <Link
              to="/founder-space/journey/feed"
              style={{
                display: 'block', padding: '9px 0',
                borderRadius: 8, background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.25)',
                color: '#fff', fontFamily: "'DM Mono', monospace",
                fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                textDecoration: 'none', textAlign: 'center',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            >
              Explore journeys →
            </Link>
          </div>

          {/* Feature quick-links + Submit CTA for signed-in users */}
          {user && (
            <>
              <SidebarCard label="What you can do">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { num: '01', title: 'Post your idea', desc: 'Submit your startup on an investigation board', to: '/founder-space/submit' },
                    { num: '02', title: 'Rate ideas', desc: 'Open any idea card → rate on 5 dimensions', to: null },
                    { num: '03', title: 'Find a co-founder', desc: 'Open any idea card → click "Want to work on this"', to: null },
                  ].map(item => (
                    item.to ? (
                      <Link
                        key={item.num}
                        to={item.to}
                        style={{ textDecoration: 'none', display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid rgba(44,31,14,0.06)' }}
                      >
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 700, color: '#c4963a', minWidth: 18, paddingTop: 2 }}>{item.num}</span>
                        <div>
                          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 700, color: '#2c1f0e', marginBottom: 2 }}>{item.title} →</div>
                          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 10, color: '#7a5c3a', lineHeight: 1.4 }}>{item.desc}</div>
                        </div>
                      </Link>
                    ) : (
                      <div key={item.num} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid rgba(44,31,14,0.06)' }}>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 700, color: '#c4963a', minWidth: 18, paddingTop: 2 }}>{item.num}</span>
                        <div>
                          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 700, color: '#2c1f0e', marginBottom: 2 }}>{item.title}</div>
                          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 10, color: '#7a5c3a', lineHeight: 1.4 }}>{item.desc}</div>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </SidebarCard>

              <div style={{
                background: '#2c1f0e', borderRadius: 16,
                padding: '20px 16px', textAlign: 'center',
              }}>
                <div style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 16, fontWeight: 900, color: '#fdf6e8',
                  marginBottom: 6,
                }}>
                  Got an idea?
                </div>
                <div style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 12, color: 'rgba(253,246,232,0.7)',
                  marginBottom: 14,
                }}>
                  Pin it in 5 minutes.
                </div>
                <Link
                  to="/founder-space/submit"
                  style={{
                    display: 'block', padding: '10px 0',
                    borderRadius: 8, background: '#f5c842',
                    color: '#2c1f0e', fontFamily: "'DM Mono', monospace",
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                    textDecoration: 'none',
                  }}
                >
                  Start your board →
                </Link>
              </div>
            </>
          )}

          {!user && !authLoading && (
            <div style={{
              background: '#2c1f0e', borderRadius: 16,
              padding: '20px 16px', textAlign: 'center',
            }}>
              <div style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 16, fontWeight: 900, color: '#fdf6e8', marginBottom: 6,
              }}>
                Join the board.
              </div>
              <div style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 12, color: 'rgba(253,246,232,0.7)', marginBottom: 14,
              }}>
                Rate ideas. Express interest. Get noticed.
              </div>
              <button
                onClick={handleSignIn}
                style={{
                  display: 'block', width: '100%', padding: '10px 0',
                  borderRadius: 8, background: '#f5c842',
                  color: '#2c1f0e', fontFamily: "'DM Mono', monospace",
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                  border: 'none', cursor: 'pointer',
                }}
              >
                Sign in with Google →
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .feed-sidebar { display: none !important; }
        }
        /* hide scrollbar on filter bar */
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
