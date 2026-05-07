/**
 * Founder Space — Public Profile Page  (dark orbital theme)
 * Route: /founder-space/profile/:uid
 */

import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  doc, getDoc,
  collection, query, where, orderBy, getDocs,
} from 'firebase/firestore';
import { db } from '../../firebase';

// ── Helpers ───────────────────────────────────

function setMetaOG(property, content) {
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function formatDateShort(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ── Stage / Role meta ─────────────────────────

const STAGE_META = {
  idea:    { color: '#f5c842', bg: 'rgba(245,200,66,0.12)',  border: 'rgba(245,200,66,0.35)',  dot: '#f5c842', label: 'Idea Stage'  },
  mvp:     { color: '#ff6b35', bg: 'rgba(255,107,53,0.12)',  border: 'rgba(255,107,53,0.35)',  dot: '#ff6b35', label: 'MVP Built'   },
  live:    { color: '#4ade80', bg: 'rgba(74,222,128,0.12)',  border: 'rgba(74,222,128,0.35)',  dot: '#4ade80', label: 'Live'        },
  scaling: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',  border: 'rgba(139,92,246,0.35)',  dot: '#8b5cf6', label: 'Scaling'     },
};

const ROLE_META = {
  founder:    { color: '#f5c842', label: 'Founder'    },
  investor:   { color: '#4ade80', label: 'Investor'   },
  talent:     { color: '#60a5fa', label: 'Talent'     },
  enthusiast: { color: '#c084fc', label: 'Enthusiast' },
};

const LOOKING_FOR_LABELS = {
  cofounder:  'Co-founder',
  cto:        'CTO',
  designer:   'Designer',
  developer:  'Developer',
  funding:    'Funding',
  betausers:  'Beta users',
  mentor:     'Mentor',
  advisor:    'Advisor',
};

const CATEGORY_LABELS = {
  fintech: 'Fintech', edtech: 'Edtech', healthtech: 'Healthtech',
  saas: 'SaaS', ecommerce: 'E-Commerce', deeptech: 'Deeptech', other: 'Other',
};

const TAG_COLORS = {
  Launched:  '#4ade80', Funding: '#f5c842', Milestone: '#60a5fa',
  Marketing: '#c084fc', Pivot:   '#f87171', Other:     '#94a3b8',
};

// ── Icons ─────────────────────────────────────

function LinkedInIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

// ── Avatar ────────────────────────────────────

function Avatar({ profile, size = 88 }) {
  const initials = (profile.name || 'F')
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  if (profile.photoURL) {
    return (
      <img
        src={profile.photoURL}
        alt={profile.name}
        style={{
          width: size, height: size, borderRadius: '50%',
          objectFit: 'cover', flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #f5c842 0%, #ff6b35 100%)',
      color: '#0a0a0f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.32,
      fontFamily: "'Syne', sans-serif",
      fontWeight: 800, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// ── Stat pill ─────────────────────────────────

function StatPill({ num, label, color = '#e8e8f0' }) {
  return (
    <div style={{ textAlign: 'center', padding: '0 24px' }}>
      <div style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 28, fontWeight: 900,
        color, lineHeight: 1,
        marginBottom: 4,
      }}>
        {num}
      </div>
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 8, letterSpacing: '0.16em',
        textTransform: 'uppercase', color: 'rgba(232,232,240,0.25)',
      }}>
        {label}
      </div>
    </div>
  );
}

// ── Dark Idea Card ────────────────────────────

function IdeaCard({ idea, index }) {
  const navigate = useNavigate();
  const tilt     = index % 2 === 0 ? -1 : 1;
  const cat      = CATEGORY_LABELS[idea.category] || 'Other';
  const avg      = idea.avgOverall ? idea.avgOverall.toFixed(1) : null;

  return (
    <div
      onClick={() => navigate(`/founder-space/ideas/${idea.id}`)}
      style={{
        background: '#1a1a2e',
        borderRadius: 6,
        padding: '16px 16px 32px',
        border: '1px solid rgba(245,200,66,0.1)',
        transform: `rotate(${tilt}deg)`,
        transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.2s',
        cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'rotate(0deg) scale(1.02)';
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(245,200,66,0.1)';
        e.currentTarget.style.borderColor = 'rgba(245,200,66,0.25)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = `rotate(${tilt}deg)`;
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)';
        e.currentTarget.style.borderColor = 'rgba(245,200,66,0.1)';
      }}
    >
      {/* Amber top accent */}
      <div style={{
        height: 2,
        background: 'linear-gradient(90deg, #f5c842, transparent)',
        marginBottom: 12, marginLeft: -16, marginRight: -16, marginTop: -16,
        borderRadius: '6px 6px 0 0',
        opacity: 0.6,
      }} />

      <div style={{ marginBottom: 8 }}>
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 8, letterSpacing: '0.18em',
          textTransform: 'uppercase',
          background: 'rgba(245,200,66,0.1)',
          color: '#f5c842',
          padding: '2px 8px', borderRadius: 4,
        }}>
          {cat}
        </span>
      </div>

      <div style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 18, fontWeight: 800,
        color: '#e8e8f0', lineHeight: 1.2,
        marginBottom: 6, letterSpacing: '-0.02em',
      }}>
        {idea.ideaTitle}
      </div>

      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 11, color: 'rgba(232,232,240,0.45)',
        lineHeight: 1.5, marginBottom: 12,
        display: '-webkit-box',
        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {idea.tagline}
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '10px 0' }} />

      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        fontFamily: "'DM Mono', monospace", fontSize: 10,
      }}>
        {avg && (
          <span style={{ color: '#f5c842', fontWeight: 700 }}>
            ★ {avg}
            <span style={{ color: 'rgba(232,232,240,0.25)', fontWeight: 400, marginLeft: 3 }}>
              ({idea.ratingCount || 0})
            </span>
          </span>
        )}
        <span style={{ color: 'rgba(232,232,240,0.3)' }}>
          {(idea.viewCount || 0).toLocaleString()} views
        </span>
        {(idea.wantToWorkCount || 0) > 0 && (
          <span style={{ color: '#4ade80', fontWeight: 600 }}>
            ↑ {idea.wantToWorkCount}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Journey timeline item ─────────────────────

function JourneyItem({ item, isLast }) {
  const dotColor = TAG_COLORS[item.tag] || TAG_COLORS.Other;
  return (
    <div style={{ display: 'flex', gap: 18, position: 'relative' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{
          width: 9, height: 9, borderRadius: '50%',
          background: dotColor, flexShrink: 0, marginTop: 5,
          boxShadow: `0 0 8px ${dotColor}50`,
        }} />
        {!isLast && (
          <div style={{
            width: 1.5, flex: 1,
            background: 'rgba(255,255,255,0.07)',
            minHeight: 28, marginTop: 4,
          }} />
        )}
      </div>

      <div style={{ paddingBottom: isLast ? 0 : 28, flex: 1 }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: 8, flexWrap: 'wrap', marginBottom: 6,
        }}>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 8, letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: dotColor,
            background: `${dotColor}15`,
            border: `1px solid ${dotColor}30`,
            padding: '2px 7px', borderRadius: 4,
          }}>
            {item.tag}
          </span>
          <Link
            to={`/founder-space/ideas/${item.ideaId}`}
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10, color: 'rgba(232,232,240,0.5)',
              fontWeight: 600, textDecoration: 'none',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#f5c842'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(232,232,240,0.5)'}
          >
            {item.ideaTitle}
          </Link>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 9, color: 'rgba(232,232,240,0.2)',
            marginLeft: 'auto',
          }}>
            {formatDateShort(item.createdAt)}
          </span>
        </div>

        <p style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 13, color: 'rgba(232,232,240,0.7)',
          lineHeight: 1.65, margin: 0,
        }}>
          {item.body}
        </p>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────

function Pulse({ w = '100%', h = 16, radius = 4 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: radius,
      background: 'rgba(255,255,255,0.05)',
      animation: 'orb-profile-pulse 1.6s ease-in-out infinite',
    }} />
  );
}

function NotFound() {
  return (
    <div style={{
      background: '#0a0a0f', minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: '48px 24px',
    }}>
      <div style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 72, fontWeight: 900,
        color: 'rgba(245,200,66,0.1)', lineHeight: 1, marginBottom: 16,
      }}>404</div>
      <h1 style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 28, fontWeight: 900,
        color: '#e8e8f0', margin: '0 0 10px', letterSpacing: '-0.02em',
      }}>
        Founder not found
      </h1>
      <p style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 12, color: 'rgba(232,232,240,0.35)',
        margin: '0 0 32px', lineHeight: 1.6,
      }}>
        This profile doesn't exist or has been removed.
      </p>
      <Link to="/founder-space/feed" style={{
        display: 'inline-block', padding: '10px 24px', borderRadius: 8,
        background: '#f5c842', color: '#0a0a0f',
        fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 800,
        textDecoration: 'none',
      }}>
        Explore ORB1T →
      </Link>
    </div>
  );
}

// ── Section heading ───────────────────────────

function SectionHeading({ label, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f5c842', boxShadow: '0 0 8px #f5c84260', flexShrink: 0 }} />
      <span style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 9, fontWeight: 700,
        letterSpacing: '0.22em', textTransform: 'uppercase',
        color: 'rgba(232,232,240,0.5)',
      }}>
        {label}
      </span>
      {count != null && (
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 9, color: 'rgba(232,232,240,0.2)',
        }}>
          {count}
        </span>
      )}
    </div>
  );
}

// ── Main Profile Page ─────────────────────────

export default function Profile() {
  const { uid } = useParams();
  const [profile,  setProfile]  = useState(null);
  const [ideas,    setIdeas]    = useState([]);
  const [journey,  setJourney]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  const totalRatings    = ideas.reduce((s, i) => s + (i.ratingCount    || 0), 0);
  const totalWantToWork = ideas.reduce((s, i) => s + (i.wantToWorkCount || 0), 0);

  useEffect(() => {
    if (!uid) return;

    async function load() {
      try {
        const userSnap = await getDoc(doc(db, 'users', uid));
        if (!userSnap.exists()) { setNotFound(true); setLoading(false); return; }
        const profileData = userSnap.data();
        setProfile(profileData);

        const ideasQ = query(
          collection(db, 'ideas'),
          where('authorUid', '==', uid),
          where('status', '==', 'published'),
          orderBy('publishedAt', 'desc')
        );
        const ideasSnap = await getDocs(ideasQ);
        const ideasData = ideasSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setIdeas(ideasData);

        const journeyItems = [];
        await Promise.all(
          ideasData.map(async idea => {
            const updatesQ = query(
              collection(db, 'ideas', idea.id, 'updates'),
              orderBy('createdAt', 'desc')
            );
            const updatesSnap = await getDocs(updatesQ);
            updatesSnap.docs.forEach(d => {
              journeyItems.push({ id: d.id, ideaTitle: idea.ideaTitle, ideaId: idea.id, ...d.data() });
            });
          })
        );
        journeyItems.sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() || 0;
          const tb = b.createdAt?.toMillis?.() || 0;
          return tb - ta;
        });
        setJourney(journeyItems);

        document.title = `${profileData.name} — ORB1T | NoCap VC`;
        setMetaOG('og:title',       `${profileData.name} on ORB1T | NoCap VC`);
        setMetaOG('og:description', `${profileData.whatImBuilding || profileData.title || ''}`.slice(0, 200));
        setMetaOG('og:image',       `/api/og/profile/${uid}`);
        setMetaOG('og:url',         window.location.href);

      } catch (err) {
        console.error('Profile load error:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => { document.title = 'NoCap VC | One Form, Opens Many Funding Doors'; };
  }, [uid]);

  if (loading) {
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
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '64px 48px' }}>
          <div style={{ display: 'flex', gap: 24, marginBottom: 40 }}>
            <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Pulse w="55%" h={26} />
              <Pulse w="38%" h={14} />
              <Pulse w="80%" h={14} />
            </div>
          </div>
          <Pulse h={180} radius={12} />
        </div>
        <style>{`@keyframes orb-profile-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      </div>
    );
  }

  if (notFound) return <NotFound />;

  const stageMeta  = profile.builderStage ? STAGE_META[profile.builderStage] : null;
  const roleMeta   = ROLE_META[profile.role] || ROLE_META.enthusiast;
  const lookingFor = profile.lookingFor || [];

  return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh' }}>

      {/* ── Nav ──────────────────────────────── */}
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
        <Link to="/" style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 10, letterSpacing: '0.14em',
          color: 'rgba(232,232,240,0.35)', textDecoration: 'none',
          textTransform: 'uppercase',
        }}>
          NoCap VC ↗
        </Link>
      </nav>

      {/* ── Profile Header ───────────────────── */}
      <div style={{
        borderBottom: '1px solid rgba(245,200,66,0.07)',
        background: 'linear-gradient(180deg, #0f0f1a 0%, #0a0a0f 100%)',
      }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '52px 48px 44px' }}>

          {/* Avatar + info row */}
          <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap' }}>

            {/* Amber ring avatar */}
            <div style={{
              padding: 2,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f5c842, #ff6b35, #f5c842)',
              flexShrink: 0,
            }}>
              <div style={{ padding: 2, borderRadius: '50%', background: '#0f0f1a' }}>
                <Avatar profile={profile} size={88} />
              </div>
            </div>

            {/* Name / meta / bio */}
            <div style={{ flex: 1, minWidth: 220 }}>

              {/* Stage badge */}
              {stageMeta && (
                <div style={{ marginBottom: 10 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: stageMeta.bg, color: stageMeta.color,
                    border: `1.5px solid ${stageMeta.border}`,
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 9, fontWeight: 700,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    padding: '4px 12px', borderRadius: 5,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: stageMeta.dot, display: 'inline-block', boxShadow: `0 0 6px ${stageMeta.dot}` }} />
                    {stageMeta.label}
                  </span>
                </div>
              )}

              {/* Name + role */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                <h1 style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 'clamp(22px, 3.5vw, 32px)',
                  fontWeight: 900, letterSpacing: '-0.03em',
                  color: '#e8e8f0', margin: 0, lineHeight: 1.1,
                }}>
                  {profile.name}
                </h1>
                <span style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 9, fontWeight: 700,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: roleMeta.color,
                  background: `${roleMeta.color}15`,
                  border: `1px solid ${roleMeta.color}30`,
                  padding: '3px 9px', borderRadius: 4,
                }}>
                  {roleMeta.label}
                </span>
              </div>

              {profile.title && (
                <div style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 12, color: 'rgba(232,232,240,0.45)',
                  marginBottom: 10, lineHeight: 1.4,
                }}>
                  {profile.title}
                </div>
              )}

              {profile.whatImBuilding && (
                <p style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 14, color: 'rgba(232,232,240,0.7)',
                  lineHeight: 1.7, margin: '0 0 16px',
                  maxWidth: 500,
                }}>
                  {profile.whatImBuilding}
                </p>
              )}

              {/* Social + contact */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {profile.linkedin && (
                  <a
                    href={profile.linkedin} target="_blank" rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.06)',
                      color: 'rgba(232,232,240,0.6)', textDecoration: 'none',
                      border: '1px solid rgba(255,255,255,0.1)',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,200,66,0.12)'; e.currentTarget.style.color = '#f5c842'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(232,232,240,0.6)'; }}
                  >
                    <LinkedInIcon />
                  </a>
                )}
                {profile.twitter && (
                  <a
                    href={profile.twitter} target="_blank" rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.06)',
                      color: 'rgba(232,232,240,0.6)', textDecoration: 'none',
                      border: '1px solid rgba(255,255,255,0.1)',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,200,66,0.12)'; e.currentTarget.style.color = '#f5c842'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(232,232,240,0.6)'; }}
                  >
                    <XIcon />
                  </a>
                )}
                {profile.contactEmail && (
                  <a
                    href={`mailto:${profile.contactEmail}`}
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 10, fontWeight: 600,
                      letterSpacing: '0.06em',
                      color: 'rgba(232,232,240,0.6)', textDecoration: 'none',
                      padding: '6px 14px',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 100,
                      transition: 'all 0.15s',
                      background: 'transparent',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,200,66,0.4)'; e.currentTarget.style.color = '#f5c842'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(232,232,240,0.6)'; }}
                  >
                    Contact →
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#13131f',
            border: '1px solid rgba(245,200,66,0.08)',
            borderRadius: 10,
            padding: '18px 0',
            width: 'fit-content',
          }}>
            <StatPill num={ideas.length}    label="Ideas published" color="#e8e8f0" />
            <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.07)' }} />
            <StatPill num={totalRatings}    label="Ratings received" color="#f5c842" />
            <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.07)' }} />
            <StatPill num={totalWantToWork} label="Want to work with" color="#4ade80" />
          </div>
        </div>
      </div>

      {/* ── Main content ─────────────────────── */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '52px 48px 80px' }}>

        {/* ── Looking For (Opportunities) ──── */}
        {lookingFor.length > 0 && (
          <section style={{ marginBottom: 56 }}>
            <SectionHeading label="Looking for" />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {lookingFor.map(id => (
                <span key={id} style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                  color: '#f5c842',
                  background: 'rgba(245,200,66,0.08)',
                  border: '1px solid rgba(245,200,66,0.2)',
                  padding: '6px 14px', borderRadius: 6,
                }}>
                  {LOOKING_FOR_LABELS[id] || id}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* ── Ideas grid ───────────────────── */}
        <section style={{ marginBottom: 64 }}>
          <SectionHeading
            label="Startup ideas"
            count={ideas.length > 0 ? `${ideas.length} published` : null}
          />

          {ideas.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 24,
            }}>
              {ideas.map((idea, i) => (
                <IdeaCard key={idea.id} idea={idea} index={i} />
              ))}
            </div>
          ) : (
            <div style={{
              background: '#13131f',
              border: '1px dashed rgba(255,255,255,0.08)',
              borderRadius: 10,
              padding: '36px 28px',
              textAlign: 'center',
            }}>
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11, color: 'rgba(232,232,240,0.2)',
                letterSpacing: '0.08em',
              }}>
                No published ideas yet.
              </div>
            </div>
          )}
        </section>

        {/* ── Journey timeline ──────────────── */}
        <section>
          <SectionHeading
            label="Founder journey"
            count={journey.length > 0 ? `${journey.length} update${journey.length !== 1 ? 's' : ''}` : null}
          />

          {journey.length === 0 ? (
            <div style={{
              background: '#13131f',
              border: '1px dashed rgba(255,255,255,0.08)',
              borderRadius: 10,
              padding: '36px 28px',
              textAlign: 'center',
            }}>
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11, color: 'rgba(232,232,240,0.2)',
                letterSpacing: '0.08em',
              }}>
                No journey updates yet.
              </div>
            </div>
          ) : (
            <div style={{ paddingLeft: 4 }}>
              {journey.map((item, i) => (
                <JourneyItem
                  key={item.id}
                  item={item}
                  isLast={i === journey.length - 1}
                />
              ))}
            </div>
          )}
        </section>

      </div>

      <style>{`
        @keyframes orb-profile-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        @media (max-width: 640px) {
          .orb-profile-header { padding: 32px 20px !important; }
        }
      `}</style>
    </div>
  );
}
