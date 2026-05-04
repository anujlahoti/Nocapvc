/**
 * Professional Journey — Public Detail Page
 * Route: /founder-space/journey/:journeyId
 */

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  doc, getDoc, updateDoc, increment,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../lib/auth';
import { useToast } from '../../components/Toast';
import './FounderSpace.css';

// ─────────────────────────────────────────────
//  Node config
// ─────────────────────────────────────────────

const NODE_CONFIG = [
  { key: 'origin',    number: 1, label: 'The Origin',  tackColor: '#7c3aed', rotation: -1.5 },
  { key: 'expertise', number: 2, label: 'The Craft',   tackColor: '#0d9488', rotation: 1    },
  { key: 'impact',    number: 3, label: 'The Proof',   tackColor: '#d97706', rotation: -0.8 },
  { key: 'now',       number: 4, label: 'The Now',     tackColor: '#2563eb', rotation: 1.2  },
  { key: 'next',      number: 5, label: 'The Seek',    tackColor: '#db2777', rotation: -0.6 },
];

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

function tsToDate(ts) {
  if (!ts) return null;
  if (ts.toDate)   return ts.toDate();
  if (ts.seconds)  return new Date(ts.seconds * 1000);
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
//  Share button
// ─────────────────────────────────────────────

function ShareButton({ url, headline }) {
  const { showToast } = useToast();

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: headline, url });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast('Link copied to clipboard!', 'success');
    } catch {
      showToast('Could not copy link.', 'error');
    }
  }

  return (
    <button
      onClick={handleShare}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '8px 16px', borderRadius: 8,
        border: '1.5px solid rgba(44,31,14,0.15)',
        background: '#fff', color: '#7a5c3a',
        fontFamily: "'DM Mono', monospace",
        fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
        cursor: 'pointer', transition: 'all 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.color = '#7c3aed'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(44,31,14,0.15)'; e.currentTarget.style.color = '#7a5c3a'; }}
    >
      ↗ Share
    </button>
  );
}

// ─────────────────────────────────────────────
//  Polaroid node card (large)
// ─────────────────────────────────────────────

function JourneyNodeCard({ node, journey, compact }) {
  const title = journey[`${node.key}Title`] || '';
  const body  = journey[`${node.key}Body`]  || '';
  const photo = journey[`${node.key}PhotoURL`] || '';

  if (!title && !body) return null;

  return (
    <div style={{
      background: '#fff',
      borderRadius: 8,
      padding: compact ? '14px 14px 28px' : '16px 16px 36px',
      border: '1px solid #e8dcc8',
      boxShadow: '2px 3px 0 #d4c4b0',
      transform: `rotate(${node.rotation}deg)`,
      position: 'relative',
      transition: 'transform 0.2s, box-shadow 0.2s',
      minWidth: compact ? 200 : 240,
      maxWidth: compact ? 220 : 260,
      flexShrink: 0,
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = `rotate(0deg) translateY(-4px)`;
      e.currentTarget.style.boxShadow = '4px 8px 0 #c4b4a0';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = `rotate(${node.rotation}deg)`;
      e.currentTarget.style.boxShadow = '2px 3px 0 #d4c4b0';
    }}
    >
      {/* Tack */}
      <div style={{
        position: 'absolute', top: -6, left: '50%',
        transform: 'translateX(-50%)',
        width: 12, height: 12, borderRadius: '50%',
        background: node.tackColor,
        boxShadow: `0 2px 6px ${node.tackColor}99`,
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

      {/* Photo */}
      {photo && (
        <div style={{
          width: '100%', height: compact ? 100 : 130,
          borderRadius: 4, marginBottom: 10, overflow: 'hidden',
        }}>
          <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      {/* Title */}
      <div style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: compact ? 14 : 16, fontWeight: 700,
        color: '#2c1f0e', lineHeight: 1.25, marginBottom: 8,
      }}>
        {title}
      </div>

      {/* Body */}
      <div style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: compact ? 11 : 12,
        color: '#7a5c3a', lineHeight: 1.6,
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
    background: '#e8dcc8', borderRadius: 4,
    animation: 'fs-skeleton 1.8s ease-in-out infinite',
  };
  return (
    <div style={{ maxWidth: 900, margin: '48px auto', padding: '0 24px' }}>
      <div style={{ ...pulse, height: 32, width: '50%', marginBottom: 16 }} />
      <div style={{ ...pulse, height: 16, width: '70%', marginBottom: 32 }} />
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{ ...pulse, width: 240, height: 300, borderRadius: 8 }} />
        ))}
      </div>
      <style>{`@keyframes fs-skeleton { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Main
// ─────────────────────────────────────────────

export default function ProfessionalJourneyPage() {
  const { journeyId }         = useParams();
  const { user } = useAuth();

  const [journey, setJourney] = useState(null);
  const [author,  setAuthor]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'journeys', journeyId));
        if (!snap.exists()) { setNotFound(true); return; }
        const data = { id: snap.id, ...snap.data() };
        setJourney(data);

        // View count
        updateDoc(doc(db, 'journeys', journeyId), { viewCount: increment(1) }).catch(() => {});

        // Author
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

  // Set page title
  useEffect(() => {
    if (journey?.headline) {
      document.title = `${journey.headline} — Professional Journey | NoCap VC`;
    }
  }, [journey]);

  if (loading) return <LoadingSkeleton />;

  if (notFound || !journey) {
    return (
      <div className="fs-page" style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', gap: 16, padding: '0 24px',
      }}>
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 32, fontWeight: 900, color: '#2c1f0e',
        }}>
          Journey not found.
        </div>
        <p style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 14, color: '#7a5c3a', textAlign: 'center',
        }}>
          It may have been removed.
        </p>
        <Link to="/founder-space/journey/feed" style={{
          padding: '10px 24px', borderRadius: 8,
          background: '#7c3aed', color: '#fff',
          fontFamily: "'DM Mono', monospace",
          fontSize: 11, fontWeight: 700, textDecoration: 'none',
        }}>
          Browse journeys
        </Link>
      </div>
    );
  }

  const pageUrl = window.location.href;

  return (
    <div className="fs-page" style={{ paddingBottom: 80 }}>

      {/* Nav */}
      <nav className="fs-nav">
        <Link to="/founder-space/journey/feed" className="fs-nav-logo">
          <span className="fs-nav-dot" style={{ background: '#7c3aed' }} />
          Professional Journey
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShareButton url={pageUrl} headline={journey.headline} />
          {user && (
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
              + Pin yours
            </Link>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(124,58,237,0.06) 0%, transparent 100%)',
        padding: '48px 24px 40px',
        borderBottom: '1px solid rgba(44,31,14,0.06)',
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
                fontFamily: "'Playfair Display', serif",
                fontSize: 18, fontWeight: 700, color: '#2c1f0e',
              }}>
                {author?.name || journey.authorName || 'Professional'}
              </div>
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9, color: '#7a5c3a',
                marginTop: 2, letterSpacing: '0.08em',
              }}>
                Published {fullDate(journey.publishedAt)}
                {journey.viewCount > 0 && ` · ${journey.viewCount} views`}
              </div>
            </div>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900,
            color: '#2c1f0e', letterSpacing: '-0.02em',
            margin: '0 0 12px', lineHeight: 1.1,
          }}>
            {journey.headline}
          </h1>

          {/* Meta tags */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {journey.industry && (
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9, fontWeight: 700,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                background: '#7c3aed', color: '#fff',
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
                background: 'rgba(44,31,14,0.07)', color: '#7a5c3a',
                padding: '4px 10px', borderRadius: 20,
              }}>
                {journey.experience}
              </span>
            )}
            {journey.location && (
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9, color: '#c4a882',
                padding: '4px 10px', borderRadius: 20,
                border: '1px solid #e8dcc8',
              }}>
                {journey.location}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Cork board */}
      <div style={{
        maxWidth: '100%',
        overflowX: 'auto',
        padding: '48px 48px',
        background: '#f5ece0',
        borderBottom: '1px solid rgba(44,31,14,0.1)',
        scrollbarWidth: 'none',
      }}>
        <div style={{
          display: 'flex',
          gap: 32,
          alignItems: 'center',
          minWidth: 'max-content',
          padding: '20px 0',
          justifyContent: 'center',
        }}>
          {NODE_CONFIG.map((node, i) => {
            const title = journey[`${node.key}Title`] || '';
            const body  = journey[`${node.key}Body`]  || '';
            if (!title && !body) return null;

            return (
              <React.Fragment key={node.key}>
                <JourneyNodeCard node={node} journey={journey} />
                {i < NODE_CONFIG.length - 1 && (
                  <div style={{
                    width: 40, height: 1.5, flexShrink: 0,
                    background: `repeating-linear-gradient(90deg, ${node.tackColor} 0px, ${node.tackColor} 4px, transparent 4px, transparent 10px)`,
                    opacity: 0.4,
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Detailed node sections */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px' }}>
        {NODE_CONFIG.map(node => {
          const title = journey[`${node.key}Title`] || '';
          const body  = journey[`${node.key}Body`]  || '';
          const photo = journey[`${node.key}PhotoURL`] || '';
          if (!title && !body) return null;

          return (
            <div key={node.key} style={{
              marginBottom: 48, paddingBottom: 48,
              borderBottom: '1px solid rgba(44,31,14,0.07)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: node.tackColor,
                  boxShadow: `0 2px 6px ${node.tackColor}66`,
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
                  width: '100%', maxHeight: 240, borderRadius: 10,
                  overflow: 'hidden', marginBottom: 16,
                }}>
                  <img src={photo} alt="" style={{ width: '100%', objectFit: 'cover' }} />
                </div>
              )}

              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 900,
                color: '#2c1f0e', letterSpacing: '-0.01em',
                margin: '0 0 14px', lineHeight: 1.2,
              }}>
                {title}
              </h2>

              <p style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 16, color: '#5a3e28',
                lineHeight: 1.75, margin: 0,
                whiteSpace: 'pre-line',
              }}>
                {body}
              </p>
            </div>
          );
        })}

        {/* Share + CTA */}
        <div style={{
          textAlign: 'center',
          padding: '32px 0',
        }}>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 22, fontWeight: 900,
            color: '#2c1f0e', marginBottom: 8,
          }}>
            Every career has a story worth telling.
          </div>
          <p style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 14, color: '#7a5c3a',
            fontStyle: 'italic', marginBottom: 20,
          }}>
            Pin yours in 5 minutes.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <ShareButton url={pageUrl} headline={journey.headline} />
            <Link
              to="/founder-space/journey/submit"
              style={{
                padding: '10px 20px', borderRadius: 8,
                background: '#7c3aed', color: '#fff',
                fontFamily: "'DM Mono', monospace",
                fontSize: 11, fontWeight: 700, textDecoration: 'none',
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
