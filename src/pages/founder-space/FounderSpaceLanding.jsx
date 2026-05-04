/**
 * Founder Space — Exclusive Invite-Only Landing
 * Route: /founder-space
 *
 * Design philosophy: exclusivity, FOMO, top-tier SF aesthetic.
 * The platform is curated — not everyone gets in.
 * Waitlist applications go to Firestore `waitlist` collection.
 */

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, getCountFromServer } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../lib/auth';
import './FounderSpace.css';

// ── Subtle background grain (pure CSS) ────────────────────────────────────────

const GRAIN_STYLE = `
  .fs-grain::before {
    content: '';
    position: fixed; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none; z-index: 0; opacity: 0.5;
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(1.3); }
  }
  @keyframes fs-fadein {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes stamp-in {
    0%   { opacity: 0; transform: rotate(-12deg) scale(1.4); }
    60%  { transform: rotate(-12deg) scale(0.92); }
    100% { opacity: 1; transform: rotate(-12deg) scale(1); }
  }
  .fs-fade-in { animation: fs-fadein 0.7s ease both; }
  .fs-fade-in-1 { animation: fs-fadein 0.7s 0.1s ease both; }
  .fs-fade-in-2 { animation: fs-fadein 0.7s 0.22s ease both; }
  .fs-fade-in-3 { animation: fs-fadein 0.7s 0.36s ease both; }
  .fs-fade-in-4 { animation: fs-fadein 0.7s 0.50s ease both; }
  .stamp-anim  { animation: stamp-in 0.5s 0.3s cubic-bezier(.36,.07,.19,.97) both; }
  @media (max-width: 768px) {
    .landing-two-col { flex-direction: column !important; }
    .fs-hero-text h1 { font-size: 36px !important; }
    .member-grid { grid-template-columns: 1fr 1fr !important; }
    .feature-grid { grid-template-columns: 1fr !important; }
  }
`;

// ── Waitlist form fields ───────────────────────────────────────────────────────

const QUESTIONS = [
  {
    id: 'name',
    label: 'Your full name',
    type: 'text',
    placeholder: 'First Last',
    required: true,
    maxLength: 80,
  },
  {
    id: 'currentWork',
    label: 'What are you working on right now?',
    subtitle: 'Founder, operator, investor, professional — what's your current chapter?',
    type: 'textarea',
    placeholder: 'Building a B2B SaaS for CA firms — early stage, 3 paying customers…',
    required: true,
    maxLength: 300,
  },
  {
    id: 'crazyThing',
    label: 'The most unconventional thing you\'ve done to date.',
    subtitle: 'The thing that makes people say "wait, you actually did that?"',
    type: 'textarea',
    placeholder: 'Cold-called 200 CFOs to validate the idea before writing a line of code…',
    required: true,
    maxLength: 300,
  },
  {
    id: 'linkedin',
    label: 'LinkedIn profile URL',
    type: 'text',
    placeholder: 'linkedin.com/in/yourname',
    required: true,
    maxLength: 200,
  },
  {
    id: 'instagram',
    label: 'Instagram handle',
    type: 'text',
    placeholder: '@yourhandle',
    required: false,
    maxLength: 100,
  },
  {
    id: 'extra',
    label: 'Anything else you want us to know?',
    subtitle: 'Optional — but this is where interesting people say interesting things.',
    type: 'textarea',
    placeholder: 'Ship it.',
    required: false,
    maxLength: 400,
  },
];

// ── What members get ───────────────────────────────────────────────────────────

const MEMBER_BENEFITS = [
  {
    tack: '#e8391e',
    icon: '📌',
    title: 'The Investigation Board',
    desc: 'Pin your startup as a 5-node polaroid story. Get rated by real founders and investors.',
  },
  {
    tack: '#7c3aed',
    icon: '◈',
    title: 'Professional Journey',
    desc: 'Tell your career story the right way. Not a LinkedIn summary — a full narrative board.',
  },
  {
    tack: '#2c8a4e',
    icon: '⚡',
    title: 'Events & Collaborations',
    desc: 'Project sprints, book clubs, founder meetups. Build and learn with the people inside.',
  },
  {
    tack: '#1a6bb5',
    icon: '★',
    title: 'Real signal, not noise',
    desc: 'Co-founder matching, VC discovery, community ratings. Earned access, not follower counts.',
  },
];

// ── Member avatars (decorative placeholder profiles) ──────────────────────────

const MEMBER_TILES = [
  { initials: 'AK', role: 'Founder',   bg: '#c4963a' },
  { initials: 'SR', role: 'Investor',  bg: '#1a6bb5' },
  { initials: 'PM', role: 'Operator',  bg: '#2c8a4e' },
  { initials: 'NJ', role: 'Founder',   bg: '#e8391e' },
  { initials: 'DV', role: 'VC',        bg: '#7c3aed' },
  { initials: 'RL', role: 'Founder',   bg: '#0d9488' },
];

// ── Testimonials ───────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    text: 'Got my first investor intro through the board. No pitch deck. Just my polaroid.',
    role: 'Fintech Founder',
    initials: 'RS',
    bg: '#c4963a',
  },
  {
    text: 'Found my co-founder here in week 2. We shipped our MVP 6 weeks later.',
    role: 'SaaS Founder',
    initials: 'AM',
    bg: '#2c8a4e',
  },
  {
    text: 'The community is small, real, and high-signal. That's the rarest thing on the internet.',
    role: 'Operator → Founder',
    initials: 'KP',
    bg: '#1a6bb5',
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function Dot({ color = '#e8391e', pulse = false }) {
  return (
    <div style={{
      width: 8, height: 8, borderRadius: '50%',
      background: color, flexShrink: 0,
      animation: pulse ? 'pulse-dot 1.8s ease-in-out infinite' : 'none',
    }} />
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function FounderSpaceLanding() {
  const { user, userProfile, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const formRef = useRef(null);

  const [waitlistCount, setWaitlistCount] = useState(null);
  const [form,          setForm]          = useState({
    name: '', currentWork: '', crazyThing: '', linkedin: '', instagram: '', extra: '',
  });
  const [errors,     setErrors]     = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);

  // Already signed in + has profile → go to feed
  useEffect(() => {
    if (!loading && user && userProfile) {
      navigate('/founder-space/feed', { replace: true });
    }
  }, [user, userProfile, loading, navigate]);

  // Load application count for FOMO
  useEffect(() => {
    getCountFromServer(collection(db, 'waitlist'))
      .then(s => setWaitlistCount(s.data().count))
      .catch(() => {});
  }, []);

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function setField(id, val) {
    setForm(prev => ({ ...prev, [id]: val }));
    if (errors[id]) setErrors(prev => ({ ...prev, [id]: '' }));
  }

  function validate() {
    const errs = {};
    QUESTIONS.forEach(q => {
      if (q.required && !(form[q.id] || '').trim()) {
        errs[q.id] = 'This field is required.';
      }
    });
    if (form.linkedin && !form.linkedin.includes('linkedin.com')) {
      errs.linkedin = 'Paste a valid LinkedIn URL.';
    }
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'waitlist'), {
        name:        form.name.trim(),
        currentWork: form.currentWork.trim(),
        crazyThing:  form.crazyThing.trim(),
        linkedin:    form.linkedin.trim(),
        instagram:   form.instagram.trim(),
        extra:       form.extra.trim(),
        status:      'pending',
        createdAt:   serverTimestamp(),
        uid:         user?.uid   || null,
        email:       user?.email || null,
      });
      setSubmitted(true);
      setWaitlistCount(c => (c || 0) + 1);
    } catch (err) {
      console.error('Waitlist submit error:', err);
    } finally {
      setSubmitting(false);
    }
  }

  // Already signed in but no profile → still show landing (let them apply)
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0f0d09',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '2px solid rgba(196,150,58,0.2)',
          borderTopColor: '#c4963a',
          animation: 'fs-spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes fs-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="fs-grain" style={{
      background: '#fdf6e8', fontFamily: "'Syne', sans-serif",
      overflowX: 'hidden',
    }}>
      <style>{GRAIN_STYLE}</style>

      {/* ══════════════════════════════════════
          DARK HERO SECTION
      ══════════════════════════════════════ */}
      <section style={{
        background: '#0f0d09',
        minHeight: '100vh',
        position: 'relative',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Ambient warm glow */}
        <div style={{
          position: 'absolute', top: '30%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600, height: 400,
          background: 'radial-gradient(ellipse, rgba(196,150,58,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Nav */}
        <nav style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '24px 48px', position: 'relative', zIndex: 10,
        }}>
          <Link to="/" style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 17, fontWeight: 700, color: '#f5e8c8',
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#c4963a',
              boxShadow: '0 0 12px rgba(196,150,58,0.6)',
            }} />
            NoCap VC
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* Invite-only badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: 'rgba(232,57,30,0.12)',
              border: '1px solid rgba(232,57,30,0.3)',
              padding: '5px 12px', borderRadius: 100,
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#e8391e',
                animation: 'pulse-dot 2s ease-in-out infinite',
              }} />
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9, fontWeight: 700,
                letterSpacing: '0.2em', textTransform: 'uppercase',
                color: '#e8391e',
              }}>
                Invite Only
              </span>
            </div>

            <button
              onClick={scrollToForm}
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10, fontWeight: 700,
                letterSpacing: '0.08em',
                background: '#c4963a', color: '#0f0d09',
                border: 'none', borderRadius: 8,
                padding: '9px 18px', cursor: 'pointer',
              }}
            >
              Apply →
            </button>
          </div>
        </nav>

        {/* Hero content */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center',
          maxWidth: 1000, margin: '0 auto', padding: '40px 48px 80px',
          width: '100%',
          position: 'relative', zIndex: 10,
        }}>
          <div style={{ maxWidth: 680 }}>

            {/* Overline */}
            <div className="fs-fade-in" style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: 28,
            }}>
              <div style={{
                height: 1, width: 32, background: 'rgba(196,150,58,0.5)',
              }} />
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase',
                color: '#c4a882',
              }}>
                Founder Space — By NoCap VC
              </span>
            </div>

            {/* Main headline */}
            <h1 className="fs-hero-text fs-fade-in-1" style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(42px, 6vw, 72px)',
              fontWeight: 900, lineHeight: 1.05,
              letterSpacing: '-0.025em',
              color: '#f5e8c8',
              margin: '0 0 24px',
            }}>
              The room where<br />
              India's most ambitious<br />
              <em style={{ color: '#c4963a', fontStyle: 'italic' }}>
                founders gather.
              </em>
            </h1>

            {/* Sub */}
            <p className="fs-fade-in-2" style={{
              fontSize: 18, color: 'rgba(245,232,200,0.6)',
              lineHeight: 1.7, margin: '0 0 40px', maxWidth: 520,
            }}>
              Not everyone gets in. That's the point. We're building the most
              curated founder community in India — and access is earned, not given.
            </p>

            {/* Stats row */}
            {waitlistCount !== null && (
              <div className="fs-fade-in-3" style={{
                display: 'flex', alignItems: 'center', gap: 6, marginBottom: 40,
              }}>
                <div style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11, color: '#c4a882',
                  letterSpacing: '0.06em',
                }}>
                  <span style={{ color: '#c4963a', fontWeight: 700 }}>
                    {waitlistCount}+
                  </span>
                  {' '}founders have applied this month.
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="fs-fade-in-4" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={scrollToForm}
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
                  background: '#c4963a', color: '#0f0d09',
                  border: 'none', borderRadius: 10,
                  padding: '14px 28px', cursor: 'pointer',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Apply for access →
              </button>
              <Link to="/founder-space/feed" style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 12, fontWeight: 600, letterSpacing: '0.06em',
                color: 'rgba(245,232,200,0.5)',
                textDecoration: 'none', padding: '14px 0',
                borderBottom: '1px solid rgba(245,232,200,0.2)',
              }}>
                Browse the board
              </Link>
            </div>
          </div>

          {/* Decorative stamp */}
          <div style={{ position: 'absolute', right: 48, top: '50%', transform: 'translateY(-50%)' }}
            className="stamp-anim"
          >
            <div style={{
              width: 180, height: 180,
              border: '3px solid rgba(232,57,30,0.4)',
              borderRadius: 8,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              transform: 'rotate(-12deg)',
              gap: 4,
              boxShadow: 'inset 0 0 30px rgba(232,57,30,0.06)',
              background: 'rgba(232,57,30,0.04)',
            }}>
              <div style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 11, fontWeight: 900,
                letterSpacing: '0.2em', textTransform: 'uppercase',
                color: 'rgba(232,57,30,0.6)',
              }}>
                Access
              </div>
              <div style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 36, fontWeight: 900,
                color: 'rgba(232,57,30,0.5)',
                lineHeight: 1,
              }}>
                BY
              </div>
              <div style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 11, fontWeight: 900,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                color: 'rgba(232,57,30,0.6)',
              }}>
                Application
              </div>
              <div style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 9, fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'rgba(232,57,30,0.4)',
                marginTop: 8,
              }}>
                Only
              </div>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{
          position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          fontFamily: "'DM Mono', monospace",
          fontSize: 9, color: 'rgba(196,150,58,0.4)',
          letterSpacing: '0.2em', textTransform: 'uppercase',
        }}>
          ↓ What's inside
        </div>
      </section>

      {/* ══════════════════════════════════════
          WHAT YOU GET ACCESS TO
      ══════════════════════════════════════ */}
      <section style={{ background: '#fdf6e8', padding: '100px 48px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9, letterSpacing: '0.26em', textTransform: 'uppercase',
              color: '#c4963a', marginBottom: 12,
            }}>
              Members get access to
            </div>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900,
              color: '#2c1f0e', margin: 0, letterSpacing: '-0.02em',
            }}>
              A platform built for people<br />who are actually building.
            </h2>
          </div>

          <div className="feature-grid" style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20,
          }}>
            {MEMBER_BENEFITS.map((b, i) => (
              <div key={i} style={{
                background: '#fff', borderRadius: 20,
                border: '1px solid rgba(44,31,14,0.08)',
                padding: '32px 28px',
                position: 'relative',
              }}>
                {/* Tack */}
                <div style={{
                  position: 'absolute', top: 20, right: 20,
                  width: 10, height: 10, borderRadius: '50%',
                  background: b.tack,
                  boxShadow: `0 0 12px ${b.tack}55`,
                }} />
                <div style={{ fontSize: 28, marginBottom: 16 }}>{b.icon}</div>
                <h3 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 20, fontWeight: 700, color: '#2c1f0e',
                  margin: '0 0 10px', lineHeight: 1.3,
                }}>
                  {b.title}
                </h3>
                <p style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 14, color: '#7a5c3a',
                  lineHeight: 1.65, margin: 0,
                }}>
                  {b.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          DARK SOCIAL PROOF — MEMBERS INSIDE
      ══════════════════════════════════════ */}
      <section style={{ background: '#2c1f0e', padding: '80px 48px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
            marginBottom: 48, flexWrap: 'wrap', gap: 16,
          }}>
            <div>
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9, letterSpacing: '0.26em', textTransform: 'uppercase',
                color: '#c4963a', marginBottom: 10,
              }}>
                Who's inside
              </div>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 900,
                color: '#f5e8c8', margin: 0, letterSpacing: '-0.02em',
              }}>
                Founders. Operators. Investors.
              </h2>
            </div>
            <div style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 14, color: 'rgba(245,232,200,0.5)',
              maxWidth: 280, lineHeight: 1.65,
            }}>
              People who are building real things, not just tweeting about building.
            </div>
          </div>

          {/* Member tiles */}
          <div className="member-grid" style={{
            display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12,
            marginBottom: 60,
          }}>
            {MEMBER_TILES.map((m, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16, padding: '20px 16px',
                textAlign: 'center',
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: m.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 16, fontWeight: 700, color: '#fff',
                  margin: '0 auto 10px',
                }}>
                  {m.initials}
                </div>
                <div style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 8, fontWeight: 700,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: 'rgba(245,232,200,0.5)',
                }}>
                  {m.role}
                </div>
              </div>
            ))}
          </div>

          {/* Testimonials */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}
            className="member-grid"
          >
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 16, padding: '24px',
              }}>
                <p style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 14, fontStyle: 'italic',
                  color: 'rgba(245,232,200,0.75)',
                  lineHeight: 1.65, margin: '0 0 20px',
                }}>
                  "{t.text}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: t.bg, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 11, fontWeight: 700, color: '#fff',
                  }}>
                    {t.initials}
                  </div>
                  <div style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: 'rgba(196,150,58,0.7)',
                  }}>
                    {t.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          APPLICATION FORM
      ══════════════════════════════════════ */}
      <section ref={formRef} style={{ background: '#fdf6e8', padding: '100px 48px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: 48, textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: 'rgba(232,57,30,0.08)',
              border: '1px solid rgba(232,57,30,0.2)',
              padding: '5px 14px', borderRadius: 100, marginBottom: 20,
            }}>
              <Dot color="#e8391e" pulse />
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9, fontWeight: 700,
                letterSpacing: '0.2em', textTransform: 'uppercase',
                color: '#e8391e',
              }}>
                By Application Only
              </span>
            </div>

            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(30px, 4vw, 46px)', fontWeight: 900,
              color: '#2c1f0e', margin: '0 0 14px', letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}>
              Apply for access.
            </h2>
            <p style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 16, color: '#7a5c3a',
              lineHeight: 1.65, margin: '0 0 8px',
            }}>
              We read every application personally. Be honest, be specific,
              be yourself. We're not looking for perfect — we're looking for real.
            </p>
            {waitlistCount !== null && (
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10, color: '#c4a882',
                letterSpacing: '0.06em',
              }}>
                {waitlistCount}+ applications reviewed so far.
              </div>
            )}
          </div>

          {submitted ? (
            /* ── Success state ───────────────────────── */
            <div style={{
              background: '#fff', borderRadius: 20,
              border: '1px solid rgba(44,31,14,0.08)',
              padding: '60px 40px', textAlign: 'center',
              boxShadow: '0 12px 48px rgba(44,31,14,0.08)',
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(44,138,78,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px',
                fontSize: 28,
              }}>
                ✓
              </div>
              <h3 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 28, fontWeight: 900,
                color: '#2c1f0e', margin: '0 0 12px',
              }}>
                Application received.
              </h3>
              <p style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 15, color: '#7a5c3a',
                lineHeight: 1.65, margin: '0 0 24px',
              }}>
                We review every application personally. You'll hear from us within
                a few days. Until then — keep building.
              </p>
              <Link to="/founder-space/feed" style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11, fontWeight: 600,
                color: '#c4963a', textDecoration: 'none',
                letterSpacing: '0.08em',
              }}>
                Browse the investigation board →
              </Link>
            </div>
          ) : (
            /* ── Application form ────────────────────── */
            <div style={{
              background: '#fff', borderRadius: 20,
              border: '1px solid rgba(44,31,14,0.08)',
              padding: '48px 40px',
              boxShadow: '0 12px 48px rgba(44,31,14,0.08)',
            }}>
              <form onSubmit={handleSubmit}>
                {QUESTIONS.map((q, i) => (
                  <div key={q.id} style={{ marginBottom: 28 }}>
                    <label style={{
                      display: 'block',
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 10, fontWeight: 700,
                      letterSpacing: '0.16em', textTransform: 'uppercase',
                      color: '#2c1f0e', marginBottom: 4,
                    }}>
                      {String(i + 1).padStart(2, '0')} — {q.label}
                      {q.required && <span style={{ color: '#c4963a', marginLeft: 4 }}>*</span>}
                    </label>
                    {q.subtitle && (
                      <div style={{
                        fontFamily: "'Syne', sans-serif",
                        fontSize: 12, color: '#b09878',
                        marginBottom: 8, fontStyle: 'italic',
                      }}>
                        {q.subtitle}
                      </div>
                    )}
                    {q.type === 'textarea' ? (
                      <textarea
                        value={form[q.id]}
                        onChange={e => setField(q.id, e.target.value)}
                        placeholder={q.placeholder}
                        maxLength={q.maxLength}
                        rows={4}
                        style={{
                          width: '100%', padding: '12px 16px',
                          background: '#fdf6e8',
                          border: errors[q.id]
                            ? '1.5px solid #c0392b'
                            : '1.5px solid rgba(44,31,14,0.12)',
                          borderRadius: 10, outline: 'none',
                          fontFamily: "'Syne', sans-serif",
                          fontSize: 14, color: '#2c1f0e',
                          lineHeight: 1.6, resize: 'vertical',
                          boxSizing: 'border-box',
                          transition: 'border-color 0.15s',
                        }}
                        onFocus={e => e.target.style.borderColor = '#c4963a'}
                        onBlur={e => e.target.style.borderColor = errors[q.id] ? '#c0392b' : 'rgba(44,31,14,0.12)'}
                      />
                    ) : (
                      <input
                        type="text"
                        value={form[q.id]}
                        onChange={e => setField(q.id, e.target.value)}
                        placeholder={q.placeholder}
                        maxLength={q.maxLength}
                        style={{
                          width: '100%', padding: '12px 16px',
                          background: '#fdf6e8',
                          border: errors[q.id]
                            ? '1.5px solid #c0392b'
                            : '1.5px solid rgba(44,31,14,0.12)',
                          borderRadius: 10, outline: 'none',
                          fontFamily: "'Syne', sans-serif",
                          fontSize: 14, color: '#2c1f0e',
                          boxSizing: 'border-box',
                          transition: 'border-color 0.15s',
                        }}
                        onFocus={e => e.target.style.borderColor = '#c4963a'}
                        onBlur={e => e.target.style.borderColor = errors[q.id] ? '#c0392b' : 'rgba(44,31,14,0.12)'}
                      />
                    )}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      marginTop: 4,
                    }}>
                      {errors[q.id] ? (
                        <span style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 10, color: '#c0392b',
                        }}>
                          {errors[q.id]}
                        </span>
                      ) : <span />}
                      <span style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 9, color: '#c4a882',
                      }}>
                        {(form[q.id] || '').length}/{q.maxLength}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: '100%', padding: '16px',
                    borderRadius: 12, border: 'none',
                    background: submitting ? 'rgba(44,31,14,0.4)' : '#2c1f0e',
                    color: '#f5c842',
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 13, fontWeight: 700, letterSpacing: '0.08em',
                    cursor: submitting ? 'wait' : 'pointer',
                    transition: 'opacity 0.15s',
                    marginTop: 8,
                  }}
                >
                  {submitting ? 'Submitting…' : 'Submit my application →'}
                </button>

                <p style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 12, color: '#c4a882',
                  textAlign: 'center', margin: '16px 0 0',
                  lineHeight: 1.5,
                }}>
                  We personally review every application. No spam, no newsletters.
                </p>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════
          DARK FOOTER CTA
      ══════════════════════════════════════ */}
      <section style={{
        background: '#0f0d09',
        padding: '80px 48px', textAlign: 'center',
      }}>
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 9, letterSpacing: '0.26em', textTransform: 'uppercase',
          color: '#c4963a', marginBottom: 16,
        }}>
          Founder Space
        </div>
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 900,
          color: '#f5e8c8', margin: '0 0 14px', letterSpacing: '-0.02em',
        }}>
          The room is small for a reason.
        </h2>
        <p style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 15, color: 'rgba(245,232,200,0.5)',
          margin: '0 0 32px', lineHeight: 1.65,
        }}>
          Quality compounds. Once you're in, you'll understand why we kept it this way.
        </p>
        <button
          onClick={scrollToForm}
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
            background: '#c4963a', color: '#0f0d09',
            border: 'none', borderRadius: 10,
            padding: '14px 32px', cursor: 'pointer',
          }}
        >
          Apply for access →
        </button>
        <div style={{ marginTop: 40 }}>
          <Link to="/founder-space/feed" style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10, color: 'rgba(196,168,130,0.4)',
            textDecoration: 'none', letterSpacing: '0.1em',
          }}>
            Browse the board without applying →
          </Link>
        </div>
      </section>
    </div>
  );
}
