/**
 * Founder Space — Events Feed
 * Route: /founder-space/events
 *
 * "Build Together" — project sprints, book clubs, meetups, open collabs.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  collection, query, where, orderBy, limit,
  getDocs, doc, getDoc,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../lib/auth';
import './FounderSpace.css';

// ─────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────

export const EVENT_TYPES = {
  book_club:     { label: 'Book Club',     tack: '#f5c842', icon: '📚' },
  project_sprint:{ label: 'Project Sprint',tack: '#2c8a4e', icon: '⚡' },
  meetup:        { label: 'Meetup',        tack: '#e8391e', icon: '☕' },
  open_collab:   { label: 'Open Collab',   tack: '#1a6bb5', icon: '◈' },
};

const TYPE_FILTERS = ['All', 'Book Club', 'Project Sprint', 'Meetup', 'Open Collab'];
const FORMAT_FILTERS = ['All', 'Online', 'In-person'];

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

export function fmtDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  const now = new Date();
  const diff = d - now;
  const days = Math.floor(diff / 86400000);

  if (diff < 0 && diff > -7200000) return 'Happening now';
  if (days === 0) {
    return `Today, ${d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })} IST`;
  }
  if (days === 1) {
    return `Tomorrow, ${d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })} IST`;
  }

  const dayName = d.toLocaleDateString('en-IN', { weekday: 'long' });
  const time    = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

  if (days < 7) return `This ${dayName}, ${time} IST`;

  const dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return `${dateStr}, ${time} IST`;
}

function isLiveNow(ts) {
  if (!ts) return false;
  const d = ts.toDate ? ts.toDate() : ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  const diff = Date.now() - d.getTime();
  return diff >= 0 && diff <= 7200000; // within 2 hours
}

function Avatar({ profile, size = 28 }) {
  const initials = (profile?.name || 'F').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  if (profile?.photoURL) {
    return <img src={profile.photoURL} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #c4963a 0%, #2c1f0e 100%)',
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.floor(size * 0.38), fontFamily: "'Playfair Display', serif", fontWeight: 700,
    }}>
      {initials}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Event Card
// ─────────────────────────────────────────────

export function EventCard({ event, host, onClick, compact }) {
  const cfg      = EVENT_TYPES[event.type] || EVENT_TYPES.meetup;
  const live     = isLiveNow(event.startDateTime);
  const total    = event.attendeeCount || 0;
  const isFull   = event.capacity && total >= event.capacity;
  const spotsLeft = event.capacity ? Math.max(0, event.capacity - total) : null;

  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff', borderRadius: 18,
        border: '1px solid rgba(44,31,14,0.1)',
        padding: compact ? '14px' : '20px',
        cursor: 'pointer', position: 'relative',
        transition: 'box-shadow 0.2s, transform 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(44,31,14,0.14)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
    >
      {/* Tack */}
      <div style={{
        position: 'absolute', top: compact ? 12 : 16, left: compact ? 12 : 16,
        width: 8, height: 8, borderRadius: '50%',
        background: cfg.tack,
        boxShadow: `0 1px 4px ${cfg.tack}88`,
      }} />

      {/* Live badge */}
      {live && (
        <div style={{
          position: 'absolute', top: compact ? 12 : 16, right: compact ? 12 : 16,
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'rgba(44,138,78,0.12)', padding: '3px 8px', borderRadius: 20,
        }}>
          <div style={{
            width: 5, height: 5, borderRadius: '50%', background: '#2c8a4e',
            animation: 'pulse-dot 1.5s ease-in-out infinite',
          }} />
          <span style={{
            fontFamily: "'DM Mono', monospace", fontSize: 8,
            fontWeight: 700, color: '#2c8a4e', letterSpacing: '0.12em',
          }}>
            LIVE
          </span>
        </div>
      )}

      {/* Type badge */}
      <div style={{
        marginBottom: 12, marginTop: compact ? 0 : 4, paddingLeft: 18,
        fontFamily: "'DM Mono', monospace",
        fontSize: 8, fontWeight: 700, letterSpacing: '0.16em',
        textTransform: 'uppercase', color: cfg.tack,
      }}>
        {cfg.icon} {cfg.label}
      </div>

      {/* Title */}
      <div style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: compact ? 15 : 18, fontWeight: 900,
        color: '#2c1f0e', lineHeight: 1.2,
        marginBottom: 8,
        display: '-webkit-box', WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {event.title}
      </div>

      {/* Description */}
      {!compact && event.description && (
        <div style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 12, color: '#7a5c3a', lineHeight: 1.5,
          marginBottom: 10,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {event.description}
        </div>
      )}

      {/* Date + Format */}
      <div style={{
        display: 'flex', gap: 8, flexWrap: 'wrap',
        alignItems: 'center', marginBottom: 10,
      }}>
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 9, color: '#c4963a', fontWeight: 600,
        }}>
          {fmtDate(event.startDateTime)}
        </span>
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 8, color: '#c4a882',
          padding: '2px 8px', borderRadius: 10,
          background: 'rgba(44,31,14,0.06)',
        }}>
          {event.format === 'online' ? '💻 Online' : `📍 ${event.city || 'In-person'}`}
        </span>
        {event.isRecurring && (
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 8, color: '#7a5c3a',
            padding: '2px 8px', borderRadius: 10,
            background: 'rgba(44,31,14,0.06)',
          }}>
            🔁 {event.recurringPattern === 'biweekly' ? 'Biweekly' : 'Weekly'}
          </span>
        )}
      </div>

      {/* Tags */}
      {!compact && (event.tags || []).length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {event.tags.slice(0, 3).map(tag => (
            <span key={tag} style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 8, fontWeight: 600,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              background: 'rgba(44,31,14,0.07)', color: '#7a5c3a',
              padding: '2px 8px', borderRadius: 10,
            }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      <div style={{ height: 1, background: 'rgba(44,31,14,0.06)', marginBottom: 12 }} />

      {/* Host + attendees row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar profile={host} size={24} />
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 9, fontWeight: 600, color: '#2c1f0e',
          }}>
            {host?.name || 'Host'}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 9, color: '#c4a882',
          }}>
            {total} {total === 1 ? 'person' : 'people'}
          </div>
          {spotsLeft !== null && (
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9, color: isFull ? '#e8391e' : '#2c8a4e',
              background: isFull ? 'rgba(232,57,30,0.08)' : 'rgba(44,138,78,0.08)',
              padding: '2px 7px', borderRadius: 10,
            }}>
              {isFull ? 'Full' : `${spotsLeft} left`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EventCardSkeleton() {
  const pulse = { background: '#e8dcc8', borderRadius: 4, animation: 'feed-pulse 1.8s ease-in-out infinite' };
  return (
    <div style={{ background: '#fff', borderRadius: 18, border: '1px solid rgba(44,31,14,0.1)', padding: '20px' }}>
      <div style={{ ...pulse, height: 12, width: 80, marginBottom: 12 }} />
      <div style={{ ...pulse, height: 20, width: '80%', marginBottom: 8 }} />
      <div style={{ ...pulse, height: 14, width: '60%', marginBottom: 10 }} />
      <div style={{ ...pulse, height: 10, width: 120, marginBottom: 12 }} />
      <div style={{ ...pulse, height: 1, marginBottom: 12, borderRadius: 1 }} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ ...pulse, width: 24, height: 24, borderRadius: '50%' }} />
        <div style={{ ...pulse, height: 9, width: 80 }} />
      </div>
      <style>{`@keyframes feed-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Main feed
// ─────────────────────────────────────────────

export default function EventsFeed() {
  const { user, signIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [typeFilter,   setTypeFilter]   = useState('All');
  const [formatFilter, setFormatFilter] = useState('All');
  const [events,       setEvents]       = useState([]);
  const [hosts,        setHosts]        = useState({});
  const [loading,      setLoading]      = useState(true);

  async function handleSignIn() {
    try {
      const result = await signIn();
      if (!result) return;
      if (!result.hasProfile) navigate('/founder-space/onboarding');
    } catch (err) { console.error(err); }
  }

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'events'),
        where('status', '==', 'upcoming'),
        orderBy('startDateTime', 'asc'),
        limit(30)
      );
      const snap = await getDocs(q);
      let docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Client-side filter
      if (typeFilter !== 'All') {
        const keyMap = { 'Book Club': 'book_club', 'Project Sprint': 'project_sprint', 'Meetup': 'meetup', 'Open Collab': 'open_collab' };
        docs = docs.filter(e => e.type === keyMap[typeFilter]);
      }
      if (formatFilter === 'Online') docs = docs.filter(e => e.format === 'online');
      if (formatFilter === 'In-person') docs = docs.filter(e => e.format === 'in_person');

      setEvents(docs);

      // Fetch hosts
      const uids = [...new Set(docs.map(e => e.creatorUid).filter(Boolean))];
      const newHosts = {};
      await Promise.all(uids.map(async uid => {
        try {
          const s = await getDoc(doc(db, 'users', uid));
          if (s.exists()) newHosts[uid] = { uid: s.id, ...s.data() };
        } catch {}
      }));
      setHosts(newHosts);

    } catch (err) {
      console.error('Events load error:', err);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, formatFilter]);

  useEffect(() => { fetchEvents(); }, [typeFilter, formatFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const liveEvents   = events.filter(e => isLiveNow(e.startDateTime));
  const upcomingEvts = events.filter(e => !isLiveNow(e.startDateTime));

  function FilterPill({ label, active, onClick }) {
    return (
      <button onClick={onClick} style={{
        padding: '5px 14px', borderRadius: 20, whiteSpace: 'nowrap',
        border: active ? 'none' : '1px solid rgba(44,31,14,0.15)',
        background: active ? '#2c1f0e' : '#fff',
        color: active ? '#f5c842' : '#7a5c3a',
        fontFamily: "'DM Mono', monospace",
        fontSize: 10, fontWeight: active ? 700 : 400,
        letterSpacing: '0.06em', cursor: 'pointer',
        transition: 'all 0.15s', flexShrink: 0,
      }}>
        {label}
      </button>
    );
  }

  return (
    <div className="fs-page" style={{ paddingBottom: 60 }}>

      {/* Nav */}
      <nav className="fs-nav">
        <Link to="/founder-space/feed" className="fs-nav-logo">
          <span className="fs-nav-dot" />Founder Space
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/founder-space/feed" style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#7a5c3a', textDecoration: 'none' }}>
            Ideas
          </Link>
          <Link to="/founder-space/journey/feed" style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#7a5c3a', textDecoration: 'none' }}>
            Journeys
          </Link>
          {!authLoading && (
            user ? (
              <Link to="/founder-space/events/create" style={{
                padding: '8px 16px', borderRadius: 8,
                background: '#2c8a4e', color: '#fff',
                fontFamily: "'DM Mono', monospace",
                fontSize: 10, fontWeight: 700, textDecoration: 'none',
              }}>
                + Start something
              </Link>
            ) : (
              <button onClick={handleSignIn} style={{
                padding: '8px 16px', borderRadius: 8, border: 'none',
                background: '#2c1f0e', color: '#f5c842',
                fontFamily: "'DM Mono', monospace",
                fontSize: 10, fontWeight: 700, cursor: 'pointer',
              }}>
                Join
              </button>
            )
          )}
        </div>
      </nav>

      {/* Header */}
      <div style={{ textAlign: 'center', padding: '40px 24px 28px' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#c4a882', marginBottom: 10 }}>
          Build Together
        </div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 900,
          color: '#2c1f0e', letterSpacing: '-0.02em',
          margin: '0 0 8px', lineHeight: 1.1,
        }}>
          What's happening.
        </h1>
        <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontStyle: 'italic', color: '#b09878', margin: '0 0 24px' }}>
          Founder-led events, book clubs, and project sprints. Join or start one.
        </p>
        {!authLoading && user && (
          <Link to="/founder-space/events/create" style={{
            padding: '12px 28px', borderRadius: 10, border: 'none',
            background: '#2c8a4e', color: '#fff',
            fontFamily: "'DM Mono', monospace",
            fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
            textDecoration: 'none',
          }}>
            Start something →
          </Link>
        )}
      </div>

      {/* Filter bar */}
      <div style={{
        background: 'rgba(253,246,232,0.96)', backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(44,31,14,0.1)',
        padding: '10px 24px', position: 'sticky', top: 0, zIndex: 40,
      }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none',
          alignItems: 'center',
        }}>
          {TYPE_FILTERS.map(f => <FilterPill key={f} label={f} active={typeFilter === f} onClick={() => setTypeFilter(f)} />)}
          <div style={{ width: 1, height: 20, background: 'rgba(44,31,14,0.12)', flexShrink: 0 }} />
          {FORMAT_FILTERS.map(f => <FilterPill key={f} label={f} active={formatFilter === f} onClick={() => setFormatFilter(f)} />)}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* Happening now */}
        {liveEvents.length > 0 && (
          <div style={{ marginBottom: 36 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2c8a4e', animation: 'pulse-dot 1.5s ease-in-out infinite' }} />
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#2c8a4e' }}>
                Happening now
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {liveEvents.map(e => (
                <EventCard key={e.id} event={e} host={hosts[e.creatorUid]} onClick={() => navigate(`/founder-space/events/${e.id}`)} />
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {Array.from({ length: 6 }).map((_, i) => <EventCardSkeleton key={i} />)}
          </div>
        ) : upcomingEvts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: '#2c1f0e', marginBottom: 10 }}>
              No events scheduled yet.
            </div>
            <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, color: '#7a5c3a', marginBottom: 24 }}>
              Be the one who starts something.
            </p>
            {user && (
              <Link to="/founder-space/events/create" style={{
                padding: '12px 24px', borderRadius: 10, border: 'none',
                background: '#2c8a4e', color: '#fff',
                fontFamily: "'DM Mono', monospace",
                fontSize: 11, fontWeight: 700, textDecoration: 'none',
              }}>
                Start an event →
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {upcomingEvts.map(e => (
              <EventCard key={e.id} event={e} host={hosts[e.creatorUid]} onClick={() => navigate(`/founder-space/events/${e.id}`)} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.3)} }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
