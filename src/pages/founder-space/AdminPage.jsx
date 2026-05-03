/**
 * Founder Space — Admin Console
 * Route: /founder-space/admin
 *
 * Auth guard: client-side userProfile.isAdmin check.
 * NOTE: Production should use Cloud Functions for write operations
 * (approve/reject/ban) to prevent client-side privilege escalation.
 * For now, Firestore security rules must restrict write access to admins.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  collection, query, where, orderBy, limit,
  getDocs, doc, getDoc, updateDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../lib/auth';
import { useToast } from '../../components/Toast';
import { PolaroidWallDiagram } from '../../components/founder-space/PolaroidWallDiagram';

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

function tsToStr(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysAgo(ts) {
  if (!ts) return 0;
  const d = ts.toDate ? ts.toDate() : ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

function Avatar({ profile, size = 32 }) {
  const initials = (profile?.name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  if (profile?.photoURL) {
    return (
      <img src={profile.photoURL} alt={profile?.name || ''}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: '#2c1f0e', color: '#f5c842',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontFamily: "'Playfair Display', serif", fontWeight: 700,
    }}>
      {initials}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Sidebar
// ─────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'pending',   icon: '⏳', label: 'Pending'   },
  { id: 'published', icon: '✅', label: 'Published'  },
  { id: 'rejected',  icon: '✗',  label: 'Rejected'   },
  { id: 'comments',  icon: '💬', label: 'Comments'   },
  { id: 'users',     icon: '👥', label: 'Users'      },
];

function Sidebar({ activeTab, setActiveTab, counts }) {
  return (
    <div style={{
      position: 'fixed', left: 0, top: 0, bottom: 0, width: 220,
      background: '#1a1208',
      display: 'flex', flexDirection: 'column',
      zIndex: 100,
    }}>
      {/* Wordmark */}
      <div style={{ padding: '28px 20px 20px' }}>
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 18, fontWeight: 900, color: '#f5c842',
          marginBottom: 4,
        }}>
          NoCap VC
        </div>
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 9, color: '#c4a882',
          letterSpacing: '0.18em', textTransform: 'uppercase',
        }}>
          Admin Console
        </div>
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 16px 16px' }} />

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '0 12px' }}>
        {NAV_ITEMS.map(item => {
          const isActive = activeTab === item.id;
          const count = counts[item.id];
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '10px 12px', borderRadius: 8, marginBottom: 2,
                border: 'none', cursor: 'pointer', textAlign: 'left',
                background: isActive ? '#2c1f0e' : 'transparent',
                color: isActive ? '#f5c842' : '#c4a882',
                fontFamily: "'DM Mono', monospace",
                fontSize: 11, fontWeight: isActive ? 700 : 400,
                letterSpacing: '0.08em',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = '#c4a882'; }}
            >
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {count > 0 && (
                <span style={{
                  background: isActive ? '#f5c842' : 'rgba(196,150,58,0.3)',
                  color: isActive ? '#2c1f0e' : '#c4a882',
                  fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 10,
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Back link */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Link to="/founder-space/feed" style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 10, color: '#7a6550', textDecoration: 'none',
          letterSpacing: '0.1em',
        }}>
          ← Back to feed
        </Link>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Stat card
// ─────────────────────────────────────────────

function StatCard({ label, value, color = '#2c1f0e' }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16,
      border: '1px solid rgba(44,31,14,0.08)',
      padding: '20px 24px',
    }}>
      <div style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 32, fontWeight: 900, color,
        marginBottom: 4,
      }}>
        {value ?? '—'}
      </div>
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 10, color: '#c4a882',
        letterSpacing: '0.12em', textTransform: 'uppercase',
      }}>
        {label}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  AdminIdeaCard (Pending tab)
// ─────────────────────────────────────────────

function AdminIdeaCard({ idea, author, onApprove, onReject }) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const waiting = daysAgo(idea.submittedAt);

  return (
    <div style={{
      background: '#fff', borderRadius: 20,
      border: '1px solid rgba(44,31,14,0.1)',
      padding: '24px 28px', marginBottom: 20,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', marginBottom: 16,
      }}>
        <div>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 22, fontWeight: 900, color: '#2c1f0e', marginBottom: 8,
          }}>
            {idea.ideaTitle || 'Untitled'}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {idea.category && (
              <span style={{
                fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 700,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                background: '#2c1f0e', color: '#f5c842',
                padding: '3px 10px', borderRadius: 20,
              }}>{idea.category}</span>
            )}
            {idea.stage && (
              <span style={{
                fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 600,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                background: 'rgba(44,31,14,0.07)', color: '#7a5c3a',
                padding: '3px 10px', borderRadius: 20,
              }}>{idea.stage}</span>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10, color: '#c4a882', marginBottom: 4,
          }}>
            Submitted {tsToStr(idea.submittedAt)}
          </div>
          {waiting >= 2 && (
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10, fontWeight: 700, color: '#e8391e',
            }}>
              {waiting} days waiting
            </div>
          )}
        </div>
      </div>

      {/* Founder row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 14px', borderRadius: 10,
        background: 'rgba(44,31,14,0.04)', marginBottom: 16,
      }}>
        <Avatar profile={author} size={36} />
        <div>
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 11, fontWeight: 700, color: '#2c1f0e',
          }}>
            {author?.name || 'Unknown founder'}
          </div>
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 9, color: '#c4a882', marginTop: 2,
          }}>
            {author?.email || '—'} · {author?.role || 'Founder'}
          </div>
        </div>
      </div>

      {/* Compact diagram */}
      <div style={{
        maxHeight: 260, overflow: 'hidden',
        borderRadius: 12, marginBottom: 16,
        background: '#fdf6e8',
        padding: '12px 12px 0',
      }}>
        <PolaroidWallDiagram idea={idea} readOnly={true} compact={true} />
      </div>

      {/* Word count summary */}
      <div style={{
        display: 'flex', gap: 16, flexWrap: 'wrap',
        padding: '10px 14px', borderRadius: 8,
        background: 'rgba(44,31,14,0.03)',
        marginBottom: 16,
      }}>
        {['problem', 'reveal', 'solution', 'market', 'ask'].map(key => {
          const body  = idea[`${key}Body`] || '';
          const title = idea[`${key}Title`] || '';
          const chars = (title + body).length;
          return (
            <div key={key} style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9, color: chars > 0 ? '#2c8a4e' : '#c4a882',
            }}>
              {key.charAt(0).toUpperCase() + key.slice(1)}: <strong>{chars}</strong> chars
            </div>
          );
        })}
      </div>

      {/* Actions */}
      {!showRejectForm ? (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={() => {
              if (window.confirm(`Approve "${idea.ideaTitle}" by ${author?.name || 'this founder'}?`)) {
                onApprove(idea.id);
              }
            }}
            style={{
              background: '#2c8a4e', color: '#fff',
              border: 'none', borderRadius: 10,
              padding: '10px 20px', cursor: 'pointer',
              fontFamily: "'DM Mono', monospace",
              fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
            }}
          >
            Approve →
          </button>
          <button
            onClick={() => setShowRejectForm(true)}
            style={{
              background: 'transparent', color: '#e8391e',
              border: '1px solid #e8391e', borderRadius: 10,
              padding: '10px 20px', cursor: 'pointer',
              fontFamily: "'DM Mono', monospace",
              fontSize: 11, letterSpacing: '0.08em',
            }}
          >
            Request changes
          </button>
          <a
            href={`/founder-space/ideas/${idea.id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10, color: '#c4a882', textDecoration: 'none',
              marginLeft: 8,
            }}
          >
            Preview →
          </a>
        </div>
      ) : (
        <div>
          <textarea
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="Explain what needs to change (min 20 characters)…"
            style={{
              width: '100%', minHeight: 80, padding: '10px 12px',
              fontFamily: "'DM Mono', monospace", fontSize: 11,
              border: '1px solid rgba(232,57,30,0.4)', borderRadius: 8,
              background: '#fdf6e8', color: '#2c1f0e', resize: 'vertical',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button
              disabled={rejectReason.trim().length < 20 || rejecting}
              onClick={async () => {
                setRejecting(true);
                await onReject(idea.id, rejectReason.trim());
                setRejecting(false);
                setShowRejectForm(false);
              }}
              style={{
                background: rejectReason.trim().length < 20 ? '#e8dcc8' : '#e8391e',
                color: '#fff', border: 'none', borderRadius: 10,
                padding: '10px 20px', cursor: rejectReason.trim().length < 20 ? 'not-allowed' : 'pointer',
                fontFamily: "'DM Mono', monospace",
                fontSize: 11, fontWeight: 700,
              }}
            >
              {rejecting ? 'Sending…' : 'Send feedback'}
            </button>
            <button
              onClick={() => { setShowRejectForm(false); setRejectReason(''); }}
              style={{
                background: 'transparent', color: '#7a5c3a',
                border: '1px solid #e8dcc8', borderRadius: 10,
                padding: '10px 16px', cursor: 'pointer',
                fontFamily: "'DM Mono', monospace", fontSize: 11,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Idea row (Published / Rejected tables)
// ─────────────────────────────────────────────

function IdeaTableRow({ idea, author, onAction, actionLabel, actionColor }) {
  return (
    <tr style={{ borderBottom: '1px solid rgba(44,31,14,0.06)' }}>
      <td style={{ padding: '12px 16px' }}>
        <a
          href={`/founder-space/ideas/${idea.id}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 11, fontWeight: 700, color: '#2c1f0e', textDecoration: 'none',
          }}
        >
          {idea.ideaTitle || 'Untitled'}
        </a>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar profile={author} size={24} />
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10, color: '#7a5c3a',
          }}>
            {author?.name || '—'}
          </span>
        </div>
      </td>
      <td style={{ padding: '12px 16px', fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#c4a882' }}>
        {tsToStr(idea.publishedAt || idea.submittedAt)}
      </td>
      <td style={{ padding: '12px 16px', fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#2c1f0e', textAlign: 'center' }}>
        {idea.viewCount || 0}
      </td>
      <td style={{ padding: '12px 16px', fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#2c1f0e', textAlign: 'center' }}>
        {idea.ratingCount || 0}
      </td>
      <td style={{ padding: '12px 16px', fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#2c1f0e', textAlign: 'center' }}>
        {idea.wantToWorkCount || 0}
      </td>
      {idea.rejectionReason && (
        <td style={{ padding: '12px 16px', fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#c4a882', maxWidth: 200 }}>
          {idea.rejectionReason}
        </td>
      )}
      <td style={{ padding: '12px 16px' }}>
        <button
          onClick={() => onAction(idea.id)}
          style={{
            background: 'transparent', color: actionColor,
            border: `1px solid ${actionColor}`, borderRadius: 8,
            padding: '6px 14px', cursor: 'pointer',
            fontFamily: "'DM Mono', monospace", fontSize: 10,
          }}
        >
          {actionLabel}
        </button>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────
//  Pending Tab
// ─────────────────────────────────────────────

function PendingTab({ showToast }) {
  const [ideas, setIdeas]     = useState([]);
  const [authors, setAuthors] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const snap = await getDocs(
        query(collection(db, 'ideas'),
          where('status', '==', 'pending_review'),
          orderBy('submittedAt', 'asc'))
      );
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setIdeas(list);

      // Batch-fetch authors
      const uids = [...new Set(list.map(i => i.authorUid).filter(Boolean))];
      const profiles = {};
      await Promise.all(uids.map(async uid => {
        const s = await getDoc(doc(db, 'users', uid));
        if (s.exists()) profiles[uid] = s.data();
      }));
      setAuthors(profiles);
      setLoading(false);
    }
    load();
  }, []);

  async function handleApprove(ideaId) {
    const idea = ideas.find(i => i.id === ideaId);
    await updateDoc(doc(db, 'ideas', ideaId), {
      status: 'published',
      publishedAt: serverTimestamp(),
    });
    setIdeas(prev => prev.filter(i => i.id !== ideaId));
    showToast(`"${idea?.ideaTitle || 'Idea'}" is now live on Founder Space`, 'success');
  }

  async function handleReject(ideaId, reason) {
    const idea = ideas.find(i => i.id === ideaId);
    await updateDoc(doc(db, 'ideas', ideaId), {
      status: 'rejected',
      rejectionReason: reason,
    });
    setIdeas(prev => prev.filter(i => i.id !== ideaId));
    showToast(`Feedback sent to ${authors[idea?.authorUid]?.name || 'founder'}`, 'info');
  }

  if (loading) return <LoadingSpinner />;
  if (ideas.length === 0) {
    return (
      <EmptyState
        icon="✓"
        title="Queue is clear"
        sub="No ideas pending review right now."
      />
    );
  }

  return (
    <div>
      {ideas.map(idea => (
        <AdminIdeaCard
          key={idea.id}
          idea={idea}
          author={authors[idea.authorUid]}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Published Tab
// ─────────────────────────────────────────────

function PublishedTab({ showToast }) {
  const [ideas, setIdeas]     = useState([]);
  const [authors, setAuthors] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const snap = await getDocs(
        query(collection(db, 'ideas'),
          where('status', '==', 'published'),
          orderBy('publishedAt', 'desc'),
          limit(50))
      );
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setIdeas(list);
      const uids = [...new Set(list.map(i => i.authorUid).filter(Boolean))];
      const profiles = {};
      await Promise.all(uids.map(async uid => {
        const s = await getDoc(doc(db, 'users', uid));
        if (s.exists()) profiles[uid] = s.data();
      }));
      setAuthors(profiles);
      setLoading(false);
    }
    load();
  }, []);

  async function handleUnpublish(ideaId) {
    const idea = ideas.find(i => i.id === ideaId);
    await updateDoc(doc(db, 'ideas', ideaId), { status: 'pending_review' });
    setIdeas(prev => prev.filter(i => i.id !== ideaId));
    showToast(`"${idea?.ideaTitle || 'Idea'}" moved back to pending`, 'info');
  }

  if (loading) return <LoadingSpinner />;
  if (ideas.length === 0) return <EmptyState icon="📌" title="Nothing published yet" />;

  return <IdeaTable ideas={ideas} authors={authors} onAction={handleUnpublish} actionLabel="Unpublish" actionColor="#c4963a" />;
}

// ─────────────────────────────────────────────
//  Rejected Tab
// ─────────────────────────────────────────────

function RejectedTab({ showToast }) {
  const [ideas, setIdeas]     = useState([]);
  const [authors, setAuthors] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const snap = await getDocs(
        query(collection(db, 'ideas'),
          where('status', '==', 'rejected'),
          orderBy('submittedAt', 'desc'),
          limit(50))
      );
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setIdeas(list);
      const uids = [...new Set(list.map(i => i.authorUid).filter(Boolean))];
      const profiles = {};
      await Promise.all(uids.map(async uid => {
        const s = await getDoc(doc(db, 'users', uid));
        if (s.exists()) profiles[uid] = s.data();
      }));
      setAuthors(profiles);
      setLoading(false);
    }
    load();
  }, []);

  async function handleReconsider(ideaId) {
    const idea = ideas.find(i => i.id === ideaId);
    await updateDoc(doc(db, 'ideas', ideaId), { status: 'pending_review', rejectionReason: null });
    setIdeas(prev => prev.filter(i => i.id !== ideaId));
    showToast(`"${idea?.ideaTitle || 'Idea'}" moved to pending review`, 'info');
  }

  if (loading) return <LoadingSpinner />;
  if (ideas.length === 0) return <EmptyState icon="✓" title="No rejected ideas" />;

  return (
    <IdeaTable
      ideas={ideas}
      authors={authors}
      onAction={handleReconsider}
      actionLabel="Reconsider"
      actionColor="#2c8a4e"
      showRejectionReason
    />
  );
}

// ─────────────────────────────────────────────
//  IdeaTable (shared by Published + Rejected)
// ─────────────────────────────────────────────

function IdeaTable({ ideas, authors, onAction, actionLabel, actionColor, showRejectionReason }) {
  const TH = ({ children, center }) => (
    <th style={{
      padding: '10px 16px', textAlign: center ? 'center' : 'left',
      fontFamily: "'DM Mono', monospace",
      fontSize: 9, fontWeight: 700, color: '#c4a882',
      letterSpacing: '0.14em', textTransform: 'uppercase',
      background: '#fdf6e8',
    }}>
      {children}
    </th>
  );

  return (
    <div style={{ overflowX: 'auto', borderRadius: 16, border: '1px solid rgba(44,31,14,0.08)', background: '#fff' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <TH>Startup</TH>
            <TH>Founder</TH>
            <TH>Date</TH>
            <TH center>Views</TH>
            <TH center>Ratings</TH>
            <TH center>Want in</TH>
            {showRejectionReason && <TH>Feedback sent</TH>}
            <TH>Action</TH>
          </tr>
        </thead>
        <tbody>
          {ideas.map(idea => (
            <IdeaTableRow
              key={idea.id}
              idea={idea}
              author={authors[idea.authorUid]}
              onAction={onAction}
              actionLabel={actionLabel}
              actionColor={actionColor}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Comments Tab
// ─────────────────────────────────────────────

function CommentsTab({ showToast }) {
  const [comments, setComments]   = useState([]);
  const [authors, setAuthors]     = useState({});
  const [ideaTitles, setIdeas]    = useState({});
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(new Set());

  useEffect(() => {
    async function load() {
      const snap = await getDocs(
        query(collection(db, 'comments'),
          where('status', '==', 'pending'),
          orderBy('createdAt', 'asc'))
      );
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setComments(list);

      // Batch-fetch authors + idea titles
      const uids   = [...new Set(list.map(c => c.authorUid).filter(Boolean))];
      const ideaIds = [...new Set(list.map(c => c.ideaId).filter(Boolean))];

      const [profiles, titles] = await Promise.all([
        Promise.all(uids.map(async uid => {
          const s = await getDoc(doc(db, 'users', uid));
          return [uid, s.exists() ? s.data() : null];
        })),
        Promise.all(ideaIds.map(async id => {
          const s = await getDoc(doc(db, 'ideas', id));
          return [id, s.exists() ? (s.data().ideaTitle || 'Untitled') : 'Unknown idea'];
        })),
      ]);

      setAuthors(Object.fromEntries(profiles));
      setIdeas(Object.fromEntries(titles));
      setLoading(false);
    }
    load();
  }, []);

  async function handleApprove(commentId) {
    await updateDoc(doc(db, 'comments', commentId), { status: 'approved' });
    setComments(prev => prev.filter(c => c.id !== commentId));
    setSelected(prev => { const s = new Set(prev); s.delete(commentId); return s; });
    showToast('Comment approved', 'success');
  }

  async function handleReject(commentId) {
    await updateDoc(doc(db, 'comments', commentId), { status: 'rejected' });
    setComments(prev => prev.filter(c => c.id !== commentId));
    setSelected(prev => { const s = new Set(prev); s.delete(commentId); return s; });
    showToast('Comment rejected', 'info');
  }

  async function handleApproveSelected() {
    await Promise.all([...selected].map(id =>
      updateDoc(doc(db, 'comments', id), { status: 'approved' })
    ));
    setComments(prev => prev.filter(c => !selected.has(c.id)));
    const count = selected.size;
    setSelected(new Set());
    showToast(`${count} comment${count > 1 ? 's' : ''} approved`, 'success');
  }

  if (loading) return <LoadingSpinner />;
  if (comments.length === 0) return <EmptyState icon="💬" title="No pending comments" />;

  return (
    <div>
      {selected.size > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 16px', borderRadius: 12,
          background: 'rgba(44,138,78,0.08)',
          border: '1px solid rgba(44,138,78,0.2)',
          marginBottom: 16,
        }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#1a5c33' }}>
            {selected.size} selected
          </span>
          <button
            onClick={handleApproveSelected}
            style={{
              background: '#2c8a4e', color: '#fff', border: 'none', borderRadius: 8,
              padding: '7px 16px', cursor: 'pointer',
              fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 700,
            }}
          >
            Approve selected
          </button>
        </div>
      )}

      {comments.map(comment => {
        const isChecked = selected.has(comment.id);
        return (
          <div key={comment.id} style={{
            background: '#fff', borderRadius: 14,
            border: '1px solid rgba(44,31,14,0.08)',
            padding: '18px 20px', marginBottom: 12,
            display: 'flex', gap: 14, alignItems: 'flex-start',
          }}>
            {/* Checkbox */}
            <div
              onClick={() => setSelected(prev => {
                const s = new Set(prev);
                isChecked ? s.delete(comment.id) : s.add(comment.id);
                return s;
              })}
              style={{
                width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 2,
                border: isChecked ? '2px solid #2c8a4e' : '2px solid #e8dcc8',
                background: isChecked ? '#2c8a4e' : '#fff',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {isChecked && <span style={{ color: '#fff', fontSize: 11, fontWeight: 900 }}>✓</span>}
            </div>

            <div style={{ flex: 1 }}>
              {/* Idea link */}
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9, color: '#c4a882', marginBottom: 6,
              }}>
                On: <a
                  href={comment.ideaId ? `/founder-space/ideas/${comment.ideaId}` : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#c4963a', textDecoration: 'none' }}
                >
                  {ideaTitles[comment.ideaId] || comment.ideaId || '—'}
                </a>
              </div>

              {/* Body */}
              <div style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 13, color: '#2c1f0e', lineHeight: 1.6,
                marginBottom: 10,
              }}>
                {comment.body}
              </div>

              {/* Author + date */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Avatar profile={authors[comment.authorUid]} size={22} />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#7a5c3a' }}>
                  {authors[comment.authorUid]?.name || 'Unknown'} · {authors[comment.authorUid]?.role || ''}
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleApprove(comment.id)}
                  style={{
                    background: '#2c8a4e', color: '#fff', border: 'none', borderRadius: 8,
                    padding: '7px 16px', cursor: 'pointer',
                    fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 700,
                  }}
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(comment.id)}
                  style={{
                    background: 'transparent', color: '#e8391e',
                    border: '1px solid rgba(232,57,30,0.4)', borderRadius: 8,
                    padding: '7px 16px', cursor: 'pointer',
                    fontFamily: "'DM Mono', monospace", fontSize: 10,
                  }}
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Users Tab
// ─────────────────────────────────────────────

function UsersTab({ showToast }) {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [ideaCounts, setIdeaCounts] = useState({});

  useEffect(() => {
    async function load() {
      const snap = await getDocs(
        query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(100))
      );
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(list);

      // Fetch published idea counts per user
      const publishedSnap = await getDocs(
        query(collection(db, 'ideas'), where('status', '==', 'published'))
      );
      const counts = {};
      publishedSnap.docs.forEach(d => {
        const uid = d.data().authorUid;
        if (uid) counts[uid] = (counts[uid] || 0) + 1;
      });
      setIdeaCounts(counts);
      setLoading(false);
    }
    load();
  }, []);

  async function toggleAdmin(user) {
    // NOTE: In production, use a Cloud Function with Admin SDK to set custom claims.
    // This client-side approach only sets the isAdmin field in Firestore.
    const newVal = !user.isAdmin;
    await updateDoc(doc(db, 'users', user.id), { isAdmin: newVal });
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isAdmin: newVal } : u));
    showToast(
      `${user.name} ${newVal ? 'is now an admin' : 'admin access removed'}`,
      newVal ? 'success' : 'info'
    );
  }

  const filtered = users.filter(u =>
    !search || (u.name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {/* Search */}
      <input
        type="text"
        placeholder="Search by name…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%', maxWidth: 320,
          padding: '10px 14px', borderRadius: 10,
          border: '1px solid rgba(44,31,14,0.12)',
          fontFamily: "'DM Mono', monospace", fontSize: 11,
          background: '#fff', color: '#2c1f0e', outline: 'none',
          marginBottom: 16, boxSizing: 'border-box',
        }}
      />

      <div style={{ overflowX: 'auto', borderRadius: 16, border: '1px solid rgba(44,31,14,0.08)', background: '#fff' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['User', 'Title', 'Role', 'Ideas published', 'Joined', 'Admin'].map(h => (
                <th key={h} style={{
                  padding: '10px 16px', textAlign: 'left',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 9, fontWeight: 700, color: '#c4a882',
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  background: '#fdf6e8',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid rgba(44,31,14,0.06)' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar profile={user} size={28} />
                    <div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 700, color: '#2c1f0e' }}>
                        {user.name || '—'}
                      </div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#c4a882' }}>
                        {user.email || ''}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 16px', fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#7a5c3a' }}>
                  {user.title || '—'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {user.role && (
                    <span style={{
                      fontFamily: "'DM Mono', monospace", fontSize: 9,
                      background: 'rgba(44,31,14,0.07)', color: '#7a5c3a',
                      padding: '2px 8px', borderRadius: 12,
                    }}>
                      {user.role}
                    </span>
                  )}
                </td>
                <td style={{ padding: '12px 16px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#2c1f0e', textAlign: 'center' }}>
                  {ideaCounts[user.id] || 0}
                </td>
                <td style={{ padding: '12px 16px', fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#c4a882' }}>
                  {tsToStr(user.createdAt)}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <button
                    onClick={() => toggleAdmin(user)}
                    style={{
                      background: user.isAdmin ? 'rgba(232,57,30,0.1)' : 'rgba(44,138,78,0.1)',
                      color: user.isAdmin ? '#e8391e' : '#2c8a4e',
                      border: `1px solid ${user.isAdmin ? 'rgba(232,57,30,0.3)' : 'rgba(44,138,78,0.3)'}`,
                      borderRadius: 8,
                      padding: '6px 14px', cursor: 'pointer',
                      fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 700,
                    }}
                  >
                    {user.isAdmin ? 'Remove admin' : 'Make admin'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Shared loading / empty states
// ─────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        border: '3px solid #e8dcc8',
        borderTopColor: '#c4963a',
        animation: 'spin 0.9s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function EmptyState({ icon, title, sub }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>{icon}</div>
      <div style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 20, fontWeight: 700, color: '#2c1f0e', marginBottom: 8,
      }}>
        {title}
      </div>
      {sub && (
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#c4a882' }}>
          {sub}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Main AdminPage
// ─────────────────────────────────────────────

export default function AdminPage() {
  const { user, userProfile, loading } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('pending');
  const [counts, setCounts]       = useState({
    pending: 0, published: 0, rejected: 0, comments: 0, users: 0,
  });

  // Auth guard
  useEffect(() => {
    if (loading) return;
    if (!user || !userProfile?.isAdmin) {
      navigate('/founder-space', { replace: true });
    }
  }, [user, userProfile, loading, navigate]);

  // Load counts for sidebar badges
  useEffect(() => {
    if (!userProfile?.isAdmin) return;
    async function loadCounts() {
      const [pending, published, rejected, comments, users] = await Promise.all([
        getDocs(query(collection(db, 'ideas'), where('status', '==', 'pending_review'))),
        getDocs(query(collection(db, 'ideas'), where('status', '==', 'published'))),
        getDocs(query(collection(db, 'ideas'), where('status', '==', 'rejected'))),
        getDocs(query(collection(db, 'comments'), where('status', '==', 'pending'))),
        getDocs(collection(db, 'users')),
      ]);
      setCounts({
        pending:   pending.size,
        published: published.size,
        rejected:  rejected.size,
        comments:  comments.size,
        users:     users.size,
      });
    }
    loadCounts();
  }, [userProfile]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#fdf6e8' }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!user || !userProfile?.isAdmin) return null;

  const TAB_LABELS = {
    pending:   'Pending Review',
    published: 'Published Ideas',
    rejected:  'Rejected Ideas',
    comments:  'Comment Moderation',
    users:     'Users',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#fdf6e8' }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} counts={counts} />

      {/* Main content */}
      <div style={{ marginLeft: 220, flex: 1, padding: '40px 40px 80px' }}>
        {/* Stats header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16, marginBottom: 40,
        }}>
          <StatCard label="Pending review"    value={counts.pending}   color="#c4963a" />
          <StatCard label="Published"         value={counts.published} color="#2c8a4e" />
          <StatCard label="Total users"       value={counts.users}     color="#1a6bb5" />
          <StatCard label="Comments pending"  value={counts.comments}  color={counts.comments > 0 ? '#e8391e' : '#2c1f0e'} />
        </div>

        {/* Tab heading */}
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 24, fontWeight: 900, color: '#2c1f0e',
          marginBottom: 24, marginTop: 0,
        }}>
          {TAB_LABELS[activeTab]}
        </h2>

        {/* Tab content */}
        {activeTab === 'pending'   && <PendingTab   showToast={showToast} />}
        {activeTab === 'published' && <PublishedTab  showToast={showToast} />}
        {activeTab === 'rejected'  && <RejectedTab   showToast={showToast} />}
        {activeTab === 'comments'  && <CommentsTab   showToast={showToast} />}
        {activeTab === 'users'     && <UsersTab      showToast={showToast} />}
      </div>
    </div>
  );
}
