/**
 * Founder Space — Unified Community Feed
 * Route: /founder-space/feed
 *
 * One feed. Ideas, journeys, events — all in one place.
 * Filterable by content type with contextual sub-filters.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  collection, collectionGroup, query, where, orderBy, limit,
  getDocs, doc, getDoc, onSnapshot,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../lib/auth';
import FeedIdeaCard, { FeedIdeaCardSkeleton } from '../../components/founder-space/FeedIdeaCard';
import { EventCard } from './EventsFeed';
import './FounderSpace.css';

// ─────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────

const TYPE_TABS = ['All', 'Ideas', 'Journeys', 'Events'];

const TYPE_CFG = {
  All:      { color: '#2c1f0e', dot: '#c4963a', createTo: '/founder-space/submit',          createLabel: 'Pin idea'     },
  Ideas:    { color: '#c4963a', dot: '#f5c842', createTo: '/founder-space/submit',          createLabel: 'Pin idea'     },
  Journeys: { color: '#7c3aed', dot: '#8b5cf6', createTo: '/founder-space/journey/submit',  createLabel: 'Pin journey'  },
  Events:   { color: '#2c8a4e', dot: '#4ade80', createTo: '/founder-space/events/create',   createLabel: 'Start event'  },
};

const CATEGORIES        = ['All', 'Fintech', 'Edtech', 'Healthtech', 'SaaS', 'Ecommerce', 'Deeptech', 'Other'];
const STAGES            = ['All', 'Idea stage', 'MVP built', 'Early stage', 'Growth stage'];
const SORTS             = [
  { value: 'newest', label: 'Newest'        },
  { value: 'rated',  label: 'Highest rated' },
  { value: 'wanted', label: 'Most wanted'   },
];
const JOURNEY_INDUSTRIES = ['All', 'Fintech', 'Edtech', 'Healthtech', 'SaaS', 'Ecommerce', 'Deeptech', 'B2B', 'D2C', 'Media', 'Climate', 'Other'];
const EVT_TYPES          = ['All', 'Book Club', 'Project Sprint', 'Meetup', 'Open Collab'];
const EVT_FORMATS        = ['All', 'Online', 'In-person'];
const EVT_KEY_MAP        = { 'Book Club': 'book_club', 'Project Sprint': 'project_sprint', 'Meetup': 'meetup', 'Open Collab': 'open_collab' };

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

function FilterPill({ label, active, onClick, activeColor }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 14px', borderRadius: 20, whiteSpace: 'nowrap',
        border: active ? 'none' : '1px solid rgba(44,31,14,0.15)',
        background: active ? (activeColor || '#2c1f0e') : '#fff',
        color: active ? '#fff' : '#7a5c3a',
        fontFamily: "'DM Mono', monospace",
        fontSize: 10, fontWeight: active ? 700 : 400,
        letterSpacing: '0.06em', cursor: 'pointer',
        transition: 'all 0.15s', flexShrink: 0,
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
  const [updates, setUpdates]     = useState([]);
  const [ideaNames, setIdeaNames] = useState({});

  useEffect(() => {
    const q = query(
      collectionGroup(db, 'updates'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsub = onSnapshot(q, async snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUpdates(docs);

      const ideaIds = [...new Set(docs.map(d => d.ideaId).filter(Boolean))];
      const names = {};
      await Promise.all(ideaIds.map(async id => {
        try {
          const ideaSnap = await getDoc(doc(db, 'ideas', id));
          if (ideaSnap.exists()) names[id] = ideaSnap.data().ideaTitle || 'Untitled';
        } catch {}
      }));
      setIdeaNames(prev => ({ ...prev, ...names }));
    }, () => {});

    return () => unsub();
  }, []);

  if (updates.length === 0) {
    return (
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#c4a882', letterSpacing: '0.08em', padding: '12px 0', textAlign: 'center' }}>
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
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: tag.dot, flexShrink: 0, marginTop: 4 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
                {u.ideaId && ideaNames[u.ideaId] && (
                  <Link
                    to={`/founder-space/ideas/${u.ideaId}`}
                    style={{ fontFamily: "'Playfair Display', serif", fontSize: 12, fontWeight: 700, color: '#2c1f0e', textDecoration: 'none' }}
                    onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                  >
                    {ideaNames[u.ideaId]}
                  </Link>
                )}
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', background: tag.bg, color: tag.color, padding: '1px 6px', borderRadius: 3 }}>
                  {u.tag}
                </span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'rgba(44,31,14,0.3)' }}>
                  {relTime(u.createdAt)}
                </span>
              </div>
              {u.body && (
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 11, color: '#7a5c3a', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
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
        const ideasSnap = await getDocs(
          query(collection(db, 'ideas'), where('status', '==', 'published'), orderBy('publishedAt', 'desc'), limit(20))
        );
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
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#c4a882', textAlign: 'center', padding: '12px 0' }}>
        Be the first builder here.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {founders.map(f => (
        <Link key={f.uid} to={`/founder-space/profile/${f.uid}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', padding: '6px 0', borderBottom: '1px solid rgba(44,31,14,0.05)' }}>
          <Avatar profile={f} size={32} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 13, fontWeight: 700, color: '#2c1f0e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {f.name}
            </div>
            {f.title && (
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#7a5c3a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f.title}
              </div>
            )}
          </div>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#c4963a', background: 'rgba(196,150,58,0.1)', padding: '2px 7px', borderRadius: 10, flexShrink: 0 }}>
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

const EVENT_TACK = { book_club: '#f5c842', project_sprint: '#2c8a4e', meetup: '#e8391e', open_collab: '#1a6bb5' };
const EVENT_ICON = { book_club: '📚', project_sprint: '⚡', meetup: '☕', open_collab: '◈' };

function fmtEventDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  const diffMs = d - new Date();
  const diffDays = Math.floor(diffMs / 86400000);
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(':00', '');
  if (diffDays === 0) return `Today, ${time} IST`;
  if (diffDays === 1) return `Tomorrow, ${time} IST`;
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) + `, ${time} IST`;
}

function UpcomingEvents() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'events'), where('status', '==', 'upcoming'), orderBy('startDateTime', 'asc'), limit(3));
    const unsub = onSnapshot(q, snap => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});
    return () => unsub();
  }, []);

  if (events.length === 0) {
    return (
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#c4a882', textAlign: 'center', padding: '12px 0' }}>
        No upcoming events yet.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {events.map(ev => (
        <Link key={ev.id} to={`/founder-space/events/${ev.id}`} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid rgba(44,31,14,0.06)', textDecoration: 'none' }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: `${EVENT_TACK[ev.type] || '#c4963a'}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>
            {EVENT_ICON[ev.type] || '◈'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 700, color: '#2c1f0e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
              {ev.title}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#7a5c3a' }}>
              {fmtEventDate(ev.startDateTime)}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#c4963a', marginTop: 2 }}>
              {ev.attendeeCount || 0} going{ev.capacity ? ` · ${ev.capacity - (ev.attendeeCount || 0)} spots left` : ''}
            </div>
          </div>
        </Link>
      ))}
      <Link to="/founder-space/events" style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 700, color: '#2c8a4e', textDecoration: 'none', letterSpacing: '0.08em', textAlign: 'center', paddingTop: 4 }}>
        All events →
      </Link>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Sidebar card
// ─────────────────────────────────────────────

function SidebarCard({ label, children, dotColor }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(44,31,14,0.1)', padding: '18px 16px', marginBottom: 16 }}>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#c4963a', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor || '#e8391e' }} />
        {label}
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Journey card (compact, for unified feed)
// ─────────────────────────────────────────────

const JOURNEY_NODES = [
  { key: 'origin', color: '#7c3aed' },
  { key: 'craft',  color: '#0d9488' },
  { key: 'proof',  color: '#d97706' },
  { key: 'now',    color: '#2563eb' },
  { key: 'seek',   color: '#db2777' },
];

function JourneyCard({ journey, author, onClick }) {
  const filled = JOURNEY_NODES.filter(n => journey[`${n.key}Title`]).length;
  return (
    <div
      onClick={onClick}
      style={{ background: '#fff', borderRadius: 18, border: '1px solid rgba(44,31,14,0.1)', padding: '20px', cursor: 'pointer', position: 'relative', transition: 'box-shadow 0.2s, transform 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(44,31,14,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
    >
      {/* Purple tack */}
      <div style={{ position: 'absolute', top: 16, left: 16, width: 8, height: 8, borderRadius: '50%', background: '#7c3aed', boxShadow: '0 1px 4px #7c3aed88' }} />
      {/* Journey badge */}
      <div style={{ position: 'absolute', top: 14, right: 14, fontFamily: "'DM Mono', monospace", fontSize: 7, fontWeight: 700, letterSpacing: '0.16em', background: 'rgba(124,58,237,0.1)', color: '#7c3aed', padding: '2px 7px', borderRadius: 10 }}>
        JOURNEY
      </div>
      {/* Headline */}
      <div style={{ paddingLeft: 20, paddingRight: 60, marginBottom: 8, fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 900, color: '#2c1f0e', lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {journey.headline || 'Untitled Journey'}
      </div>
      {/* Industry + exp */}
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#7a5c3a', marginBottom: 14, paddingLeft: 20, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {journey.industry && <span style={{ background: 'rgba(124,58,237,0.08)', color: '#7c3aed', padding: '2px 8px', borderRadius: 10 }}>{journey.industry}</span>}
        {journey.experience && <span>{journey.experience}</span>}
      </div>
      {/* Node dot strip */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 12, alignItems: 'center' }}>
        {JOURNEY_NODES.map(n => (
          <div key={n.key} style={{ width: 7, height: 7, borderRadius: '50%', background: journey[`${n.key}Title`] ? n.color : 'rgba(44,31,14,0.1)' }} />
        ))}
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#c4a882', marginLeft: 4 }}>{filled}/5 chapters</span>
      </div>
      {/* Origin teaser */}
      {journey.originTitle && (
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 12, color: '#7a5c3a', lineHeight: 1.4, marginBottom: 14, fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          "{journey.originTitle}"
        </div>
      )}
      <div style={{ height: 1, background: 'rgba(44,31,14,0.06)', marginBottom: 12 }} />
      {/* Author */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Avatar profile={author} size={22} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 600, color: '#2c1f0e' }}>{author?.name || 'Member'}</div>
          {author?.role && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#7a5c3a' }}>{author.role}</div>}
        </div>
        {journey.viewCount > 0 && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#c4a882' }}>{journey.viewCount} views</div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Main unified feed
// ─────────────────────────────────────────────

export default function FeedPage() {
  const { user, userProfile, signIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [typeTab,   setTypeTab]   = useState('All');
  const [category,  setCategory]  = useState('All');
  const [stage,     setStage]     = useState('All');
  const [sort,      setSort]      = useState('newest');
  const [industry,  setIndustry]  = useState('All');
  const [evtType,   setEvtType]   = useState('All');
  const [evtFormat, setEvtFormat] = useState('All');

  const [items,    setItems]    = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);

  async function handleSignIn() {
    try {
      const result = await signIn();
      if (!result) return;
      if (!result.hasProfile) navigate('/founder-space/onboarding');
    } catch (err) { console.error('Sign-in error:', err); }
  }

  // ── Batch-fetch profiles for all UIDs ─────
  const resolveProfiles = useCallback(async (uids) => {
    const fresh = {};
    await Promise.all(uids.map(async uid => {
      try {
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) fresh[uid] = { uid: snap.id, ...snap.data() };
      } catch {}
    }));
    setProfiles(prev => ({ ...prev, ...fresh }));
  }, []);

  // ── Data loading ───────────────────────────
  useEffect(() => {
    setLoading(true);
    setError(false);

    async function load() {
      try {
        if (typeTab === 'All') {
          const [ideasSnap, journeysSnap, eventsSnap] = await Promise.all([
            getDocs(query(collection(db, 'ideas'), where('status', '==', 'published'), orderBy('publishedAt', 'desc'), limit(18))),
            getDocs(query(collection(db, 'journeys'), where('status', '==', 'published'), orderBy('publishedAt', 'desc'), limit(12))),
            getDocs(query(collection(db, 'events'), where('status', '==', 'upcoming'), orderBy('startDateTime', 'asc'), limit(6))),
          ]);

          const ideas    = ideasSnap.docs.map(d => ({ id: d.id, ...d.data(), _type: 'idea',    _ts: d.data().publishedAt?.seconds || 0 }));
          const journeys = journeysSnap.docs.map(d => ({ id: d.id, ...d.data(), _type: 'journey', _ts: d.data().publishedAt?.seconds || 0 }));
          const events   = eventsSnap.docs.map(d => ({ id: d.id, ...d.data(), _type: 'event' }));

          const mixed = [...ideas, ...journeys].sort((a, b) => b._ts - a._ts);
          setItems([...events, ...mixed]);

          const uids = [...new Set([
            ...ideas.map(i => i.authorUid),
            ...journeys.map(j => j.authorUid),
            ...events.map(e => e.creatorUid),
          ].filter(Boolean))];
          await resolveProfiles(uids);

        } else if (typeTab === 'Ideas') {
          const sortField = sort === 'rated' ? 'avgOverall' : sort === 'wanted' ? 'wantToWorkCount' : 'publishedAt';
          const snap = await getDocs(query(collection(db, 'ideas'), where('status', '==', 'published'), orderBy(sortField, 'desc'), limit(30)));
          let docs = snap.docs.map(d => ({ id: d.id, ...d.data(), _type: 'idea' }));
          if (category !== 'All') docs = docs.filter(i => i.category === category);
          if (stage    !== 'All') docs = docs.filter(i => i.stage    === stage);
          setItems(docs);
          await resolveProfiles([...new Set(docs.map(i => i.authorUid).filter(Boolean))]);

        } else if (typeTab === 'Journeys') {
          const snap = await getDocs(query(collection(db, 'journeys'), where('status', '==', 'published'), orderBy('publishedAt', 'desc'), limit(30)));
          let docs = snap.docs.map(d => ({ id: d.id, ...d.data(), _type: 'journey' }));
          if (industry !== 'All') docs = docs.filter(j => j.industry === industry);
          setItems(docs);
          await resolveProfiles([...new Set(docs.map(j => j.authorUid).filter(Boolean))]);

        } else {
          const snap = await getDocs(query(collection(db, 'events'), where('status', '==', 'upcoming'), orderBy('startDateTime', 'asc'), limit(30)));
          let docs = snap.docs.map(d => ({ id: d.id, ...d.data(), _type: 'event' }));
          if (evtType   !== 'All') docs = docs.filter(e => e.type   === EVT_KEY_MAP[evtType]);
          if (evtFormat === 'Online')    docs = docs.filter(e => e.format === 'online');
          if (evtFormat === 'In-person') docs = docs.filter(e => e.format === 'in_person');
          setItems(docs);
          await resolveProfiles([...new Set(docs.map(e => e.creatorUid).filter(Boolean))]);
        }
      } catch (err) {
        console.error('Feed load error:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [typeTab, category, stage, sort, industry, evtType, evtFormat]); // eslint-disable-line react-hooks/exhaustive-deps

  const cfg = TYPE_CFG[typeTab];

  // ── Render ────────────────────────────────

  return (
    <div className="fs-page" style={{ paddingBottom: 60 }}>

      {/* ── Nav ──────────────────────────── */}
      <nav className="fs-nav">
        <Link to="/orb1t" className="fs-nav-logo" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, letterSpacing: '-0.02em', fontSize: 17 }}>
          <span className="fs-nav-dot" />ORB<span style={{ color: '#f5c842' }}>1</span>T
        </Link>
        {!authLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {user ? (
              <>
                <Link
                  to={userProfile ? `/founder-space/profile/${user.uid}` : '/founder-space/onboarding'}
                  style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#7a5c3a', textDecoration: 'none', letterSpacing: '0.06em' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#2c1f0e'}
                  onMouseLeave={e => e.currentTarget.style.color = '#7a5c3a'}
                >
                  {userProfile?.name || 'Complete profile'}
                </Link>
                <Link
                  to={cfg.createTo}
                  style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: cfg.color, color: typeTab === 'Ideas' || typeTab === 'All' ? '#f5c842' : '#fff', fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textDecoration: 'none' }}
                >
                  + {cfg.createLabel}
                </Link>
              </>
            ) : (
              <button
                onClick={handleSignIn}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#2c1f0e', color: '#f5c842', fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', cursor: 'pointer' }}
              >
                Join the orbit →
              </button>
            )}
          </div>
        )}
      </nav>

      {/* ── Page header ──────────────────── */}
      <div style={{ textAlign: 'center', padding: '40px 24px 24px' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#c4a882', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span style={{ width: 20, height: 1, background: '#c4963a', display: 'inline-block', opacity: 0.4 }} />
          ORB1T · Create your orbit
          <span style={{ width: 20, height: 1, background: '#c4963a', display: 'inline-block', opacity: 0.4 }} />
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 900, color: '#2c1f0e', letterSpacing: '-0.02em', margin: '0 0 8px', lineHeight: 1.1 }}>
          {typeTab === 'All'      && 'Everything in orbit.'}
          {typeTab === 'Ideas'    && 'Ideas with escape velocity.'}
          {typeTab === 'Journeys' && 'Trajectories, not resumes.'}
          {typeTab === 'Events'   && 'Launch windows.'}
        </h1>
        <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontStyle: 'italic', color: '#b09878', margin: 0 }}>
          {typeTab === 'All'      && 'Signal from every corner of the orbit — ideas, journeys, and live events.'}
          {typeTab === 'Ideas'    && 'A thesis in orbit travels farther than one kept private. Rate it. Push it. Break it open.'}
          {typeTab === 'Journeys' && 'Where you came from determines your trajectory. Share yours.'}
          {typeTab === 'Events'   && 'Gravity doesn\'t wait. Launch windows open — catch them or drift.'}
        </p>
      </div>

      {/* ── Type tab bar ─────────────────── */}
      <div style={{ borderBottom: '1px solid rgba(44,31,14,0.08)', background: '#fdf6e8' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'flex', gap: 0 }}>
          {TYPE_TABS.map(tab => {
            const tabCfg = TYPE_CFG[tab];
            const active = typeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setTypeTab(tab)}
                style={{
                  padding: '14px 22px', background: 'none', border: 'none',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10, fontWeight: active ? 700 : 400,
                  color: active ? tabCfg.color : '#7a5c3a',
                  cursor: 'pointer',
                  borderBottom: active ? `2px solid ${tabCfg.color}` : '2px solid transparent',
                  marginBottom: -1,
                  transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 6,
                  letterSpacing: '0.06em',
                }}
              >
                {active && <span style={{ width: 5, height: 5, borderRadius: '50%', background: tabCfg.color, display: 'inline-block', flexShrink: 0 }} />}
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Sub-filter row (contextual) ───── */}
      {typeTab !== 'All' && (
        <div style={{ background: 'rgba(253,246,232,0.96)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(44,31,14,0.08)', padding: '10px 24px', position: 'sticky', top: 0, zIndex: 40 }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', alignItems: 'center' }}>

            {typeTab === 'Ideas' && (
              <>
                {CATEGORIES.map(c => <FilterPill key={c} label={c} active={category === c} activeColor={cfg.color} onClick={() => setCategory(c)} />)}
                <div style={{ width: 1, height: 18, background: 'rgba(44,31,14,0.12)', flexShrink: 0 }} />
                {STAGES.map(s => <FilterPill key={s} label={s === 'All' ? 'All stages' : s} active={stage === s} activeColor={cfg.color} onClick={() => setStage(s)} />)}
                <div style={{ width: 1, height: 18, background: 'rgba(44,31,14,0.12)', flexShrink: 0 }} />
                {SORTS.map(s => <FilterPill key={s.value} label={s.label} active={sort === s.value} activeColor={cfg.color} onClick={() => setSort(s.value)} />)}
              </>
            )}

            {typeTab === 'Journeys' && (
              JOURNEY_INDUSTRIES.map(ind => <FilterPill key={ind} label={ind} active={industry === ind} activeColor={cfg.color} onClick={() => setIndustry(ind)} />)
            )}

            {typeTab === 'Events' && (
              <>
                {EVT_TYPES.map(t => <FilterPill key={t} label={t} active={evtType === t} activeColor={cfg.color} onClick={() => setEvtType(t)} />)}
                <div style={{ width: 1, height: 18, background: 'rgba(44,31,14,0.12)', flexShrink: 0 }} />
                {EVT_FORMATS.map(f => <FilterPill key={f} label={f} active={evtFormat === f} activeColor={cfg.color} onClick={() => setEvtFormat(f)} />)}
              </>
            )}

          </div>
        </div>
      )}

      {/* ── Main layout ──────────────────── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px', display: 'flex', gap: 28, alignItems: 'flex-start' }}>

        {/* ── FEED ─────────────────────── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* "All" tab: events section header if events exist */}
          {typeTab === 'All' && !loading && items.some(i => i._type === 'event') && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#2c8a4e' }} />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#2c8a4e' }}>
                  Coming up
                </span>
              </div>
              <Link to="/founder-space/events" style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#2c8a4e', textDecoration: 'none' }}>
                All events →
              </Link>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {Array.from({ length: 6 }).map((_, i) => <FeedIdeaCardSkeleton key={i} />)}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#2c1f0e', marginBottom: 10 }}>
                Couldn't load the board.
              </div>
              <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, color: '#7a5c3a', marginBottom: 20 }}>
                Refresh to try again.
              </p>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && items.length === 0 && (
            <div style={{ textAlign: 'center', padding: '64px 0' }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: '#2c1f0e', marginBottom: 10 }}>
                No signals here yet.
              </div>
              <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, color: '#7a5c3a', marginBottom: 24 }}>
                Be the first to {typeTab === 'Events' ? 'open a launch window' : typeTab === 'Journeys' ? 'share your trajectory' : 'emit a signal'}.
              </p>
              {user && (
                <Link to={cfg.createTo} style={{ padding: '12px 24px', borderRadius: 10, background: cfg.color, color: typeTab === 'Ideas' || typeTab === 'All' ? '#f5c842' : '#fff', fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>
                  {cfg.createLabel} →
                </Link>
              )}
            </div>
          )}

          {/* Unified grid */}
          {!loading && !error && items.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
              {items.map(item => {
                if (item._type === 'journey') {
                  return <JourneyCard key={'j-' + item.id} journey={item} author={profiles[item.authorUid]} onClick={() => navigate(`/founder-space/journey/${item.id}`)} />;
                }
                if (item._type === 'event') {
                  return <EventCard key={'e-' + item.id} event={item} host={profiles[item.creatorUid]} onClick={() => navigate(`/founder-space/events/${item.id}`)} compact />;
                }
                return <FeedIdeaCard key={'i-' + item.id} idea={item} author={profiles[item.authorUid]} onClick={() => navigate(`/founder-space/ideas/${item.id}`)} />;
              })}
            </div>
          )}

        </div>

        {/* ── SIDEBAR ──────────────────── */}
        <div className="feed-sidebar" style={{ width: 272, flexShrink: 0 }}>

          <SidebarCard label="Signals just emitted" dotColor="#e8391e">
            <UpdatesTicker />
          </SidebarCard>

          <SidebarCard label="Active in orbit" dotColor="#c4963a">
            <TopFounders />
          </SidebarCard>

          <SidebarCard label="Launch windows" dotColor="#2c8a4e">
            <UpcomingEvents />
          </SidebarCard>

          {/* Contextual CTA */}
          {user && (
            <div style={{ background: '#2c1f0e', borderRadius: 16, padding: '20px 16px' }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 900, color: '#fdf6e8', marginBottom: 6 }}>
                {typeTab === 'Events' ? 'Open a launch window.' : typeTab === 'Journeys' ? 'Share your trajectory.' : 'Emit your signal.'}
              </div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 12, color: 'rgba(253,246,232,0.7)', marginBottom: 14 }}>
                {typeTab === 'Events' ? 'Sprint, book club, open collab — create the window.' : typeTab === 'Journeys' ? "Your path is signal. Other builders will find you through it." : 'An idea in orbit travels farther. Pin it in 5 minutes.'}
              </div>
              <Link
                to={cfg.createTo}
                style={{ display: 'block', padding: '10px 0', borderRadius: 8, background: '#f5c842', color: '#2c1f0e', fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textDecoration: 'none', textAlign: 'center' }}
              >
                {cfg.createLabel} →
              </Link>
              {typeTab === 'All' && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { label: 'Pin journey', to: '/founder-space/journey/submit' },
                    { label: 'Start event', to: '/founder-space/events/create' },
                  ].map(item => (
                    <Link key={item.label} to={item.to} style={{ display: 'block', padding: '8px 0', borderRadius: 8, background: 'rgba(253,246,232,0.08)', border: '1px solid rgba(253,246,232,0.12)', color: 'rgba(253,246,232,0.7)', fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 600, textDecoration: 'none', textAlign: 'center', letterSpacing: '0.04em' }}>
                      {item.label} →
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      <style>{`
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
