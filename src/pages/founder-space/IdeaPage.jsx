/**
 * Founder Space — Public Idea Page
 * Route: /founder-space/ideas/:ideaId
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  doc, getDoc, getDocs, addDoc, updateDoc,
  collection, query, where, orderBy, limit,
  increment, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../lib/auth';
import { PolaroidWallDiagram } from '../../components/founder-space/PolaroidWallDiagram';
import RatingModal from '../../components/founder-space/RatingModal';
import { useToast } from '../../components/Toast';
import DiagramSkeleton from '../../components/founder-space/skeletons/DiagramSkeleton';
import './FounderSpace.css';

// ─────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────

const TAG_STYLES = {
  Launched:  { bg: '#d4edda', color: '#1a5c33', dot: '#2c8a4e' },
  Funding:   { bg: '#fef3cd', color: '#92610a', dot: '#f5c842' },
  Milestone: { bg: '#d1ecf1', color: '#0c5460', dot: '#1a6bb5' },
  Marketing: { bg: '#e8d5fb', color: '#5a2d82', dot: '#8b5cf6' },
  Pivot:     { bg: '#f8d7da', color: '#721c24', dot: '#e8391e' },
  Other:     { bg: '#f0e8d8', color: '#7a5c3a', dot: '#c4a882' },
};

const RATING_PARAMS = [
  { key: 'avgProblemClarity',       label: 'Problem Clarity'      },
  { key: 'avgMarketPotential',      label: 'Market Potential'     },
  { key: 'avgFounderCredibility',   label: 'Founder Credibility'  },
  { key: 'avgExecutionReadiness',   label: 'Execution Readiness'  },
  { key: 'avgOverallInvestability', label: 'Investability'        },
];

const UPDATE_TAGS = ['Launched', 'Funding', 'Milestone', 'Marketing', 'Pivot', 'Other'];

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

function tsToDate(ts) {
  if (!ts) return null;
  if (ts.toDate) return ts.toDate();
  if (ts.seconds) return new Date(ts.seconds * 1000);
  return new Date(ts);
}

function relativeDate(ts) {
  const d = tsToDate(ts);
  if (!d) return '';
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Upsert an OG/meta tag on document.head. Works for JS-crawlable contexts. */
function setMeta(property, content) {
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function Avatar({ profile, size = 32 }) {
  if (!profile) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: '#e8dcc8', flexShrink: 0,
      }} />
    );
  }
  const initials = (profile.name || 'F').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  if (profile.photoURL) {
    return (
      <img src={profile.photoURL} alt={profile.name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #c4963a 0%, #2c1f0e 100%)',
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontFamily: "'Playfair Display', serif", fontWeight: 700,
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Card wrapper
// ─────────────────────────────────────────────

function Card({ children, style }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 18,
      border: '1px solid rgba(44,31,14,0.1)',
      padding: '20px',
      ...style,
    }}>
      {children}
    </div>
  );
}

function CardLabel({ children }) {
  return (
    <div style={{
      fontFamily: "'DM Mono', monospace",
      fontSize: 9, fontWeight: 700,
      letterSpacing: '0.22em', textTransform: 'uppercase',
      color: '#c4963a', marginBottom: 14,
    }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
//  UpdateCard
// ─────────────────────────────────────────────

function UpdateCard({ update }) {
  const tag = TAG_STYLES[update.tag] || TAG_STYLES.Other;
  return (
    <div style={{
      display: 'flex', gap: 12, alignItems: 'flex-start',
      paddingBottom: 16, marginBottom: 16,
      borderBottom: '1px solid rgba(44,31,14,0.06)',
    }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: tag.dot, marginTop: 5, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
            textTransform: 'uppercase',
            background: tag.bg, color: tag.color,
            padding: '2px 8px', borderRadius: 4,
          }}>
            {update.tag}
          </span>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 9, color: 'rgba(44,31,14,0.35)',
          }}>
            {relativeDate(update.createdAt)}
          </span>
        </div>
        <div style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 13, color: '#2c1f0e', lineHeight: 1.65,
        }}>
          {update.body}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  PostUpdateForm
// ─────────────────────────────────────────────

function PostUpdateForm({ ideaId, onPosted }) {
  const { user }            = useAuth();
  const [tag, setTag]       = useState('');
  const [body, setBody]     = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!tag || !body.trim()) return;
    setSaving(true);
    try {
      const docRef = await addDoc(collection(db, 'ideas', ideaId, 'updates'), {
        ideaId, authorUid: user.uid, tag, body: body.trim(), createdAt: serverTimestamp(),
      });
      onPosted({ id: docRef.id, tag, body: body.trim(), createdAt: { seconds: Date.now() / 1000 } });
      setTag(''); setBody('');
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  return (
    <div style={{
      background: '#fdf6e8', borderRadius: 14,
      border: '1.5px solid #e8dcc8', padding: '16px', marginBottom: 16,
    }}>
      <div style={{
        fontFamily: "'DM Mono', monospace", fontSize: 9,
        letterSpacing: '0.16em', textTransform: 'uppercase',
        color: '#c4a882', marginBottom: 10,
      }}>
        Tag
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {UPDATE_TAGS.map(t => {
          const sel = tag === t;
          return (
            <button key={t} onClick={() => setTag(t)} style={{
              padding: '5px 12px', borderRadius: 20,
              border: `1.5px solid ${sel ? TAG_STYLES[t].dot : '#e8dcc8'}`,
              background: sel ? TAG_STYLES[t].bg : '#fff',
              color: sel ? TAG_STYLES[t].color : '#7a5c3a',
              fontFamily: "'DM Mono', monospace",
              fontSize: 10, fontWeight: sel ? 700 : 400,
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {t}
            </button>
          );
        })}
      </div>
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="What happened? Keep it punchy."
        maxLength={300}
        rows={3}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: '#fff !important', border: '1.5px solid #e8dcc8',
          borderRadius: 10, outline: 'none', padding: '10px 12px',
          fontFamily: "'Syne', sans-serif", fontSize: 13,
          color: '#2c1f0e', lineHeight: 1.6, resize: 'none',
        }}
        onFocus={e => e.target.style.borderColor = '#2c1f0e'}
        onBlur={e => e.target.style.borderColor = '#e8dcc8'}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#c4a882' }}>
          {300 - body.length} left
        </span>
        <button
          onClick={handleSubmit}
          disabled={!tag || !body.trim() || saving}
          style={{
            padding: '8px 18px', borderRadius: 8, border: 'none',
            background: tag && body.trim() ? '#2c1f0e' : '#e8dcc8',
            color: tag && body.trim() ? '#f5c842' : '#c4a882',
            fontFamily: "'DM Mono', monospace",
            fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
            cursor: tag && body.trim() ? 'pointer' : 'not-allowed',
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? 'Posting…' : 'Post update'}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  CommentCard
// ─────────────────────────────────────────────

const ROLE_BADGES = {
  founder:    { bg: '#fef3cd', color: '#92610a' },
  investor:   { bg: '#d4edda', color: '#1a5c33' },
  talent:     { bg: '#d1ecf1', color: '#0c5460' },
  enthusiast: { bg: '#e8d5fb', color: '#5a2d82' },
};

function CommentCard({ comment, authorProfile, onReply, isReply }) {
  const rb = ROLE_BADGES[authorProfile?.role] || ROLE_BADGES.enthusiast;

  return (
    <div style={{
      display: 'flex', gap: 10, alignItems: 'flex-start',
      paddingLeft: isReply ? 44 : 0,
      marginBottom: 14,
    }}>
      <Avatar profile={authorProfile} size={34} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 13, fontWeight: 700, color: '#2c1f0e',
          }}>
            {authorProfile?.name || 'Founder'}
          </span>
          {authorProfile?.role && (
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 8, fontWeight: 700, letterSpacing: '0.14em',
              textTransform: 'uppercase',
              background: rb.bg, color: rb.color,
              padding: '2px 7px', borderRadius: 4,
            }}>
              {authorProfile.role}
            </span>
          )}
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 9, color: 'rgba(44,31,14,0.35)',
          }}>
            {relativeDate(comment.createdAt)}
          </span>
        </div>
        <div style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 13, color: '#2c1f0e', lineHeight: 1.65,
          marginBottom: 6,
        }}>
          {comment.body}
        </div>
        {!isReply && (
          <button
            onClick={() => onReply(comment.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'DM Mono', monospace",
              fontSize: 9, color: '#c4a882', letterSpacing: '0.08em',
              padding: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#2c1f0e'}
            onMouseLeave={e => e.currentTarget.style.color = '#c4a882'}
          >
            ↩ Reply
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  RatingCard (right column)
// ─────────────────────────────────────────────

function RatingCard({ idea, onRate }) {
  const count = idea?.ratingCount || 0;
  const avg = idea?.avgOverall || 0;

  return (
    <Card style={{ marginBottom: 12 }}>
      <CardLabel>Community verdict</CardLabel>
      {count === 0 ? (
        <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 15, fontWeight: 700, color: '#2c1f0e', marginBottom: 6,
          }}>
            Be the first to pin a verdict
          </div>
          <div style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 12, color: '#7a5c3a', marginBottom: 14,
          }}>
            Rate the 5 pitch dimensions
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 14 }}>
          {/* Big avg */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
            <span style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 40, fontWeight: 900, color: '#2c1f0e', lineHeight: 1,
            }}>
              {avg.toFixed(1)}
            </span>
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10, color: '#c4a882',
            }}>
              / 5 · {count} {count === 1 ? 'rating' : 'ratings'}
            </span>
          </div>
          {/* Parameter bars */}
          {RATING_PARAMS.map(p => (
            <div key={p.key} style={{ marginBottom: 8 }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontFamily: "'DM Mono', monospace",
                fontSize: 8, letterSpacing: '0.1em', marginBottom: 3,
              }}>
                <span style={{ color: '#7a5c3a' }}>{p.label}</span>
                <span style={{ color: '#2c1f0e', fontWeight: 700 }}>
                  {(idea[p.key] || 0).toFixed(1)}
                </span>
              </div>
              <div style={{ height: 4, background: '#f0e8d8', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${((idea[p.key] || 0) / 5) * 100}%`,
                  background: 'linear-gradient(90deg, #c4963a, #f5c842)',
                  borderRadius: 2, transition: 'width 0.5s ease',
                }} />
              </div>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={onRate}
        style={{
          width: '100%', padding: '10px 0',
          background: '#2c1f0e', color: '#f5c842',
          borderRadius: 10, border: 'none',
          fontFamily: "'DM Mono', monospace",
          fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
          cursor: 'pointer', transition: 'opacity 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        Rate this idea →
      </button>
    </Card>
  );
}

// ─────────────────────────────────────────────
//  StatsCard (right column)
// ─────────────────────────────────────────────

function StatsCard({ idea }) {
  const stats = [
    { label: 'Views',      value: idea?.viewCount       || 0 },
    { label: 'Ratings',    value: idea?.ratingCount     || 0 },
    { label: 'Want in',    value: idea?.wantToWorkCount || 0 },
  ];
  return (
    <Card style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
        {stats.map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 24, fontWeight: 900, color: '#2c1f0e',
            }}>
              {s.value}
            </div>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 8, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: '#c4a882',
            }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────
//  WantToWorkCard (right column)
// ─────────────────────────────────────────────

function WantToWorkCard({ ideaId, user, signIn, done, onDone }) {
  const [note, setNote]         = useState('');
  const [saving, setSaving]     = useState(false);

  async function handleSubmit() {
    if (!user || done) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'wantToWork'), {
        ideaId, authorUid: user.uid,
        note: note.trim() || null, createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'ideas', ideaId), { wantToWorkCount: increment(1) });
      onDone();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  if (done) {
    return (
      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%', background: '#2c8a4e', flexShrink: 0,
          }} />
          <div>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 14, fontWeight: 700, color: '#2c1f0e',
            }}>
              You're interested ✓
            </div>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9, color: '#7a5c3a', marginTop: 2,
            }}>
              The founder has been notified.
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card style={{ marginBottom: 12 }}>
        <CardLabel>Want to work on this?</CardLabel>
        <div style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 13, color: '#7a5c3a', marginBottom: 14,
        }}>
          Sign in to express interest in this idea.
        </div>
        <button
          onClick={signIn}
          style={{
            width: '100%', padding: '10px 0',
            background: '#fff', borderRadius: 10,
            border: '1.5px solid #e8dcc8',
            fontFamily: "'DM Mono', monospace",
            fontSize: 11, color: '#2c1f0e', fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Sign in with Google
        </button>
      </Card>
    );
  }

  return (
    <Card style={{ marginBottom: 12 }}>
      <CardLabel>Want to work on this?</CardLabel>
      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Optional: tell the founder why you'd be a great fit…"
        maxLength={200}
        rows={3}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: '#fdf6e8 !important', border: '1.5px solid #e8dcc8',
          borderRadius: 10, outline: 'none', padding: '10px 12px',
          fontFamily: "'Syne', sans-serif", fontSize: 13,
          color: '#2c1f0e', lineHeight: 1.6, resize: 'none', marginBottom: 10,
        }}
        onFocus={e => e.target.style.borderColor = '#2c1f0e'}
        onBlur={e => e.target.style.borderColor = '#e8dcc8'}
      />
      <div style={{
        display: 'flex', justifyContent: 'flex-end',
        fontFamily: "'DM Mono', monospace", fontSize: 9,
        color: '#c4a882', marginBottom: 10,
      }}>
        {200 - note.length} left
      </div>
      <button
        onClick={handleSubmit}
        disabled={saving}
        style={{
          width: '100%', padding: '10px 0',
          background: '#2c1f0e', color: '#f5c842',
          borderRadius: 10, border: 'none',
          fontFamily: "'DM Mono', monospace",
          fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
          cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.6 : 1,
        }}
      >
        {saving ? 'Submitting…' : 'I want in →'}
      </button>
    </Card>
  );
}

// ─────────────────────────────────────────────
//  Shimmer loading
// ─────────────────────────────────────────────

function Shimmer() {
  return (
    <div className="fs-page">
      <nav className="fs-nav" style={{ justifyContent: 'space-between' }}>
        <div style={{ width: 120, height: 16, background: '#e8dcc8', borderRadius: 4 }} />
        <div style={{ width: 80, height: 16, background: '#e8dcc8', borderRadius: 4 }} />
      </nav>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <DiagramSkeleton />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Main IdeaPage
// ─────────────────────────────────────────────

export default function IdeaPage() {
  const { ideaId }              = useParams();
  const { user, userProfile, signIn } = useAuth();
  const navigate                = useNavigate();
  const { showToast }           = useToast();

  // ── Data ──────────────────────────────────
  const [idea,           setIdea]           = useState(null);
  const [author,         setAuthor]         = useState(null);
  const [comments,       setComments]       = useState([]);
  const [commentAuthors, setCommentAuthors] = useState({});
  const [updates,        setUpdates]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [notFound,       setNotFound]       = useState(false);

  // ── Interaction ───────────────────────────
  const [userRating,      setUserRating]      = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [wantToWorkDone,  setWantToWorkDone]  = useState(false);

  // ── Comments ──────────────────────────────
  const [newComment,  setNewComment]  = useState('');
  const [replyingTo,  setReplyingTo]  = useState(null);
  const [replyBody,         setReplyBody]         = useState('');

  // ── Fetch data ───────────────────────────
  useEffect(() => {
    if (!ideaId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        // 1. Idea
        const ideaSnap = await getDoc(doc(db, 'ideas', ideaId));
        if (!ideaSnap.exists() || ideaSnap.data().status !== 'published') {
          if (!cancelled) setNotFound(true);
          return;
        }
        const ideaData = { id: ideaSnap.id, ...ideaSnap.data() };
        if (!cancelled) setIdea(ideaData);

        // Set page title + OG meta
        document.title = `${ideaData.ideaTitle || 'Idea'} — Founder Space | NoCap VC`;
        setMeta('og:title',       `${ideaData.ideaTitle || 'Idea'} on Founder Space | NoCap VC`);
        setMeta('og:description', ideaData.tagline || ideaData.problemTitle || '');
        setMeta('og:image',       `/api/og/idea/${ideaId}`);
        setMeta('og:image:width',  '1200');
        setMeta('og:image:height', '630');
        setMeta('og:url',         window.location.href);

        // 2. Author
        const authorSnap = await getDoc(doc(db, 'users', ideaData.authorUid));
        if (!cancelled && authorSnap.exists()) setAuthor({ uid: authorSnap.id, ...authorSnap.data() });

        // 3. Comments (approved)
        const cQ = query(
          collection(db, 'comments'),
          where('ideaId', '==', ideaId),
          where('status', '==', 'approved'),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const cSnap = await getDocs(cQ);
        const fetchedComments = cSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (!cancelled) setComments(fetchedComments);

        // 4. Comment author profiles (batch by unique uid)
        const authorUids = [...new Set(fetchedComments.map(c => c.authorUid).filter(Boolean))];
        const authorMap = {};
        await Promise.all(authorUids.map(async uid => {
          const snap = await getDoc(doc(db, 'users', uid));
          if (snap.exists()) authorMap[uid] = { uid: snap.id, ...snap.data() };
        }));
        if (!cancelled) setCommentAuthors(authorMap);

        // 5. Updates subcollection
        const uQ = query(
          collection(db, 'ideas', ideaId, 'updates'),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        const uSnap = await getDocs(uQ);
        if (!cancelled) setUpdates(uSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // 6. Fire-and-forget view count
        updateDoc(doc(db, 'ideas', ideaId), { viewCount: increment(1) });

      } catch (err) {
        console.error('IdeaPage load error:', err);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [ideaId]);

  // ── User-specific data (after auth resolves) ──
  useEffect(() => {
    if (!user || !ideaId) return;

    async function loadUserData() {
      // Check wantToWork
      const wtwQ = query(
        collection(db, 'wantToWork'),
        where('ideaId', '==', ideaId),
        where('authorUid', '==', user.uid),
        limit(1)
      );
      const wtwSnap = await getDocs(wtwQ);
      if (!wtwSnap.empty) setWantToWorkDone(true);

      // Check existing rating
      const rQ = query(
        collection(db, 'ratings'),
        where('ideaId', '==', ideaId),
        where('authorUid', '==', user.uid),
        limit(1)
      );
      const rSnap = await getDocs(rQ);
      if (!rSnap.empty) setUserRating({ id: rSnap.docs[0].id, ...rSnap.docs[0].data() });
    }

    loadUserData();
  }, [user, ideaId]);

  // ── Submit comment ───────────────────────
  const handleCommentSubmit = useCallback(async (body, parentId = null) => {
    if (!user || !body.trim()) return;
    try {
      const data = {
        ideaId, authorUid: user.uid,
        body: body.trim(),
        status: 'approved',
        parentId: parentId || null,
        createdAt: serverTimestamp(),
      };
      const ref = await addDoc(collection(db, 'comments'), data);
      const optimistic = {
        id: ref.id, ...data,
        createdAt: { seconds: Date.now() / 1000 },
      };
      if (!parentId) {
        setComments(prev => [optimistic, ...prev]);
        setCommentAuthors(prev => ({
          ...prev,
          [user.uid]: userProfile || { name: user.displayName, photoURL: user.photoURL },
        }));
        setNewComment('');
      } else {
        setComments(prev => [...prev, optimistic]);
        setReplyingTo(null);
        setReplyBody('');
      }
    } catch (e) { console.error(e); }
  }, [user, ideaId, userProfile]);

  // ── Share ────────────────────────────────
  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: idea?.ideaTitle, text: idea?.tagline, url });
      } catch {
        // User cancelled — no-op
      }
    } else {
      await navigator.clipboard.writeText(url);
      showToast('Link copied to clipboard!', 'success');
    }
    // Fire-and-forget share count
    if (ideaId) updateDoc(doc(db, 'ideas', ideaId), { shareCount: increment(1) });
  }

  // ── Rating submitted ─────────────────────
  function handleRatingSubmitted(newAggregates) {
    setIdea(prev => prev ? { ...prev, ...newAggregates } : prev);
    setShowRatingModal(false);
    showToast('Verdict pinned ✓', 'success');
  }

  // ─────────────────────────────────────────
  //  Render states
  // ─────────────────────────────────────────

  if (loading) return <Shimmer />;

  if (notFound) {
    return (
      <div className="fs-page">
        <nav className="fs-nav">
          <Link to="/founder-space" className="fs-nav-logo">
            <span className="fs-nav-dot" />Founder Space
          </Link>
        </nav>
        <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 36, fontWeight: 900, color: '#2c1f0e', marginBottom: 12,
          }}>
            Board not found.
          </div>
          <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, color: '#7a5c3a', marginBottom: 24 }}>
            This idea may not be published yet, or the link is wrong.
          </p>
          <Link to="/founder-space" className="fs-btn-primary">← Back to Founder Space</Link>
        </div>
      </div>
    );
  }

  const isAuthor = user?.uid === idea?.authorUid;

  // Group comments: top-level + replies
  const topComments = comments.filter(c => !c.parentId);
  const replies     = comments.filter(c => c.parentId);

  return (
    <div className="fs-page" style={{ paddingBottom: 60 }}>

      {/* ── Sticky nav ─────────────────────── */}
      <nav className="fs-nav" style={{ position: 'sticky', top: 0, zIndex: 50 }}>
        <Link to="/founder-space/feed" className="fs-nav-logo">
          <span className="fs-nav-dot" />Founder Space
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isAuthor && (
            <button
              onClick={() => navigate(`/founder-space/submit?ideaId=${ideaId}`)}
              style={{
                padding: '7px 14px', borderRadius: 8,
                border: '1.5px solid #e8dcc8', background: '#fff',
                fontFamily: "'DM Mono', monospace",
                fontSize: 10, color: '#2c1f0e', cursor: 'pointer',
              }}
            >
              Edit board
            </button>
          )}
          <button
            onClick={handleShare}
            style={{
              padding: '7px 14px', borderRadius: 8,
              border: 'none', background: '#2c1f0e',
              fontFamily: "'DM Mono', monospace",
              fontSize: 10, fontWeight: 700, color: '#f5c842',
              cursor: 'pointer',
            }}
          >
            Share
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* ── PolaroidWallDiagram ─────────────── */}
        <div style={{ marginBottom: 32, overflowX: 'auto' }}>
          <PolaroidWallDiagram idea={idea} author={author} readOnly={true} />
        </div>

        {/* ── Two-column layout ──────────────── */}
        <div className="idea-layout">

          {/* ── LEFT COLUMN ──────────────────── */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Updates */}
            <Card style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#e8391e' }} />
                <span style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 17, fontWeight: 700, color: '#2c1f0e',
                }}>
                  Investigation updates
                </span>
              </div>

              {isAuthor && (
                <PostUpdateForm
                  ideaId={ideaId}
                  onPosted={u => setUpdates(prev => [u, ...prev])}
                />
              )}

              {updates.length === 0 ? (
                <div style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10, color: '#c4a882', letterSpacing: '0.08em',
                  textAlign: 'center', padding: '16px 0',
                }}>
                  No updates yet.
                </div>
              ) : (
                updates.map(u => <UpdateCard key={u.id} update={u} />)
              )}
            </Card>

            {/* Comments */}
            <Card>
              <div style={{ marginBottom: 16 }}>
                <span style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 17, fontWeight: 700, color: '#2c1f0e',
                }}>
                  Community notes
                </span>
                <span style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 9, color: '#c4a882',
                  marginLeft: 10, letterSpacing: '0.1em',
                }}>
                  {topComments.length}
                </span>
              </div>

              {/* Comments list */}
              {topComments.map(c => (
                <React.Fragment key={c.id}>
                  <CommentCard
                    comment={c}
                    authorProfile={commentAuthors[c.authorUid]}
                    onReply={id => { setReplyingTo(id); setReplyBody(''); }}
                    isReply={false}
                  />
                  {/* Reply form */}
                  {replyingTo === c.id && (
                    <div style={{ paddingLeft: 44, marginBottom: 12 }}>
                      <textarea
                        value={replyBody}
                        onChange={e => setReplyBody(e.target.value)}
                        placeholder="Write a reply…"
                        maxLength={500} rows={2}
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          background: '#fdf6e8 !important',
                          border: '1.5px solid #e8dcc8', borderRadius: 8,
                          outline: 'none', padding: '8px 10px',
                          fontFamily: "'Syne', sans-serif",
                          fontSize: 13, color: '#2c1f0e', lineHeight: 1.6, resize: 'none',
                        }}
                        autoFocus
                      />
                      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                        <button
                          onClick={() => handleCommentSubmit(replyBody, c.id)}
                          disabled={!replyBody.trim()}
                          style={{
                            padding: '6px 14px', borderRadius: 6, border: 'none',
                            background: replyBody.trim() ? '#2c1f0e' : '#e8dcc8',
                            color: replyBody.trim() ? '#f5c842' : '#c4a882',
                            fontFamily: "'DM Mono', monospace",
                            fontSize: 10, fontWeight: 700, cursor: 'pointer',
                          }}
                        >
                          Reply
                        </button>
                        <button
                          onClick={() => setReplyingTo(null)}
                          style={{
                            padding: '6px 14px', borderRadius: 6,
                            border: '1px solid #e8dcc8', background: '#fff',
                            fontFamily: "'DM Mono', monospace",
                            fontSize: 10, color: '#7a5c3a', cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  {/* Nested replies */}
                  {replies.filter(r => r.parentId === c.id).map(r => (
                    <CommentCard
                      key={r.id}
                      comment={r}
                      authorProfile={commentAuthors[r.authorUid]}
                      onReply={() => {}}
                      isReply={true}
                    />
                  ))}
                  <div style={{ height: 1, background: 'rgba(44,31,14,0.05)', marginBottom: 14 }} />
                </React.Fragment>
              ))}

              {topComments.length === 0 && (
                <div style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10, color: '#c4a882',
                  textAlign: 'center', padding: '16px 0 8px',
                }}>
                  No notes yet — be the first.
                </div>
              )}

              {/* Add comment */}
              <div style={{ marginTop: 16, borderTop: '1px solid rgba(44,31,14,0.07)', paddingTop: 16 }}>
                {user ? (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <Avatar profile={userProfile} size={30} />
                    <div style={{ flex: 1 }}>
                      <textarea
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder="Add a note…"
                        maxLength={500} rows={3}
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          background: '#fdf6e8 !important',
                          border: '1.5px solid #e8dcc8', borderRadius: 10,
                          outline: 'none', padding: '10px 12px',
                          fontFamily: "'Syne', sans-serif",
                          fontSize: 13, color: '#2c1f0e',
                          lineHeight: 1.6, resize: 'none',
                        }}
                        onFocus={e => e.target.style.borderColor = '#2c1f0e'}
                        onBlur={e => e.target.style.borderColor = '#e8dcc8'}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, alignItems: 'center' }}>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#c4a882' }}>
                          {500 - newComment.length} left
                        </span>
                        <button
                          onClick={() => handleCommentSubmit(newComment)}
                          disabled={!newComment.trim()}
                          style={{
                            padding: '8px 16px', borderRadius: 8, border: 'none',
                            background: newComment.trim() ? '#2c1f0e' : '#e8dcc8',
                            color: newComment.trim() ? '#f5c842' : '#c4a882',
                            fontFamily: "'DM Mono', monospace",
                            fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                            cursor: newComment.trim() ? 'pointer' : 'not-allowed',
                          }}
                        >
                          Add note →
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{
                      fontFamily: "'Syne', sans-serif",
                      fontSize: 13, color: '#7a5c3a',
                    }}>
                      Sign in to add a note
                    </span>
                    <button
                      onClick={signIn}
                      style={{
                        padding: '8px 16px', borderRadius: 8, border: 'none',
                        background: '#2c1f0e', color: '#f5c842',
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 10, fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      Sign in →
                    </button>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* ── RIGHT COLUMN ─────────────────── */}
          <div className="idea-right-col" style={{ width: 300, flexShrink: 0 }}>

            {/* Founder card */}
            {author && (
              <Card style={{ marginBottom: 12 }}>
                <CardLabel>The founder</CardLabel>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <Avatar profile={author} size={44} />
                  <div>
                    <div style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 15, fontWeight: 700, color: '#2c1f0e',
                    }}>
                      {author.name}
                    </div>
                    {author.title && (
                      <div style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 10, color: '#7a5c3a', marginTop: 2,
                      }}>
                        {author.title}
                      </div>
                    )}
                    {author.location && (
                      <div style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 9, color: '#c4a882', marginTop: 2,
                      }}>
                        {author.location}
                      </div>
                    )}
                  </div>
                </div>
                {author.whatImBuilding && (
                  <div style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 12, color: '#7a5c3a', lineHeight: 1.6,
                    marginBottom: 12,
                  }}>
                    {author.whatImBuilding}
                  </div>
                )}
                <Link
                  to={`/founder-space/profile/${author.uid}`}
                  style={{
                    display: 'block', textAlign: 'center',
                    padding: '8px 0', borderRadius: 8,
                    border: '1.5px solid #e8dcc8', background: '#fff',
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10, fontWeight: 600, color: '#2c1f0e',
                    textDecoration: 'none',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#2c1f0e'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#e8dcc8'}
                >
                  View full profile →
                </Link>
              </Card>
            )}

            <RatingCard idea={idea} onRate={() => setShowRatingModal(true)} />
            <StatsCard idea={idea} />
            <WantToWorkCard
              ideaId={ideaId}
              user={user}
              signIn={signIn}
              done={wantToWorkDone || isAuthor}
              onDone={() => setWantToWorkDone(true)}
            />
          </div>
        </div>
      </div>

      {/* ── Rating modal ───────────────────── */}
      <RatingModal
        ideaId={ideaId}
        authorUid={idea?.authorUid}
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        existingRating={userRating}
        onRatingSubmitted={handleRatingSubmitted}
      />

      <style>{`
        .idea-layout {
          display: flex;
          gap: 24px;
          align-items: flex-start;
        }
        @media (max-width: 900px) {
          .idea-layout { flex-direction: column-reverse; }
          .idea-right-col { width: 100% !important; }
        }
      `}</style>
    </div>
  );
}
