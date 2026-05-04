/**
 * Event Detail Page — Founder Space
 * Route: /founder-space/events/:eventId
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  collection, query, where, limit,
  increment, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../lib/auth';
import { useToast } from '../../components/Toast';
import { EVENT_TYPES, fmtDate } from './EventsFeed';
import './FounderSpace.css';

// ─────────────────────────────────────────────
//  Avatar
// ─────────────────────────────────────────────

function Avatar({ profile, size = 36 }) {
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
//  Share button
// ─────────────────────────────────────────────

function ShareBtn({ title }) {
  const { showToast } = useToast();
  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title, url }); return; } catch {}
    }
    try { await navigator.clipboard.writeText(url); showToast('Link copied!', 'success'); }
    catch { showToast('Could not copy.', 'error'); }
  }
  return (
    <button onClick={share} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '8px 16px', borderRadius: 8,
      border: '1.5px solid rgba(44,31,14,0.15)',
      background: '#fff', color: '#7a5c3a',
      fontFamily: "'DM Mono', monospace",
      fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
      cursor: 'pointer',
    }}>
      ↗ Share
    </button>
  );
}

// ─────────────────────────────────────────────
//  Sidebar Card
// ─────────────────────────────────────────────

function SCard({ children, style }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16,
      border: '1px solid rgba(44,31,14,0.1)',
      padding: '20px', marginBottom: 16,
      ...style,
    }}>
      {children}
    </div>
  );
}

function SLabel({ children }) {
  return (
    <div style={{
      fontFamily: "'DM Mono', monospace",
      fontSize: 9, fontWeight: 700,
      letterSpacing: '0.22em', textTransform: 'uppercase',
      color: '#c4963a', marginBottom: 14,
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#e8391e' }} />
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Role badge
// ─────────────────────────────────────────────

function RoleBadge({ role }) {
  const colors = {
    Founder:      { bg: 'rgba(232,57,30,0.1)',   color: '#e8391e'   },
    Investor:     { bg: 'rgba(26,107,181,0.1)',   color: '#1a6bb5'   },
    Professional: { bg: 'rgba(44,138,78,0.1)',    color: '#2c8a4e'   },
    VC:           { bg: 'rgba(196,150,58,0.12)',  color: '#c4963a'   },
    Other:        { bg: 'rgba(44,31,14,0.07)',    color: '#7a5c3a'   },
  };
  const c = colors[role] || colors.Other;
  return (
    <span style={{
      fontFamily: "'DM Mono', monospace",
      fontSize: 7, fontWeight: 700,
      letterSpacing: '0.12em', textTransform: 'uppercase',
      background: c.bg, color: c.color,
      padding: '2px 7px', borderRadius: 10, flexShrink: 0,
    }}>
      {role || 'Member'}
    </span>
  );
}

// ─────────────────────────────────────────────
//  Loading skeleton
// ─────────────────────────────────────────────

function LoadingSkeleton() {
  const p = { background: '#e8dcc8', borderRadius: 4, animation: 'fs-skeleton 1.8s ease-in-out infinite' };
  return (
    <div style={{ maxWidth: 960, margin: '48px auto', padding: '0 24px' }}>
      <div style={{ ...p, height: 36, width: '60%', marginBottom: 16 }} />
      <div style={{ ...p, height: 18, width: '80%', marginBottom: 32 }} />
      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ flex: 1 }}>
          <div style={{ ...p, height: 200, borderRadius: 16 }} />
        </div>
        <div style={{ width: 280 }}>
          <div style={{ ...p, height: 120, borderRadius: 16, marginBottom: 16 }} />
          <div style={{ ...p, height: 100, borderRadius: 16 }} />
        </div>
      </div>
      <style>{`@keyframes fs-skeleton { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Main
// ─────────────────────────────────────────────

export default function EventPage() {
  const { eventId }    = useParams();
  const { user }       = useAuth();
  const navigate       = useNavigate();
  const { showToast }  = useToast();

  const [event,     setEvent]     = useState(null);
  const [host,      setHost]      = useState(null);
  const [attendees, setAttendees] = useState([]);  // [{userId, profile, ...}]
  const [myRecord,  setMyRecord]  = useState(null); // my eventAttendees doc
  const [loading,   setLoading]   = useState(true);
  const [joining,   setJoining]   = useState(false);
  const [notFound,  setNotFound]  = useState(false);

  // Load event + host (critical path — sets notFound on failure)
  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'events', eventId));
        if (!snap.exists()) { setNotFound(true); setLoading(false); return; }
        const data = { id: snap.id, ...snap.data() };
        setEvent(data);

        updateDoc(doc(db, 'events', eventId), { viewCount: increment(1) }).catch(() => {});

        if (data.creatorUid) {
          try {
            const hSnap = await getDoc(doc(db, 'users', data.creatorUid));
            if (hSnap.exists()) setHost({ uid: hSnap.id, ...hSnap.data() });
          } catch {}
        }
      } catch (err) {
        console.error('Load event error:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }

      // Load attendees separately — failure here should NOT cause "not found"
      try {
        const attSnap = await getDocs(
          query(collection(db, 'eventAttendees'), where('eventId', '==', eventId), limit(20))
        );
        const attDocs = attSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const profileMap = {};
        await Promise.all(attDocs.map(async a => {
          try {
            const p = await getDoc(doc(db, 'users', a.userId));
            if (p.exists()) profileMap[a.userId] = { uid: p.id, ...p.data() };
          } catch {}
        }));

        setAttendees(attDocs.map(a => ({ ...a, profile: profileMap[a.userId] })));
      } catch {}
    }
    load();
  }, [eventId]);

  // Check if current user already joined
  useEffect(() => {
    if (!user || !event) return;
    const me = attendees.find(a => a.userId === user.uid);
    setMyRecord(me || null);
  }, [user, attendees, event]);

  const isHost   = user && event && event.creatorUid === user.uid;
  const isFull   = event?.capacity && (event.attendeeCount || 0) >= event.capacity;
  const isJoined = !!myRecord;

  const handleJoin = useCallback(async () => {
    if (!user) { navigate('/founder-space'); return; }
    setJoining(true);
    try {
      const status = isFull ? 'waitlist' : 'confirmed';
      const ref = await addDoc(collection(db, 'eventAttendees'), {
        eventId, userId: user.uid, joinedAt: serverTimestamp(), status,
      });
      if (status === 'confirmed') {
        await updateDoc(doc(db, 'events', eventId), { attendeeCount: increment(1) });
        setEvent(prev => ({ ...prev, attendeeCount: (prev.attendeeCount || 0) + 1 }));
      }
      const newRec = { id: ref.id, eventId, userId: user.uid, status };
      setMyRecord(newRec);
      setAttendees(prev => [...prev, { ...newRec, profile: null }]);
      showToast(status === 'confirmed' ? 'You\'re in! ✓' : 'Added to waitlist.', 'success');
    } catch (err) {
      console.error('Join error:', err);
      showToast('Could not join. Try again.', 'error');
    } finally {
      setJoining(false);
    }
  }, [user, eventId, isFull, navigate, showToast]);

  const handleLeave = useCallback(async () => {
    if (!myRecord) return;
    try {
      await deleteDoc(doc(db, 'eventAttendees', myRecord.id));
      if (myRecord.status === 'confirmed') {
        await updateDoc(doc(db, 'events', eventId), { attendeeCount: increment(-1) });
        setEvent(prev => ({ ...prev, attendeeCount: Math.max(0, (prev.attendeeCount || 0) - 1) }));
      }
      setMyRecord(null);
      setAttendees(prev => prev.filter(a => a.userId !== user.uid));
      showToast('Left the event.', 'success');
    } catch {
      showToast('Could not leave.', 'error');
    }
  }, [myRecord, eventId, user, showToast]);

  if (loading) return <LoadingSkeleton />;

  if (notFound || !event) {
    return (
      <div className="fs-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 900, color: '#2c1f0e', marginBottom: 12 }}>
          Event not found.
        </div>
        <Link to="/founder-space/events" style={{ color: '#c4963a', fontFamily: "'DM Mono', monospace", fontSize: 11 }}>
          Browse all events →
        </Link>
      </div>
    );
  }

  const cfg    = EVENT_TYPES[event.type] || EVENT_TYPES.meetup;
  const spots  = event.capacity ? Math.max(0, event.capacity - (event.attendeeCount || 0)) : null;

  return (
    <div className="fs-page" style={{ paddingBottom: 80 }}>

      {/* Nav */}
      <nav className="fs-nav">
        <Link to="/founder-space/events" className="fs-nav-logo">
          <span className="fs-nav-dot" />Founder Space
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShareBtn title={event.title} />
          {user && (
            <Link to="/founder-space/events/create" style={{
              padding: '8px 16px', borderRadius: 8,
              background: '#2c8a4e', color: '#fff',
              fontFamily: "'DM Mono', monospace",
              fontSize: 10, fontWeight: 700, textDecoration: 'none',
            }}>
              + Start one
            </Link>
          )}
        </div>
      </nav>

      {/* Event hero card */}
      <div style={{ background: '#fff', borderBottom: '1px solid rgba(44,31,14,0.06)', padding: '40px 0' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px' }}>
          {/* Tack */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: cfg.tack, boxShadow: `0 2px 8px ${cfg.tack}66` }} />
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: cfg.tack }}>
              {cfg.icon} {cfg.label}
            </div>
          </div>

          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 900, color: '#2c1f0e', margin: '0 0 12px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            {event.title}
          </h1>

          {event.description && (
            <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, color: '#7a5c3a', lineHeight: 1.65, margin: '0 0 20px', maxWidth: 600 }}>
              {event.description}
            </p>
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#c4963a', fontWeight: 600 }}>
              {fmtDate(event.startDateTime)}
            </span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#7a5c3a', background: 'rgba(44,31,14,0.07)', padding: '3px 10px', borderRadius: 10 }}>
              {event.format === 'online' ? '💻 Online' : `📍 ${event.city || 'In-person'}`}
            </span>
            {event.isRecurring && (
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#7a5c3a', background: 'rgba(44,31,14,0.07)', padding: '3px 10px', borderRadius: 10 }}>
                🔁 {event.recurringPattern === 'biweekly' ? 'Biweekly' : 'Weekly'}
              </span>
            )}
            {(event.tags || []).map(t => (
              <span key={t} style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, fontWeight: 600, color: '#7a5c3a', background: 'rgba(44,31,14,0.06)', padding: '3px 9px', borderRadius: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{
        maxWidth: 960, margin: '0 auto', padding: '32px 24px',
        display: 'flex', gap: 28, alignItems: 'flex-start',
      }}>

        {/* ── LEFT: Attendees ─────────────────── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: '#2c1f0e', marginBottom: 20, marginTop: 0 }}>
            Who's coming ({event.attendeeCount || 0})
          </h2>

          {attendees.length === 0 ? (
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, color: '#7a5c3a', padding: '24px 0' }}>
              Be the first to join.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {attendees.map(a => (
                <div key={a.id} style={{
                  background: '#fff', borderRadius: 14,
                  border: '1px solid rgba(44,31,14,0.08)',
                  padding: '14px',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <Avatar profile={a.profile} size={36} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 11, fontWeight: 600, color: '#2c1f0e',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {a.profile?.name || 'Member'}
                    </div>
                    <RoleBadge role={a.profile?.role} />
                    {a.status === 'waitlist' && (
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#c4a882', marginTop: 3 }}>
                        Waitlisted
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Discussion locked */}
          <div style={{
            marginTop: 40, background: '#fff', borderRadius: 16,
            border: '1px solid rgba(44,31,14,0.08)',
            padding: '28px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>💬</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: '#2c1f0e', marginBottom: 6 }}>
              Discussion opens after the event.
            </div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, color: '#7a5c3a' }}>
              Post-event notes and resources will live here.
            </div>
          </div>
        </div>

        {/* ── RIGHT: Sidebar ──────────────────── */}
        <div style={{ width: 272, flexShrink: 0 }}>

          {/* Host card */}
          <SCard>
            <SLabel>Host</SLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar profile={host || { name: event.creatorName, photoURL: event.creatorPhoto }} size={44} />
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: '#2c1f0e' }}>
                  {host?.name || event.creatorName || 'Host'}
                </div>
                {host?.title && (
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#7a5c3a', marginTop: 2 }}>
                    {host.title}
                  </div>
                )}
              </div>
            </div>
            {host?.uid && (
              <Link to={`/founder-space/profile/${host.uid}`} style={{
                display: 'block', marginTop: 14,
                fontFamily: "'DM Mono', monospace", fontSize: 10,
                color: '#c4963a', textDecoration: 'none', fontWeight: 600,
              }}>
                View profile →
              </Link>
            )}
          </SCard>

          {/* Join card */}
          <SCard>
            <SLabel>Join this event</SLabel>

            {/* Spots counter */}
            {spots !== null && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#7a5c3a' }}>
                    {event.attendeeCount || 0} / {event.capacity} spots
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: isFull ? '#e8391e' : '#2c8a4e' }}>
                    {isFull ? 'Full' : `${spots} left`}
                  </div>
                </div>
                <div style={{ height: 4, background: 'rgba(44,31,14,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 4,
                    width: `${Math.min(100, ((event.attendeeCount || 0) / event.capacity) * 100)}%`,
                    background: isFull ? '#e8391e' : '#2c8a4e',
                    transition: 'width 0.4s',
                  }} />
                </div>
                {spots <= 3 && !isFull && (
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#e8391e', marginTop: 6 }}>
                    ⚠ Only {spots} {spots === 1 ? 'spot' : 'spots'} remaining!
                  </div>
                )}
              </div>
            )}

            {isHost ? (
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#2c8a4e', fontWeight: 600 }}>
                ✓ You're hosting this
              </div>
            ) : isJoined ? (
              <>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 14px', borderRadius: 8,
                  background: 'rgba(44,138,78,0.1)', marginBottom: 12,
                }}>
                  <span style={{ fontSize: 14 }}>✓</span>
                  <div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 700, color: '#2c8a4e' }}>
                      You're in!
                    </div>
                    {myRecord?.status === 'waitlist' && (
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#c4a882' }}>
                        Waitlisted — we'll notify if a spot opens
                      </div>
                    )}
                  </div>
                </div>
                {event.format === 'online' && event.meetingLink && (
                  <a href={event.meetingLink} target="_blank" rel="noreferrer" style={{
                    display: 'block', padding: '10px 0', textAlign: 'center',
                    borderRadius: 8, background: '#2c1f0e', color: '#f5c842',
                    fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 700,
                    textDecoration: 'none', marginBottom: 10,
                  }}>
                    Join the meeting →
                  </a>
                )}
                {event.format === 'in_person' && (event.city || event.venue) && (
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, color: '#7a5c3a', marginBottom: 10 }}>
                    📍 {[event.venue, event.city].filter(Boolean).join(', ')}
                  </div>
                )}
                <button onClick={handleLeave} style={{
                  width: '100%', padding: '9px', borderRadius: 8,
                  border: '1px solid rgba(44,31,14,0.15)', background: '#fff',
                  color: '#c4a882', fontFamily: "'DM Mono', monospace",
                  fontSize: 10, cursor: 'pointer',
                }}>
                  Leave event
                </button>
              </>
            ) : (
              <button
                onClick={handleJoin}
                disabled={joining}
                style={{
                  width: '100%', padding: '13px 0',
                  borderRadius: 10, border: 'none',
                  background: joining ? 'rgba(44,31,14,0.4)' : isFull ? '#7a5c3a' : '#2c1f0e',
                  color: '#f5c842',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
                  cursor: joining ? 'wait' : 'pointer',
                }}
              >
                {joining ? 'Joining…' : isFull ? 'Join waitlist' : 'Join this event →'}
              </button>
            )}
          </SCard>

          {/* Details card */}
          <SCard>
            <SLabel>Details</SLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Date',   value: fmtDate(event.startDateTime) },
                { label: 'Format', value: event.format === 'online' ? '💻 Online' : `📍 ${event.city || 'In-person'}` },
                { label: 'Type',   value: `${EVENT_TYPES[event.type]?.icon} ${EVENT_TYPES[event.type]?.label}` },
                event.capacity ? { label: 'Capacity', value: `${event.capacity} people` } : null,
                event.isRecurring ? { label: 'Recurrence', value: event.recurringPattern === 'biweekly' ? 'Biweekly' : 'Weekly' } : null,
              ].filter(Boolean).map(item => (
                <div key={item.label}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#c4a882', marginBottom: 3 }}>
                    {item.label}
                  </div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, color: '#2c1f0e' }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </SCard>

        </div>
      </div>
    </div>
  );
}
