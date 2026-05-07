/**
 * Founder Space — Public Idea Page  (dark orbital theme)
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

// ─────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────

const TAG_COLORS = {
  Launched:  '#4ade80',
  Funding:   '#f5c842',
  Milestone: '#60a5fa',
  Marketing: '#c084fc',
  Pivot:     '#f87171',
  Other:     '#94a3b8',
};

const RATING_PARAMS = [
  { key: 'avgProblemClarity',       label: 'Problem Clarity'      },
  { key: 'avgMarketPotential',      label: 'Market Potential'     },
  { key: 'avgFounderCredibility',   label: 'Founder Credibility'  },
  { key: 'avgExecutionReadiness',   label: 'Execution Readiness'  },
  { key: 'avgOverallInvestability', label: 'Investability'        },
];

const UPDATE_TAGS = ['Launched', 'Funding', 'Milestone', 'Marketing', 'Pivot', 'Other'];

const ROLE_COLORS = {
  founder:    '#f5c842',
  investor:   '#4ade80',
  talent:     '#60a5fa',
  enthusiast: '#c084fc',
};

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

function setMeta(property, content) {
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

// ─────────────────────────────────────────────
//  Dark card primitives
// ─────────────────────────────────────────────

function Card({ children, style }) {
  return (
    <div style={{
      background: '#13131f',
      borderRadius: 14,
      border: '1px solid rgba(245,200,66,0.08)',
      padding: '20px',
      ...style,
    }}>
      {children}
    </div>
  );
}

function CardLabel({ children, color = '#f5c842' }) {
  return (
    <div style={{
      fontFamily: "'DM Mono', monospace",
      fontSize: 9, fontWeight: 700,
      letterSpacing: '0.22em', textTransform: 'uppercase',
      color, marginBottom: 14,
    }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Avatar
// ─────────────────────────────────────────────

function Avatar({ profile, size = 32 }) {
  if (!profile) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)', flexShrink: 0,
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
      background: 'linear-gradient(135deg, #f5c842 0%, #ff6b35 100%)',
      color: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontFamily: "'Syne', sans-serif", fontWeight: 800,
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// ─────────────────────────────────────────────
//  UpdateCard
// ─────────────────────────────────────────────

function UpdateCard({ update }) {
  const color = TAG_COLORS[update.tag] || TAG_COLORS.Other;
  return (
    <div style={{
      display: 'flex', gap: 12, alignItems: 'flex-start',
      paddingBottom: 16, marginBottom: 16,
      borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      <div style={{
        width: 7, height: 7, borderRadius: '50%',
        background: color, marginTop: 6, flexShrink: 0,
        boxShadow: `0 0 8px ${color}60`,
      }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 8, fontWeight: 700, letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color,
            background: `${color}15`,
            border: `1px solid ${color}30`,
            padding: '2px 8px', borderRadius: 4,
          }}>
            {update.tag}
          </span>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 9, color: 'rgba(232,232,240,0.25)',
          }}>
            {relativeDate(update.createdAt)}
          </span>
        </div>
        <div style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 13, color: 'rgba(232,232,240,0.75)', lineHeight: 1.65,
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
      background: 'rgba(255,255,255,0.03)', borderRadius: 10,
      border: '1px solid rgba(255,255,255,0.07)', padding: '14px', marginBottom: 16,
    }}>
      <div style={{
        fontFamily: "'DM Mono', monospace", fontSize: 9,
        letterSpacing: '0.16em', textTransform: 'uppercase',
        color: 'rgba(232,232,240,0.3)', marginBottom: 10,
      }}>
        Tag
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {UPDATE_TAGS.map(t => {
          const sel = tag === t;
          const c = TAG_COLORS[t];
          return (
            <button key={t} onClick={() => setTag(t)} style={{
              padding: '5px 12px', borderRadius: 20,
              border: `1.5px solid ${sel ? c : 'rgba(255,255,255,0.1)'}`,
              background: sel ? `${c}15` : 'transparent',
              color: sel ? c : 'rgba(232,232,240,0.45)',
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
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, outline: 'none', padding: '10px 12px',
          fontFamily: "'Syne', sans-serif", fontSize: 13,
          color: '#e8e8f0', lineHeight: 1.6, resize: 'none',
        }}
        onFocus={e => e.target.style.borderColor = 'rgba(245,200,66,0.4)'}
        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'rgba(232,232,240,0.25)' }}>
          {300 - body.length} left
        </span>
        <button
          onClick={handleSubmit}
          disabled={!tag || !body.trim() || saving}
          style={{
            padding: '8px 18px', borderRadius: 8, border: 'none',
            background: tag && body.trim() ? '#f5c842' : 'rgba(255,255,255,0.07)',
            color: tag && body.trim() ? '#0a0a0f' : 'rgba(232,232,240,0.3)',
            fontFamily: "'DM Mono', monospace",
            fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
            cursor: tag && body.trim() ? 'pointer' : 'not-allowed',
            opacity: saving ? 0.6 : 1, transition: 'all 0.15s',
          }}
        >
          {saving ? 'Posting…' : 'Post update'}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Reddit-style CommentCard
// ─────────────────────────────────────────────

function CommentCard({ comment, authorProfile, onReply, isReply, isUpvoted, onUpvote }) {
  const roleColor = ROLE_COLORS[authorProfile?.role] || 'rgba(232,232,240,0.3)';
  const votes = comment.upvoteCount || 0;

  return (
    <div style={{
      display: 'flex', gap: 0, alignItems: 'flex-start',
      paddingLeft: isReply ? 32 : 0,
      marginBottom: 4,
      position: 'relative',
    }}>
      {/* Thread indent line for replies */}
      {isReply && (
        <div style={{
          position: 'absolute', left: 12, top: 0, bottom: 0,
          width: 1.5, background: 'rgba(255,255,255,0.07)',
          borderRadius: 1,
        }} />
      )}

      {/* Vote column */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 2, paddingTop: 4, marginRight: 10, flexShrink: 0, width: 24,
      }}>
        <button
          onClick={() => onUpvote(comment.id)}
          title={isUpvoted ? 'Remove upvote' : 'Upvote'}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '2px 4px', lineHeight: 1,
            color: isUpvoted ? '#f5c842' : 'rgba(232,232,240,0.25)',
            fontSize: 12, transition: 'color 0.15s',
          }}
          onMouseEnter={e => { if (!isUpvoted) e.currentTarget.style.color = 'rgba(245,200,66,0.6)'; }}
          onMouseLeave={e => { if (!isUpvoted) e.currentTarget.style.color = 'rgba(232,232,240,0.25)'; }}
        >
          ▲
        </button>
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 9, fontWeight: 700,
          color: votes > 0 ? '#f5c842' : 'rgba(232,232,240,0.2)',
          lineHeight: 1,
        }}>
          {votes}
        </span>
      </div>

      {/* Avatar */}
      <div style={{ marginRight: 10, marginTop: 2 }}>
        <Avatar profile={authorProfile} size={28} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 11, fontWeight: 700, color: '#e8e8f0',
          }}>
            {authorProfile?.name || 'Founder'}
          </span>
          {authorProfile?.role && (
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 8, fontWeight: 700, letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: roleColor,
              background: `${roleColor}15`,
              border: `1px solid ${roleColor}30`,
              padding: '1px 6px', borderRadius: 3,
            }}>
              {authorProfile.role}
            </span>
          )}
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 9, color: 'rgba(232,232,240,0.25)',
          }}>
            {relativeDate(comment.createdAt)}
          </span>
        </div>
        <div style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 13, color: 'rgba(232,232,240,0.8)', lineHeight: 1.65,
          marginBottom: 7, wordBreak: 'break-word',
        }}>
          {comment.body}
        </div>
        {!isReply && (
          <button
            onClick={() => onReply(comment.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'DM Mono', monospace",
              fontSize: 9, color: 'rgba(232,232,240,0.25)',
              letterSpacing: '0.08em', padding: 0,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#f5c842'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(232,232,240,0.25)'}
          >
            ↩ reply
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  RatingCard
// ─────────────────────────────────────────────

function RatingCard({ idea, onRate }) {
  const count = idea?.ratingCount || 0;
  const avg   = idea?.avgOverall  || 0;

  return (
    <Card style={{ marginBottom: 12 }}>
      <CardLabel>Community verdict</CardLabel>
      {count === 0 ? (
        <div style={{ textAlign: 'center', padding: '8px 0 14px' }}>
          <div style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 14, fontWeight: 700, color: '#e8e8f0', marginBottom: 6,
          }}>
            No verdicts yet
          </div>
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 11, color: 'rgba(232,232,240,0.35)', marginBottom: 14,
          }}>
            Rate the 5 pitch dimensions
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
            <span style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 40, fontWeight: 900, color: '#f5c842', lineHeight: 1,
            }}>
              {avg.toFixed(1)}
            </span>
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10, color: 'rgba(232,232,240,0.35)',
            }}>
              / 5 · {count} {count === 1 ? 'rating' : 'ratings'}
            </span>
          </div>
          {RATING_PARAMS.map(p => (
            <div key={p.key} style={{ marginBottom: 8 }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontFamily: "'DM Mono', monospace",
                fontSize: 8, letterSpacing: '0.1em', marginBottom: 3,
              }}>
                <span style={{ color: 'rgba(232,232,240,0.4)' }}>{p.label}</span>
                <span style={{ color: '#f5c842', fontWeight: 700 }}>
                  {(idea[p.key] || 0).toFixed(1)}
                </span>
              </div>
              <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${((idea[p.key] || 0) / 5) * 100}%`,
                  background: 'linear-gradient(90deg, #f5c842, #ff6b35)',
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
          background: '#f5c842', color: '#0a0a0f',
          borderRadius: 8, border: 'none',
          fontFamily: "'DM Mono', monospace",
          fontSize: 11, fontWeight: 800, letterSpacing: '0.08em',
          cursor: 'pointer', transition: 'opacity 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        Rate this idea →
      </button>
    </Card>
  );
}

// ─────────────────────────────────────────────
//  StatsCard
// ─────────────────────────────────────────────

function StatsCard({ idea }) {
  const stats = [
    { label: 'Views',   value: idea?.viewCount       || 0, color: 'rgba(232,232,240,0.5)' },
    { label: 'Ratings', value: idea?.ratingCount     || 0, color: '#f5c842'               },
    { label: 'Want in', value: idea?.wantToWorkCount || 0, color: '#4ade80'               },
  ];
  return (
    <Card style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
        {stats.map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 26, fontWeight: 900, color: s.color, lineHeight: 1,
            }}>
              {s.value}
            </div>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 8, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: 'rgba(232,232,240,0.25)',
              marginTop: 4,
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
//  WantToWorkCard
// ─────────────────────────────────────────────

function WantToWorkCard({ ideaId, user, signIn, done, onDone }) {
  const [note, setNote]     = useState('');
  const [saving, setSaving] = useState(false);

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
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', flexShrink: 0, boxShadow: '0 0 8px #4ade8060' }} />
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, color: '#4ade80' }}>
              You're interested ✓
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'rgba(232,232,240,0.3)', marginTop: 2 }}>
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
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'rgba(232,232,240,0.4)', marginBottom: 14 }}>
          Sign in to express interest.
        </div>
        <button
          onClick={signIn}
          style={{
            width: '100%', padding: '10px 0', background: 'transparent',
            borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)',
            fontFamily: "'DM Mono', monospace",
            fontSize: 11, color: '#e8e8f0', fontWeight: 600, cursor: 'pointer',
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
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, outline: 'none', padding: '10px 12px',
          fontFamily: "'Syne', sans-serif", fontSize: 13,
          color: '#e8e8f0', lineHeight: 1.6, resize: 'none', marginBottom: 8,
        }}
        onFocus={e => e.target.style.borderColor = 'rgba(245,200,66,0.4)'}
        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
      />
      <div style={{
        display: 'flex', justifyContent: 'flex-end',
        fontFamily: "'DM Mono', monospace", fontSize: 9,
        color: 'rgba(232,232,240,0.25)', marginBottom: 10,
      }}>
        {200 - note.length} left
      </div>
      <button
        onClick={handleSubmit}
        disabled={saving}
        style={{
          width: '100%', padding: '10px 0',
          background: '#4ade80', color: '#0a0a0f',
          borderRadius: 8, border: 'none',
          fontFamily: "'DM Mono', monospace",
          fontSize: 11, fontWeight: 800, letterSpacing: '0.08em',
          cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.6 : 1,
          transition: 'opacity 0.15s',
        }}
      >
        {saving ? 'Submitting…' : 'I want in →'}
      </button>
    </Card>
  );
}

// ─────────────────────────────────────────────
//  Shimmer
// ─────────────────────────────────────────────

function Shimmer() {
  return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh' }}>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(10,10,15,0.95)',
        borderBottom: '1px solid rgba(245,200,66,0.07)',
        padding: '14px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ width: 120, height: 14, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }} />
        <div style={{ width: 60, height: 14, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }} />
      </nav>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        <DiagramSkeleton />
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

  const [idea,           setIdea]           = useState(null);
  const [author,         setAuthor]         = useState(null);
  const [comments,       setComments]       = useState([]);
  const [commentAuthors, setCommentAuthors] = useState({});
  const [updates,        setUpdates]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [notFound,       setNotFound]       = useState(false);

  const [userRating,      setUserRating]      = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [wantToWorkDone,  setWantToWorkDone]  = useState(false);

  const [newComment,  setNewComment]  = useState('');
  const [replyingTo,  setReplyingTo]  = useState(null);
  const [replyBody,   setReplyBody]   = useState('');

  // Track upvoted comment IDs for this session
  const [upvotedIds,  setUpvotedIds]  = useState(new Set());

  // ── Fetch data ───────────────────────────
  useEffect(() => {
    if (!ideaId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const ideaSnap = await getDoc(doc(db, 'ideas', ideaId));
        if (!ideaSnap.exists() || ideaSnap.data().status !== 'published') {
          if (!cancelled) setNotFound(true);
          return;
        }
        const ideaData = { id: ideaSnap.id, ...ideaSnap.data() };
        if (!cancelled) setIdea(ideaData);

        document.title = `${ideaData.ideaTitle || 'Idea'} — ORB1T | NoCap VC`;
        setMeta('og:title',       `${ideaData.ideaTitle || 'Idea'} on ORB1T | NoCap VC`);
        setMeta('og:description', ideaData.tagline || ideaData.problemTitle || '');
        setMeta('og:image',       `/api/og/idea/${ideaId}`);
        setMeta('og:url',         window.location.href);

        const authorSnap = await getDoc(doc(db, 'users', ideaData.authorUid));
        if (!cancelled && authorSnap.exists()) setAuthor({ uid: authorSnap.id, ...authorSnap.data() });

        const cQ = query(
          collection(db, 'comments'),
          where('ideaId', '==', ideaId),
          where('status', '==', 'approved'),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        const cSnap = await getDocs(cQ);
        const fetchedComments = cSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (!cancelled) setComments(fetchedComments);

        const authorUids = [...new Set(fetchedComments.map(c => c.authorUid).filter(Boolean))];
        const authorMap = {};
        await Promise.all(authorUids.map(async uid => {
          const snap = await getDoc(doc(db, 'users', uid));
          if (snap.exists()) authorMap[uid] = { uid: snap.id, ...snap.data() };
        }));
        if (!cancelled) setCommentAuthors(authorMap);

        const uQ = query(
          collection(db, 'ideas', ideaId, 'updates'),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        const uSnap = await getDocs(uQ);
        if (!cancelled) setUpdates(uSnap.docs.map(d => ({ id: d.id, ...d.data() })));

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

  useEffect(() => {
    if (!user || !ideaId) return;

    async function loadUserData() {
      const wtwQ = query(
        collection(db, 'wantToWork'),
        where('ideaId', '==', ideaId),
        where('authorUid', '==', user.uid),
        limit(1)
      );
      const wtwSnap = await getDocs(wtwQ);
      if (!wtwSnap.empty) setWantToWorkDone(true);

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
        upvoteCount: 0,
        createdAt: serverTimestamp(),
      };
      const ref = await addDoc(collection(db, 'comments'), data);
      const optimistic = { id: ref.id, ...data, createdAt: { seconds: Date.now() / 1000 } };
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

  // ── Upvote ───────────────────────────────
  const handleUpvote = useCallback(async (commentId) => {
    if (!user) return;
    const isUpvoted = upvotedIds.has(commentId);
    setUpvotedIds(prev => {
      const next = new Set(prev);
      isUpvoted ? next.delete(commentId) : next.add(commentId);
      return next;
    });
    setComments(prev => prev.map(c =>
      c.id === commentId
        ? { ...c, upvoteCount: Math.max(0, (c.upvoteCount || 0) + (isUpvoted ? -1 : 1)) }
        : c
    ));
    try {
      await updateDoc(doc(db, 'comments', commentId), {
        upvoteCount: increment(isUpvoted ? -1 : 1),
      });
    } catch (e) { console.error(e); }
  }, [user, upvotedIds]);

  // ── Share ────────────────────────────────
  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: idea?.ideaTitle, text: idea?.tagline, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      showToast('Link copied!', 'success');
    }
    if (ideaId) updateDoc(doc(db, 'ideas', ideaId), { shareCount: increment(1) });
  }

  function handleRatingSubmitted(newAggregates) {
    setIdea(prev => prev ? { ...prev, ...newAggregates } : prev);
    setShowRatingModal(false);
    showToast('Verdict pinned ✓', 'success');
  }

  // ─────────────────────────────────────────
  //  Render
  // ─────────────────────────────────────────

  if (loading) return <Shimmer />;

  if (notFound) {
    return (
      <div style={{ background: '#0a0a0f', minHeight: '100vh' }}>
        <nav style={{
          background: 'rgba(10,10,15,0.95)',
          borderBottom: '1px solid rgba(245,200,66,0.07)',
          padding: '14px 24px',
        }}>
          <Link to="/founder-space/feed" style={{
            fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 800,
            color: '#e8e8f0', textDecoration: 'none', letterSpacing: '-0.02em',
          }}>
            ORB<span style={{ color: '#f5c842' }}>1</span>T
          </Link>
        </nav>
        <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
          <div style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 32, fontWeight: 900, color: '#e8e8f0', marginBottom: 12,
          }}>
            Signal not found.
          </div>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'rgba(232,232,240,0.35)', marginBottom: 24 }}>
            This idea may not be published yet, or the link is wrong.
          </p>
          <Link to="/founder-space/feed" style={{
            display: 'inline-block', padding: '10px 24px', borderRadius: 8,
            background: '#f5c842', color: '#0a0a0f',
            fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 800,
            textDecoration: 'none',
          }}>← Back to feed</Link>
        </div>
      </div>
    );
  }

  const isAuthor    = user?.uid === idea?.authorUid;
  const topComments = comments
    .filter(c => !c.parentId)
    .sort((a, b) => (b.upvoteCount || 0) - (a.upvoteCount || 0));
  const replies     = comments.filter(c => c.parentId);

  return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh', paddingBottom: 60 }}>

      {/* ── Sticky nav ─────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(10,10,15,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(245,200,66,0.07)',
        padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link to="/founder-space/feed" style={{
          fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 800,
          color: '#e8e8f0', textDecoration: 'none', letterSpacing: '-0.02em',
        }}>
          ORB<span style={{ color: '#f5c842' }}>1</span>T
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isAuthor && (
            <button
              onClick={() => navigate(`/founder-space/submit?ideaId=${ideaId}`)}
              style={{
                padding: '7px 14px', borderRadius: 7,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'transparent',
                fontFamily: "'DM Mono', monospace",
                fontSize: 10, color: 'rgba(232,232,240,0.7)', cursor: 'pointer',
              }}
            >
              Edit board
            </button>
          )}
          <button
            onClick={handleShare}
            style={{
              padding: '7px 16px', borderRadius: 7,
              border: 'none', background: '#f5c842',
              fontFamily: "'DM Mono', monospace",
              fontSize: 10, fontWeight: 800, color: '#0a0a0f',
              cursor: 'pointer', letterSpacing: '0.04em',
            }}
          >
            Share ↗
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
            <Card style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#f87171', boxShadow: '0 0 8px #f8717160' }} />
                <span style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 15, fontWeight: 800, color: '#e8e8f0', letterSpacing: '-0.01em',
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
                  fontSize: 10, color: 'rgba(232,232,240,0.2)',
                  textAlign: 'center', padding: '14px 0',
                  letterSpacing: '0.08em',
                }}>
                  No updates yet.
                </div>
              ) : (
                updates.map(u => <UpdateCard key={u.id} update={u} />)
              )}
            </Card>

            {/* Comments */}
            <Card>
              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18,
              }}>
                <span style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 15, fontWeight: 800, color: '#e8e8f0', letterSpacing: '-0.01em',
                }}>
                  Community notes
                </span>
                {topComments.length > 0 && (
                  <span style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 9, color: '#f5c842',
                    background: 'rgba(245,200,66,0.1)',
                    padding: '2px 7px', borderRadius: 4, fontWeight: 700,
                  }}>
                    {topComments.length}
                  </span>
                )}
                <span style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 8, color: 'rgba(232,232,240,0.2)',
                  marginLeft: 4, letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}>
                  sorted by top
                </span>
              </div>

              {/* Comment list */}
              {topComments.map(c => (
                <React.Fragment key={c.id}>
                  <div style={{
                    paddingBottom: 12, marginBottom: 8,
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}>
                    <CommentCard
                      comment={c}
                      authorProfile={commentAuthors[c.authorUid]}
                      onReply={id => { setReplyingTo(id); setReplyBody(''); }}
                      isReply={false}
                      isUpvoted={upvotedIds.has(c.id)}
                      onUpvote={handleUpvote}
                    />

                    {/* Reply input */}
                    {replyingTo === c.id && (
                      <div style={{ paddingLeft: 66, marginTop: 10 }}>
                        <textarea
                          value={replyBody}
                          onChange={e => setReplyBody(e.target.value)}
                          placeholder="Write a reply…"
                          maxLength={500} rows={2}
                          autoFocus
                          style={{
                            width: '100%', boxSizing: 'border-box',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8,
                            outline: 'none', padding: '8px 10px',
                            fontFamily: "'Syne', sans-serif",
                            fontSize: 13, color: '#e8e8f0', lineHeight: 1.6, resize: 'none',
                          }}
                          onFocus={e => e.target.style.borderColor = 'rgba(245,200,66,0.35)'}
                          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                        />
                        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                          <button
                            onClick={() => handleCommentSubmit(replyBody, c.id)}
                            disabled={!replyBody.trim()}
                            style={{
                              padding: '6px 14px', borderRadius: 6, border: 'none',
                              background: replyBody.trim() ? '#f5c842' : 'rgba(255,255,255,0.07)',
                              color: replyBody.trim() ? '#0a0a0f' : 'rgba(232,232,240,0.3)',
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
                              border: '1px solid rgba(255,255,255,0.1)',
                              background: 'transparent',
                              fontFamily: "'DM Mono', monospace",
                              fontSize: 10, color: 'rgba(232,232,240,0.4)', cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Nested replies */}
                    {replies.filter(r => r.parentId === c.id).length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        {replies.filter(r => r.parentId === c.id).map(r => (
                          <div key={r.id} style={{ marginTop: 6 }}>
                            <CommentCard
                              comment={r}
                              authorProfile={commentAuthors[r.authorUid]}
                              onReply={() => {}}
                              isReply={true}
                              isUpvoted={upvotedIds.has(r.id)}
                              onUpvote={handleUpvote}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </React.Fragment>
              ))}

              {topComments.length === 0 && (
                <div style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10, color: 'rgba(232,232,240,0.2)',
                  textAlign: 'center', padding: '16px 0 8px',
                  letterSpacing: '0.08em',
                }}>
                  No notes yet — be the first.
                </div>
              )}

              {/* Add comment */}
              <div style={{ marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16 }}>
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
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 10,
                          outline: 'none', padding: '10px 12px',
                          fontFamily: "'Syne', sans-serif",
                          fontSize: 13, color: '#e8e8f0',
                          lineHeight: 1.6, resize: 'none',
                        }}
                        onFocus={e => e.target.style.borderColor = 'rgba(245,200,66,0.35)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, alignItems: 'center' }}>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'rgba(232,232,240,0.2)' }}>
                          {500 - newComment.length} left
                        </span>
                        <button
                          onClick={() => handleCommentSubmit(newComment)}
                          disabled={!newComment.trim()}
                          style={{
                            padding: '8px 16px', borderRadius: 8, border: 'none',
                            background: newComment.trim() ? '#f5c842' : 'rgba(255,255,255,0.07)',
                            color: newComment.trim() ? '#0a0a0f' : 'rgba(232,232,240,0.25)',
                            fontFamily: "'DM Mono', monospace",
                            fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                            cursor: newComment.trim() ? 'pointer' : 'not-allowed',
                            transition: 'all 0.15s',
                          }}
                        >
                          Add note →
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'rgba(232,232,240,0.35)' }}>
                      Sign in to add a note
                    </span>
                    <button
                      onClick={signIn}
                      style={{
                        padding: '8px 16px', borderRadius: 8, border: 'none',
                        background: '#f5c842', color: '#0a0a0f',
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 10, fontWeight: 800, cursor: 'pointer',
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
                      fontFamily: "'Syne', sans-serif",
                      fontSize: 14, fontWeight: 800, color: '#e8e8f0',
                    }}>
                      {author.name}
                    </div>
                    {author.title && (
                      <div style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 10, color: 'rgba(232,232,240,0.4)', marginTop: 2,
                      }}>
                        {author.title}
                      </div>
                    )}
                    {author.location && (
                      <div style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 9, color: 'rgba(232,232,240,0.25)', marginTop: 2,
                      }}>
                        {author.location}
                      </div>
                    )}
                  </div>
                </div>
                {author.whatImBuilding && (
                  <div style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11, color: 'rgba(232,232,240,0.45)', lineHeight: 1.6,
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
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'transparent',
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10, fontWeight: 600, color: 'rgba(232,232,240,0.7)',
                    textDecoration: 'none',
                    transition: 'border-color 0.15s, color 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(245,200,66,0.4)';
                    e.currentTarget.style.color = '#f5c842';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                    e.currentTarget.style.color = 'rgba(232,232,240,0.7)';
                  }}
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
