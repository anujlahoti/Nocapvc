/**
 * Founder Space — Public Profile Page
 * Route: /founder-space/profile/:uid
 *
 * Shows:
 *   1. Profile header (avatar, name, title, stats)
 *   2. Published idea cards (mini polaroid grid)
 *   3. Founder journey timeline (updates across all ideas)
 */

import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  doc, getDoc,
  collection, query, where, orderBy, getDocs,
} from 'firebase/firestore';
import { db } from '../../firebase';
import './FounderSpace.css';

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

// ── Icon components ───────────────────────────

function LinkedInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

// ── Role meta ─────────────────────────────────

const ROLE_STYLES = {
  founder:    { bg: '#fef3cd', color: '#92610a', label: 'Founder'    },
  investor:   { bg: '#d4edda', color: '#1a5c33', label: 'Investor'   },
  talent:     { bg: '#d1ecf1', color: '#0c5460', label: 'Talent'     },
  enthusiast: { bg: '#e8d5fb', color: '#5a2d82', label: 'Enthusiast' },
};

const CATEGORY_LABELS = {
  fintech: 'Fintech', edtech: 'Edtech', healthtech: 'Healthtech',
  saas: 'SaaS', ecommerce: 'E-Commerce', deeptech: 'Deeptech', other: 'Other',
};

// ── Avatar ────────────────────────────────────

function Avatar({ profile, size = 96 }) {
  const initials = (profile.name || 'F')
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  if (profile.photoURL) {
    return (
      <img
        src={profile.photoURL}
        alt={profile.name}
        style={{
          width: size, height: size, borderRadius: '50%',
          objectFit: 'cover',
          border: '3px solid rgba(44,31,14,0.1)',
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #c4963a 0%, #2c1f0e 100%)',
      color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.32,
      fontFamily: "'Playfair Display', serif",
      fontWeight: 700, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// ── Social icon button ────────────────────────

function SocialBtn({ href, title, children }) {
  return (
    <a
      href={href} target="_blank" rel="noopener noreferrer" title={title}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 36, height: 36, borderRadius: '50%',
        background: 'rgba(44,31,14,0.07)',
        color: '#2c1f0e', textDecoration: 'none',
        transition: 'background 0.15s',
        border: '1px solid rgba(44,31,14,0.1)',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(44,31,14,0.15)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(44,31,14,0.07)'}
    >
      {children}
    </a>
  );
}

// ── Stat pill ─────────────────────────────────

function StatPill({ num, label }) {
  return (
    <div style={{ textAlign: 'center', padding: '0 20px' }}>
      <div style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 26, fontWeight: 700,
        color: '#2c1f0e', lineHeight: 1,
        marginBottom: 4,
      }}>
        {num}
      </div>
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 9, letterSpacing: '0.16em',
        textTransform: 'uppercase', color: '#7a5c3a',
      }}>
        {label}
      </div>
    </div>
  );
}

// ── Mini Idea Card (polaroid style) ──────────

function IdeaCard({ idea, index }) {
  const navigate = useNavigate();
  const tilt = index % 2 === 0 ? -1 : 1;
  const cat = CATEGORY_LABELS[idea.category] || 'Other';
  const avg = idea.avgOverall ? idea.avgOverall.toFixed(1) : null;

  return (
    <div
      onClick={() => navigate(`/founder-space/ideas/${idea.id}`)}
      style={{
        background: '#fff',
        borderRadius: 4,
        padding: '18px 18px 36px',
        boxShadow: '0 4px 24px rgba(44,31,14,0.12), 0 1px 4px rgba(44,31,14,0.07)',
        border: '1px solid rgba(44,31,14,0.07)',
        transform: `rotate(${tilt}deg)`,
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'rotate(0deg) scale(1.02)';
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(44,31,14,0.18)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = `rotate(${tilt}deg)`;
        e.currentTarget.style.boxShadow = '0 4px 24px rgba(44,31,14,0.12), 0 1px 4px rgba(44,31,14,0.07)';
      }}
    >
      {/* Category badge */}
      <div style={{ marginBottom: 10 }}>
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 9, letterSpacing: '0.18em',
          textTransform: 'uppercase',
          background: 'rgba(196,150,58,0.12)',
          color: '#92610a',
          padding: '3px 10px', borderRadius: 100,
        }}>
          {cat}
        </span>
      </div>

      {/* Startup name */}
      <div style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 20, fontWeight: 700,
        color: '#2c1f0e', lineHeight: 1.2,
        marginBottom: 6,
      }}>
        {idea.ideaTitle}
      </div>

      {/* Tagline */}
      <div style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 13, color: '#7a5c3a',
        lineHeight: 1.5, marginBottom: 14,
      }}>
        {idea.tagline}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(44,31,14,0.07)', margin: '12px 0' }} />

      {/* Stats row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        fontFamily: "'DM Mono', monospace", fontSize: 11,
      }}>
        {avg && (
          <span style={{ color: '#c4963a', fontWeight: 600 }}>
            ★ {avg}
            <span style={{ color: '#aaa', fontWeight: 400, marginLeft: 3 }}>
              ({idea.ratingCount || 0})
            </span>
          </span>
        )}
        <span style={{ color: '#aaa' }}>
          {(idea.viewCount || 0).toLocaleString()} views
        </span>
        {(idea.wantToWorkCount || 0) > 0 && (
          <span style={{ color: '#7a5c3a' }}>
            {idea.wantToWorkCount} want in
          </span>
        )}
      </div>
    </div>
  );
}

// ── Journey timeline item ─────────────────────

function JourneyItem({ item, isLast }) {
  return (
    <div style={{ display: 'flex', gap: 20, position: 'relative' }}>
      {/* Line + dot */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: '#c4963a', flexShrink: 0, marginTop: 4,
          boxShadow: '0 0 0 3px rgba(196,150,58,0.2)',
        }} />
        {!isLast && (
          <div style={{
            width: 1.5, flex: 1,
            background: 'rgba(44,31,14,0.12)',
            minHeight: 32, marginTop: 4,
          }} />
        )}
      </div>

      {/* Content */}
      <div style={{ paddingBottom: isLast ? 0 : 32, flex: 1 }}>
        {/* Tag + startup + date */}
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: 8, flexWrap: 'wrap', marginBottom: 6,
        }}>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 9, letterSpacing: '0.16em',
            textTransform: 'uppercase',
            background: 'rgba(196,150,58,0.1)',
            color: '#92610a',
            padding: '2px 8px', borderRadius: 100,
          }}>
            {item.tag}
          </span>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10, color: '#7a5c3a',
            fontWeight: 600,
          }}>
            {item.ideaTitle}
          </span>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10, color: 'rgba(44,31,14,0.35)',
            marginLeft: 'auto',
          }}>
            {formatDateShort(item.createdAt)}
          </span>
        </div>

        {/* Body */}
        <p style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 14, color: '#3d2810',
          lineHeight: 1.65, margin: 0,
        }}>
          {item.body}
        </p>
      </div>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────

function Skeleton({ w = '100%', h = 16, radius = 4, mb = 0 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: radius,
      background: 'linear-gradient(90deg, rgba(44,31,14,0.06) 25%, rgba(44,31,14,0.12) 50%, rgba(44,31,14,0.06) 75%)',
      backgroundSize: '200% 100%',
      animation: 'fs-shimmer 1.4s ease infinite',
      marginBottom: mb,
    }} />
  );
}

// ── 404 state ─────────────────────────────────

function NotFound() {
  return (
    <div className="fs-page" style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', textAlign: 'center', padding: '48px 24px',
    }}>
      <div style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 80, fontWeight: 700,
        color: 'rgba(44,31,14,0.08)', lineHeight: 1,
        marginBottom: 16,
      }}>404</div>
      <h1 style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 28, fontWeight: 700,
        color: '#2c1f0e', margin: '0 0 10px',
      }}>
        Founder not found
      </h1>
      <p style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 15, color: '#7a5c3a',
        margin: '0 0 32px', lineHeight: 1.6,
      }}>
        This profile doesn't exist or has been removed.
      </p>
      <Link to="/founder-space" className="fs-btn-primary">
        Explore Founder Space →
      </Link>
    </div>
  );
}

// ── Main Page ─────────────────────────────────

export default function Profile() {
  const { uid } = useParams();
  const [profile,  setProfile]  = useState(null);
  const [ideas,    setIdeas]    = useState([]);
  const [journey,  setJourney]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Aggregate stats
  const totalRatings    = ideas.reduce((s, i) => s + (i.ratingCount    || 0), 0);
  const totalWantToWork = ideas.reduce((s, i) => s + (i.wantToWorkCount || 0), 0);

  useEffect(() => {
    if (!uid) return;

    async function load() {
      try {
        // 1. Fetch user profile
        const userSnap = await getDoc(doc(db, 'users', uid));
        if (!userSnap.exists()) { setNotFound(true); setLoading(false); return; }
        const profileData = userSnap.data();
        setProfile(profileData);

        // 2. Fetch published ideas by this user
        const ideasQ = query(
          collection(db, 'ideas'),
          where('authorUid', '==', uid),
          where('status', '==', 'published'),
          orderBy('publishedAt', 'desc')
        );
        const ideasSnap = await getDocs(ideasQ);
        const ideasData = ideasSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setIdeas(ideasData);

        // 3. Fetch updates across all ideas (journey timeline)
        const journeyItems = [];
        await Promise.all(
          ideasData.map(async idea => {
            const updatesQ = query(
              collection(db, 'ideas', idea.id, 'updates'),
              orderBy('createdAt', 'desc')
            );
            const updatesSnap = await getDocs(updatesQ);
            updatesSnap.docs.forEach(d => {
              journeyItems.push({
                id: d.id,
                ideaTitle: idea.ideaTitle,
                ideaId: idea.id,
                ...d.data(),
              });
            });
          })
        );
        // Sort all updates newest first
        journeyItems.sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() || 0;
          const tb = b.createdAt?.toMillis?.() || 0;
          return tb - ta;
        });
        setJourney(journeyItems);

        // 4. SEO meta tags
        const ideaTitles = ideasData.map(i => i.ideaTitle).slice(0, 2).join(', ');
        document.title = `${profileData.name} — Founder Space | NoCap VC`;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
          metaDesc.setAttribute('content',
            `${profileData.name} — ${profileData.title || 'Founder'}. ${
              ideaTitles ? `Building: ${ideaTitles}.` : ''
            } ${profileData.whatImBuilding || ''}`.slice(0, 160)
          );
        }

        // OG meta tags
        setMetaOG('og:title', `${profileData.name} on Founder Space | NoCap VC`);
        setMetaOG('og:description',
          `${profileData.whatImBuilding || profileData.title || ''}`.slice(0, 200)
        );
        setMetaOG('og:image',        `/api/og/profile/${uid}`);
        setMetaOG('og:image:width',  '1200');
        setMetaOG('og:image:height', '630');
        setMetaOG('og:url', window.location.href);

      } catch (err) {
        console.error('Profile load error:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    load();

    return () => {
      document.title = 'NoCap VC | One Form, Opens Many Funding Doors';
    };
  }, [uid]);

  // ── Loading state ──────────────────────────
  if (loading) {
    return (
      <div className="fs-page">
        <nav className="fs-nav">
          <Link to="/founder-space" className="fs-nav-logo">
            <span className="fs-nav-dot" />Founder Space
          </Link>
        </nav>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '64px 48px' }}>
          <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', marginBottom: 48 }}>
            <div style={{
              width: 96, height: 96, borderRadius: '50%',
              background: 'rgba(44,31,14,0.08)', flexShrink: 0,
              animation: 'fs-shimmer 1.4s ease infinite',
            }} />
            <div style={{ flex: 1 }}>
              <Skeleton w="60%" h={28} mb={10} />
              <Skeleton w="40%" h={14} mb={14} />
              <Skeleton w="90%" h={14} mb={6} />
              <Skeleton w="70%" h={14} />
            </div>
          </div>
          <Skeleton h={200} radius={4} />
        </div>
        <style>{`@keyframes fs-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }`}</style>
      </div>
    );
  }

  if (notFound) return <NotFound />;

  const roleMeta = ROLE_STYLES[profile.role] || ROLE_STYLES.enthusiast;

  return (
    <div className="fs-page">
      {/* ── Nav ──────────────────────────────── */}
      <nav className="fs-nav">
        <Link to="/founder-space" className="fs-nav-logo">
          <span className="fs-nav-dot" />Founder Space
        </Link>
        <Link to="/" style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 10, letterSpacing: '0.14em',
          color: '#7a5c3a', textDecoration: 'none',
          textTransform: 'uppercase',
        }}>
          NoCap VC ↗
        </Link>
      </nav>

      {/* ── Profile Header ───────────────────── */}
      <div style={{
        borderBottom: '1px solid rgba(44,31,14,0.08)',
        background: 'linear-gradient(180deg, #fff8ee 0%, #fdf6e8 100%)',
      }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '56px 48px 48px' }}>
          {/* Avatar + info */}
          <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', marginBottom: 32 }}>
            {/* Avatar with warm gradient ring */}
            <div style={{
              padding: 3,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #c4963a, #e8c97a, #c4963a)',
              flexShrink: 0,
            }}>
              <div style={{
                padding: 2,
                borderRadius: '50%',
                background: '#fff8ee',
              }}>
                <Avatar profile={profile} size={88} />
              </div>
            </div>

            {/* Name / title / bio */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
                <h1 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 'clamp(24px, 3.5vw, 36px)',
                  fontWeight: 700,
                  color: '#2c1f0e',
                  margin: 0, lineHeight: 1.1,
                }}>
                  {profile.name}
                </h1>
                <span style={{
                  background: roleMeta.bg, color: roleMeta.color,
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 9, fontWeight: 600,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  padding: '3px 10px', borderRadius: 100,
                }}>
                  {roleMeta.label}
                </span>
              </div>

              {profile.title && (
                <div style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 13, color: '#7a5c3a',
                  marginBottom: 12, lineHeight: 1.4,
                }}>
                  {profile.title}
                </div>
              )}

              {profile.whatImBuilding && (
                <p style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 15, color: '#3d2810',
                  lineHeight: 1.7, margin: '0 0 18px',
                  maxWidth: 540,
                }}>
                  {profile.whatImBuilding}
                </p>
              )}

              {/* Social + contact row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {profile.linkedin && (
                  <SocialBtn href={profile.linkedin} title="LinkedIn">
                    <LinkedInIcon />
                  </SocialBtn>
                )}
                {profile.twitter && (
                  <SocialBtn href={profile.twitter} title="X / Twitter">
                    <XIcon />
                  </SocialBtn>
                )}
                {profile.contactEmail && (
                  <a
                    href={`mailto:${profile.contactEmail}`}
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 11, fontWeight: 600,
                      letterSpacing: '0.06em',
                      color: '#2c1f0e', textDecoration: 'none',
                      padding: '7px 16px',
                      border: '1.5px solid rgba(44,31,14,0.2)',
                      borderRadius: 100,
                      transition: 'all 0.15s',
                      background: 'transparent',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#2c1f0e';
                      e.currentTarget.style.color = '#fdf6e8';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#2c1f0e';
                    }}
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
            background: '#fff',
            border: '1px solid rgba(44,31,14,0.08)',
            borderRadius: 10,
            padding: '20px 0',
            width: 'fit-content',
          }}>
            <StatPill num={ideas.length} label="Ideas published" />
            <div style={{ width: 1, height: 32, background: 'rgba(44,31,14,0.1)' }} />
            <StatPill num={totalRatings} label="Ratings received" />
            <div style={{ width: 1, height: 32, background: 'rgba(44,31,14,0.1)' }} />
            <StatPill num={totalWantToWork} label="Want to work with" />
          </div>
        </div>
      </div>

      {/* ── Main content ─────────────────────── */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '56px 48px 80px' }}>

        {/* ── Ideas grid ───────────────────── */}
        {ideas.length > 0 && (
          <section style={{ marginBottom: 72 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 32 }}>
              <div className="fs-section-label">Their startup ideas</div>
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10, color: 'rgba(44,31,14,0.35)',
              }}>
                {ideas.length} published
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 28,
            }}>
              {ideas.map((idea, i) => (
                <IdeaCard key={idea.id} idea={idea} index={i} />
              ))}
            </div>
          </section>
        )}

        {ideas.length === 0 && (
          <section style={{ marginBottom: 72 }}>
            <div className="fs-section-label" style={{ marginBottom: 20 }}>
              Their startup ideas
            </div>
            <div style={{
              background: '#fff',
              border: '1.5px dashed rgba(44,31,14,0.15)',
              borderRadius: 8,
              padding: '40px 32px',
              textAlign: 'center',
            }}>
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11, color: 'rgba(44,31,14,0.35)',
              }}>
                No published ideas yet — check back soon.
              </div>
            </div>
          </section>
        )}

        {/* ── Journey timeline ──────────────── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 32 }}>
            <div className="fs-section-label">Founder journey</div>
            {journey.length > 0 && (
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10, color: 'rgba(44,31,14,0.35)',
              }}>
                {journey.length} update{journey.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          {journey.length === 0 ? (
            <div style={{
              background: '#fff',
              border: '1.5px dashed rgba(44,31,14,0.15)',
              borderRadius: 8,
              padding: '40px 32px',
              textAlign: 'center',
            }}>
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11, color: 'rgba(44,31,14,0.35)',
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

      {/* ── Keyframes ────────────────────────── */}
      <style>{`
        @keyframes fs-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @media (max-width: 640px) {
          .fs-nav { padding: 14px 20px !important; }
        }
      `}</style>
    </div>
  );
}
