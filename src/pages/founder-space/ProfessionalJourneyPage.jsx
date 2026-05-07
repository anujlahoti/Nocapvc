/**
 * Professional Journey — Public Detail Page  (dark orbital theme)
 * Route: /founder-space/journey/:journeyId
 */

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../lib/auth';
import { useToast } from '../../components/Toast';

// ─────────────────────────────────────────────
//  Node config
// ─────────────────────────────────────────────

const NODE_CONFIG = [
  { key: 'origin',    number: 1, label: 'The Origin', tackColor: '#8b5cf6', rotation: -1.5 },
  { key: 'expertise', number: 2, label: 'The Craft',  tackColor: '#0d9488', rotation: 1    },
  { key: 'impact',    number: 3, label: 'The Proof',  tackColor: '#f59e0b', rotation: -0.8 },
  { key: 'now',       number: 4, label: 'The Now',    tackColor: '#3b82f6', rotation: 1.2  },
  { key: 'next',      number: 5, label: 'The Seek',   tackColor: '#ec4899', rotation: -0.6 },
];

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

function tsToDate(ts) {
  if (!ts) return null;
  if (ts.toDate)  return ts.toDate();
  if (ts.seconds) return new Date(ts.seconds * 1000);
  return new Date(ts);
}

function fullDate(ts) {
  const d = tsToDate(ts);
  if (!d) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function Avatar({ profile, size = 40 }) {
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
//  Share button
// ─────────────────────────────────────────────

function ShareButton({ url, headline }) {
  const { showToast } = useToast();

  async function handleShare() {
    if (navigator.share) {
      try { await navigator.share({ title: headline, url }); return; } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast('Link copied!', 'success');
    } catch {
      showToast('Could not copy link.', 'error');
    }
  }

  return (
    <button
      onClick={handleShare}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '7px 16px', borderRadius: 7,
        border: '1px solid rgba(255,255,255,0.12)',
        background: 'transparent', color: 'rgba(232,232,240,0.6)',
        fontFamily: "'DM Mono', monospace",
        fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
        cursor: 'pointer', transition: 'all 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'; e.currentTarget.style.color = '#8b5cf6'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(232,232,240,0.6)'; }}
    >
      ↗ Share
    </button>
  );
}

// ─────────────────────────────────────────────
//  Dark polaroid node card
// ─────────────────────────────────────────────

function JourneyNodeCard({ node, journey }) {
  const title = journey[`${node.key}Title`] || '';
  const body  = journey[`${node.key}Body`]  || '';
  const photo = journey[`${node.key}PhotoURL`] || '';

  if (!title && !body) return null;

  return (
    <div style={{
      background: '#1a1a2e',
      borderRadius: 6,
      padding: '16px 14px 32px',
      border: `1px solid ${node.tackColor}25`,
      boxShadow: `2px 3px 0 rgba(0,0,0,0.4), 0 0 20px ${node.tackColor}08`,
      transform: `rotate(${node.rotation}deg)`,
      position: 'relative',
      transition: 'transform 0.2s, box-shadow 0.2s',
      minWidth: 230, maxWidth: 255,
      flexShrink: 0,
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = 'rotate(0deg) translateY(-4px)';
      e.currentTarget.style.boxShadow = `4px 8px 0 rgba(0,0,0,0.5), 0 0 30px ${node.tackColor}20`;
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = `rotate(${node.rotation}deg)`;
      e.currentTarget.style.boxShadow = `2px 3px 0 rgba(0,0,0,0.4), 0 0 20px ${node.tackColor}08`;
    }}
    >
      {/* Tack */}
      <div style={{
        position: 'absolute', top: -6, left: '50%',
        transform: 'translateX(-50%)',
        width: 12, height: 12, borderRadius: '50%',
        background: node.tackColor,
        boxShadow: `0 2px 8px ${node.tackColor}80`,
      }} />

      {/* Node label */}
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 8, fontWeight: 700,
        letterSpacing: '0.2em', textTransform: 'uppercase',
        color: node.tackColor, marginBottom: 10,
        textAlign: 'center',
      }}>
        {String(node.number).padStart(2, '0')} · {node.label}
      </div>

      {photo && (
        <div style={{
          width: '100%', height: 120,
          borderRadius: 4, marginBottom: 10, overflow: 'hidden',
        }}>
          <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      <div style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 15, fontWeight: 800,
        color: '#e8e8f0', lineHeight: 1.25, marginBottom: 8,
        letterSpacing: '-0.01em',
      }}>
        {title}
      </div>

      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 11, color: 'rgba(232,232,240,0.45)', lineHeight: 1.6,
        display: '-webkit-box', WebkitLineClamp: 4,
        WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {body}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Loading skeleton
// ─────────────────────────────────────────────

function LoadingSkeleton() {
  const pulse = {
    background: 'rgba(255,255,255,0.05)', borderRadius: 4,
    animation: 'orb-jp-pulse 1.8s ease-in-out infinite',
  };
  return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh' }}>
      <nav style={{
        background: 'rgba(10,10,15,0.95)',
        borderBottom: '1px solid rgba(139,92,246,0.1)',
        padding: '14px 24px',
        display: 'flex', justifyContent: 'space-between',
      }}>
        <div style={{ ...pulse, height: 14, width: 120 }} />
        <div style={{ ...pulse, height: 14, width: 60 }} />
      </nav>
      <div style={{ maxWidth: 900, margin: '48px auto', padding: '0 24px' }}>
        <div style={{ ...pulse, height: 32, width: '55%', marginBottom: 14 }} />
        <div style={{ ...pulse, height: 16, width: '70%', marginBottom: 32 }} />
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{ ...pulse, width: 240, height: 280, borderRadius: 6 }} />
          ))}
        </div>
      </div>
      <style>{`@keyframes orb-jp-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Main
// ─────────────────────────────────────────────

export default function ProfessionalJourneyPage() {
  const { journeyId } = useParams();
  const { user }      = useAuth();

  const [journey,  setJourney]  = useState(null);
  const [author,   setAuthor]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'journeys', journeyId));
        if (!snap.exists()) { setNotFound(true); return; }
        const data = { id: snap.id, ...snap.data() };
        setJourney(data);
        updateDoc(doc(db, 'journeys', journeyId), { viewCount: increment(1) }).catch(() => {});
        if (data.authorUid) {
          const aSnap = await getDoc(doc(db, 'users', data.authorUid));
          if (aSnap.exists()) setAuthor({ uid: aSnap.id, ...aSnap.data() });
        }
      } catch (err) {
        console.error('Load journey error:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [journeyId]);

  useEffect(() => {
    if (journey?.headline) {
      document.title = `${journey.headline} — Trajectory | NoCap VC`;
    }
  }, [journey]);

  if (loading) return <LoadingSkeleton />;

  if (notFound || !journey) {
    return (
      <div style={{
        background: '#0a0a0f', minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 16, padding: '0 24px',
      }}>
        <div style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 28, fontWeight: 900, color: '#e8e8f0', letterSpacing: '-0.02em',
        }}>
          Trajectory not found.
        </div>
        <p style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 12, color: 'rgba(232,232,240,0.35)',
        }}>
          It may have been removed.
        </p>
        <Link to="/founder-space/journey/feed" style={{
          padding: '10px 24px', borderRadius: 8,
          background: '#8b5cf6', color: '#fff',
          fontFamily: "'DM Mono', monospace",
          fontSize: 11, fontWeight: 700, textDecoration: 'none',
        }}>
          Browse trajectories
        </Link>
      </div>
    );
  }

  const pageUrl    = window.location.href;
  const filledNodes = NODE_CONFIG.filter(n => journey[`${n.key}Title`] || journey[`${n.key}Body`]);

  return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh', paddingBottom: 80 }}>

      {/* ── Nav ─────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(10,10,15,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(139,92,246,0.1)',
        padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link to="/founder-space/journey/feed" style={{
          fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 800,
          color: '#e8e8f0', textDecoration: 'none', letterSpacing: '-0.02em',
          display: 'flex', alignItems: 'center', gap: 7,
        }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#8b5cf6', boxShadow: '0 0 8px #8b5cf680' }} />
          TRAJECTORY
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShareButton url={pageUrl} headline={journey.headline} />
          {user && (
            <Link
              to="/founder-space/journey/submit"
              style={{
                padding: '7px 16px', borderRadius: 7,
                background: '#8b5cf6', color: '#fff',
                fontFamily: "'DM Mono', monospace",
                fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
                textDecoration: 'none',
              }}
            >
              + Pin yours
            </Link>
          )}
        </div>
      </nav>

      {/* ── Hero ────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(139,92,246,0.06) 0%, transparent 100%)',
        padding: '44px 24px 36px',
        borderBottom: '1px solid rgba(139,92,246,0.07)',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {/* Author row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <Avatar
              profile={author || { name: journey.authorName, photoURL: journey.authorPhoto }}
              size={48}
            />
            <div>
              <div style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 16, fontWeight: 800, color: '#e8e8f0', letterSpacing: '-0.01em',
              }}>
                {author?.name || journey.authorName || 'Professional'}
              </div>
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9, color: 'rgba(232,232,240,0.3)',
                marginTop: 3, letterSpacing: '0.08em',
              }}>
                Published {fullDate(journey.publishedAt)}
                {journey.viewCount > 0 && ` · ${journey.viewCount} views`}
              </div>
            </div>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 'clamp(24px, 4vw, 42px)', fontWeight: 900,
            color: '#e8e8f0', letterSpacing: '-0.03em',
            margin: '0 0 14px', lineHeight: 1.05,
          }}>
            {journey.headline}
          </h1>

          {/* Tags */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {journey.industry && (
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9, fontWeight: 700,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                background: '#8b5cf6', color: '#fff',
                padding: '4px 10px', borderRadius: 20,
              }}>
                {journey.industry}
              </span>
            )}
            {journey.experience && (
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9, fontWeight: 600,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                background: 'rgba(255,255,255,0.06)', color: 'rgba(232,232,240,0.5)',
                padding: '4px 10px', borderRadius: 20,
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                {journey.experience}
              </span>
            )}
            {journey.location && (
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9, color: 'rgba(232,232,240,0.35)',
                padding: '4px 10px', borderRadius: 20,
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                {journey.location}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Dark cork board ──────────────────── */}
      <div style={{
        maxWidth: '100%', overflowX: 'auto',
        padding: '48px',
        background: '#0d0d1a',
        borderBottom: '1px solid rgba(139,92,246,0.08)',
        scrollbarWidth: 'none',
        backgroundImage: 'radial-gradient(rgba(139,92,246,0.04) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}>
        <div style={{
          display: 'flex', gap: 28,
          alignItems: 'center',
          minWidth: 'max-content',
          padding: '24px 0',
          justifyContent: 'center',
        }}>
          {NODE_CONFIG.map((node, i) => {
            const title = journey[`${node.key}Title`] || '';
            const body  = journey[`${node.key}Body`]  || '';
            if (!title && !body) return null;

            return (
              <React.Fragment key={node.key}>
                <JourneyNodeCard node={node} journey={journey} />
                {i < NODE_CONFIG.length - 1 && filledNodes.indexOf(node) < filledNodes.length - 1 && (
                  <div style={{
                    width: 36, height: 1.5, flexShrink: 0,
                    background: `repeating-linear-gradient(90deg, ${node.tackColor}60 0px, ${node.tackColor}60 4px, transparent 4px, transparent 10px)`,
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── Detailed sections ────────────────── */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '52px 24px' }}>
        {NODE_CONFIG.map((node, idx) => {
          const title = journey[`${node.key}Title`] || '';
          const body  = journey[`${node.key}Body`]  || '';
          const photo = journey[`${node.key}PhotoURL`] || '';
          if (!title && !body) return null;

          return (
            <div key={node.key} style={{
              marginBottom: 52, paddingBottom: 52,
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: node.tackColor,
                  boxShadow: `0 0 10px ${node.tackColor}70`,
                  flexShrink: 0,
                }} />
                <div style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 9,
                  fontWeight: 700, letterSpacing: '0.2em',
                  textTransform: 'uppercase', color: node.tackColor,
                }}>
                  {String(node.number).padStart(2, '0')} · {node.label}
                </div>
              </div>

              {photo && (
                <div style={{
                  width: '100%', maxHeight: 260, borderRadius: 10,
                  overflow: 'hidden', marginBottom: 18,
                  border: '1px solid rgba(255,255,255,0.07)',
                }}>
                  <img src={photo} alt="" style={{ width: '100%', objectFit: 'cover' }} />
                </div>
              )}

              <h2 style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 900,
                color: '#e8e8f0', letterSpacing: '-0.02em',
                margin: '0 0 14px', lineHeight: 1.15,
              }}>
                {title}
              </h2>

              <p style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 14, color: 'rgba(232,232,240,0.6)',
                lineHeight: 1.8, margin: 0,
                whiteSpace: 'pre-line',
              }}>
                {body}
              </p>
            </div>
          );
        })}

        {/* CTA */}
        <div style={{
          textAlign: 'center', padding: '32px 0',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 22, fontWeight: 900,
            color: '#e8e8f0', marginBottom: 8, letterSpacing: '-0.02em',
          }}>
            Every career has a story worth telling.
          </div>
          <p style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 11, color: 'rgba(232,232,240,0.3)',
            marginBottom: 24, letterSpacing: '0.04em',
          }}>
            Pin yours in 5 minutes.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <ShareButton url={pageUrl} headline={journey.headline} />
            <Link
              to="/founder-space/journey/submit"
              style={{
                padding: '10px 24px', borderRadius: 8,
                background: '#8b5cf6', color: '#fff',
                fontFamily: "'DM Mono', monospace",
                fontSize: 11, fontWeight: 800, textDecoration: 'none',
              }}
            >
              Pin your journey →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
