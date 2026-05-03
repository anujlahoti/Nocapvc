/**
 * Founder Space — Landing / Sign-In page
 * Route: /founder-space
 *
 * Two states:
 *   1. Not signed in → shows full landing page
 *   2. Already signed in → auto-redirects to /feed or /onboarding
 *
 * Sections:
 *   Hero · How It Works · Live Stats Bar · Featured Ideas · Who Is It For
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  collection, query, where, orderBy, limit, getDocs, getCountFromServer,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../lib/auth';
import FeedIdeaCard from '../../components/founder-space/FeedIdeaCard';
import './FounderSpace.css';

// ── Google icon ───────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

// ── Decorative polaroid stack (hero right) ────────────────────────────────────

function PolaroidStack() {
  const cards = [
    { tilt: -4, top: 20, color: '#e8d9c4', label: '₹4.25L Cr opportunity hidden in plain sight' },
    { tilt:  2, top:  0, color: '#f5e9d0', label: 'Democratizing stock lending for retail India'  },
    { tilt:  6, top: 14, color: '#fdf6e8', label: 'The pitch nobody else had the guts to make'    },
  ];
  return (
    <div style={{ position: 'relative', height: 280, width: 260, margin: '0 auto' }}>
      {cards.map((c, i) => (
        <div key={i} style={{
          position: 'absolute', left: i * 12, top: c.top, width: 220,
          background: c.color, borderRadius: 4, padding: '16px 16px 36px',
          boxShadow: '0 4px 20px rgba(44,31,14,0.14)',
          transform: `rotate(${c.tilt}deg)`,
          border: '1px solid rgba(44,31,14,0.08)', zIndex: 3 - i,
        }}>
          <div style={{
            height: 100, background: 'rgba(44,31,14,0.07)', borderRadius: 2,
            marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 28, opacity: 0.25 }}>✦</span>
          </div>
          <div style={{
            fontFamily: "'Syne', sans-serif", fontSize: 11,
            color: '#2c1f0e', lineHeight: 1.5, opacity: 0.7,
          }}>{c.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── How It Works cards ────────────────────────────────────────────────────────

const HOW_STEPS = [
  {
    icon: '📌',
    title: 'Build your investigation board',
    desc: 'Fill in 5 nodes. Upload evidence. Add branch notes. Your pitch becomes a beautiful visual board.',
  },
  {
    icon: '★',
    title: "Get the community's verdict",
    desc: 'Real ratings from founders and investors. Comments. People who want to work on it with you.',
  },
  {
    icon: '⏱',
    title: 'Build in public',
    desc: 'Post updates as you ship. Attract co-founders. Get found by investors looking for their next bet.',
  },
];

function HowItWorks() {
  return (
    <section style={{ padding: '80px 48px', background: '#fdf6e8' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div className="fs-section-label" style={{ marginBottom: 12 }}>Simple process</div>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 900, color: '#2c1f0e',
            margin: 0, letterSpacing: '-0.02em',
          }}>
            How it works
          </h2>
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
        }} className="fs-how-grid">
          {HOW_STEPS.map((s, i) => (
            <div key={i} style={{
              background: '#fff', borderRadius: 20,
              border: '1px solid rgba(44,31,14,0.08)',
              padding: '32px 28px', textAlign: 'center',
            }}>
              <div style={{
                fontSize: 32, marginBottom: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'rgba(196,150,58,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24,
                }}>
                  {s.icon}
                </span>
              </div>
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9, fontWeight: 700, letterSpacing: '0.18em',
                textTransform: 'uppercase', color: '#c4963a', marginBottom: 10,
              }}>
                Step {i + 1}
              </div>
              <h3 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 18, fontWeight: 700, color: '#2c1f0e',
                margin: '0 0 12px', lineHeight: 1.3,
              }}>
                {s.title}
              </h3>
              <p style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 13, color: '#7a5c3a', lineHeight: 1.65, margin: 0,
              }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Live stats bar ────────────────────────────────────────────────────────────

function StatsBar({ ideaCount, userCount, ratingCount }) {
  const stats = [
    { value: ideaCount,   label: 'ideas pinned'        },
    { value: userCount,   label: 'builders'             },
    { value: ratingCount, label: 'community ratings'   },
  ];
  return (
    <section style={{
      background: '#2c1f0e', padding: '48px 48px',
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto',
        display: 'flex', justifyContent: 'center',
        gap: 80, flexWrap: 'wrap',
      }} className="fs-stats-bar">
        {stats.map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(32px, 5vw, 48px)',
              fontWeight: 900, color: '#f5c842',
              lineHeight: 1, marginBottom: 8,
            }}>
              {s.value ?? '—'}
            </div>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11, color: '#c4a882',
              letterSpacing: '0.16em', textTransform: 'uppercase',
            }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Featured ideas ────────────────────────────────────────────────────────────

function FeaturedIdeas({ ideas, authors }) {
  const navigate = useNavigate();
  if (!ideas.length) return null;
  return (
    <section style={{ padding: '80px 48px', background: '#fdf6e8' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
          <div style={{
            width: 12, height: 12, borderRadius: '50%',
            background: '#e8391e',
            boxShadow: '0 0 0 4px rgba(232,57,30,0.15)',
            flexShrink: 0,
          }} />
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(26px, 3.5vw, 36px)',
            fontWeight: 900, color: '#2c1f0e',
            margin: 0, letterSpacing: '-0.02em',
          }}>
            Ideas worth watching
          </h2>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 20,
        }} className="fs-featured-grid">
          {ideas.map(idea => (
            <FeedIdeaCard
              key={idea.id}
              idea={idea}
              author={authors[idea.authorUid]}
              onClick={() => navigate(`/founder-space/ideas/${idea.id}`)}
            />
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 36 }}>
          <Link to="/founder-space/feed" style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 12, fontWeight: 700,
            color: '#c4963a', textDecoration: 'none',
            letterSpacing: '0.1em',
          }}>
            Browse all ideas →
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Who is it for ─────────────────────────────────────────────────────────────

const AUDIENCES = [
  { color: '#e8391e', icon: '🎯', who: 'Founders with ideas',   desc: 'You have the vision. We give it a stage.'                      },
  { color: '#1a6bb5', icon: '💼', who: 'Investors',              desc: 'Discover pre-seed deal flow before anyone else.'                },
  { color: '#2c8a4e', icon: '⚡', who: 'Talent',                 desc: 'Find the startup you actually want to build.'                   },
  { color: '#c4963a', icon: '👀', who: 'Enthusiasts',            desc: 'Stay ahead of what\'s being built in India.'                    },
];

function WhoIsItFor() {
  return (
    <section style={{ padding: '80px 48px', background: '#fff' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(26px, 3.5vw, 36px)',
            fontWeight: 900, color: '#2c1f0e',
            margin: 0, letterSpacing: '-0.02em',
          }}>
            Who is Founder Space for?
          </h2>
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16,
        }} className="fs-audience-grid">
          {AUDIENCES.map(a => (
            <div key={a.who} style={{
              background: '#fdf6e8', borderRadius: 18,
              border: `1.5px solid ${a.color}22`,
              padding: '28px 22px',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: `${a.color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, marginBottom: 16,
              }}>
                {a.icon}
              </div>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: a.color, marginBottom: 12,
                boxShadow: `0 0 0 3px ${a.color}25`,
              }} />
              <h3 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 16, fontWeight: 700, color: '#2c1f0e',
                margin: '0 0 8px',
              }}>
                {a.who}
              </h3>
              <p style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 13, color: '#7a5c3a', lineHeight: 1.6, margin: 0,
              }}>
                {a.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function FounderSpaceLanding() {
  const { user, userProfile, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const [signingIn,    setSigningIn]    = useState(false);
  const [authError,    setAuthError]    = useState(null);
  const [featuredIdeas, setFeaturedIdeas] = useState([]);
  const [featuredAuthors, setFeaturedAuthors] = useState({});
  const [stats, setStats] = useState({ ideaCount: null, userCount: null, ratingCount: null });

  // Already signed in → redirect
  useEffect(() => {
    if (!loading && user) {
      if (userProfile) navigate('/founder-space/feed', { replace: true });
      else navigate('/founder-space/onboarding', { replace: true });
    }
  }, [user, userProfile, loading, navigate]);

  // Load featured ideas + stats
  useEffect(() => {
    async function loadData() {
      try {
        // 3 top-rated published ideas
        const ideasSnap = await getDocs(
          query(
            collection(db, 'ideas'),
            where('status', '==', 'published'),
            orderBy('avgOverall', 'desc'),
            limit(3)
          )
        );
        const ideas = ideasSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setFeaturedIdeas(ideas);

        // Batch-fetch authors
        const uids = [...new Set(ideas.map(i => i.authorUid).filter(Boolean))];
        const { getDoc, doc } = await import('firebase/firestore');
        const profiles = {};
        await Promise.all(uids.map(async uid => {
          const s = await getDoc(doc(db, 'users', uid));
          if (s.exists()) profiles[uid] = s.data();
        }));
        setFeaturedAuthors(profiles);

        // Counts
        const [ideasCount, usersCount, ratingsCount] = await Promise.all([
          getCountFromServer(query(collection(db, 'ideas'), where('status', '==', 'published'))),
          getCountFromServer(collection(db, 'users')),
          getCountFromServer(collection(db, 'ratings')),
        ]);
        setStats({
          ideaCount:   ideasCount.data().count,
          userCount:   usersCount.data().count,
          ratingCount: ratingsCount.data().count,
        });
      } catch (err) {
        console.error('Landing data load failed:', err);
      }
    }
    loadData();
  }, []);

  async function handleSignIn() {
    setSigningIn(true);
    setAuthError(null);
    try {
      const result = await signIn();
      if (!result) return;
      if (result.hasProfile) navigate('/founder-space/feed');
      else navigate('/founder-space/onboarding');
    } catch {
      setAuthError('Sign-in failed. Please try again.');
    } finally {
      setSigningIn(false);
    }
  }

  if (loading) {
    return (
      <div className="fs-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="fs-spinner" />
      </div>
    );
  }

  return (
    <div className="fs-page" style={{ paddingBottom: 0 }}>

      {/* ── Nav ──────────────────────────────────── */}
      <nav className="fs-nav">
        <Link to="/" className="fs-nav-logo">
          <span className="fs-nav-dot" />
          NoCap VC
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{
            fontFamily: "'DM Mono', monospace", fontSize: 10,
            letterSpacing: '0.2em', color: 'var(--fs-muted)', textTransform: 'uppercase',
          }}>
            Founder Space
          </span>
          <Link to="/founder-space/feed" style={{
            fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 700,
            color: '#2c1f0e', background: '#f5c842',
            padding: '6px 14px', borderRadius: 8, textDecoration: 'none',
            letterSpacing: '0.08em',
          }}>
            Browse board →
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────── */}
      <div style={{
        maxWidth: 1100, margin: '0 auto',
        padding: '80px 48px 60px',
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 80, alignItems: 'center',
      }} className="fs-landing-grid">

        {/* Left: copy */}
        <div>
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase',
            color: '#c4a882', marginBottom: 20,
          }}>
            NoCap VC presents
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(36px, 5vw, 58px)',
            fontWeight: 900, color: '#2c1f0e',
            lineHeight: 1.1, letterSpacing: '-0.02em',
            margin: '0 0 20px',
          }}>
            Your startup idea<br />
            <em style={{ color: '#c4963a' }}>deserves a stage.</em>
          </h1>
          <p style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 17, color: '#7a5c3a',
            lineHeight: 1.7, margin: '0 0 32px', maxWidth: 440,
          }}>
            Founder Space is where ideas stop being secrets. Build your investigation board.
            Get rated by real investors and founders. Find your co-founder. Build in public.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 340 }}>
            <button
              className="fs-btn-primary"
              onClick={handleSignIn}
              disabled={signingIn}
              style={{ justifyContent: 'center', gap: 12, fontSize: 13, padding: '16px 28px' }}
            >
              {signingIn
                ? <span className="fs-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                : <GoogleIcon />
              }
              {signingIn ? 'Signing in…' : 'Pin your first idea →'}
            </button>

            <Link to="/founder-space/feed" style={{
              display: 'block', textAlign: 'center',
              padding: '14px 28px', borderRadius: 12,
              border: '1.5px solid #e8dcc8', background: '#fff',
              fontFamily: "'DM Mono', monospace",
              fontSize: 12, fontWeight: 600, color: '#2c1f0e',
              textDecoration: 'none', transition: 'border-color 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#2c1f0e'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#e8dcc8'}
            >
              Browse the board
            </Link>

            {authError && (
              <p style={{
                fontFamily: "'DM Mono', monospace", fontSize: 11,
                color: '#c0392b', margin: 0,
              }}>
                {authError}
              </p>
            )}

            {stats.userCount !== null && (
              <p style={{
                fontFamily: "'DM Mono', monospace", fontSize: 10,
                color: '#c4a882', margin: 0, letterSpacing: '0.08em',
              }}>
                Join {stats.userCount}+ founders already building in public
              </p>
            )}
          </div>
        </div>

        {/* Right: decorative polaroid stack */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <PolaroidStack />
        </div>
      </div>

      {/* ── How It Works ─────────────────────────── */}
      <HowItWorks />

      {/* ── Live Stats Bar ───────────────────────── */}
      <StatsBar
        ideaCount={stats.ideaCount}
        userCount={stats.userCount}
        ratingCount={stats.ratingCount}
      />

      {/* ── Featured Ideas ───────────────────────── */}
      <FeaturedIdeas ideas={featuredIdeas} authors={featuredAuthors} />

      {/* ── Who Is It For ────────────────────────── */}
      <WhoIsItFor />

      {/* ── Footer CTA ───────────────────────────── */}
      <section style={{
        background: '#2c1f0e', padding: '64px 48px', textAlign: 'center',
      }}>
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase',
          color: '#c4963a', marginBottom: 16,
        }}>
          Free forever
        </div>
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(28px, 4vw, 44px)',
          fontWeight: 900, color: '#fdf6e8',
          margin: '0 0 20px', letterSpacing: '-0.02em',
        }}>
          Your idea deserves to be heard.
        </h2>
        <button
          onClick={handleSignIn}
          disabled={signingIn}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: '#f5c842', color: '#2c1f0e',
            border: 'none', borderRadius: 12,
            padding: '16px 32px', cursor: 'pointer',
            fontFamily: "'DM Mono', monospace",
            fontSize: 13, fontWeight: 700, letterSpacing: '0.06em',
          }}
        >
          {signingIn ? 'Signing in…' : <>
            <GoogleIcon />
            Get started for free
          </>}
        </button>
      </section>

      {/* ── Responsive ───────────────────────────── */}
      <style>{`
        @media (max-width: 768px) {
          .fs-landing-grid  { grid-template-columns: 1fr !important; }
          .fs-how-grid      { grid-template-columns: 1fr !important; }
          .fs-featured-grid { grid-template-columns: 1fr !important; }
          .fs-audience-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .fs-stats-bar     { gap: 40px !important; }
        }
      `}</style>
    </div>
  );
}
