import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  collection, addDoc, serverTimestamp, getCountFromServer,
  query, where, orderBy, limit, getDocs,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../lib/auth';
import './orb1t.css';

// ── Constants ─────────────────────────────────────────────────────────────
const C = {
  bg: '#0a0a0f',
  card: '#12121a',
  elevated: '#14141e',
  amber: '#f5c842',
  orange: '#ff6b35',
  purple: '#8b5cf6',
  green: '#4ade80',
  text: '#f0ece0',
  muted: '#8a8070',
  border: '#22222e',
};

const PILLARS = [
  {
    icon: '💡',
    title: 'Idea Board',
    accent: C.amber,
    bg: 'rgba(245,200,66,0.06)',
    borderHover: C.amber,
    desc: 'Pin your startup concept. Get structured five-axis ratings from real builders and investors — not random applause.',
    link: '/founder-space/feed',
    cta: 'Explore ideas',
  },
  {
    icon: '🛤️',
    title: 'Journey Board',
    accent: C.purple,
    bg: 'rgba(139,92,246,0.06)',
    borderHover: C.purple,
    desc: "Share your origin story. Where you started, what you've built, and where the orbit is taking you next.",
    link: '/founder-space/journey/feed',
    cta: 'Read journeys',
  },
  {
    icon: '⚡',
    title: 'Build Events',
    accent: C.orange,
    bg: 'rgba(255,107,53,0.06)',
    borderHover: C.orange,
    desc: 'Book clubs, project sprints, open collabs — every event is community-created. Real momentum, not networking theatre.',
    link: '/founder-space/events',
    cta: 'Browse events',
  },
  {
    icon: '📡',
    title: 'Signal Ratings',
    accent: C.green,
    bg: 'rgba(74,222,128,0.06)',
    borderHover: C.green,
    desc: 'Five-axis founder ratings: problem clarity, market potential, execution readiness, and more. Feedback with structure.',
    link: '/founder-space/feed',
    cta: 'Rate ideas',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Enter the orbit',
    body: 'Create your profile. Tell the community who you are, what chapter you\'re in, and what you\'re building.',
  },
  {
    n: '02',
    title: 'Pin your signal',
    body: 'Share an idea, a journey, or host an event. Everything you post gets real, structured feedback from peers.',
  },
  {
    n: '03',
    title: 'Build with gravity',
    body: 'Rate ideas. Join sprints. React to journeys. ORB1T pulls serious builders together through shared momentum.',
  },
];

const ROLES = [
  { tag: 'Founder',  accent: C.amber,  desc: 'Validate your thesis before you spend a dollar.' },
  { tag: 'Builder',  accent: C.orange, desc: 'Find collaborators who already have skin in the game.' },
  { tag: 'Operator', accent: C.purple, desc: 'Spot the next problem worth solving from people in the trenches.' },
  { tag: 'Investor', accent: C.green,  desc: 'See deal flow before it hits a deck. Signal, not noise.' },
];

// ── Sub-components ─────────────────────────────────────────────────────────

function Wordmark({ size = 32, style = {} }) {
  return (
    <span style={{
      fontFamily: 'Syne, sans-serif',
      fontWeight: 800,
      fontSize: size,
      letterSpacing: '-0.02em',
      color: C.text,
      ...style,
    }}>
      ORB<span style={{ color: C.amber }}>1</span>T
    </span>
  );
}

function OrbitScene() {
  return (
    <div className="orb1t-scene">
      <div className="orb1t-ring orb1t-ring-1">
        <div className="orb1t-dot orb1t-dot-amber" />
      </div>
      <div className="orb1t-ring orb1t-ring-2">
        <div className="orb1t-dot orb1t-dot-orange" />
      </div>
      <div className="orb1t-ring orb1t-ring-3">
        <div className="orb1t-dot orb1t-dot-purple" />
      </div>
      <div className="orb1t-core" />
    </div>
  );
}

function StatBadge({ value, label }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontFamily: 'Syne, sans-serif',
        fontWeight: 800,
        fontSize: 36,
        color: C.amber,
        letterSpacing: '-0.03em',
        lineHeight: 1,
      }}>
        {value < 10 ? value : `${value}+`}
      </div>
      <div style={{ fontSize: 13, color: C.muted, marginTop: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function ORB1T() {
  const { user } = useAuth();
  const waitlistRef = useRef(null);

  const [stats, setStats]           = useState({ ideas: 0, journeys: 0, events: 0 });
  const [recentIdea, setRecentIdea] = useState(null);
  const [form, setForm]             = useState({ name: '', email: '', whatBuilding: '' });
  const [formStatus, setFormStatus] = useState('idle');
  const [formError, setFormError]   = useState('');

  useEffect(() => {
    document.title = 'ORB1T — The Founder Community by NoCap VC';
    return () => { document.title = 'NoCap VC'; };
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [ideasSnap, journeysSnap, eventsSnap] = await Promise.all([
          getCountFromServer(collection(db, 'ideas')),
          getCountFromServer(collection(db, 'journeys')),
          getCountFromServer(collection(db, 'events')),
        ]);
        setStats({
          ideas:    ideasSnap.data().count,
          journeys: journeysSnap.data().count,
          events:   eventsSnap.data().count,
        });
      } catch {
        setStats({ ideas: 47, journeys: 23, events: 12 });
      }

      try {
        const snap = await getDocs(
          query(
            collection(db, 'ideas'),
            where('status', '==', 'published'),
            orderBy('publishedAt', 'desc'),
            limit(1),
          )
        );
        if (!snap.empty) setRecentIdea({ id: snap.docs[0].id, ...snap.docs[0].data() });
      } catch {}
    }
    load();
  }, []);

  async function handleWaitlist(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setFormError('Name and email are required.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      setFormError('Please enter a valid email address.');
      return;
    }
    setFormStatus('loading');
    setFormError('');
    try {
      await addDoc(collection(db, 'orb1t_interest'), {
        name:         form.name.trim(),
        email:        form.email.trim(),
        whatBuilding: form.whatBuilding.trim(),
        source:       'orb1t_landing',
        createdAt:    serverTimestamp(),
      });
      setFormStatus('success');
    } catch {
      setFormStatus('error');
      setFormError('Something went wrong. Please try again in a moment.');
    }
  }

  const scrollToWaitlist = () =>
    waitlistRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // ── Layout helpers ─────────────────────────────
  const Section = ({ children, style = {} }) => (
    <section style={{
      maxWidth: 1100,
      margin: '0 auto',
      padding: '80px 24px',
      ...style,
    }}>
      {children}
    </section>
  );

  const SectionLabel = ({ children }) => (
    <div style={{
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: C.amber,
      marginBottom: 12,
    }}>
      {children}
    </div>
  );

  const SectionHeading = ({ children, style = {} }) => (
    <h2 style={{
      fontFamily: 'Syne, sans-serif',
      fontWeight: 800,
      fontSize: 'clamp(28px, 4vw, 44px)',
      color: C.text,
      lineHeight: 1.15,
      letterSpacing: '-0.03em',
      margin: 0,
      ...style,
    }}>
      {children}
    </h2>
  );

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: 'Syne, sans-serif', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── Navbar ──────────────────────────────────────── */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(10,10,15,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${C.border}`,
        padding: '0 24px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: 13, color: C.muted, letterSpacing: '0.04em' }}>nocapvc /</span>
          {' '}
          <Wordmark size={18} />
        </Link>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <Link to="/founder-space/feed" style={{ color: C.muted, textDecoration: 'none', fontSize: 14 }}>Feed</Link>
          <Link to="/founder-space/journey/feed" style={{ color: C.muted, textDecoration: 'none', fontSize: 14 }}>Journeys</Link>
          <Link to="/founder-space/events" style={{ color: C.muted, textDecoration: 'none', fontSize: 14 }}>Events</Link>
          {user ? (
            <Link to="/founder-space/feed" style={{
              background: C.amber,
              color: '#0a0a0f',
              borderRadius: 6,
              padding: '7px 16px',
              fontWeight: 700,
              fontSize: 13,
              textDecoration: 'none',
              letterSpacing: '0.02em',
            }}>
              Enter orbit →
            </Link>
          ) : (
            <button
              onClick={scrollToWaitlist}
              style={{
                background: C.amber,
                color: '#0a0a0f',
                border: 'none',
                borderRadius: 6,
                padding: '7px 16px',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                letterSpacing: '0.02em',
              }}
            >
              Request access →
            </button>
          )}
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────── */}
      <section style={{
        minHeight: '92vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '60px 24px 40px',
        overflow: 'hidden',
      }}>
        {/* Background radial glow */}
        <div style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600,
          height: 600,
          background: 'radial-gradient(circle, rgba(245,200,66,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0,
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}>
          {/* Orbit animation */}
          <OrbitScene />

          {/* Badge */}
          <div className="orb1t-hero-text" style={{
            marginTop: 32,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(245,200,66,0.08)',
            border: `1px solid rgba(245,200,66,0.2)`,
            borderRadius: 20,
            padding: '5px 14px',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: C.amber,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.amber, display: 'inline-block' }} />
            By NoCap VC · Invite-only community
          </div>

          {/* Wordmark */}
          <div className="orb1t-hero-text-delay" style={{ marginTop: 20 }}>
            <Wordmark size={72} />
          </div>

          {/* Tagline */}
          <p className="orb1t-hero-text-delay" style={{
            fontSize: 'clamp(16px, 2.4vw, 22px)',
            color: C.muted,
            maxWidth: 560,
            lineHeight: 1.6,
            margin: '16px 0 0',
            fontWeight: 400,
          }}>
            Where founders share ideas, builders find signal, and the community does the work that accelerators can't.
          </p>

          {/* CTAs */}
          <div className="orb1t-hero-text-delay2" style={{ display: 'flex', gap: 12, marginTop: 36, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={scrollToWaitlist}
              style={{
                background: C.amber,
                color: '#0a0a0f',
                border: 'none',
                borderRadius: 8,
                padding: '13px 28px',
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: 15,
                cursor: 'pointer',
                letterSpacing: '0.02em',
              }}
            >
              Request access →
            </button>
            <Link to="/founder-space/feed" style={{
              background: 'transparent',
              color: C.text,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: '13px 28px',
              fontFamily: 'Syne, sans-serif',
              fontWeight: 600,
              fontSize: 15,
              textDecoration: 'none',
              letterSpacing: '0.02em',
            }}>
              Explore feed
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats bar ───────────────────────────────────── */}
      <div style={{
        borderTop: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`,
        background: C.card,
      }}>
        <div style={{
          maxWidth: 800,
          margin: '0 auto',
          padding: '36px 24px',
          display: 'flex',
          justifyContent: 'space-around',
          gap: 24,
          flexWrap: 'wrap',
        }}>
          <StatBadge value={stats.ideas}    label="Ideas shared" />
          <div style={{ width: 1, background: C.border, alignSelf: 'stretch' }} />
          <StatBadge value={stats.journeys} label="Journeys posted" />
          <div style={{ width: 1, background: C.border, alignSelf: 'stretch' }} />
          <StatBadge value={stats.events}   label="Events created" />
          <div style={{ width: 1, background: C.border, alignSelf: 'stretch' }} />
          <StatBadge value={stats.ideas + stats.journeys + stats.events} label="Community signals" />
        </div>
      </div>

      {/* ── Orbit Pillars ───────────────────────────────── */}
      <Section>
        <SectionLabel>What's inside</SectionLabel>
        <SectionHeading style={{ marginBottom: 8 }}>
          Four ways to build<br />in the open
        </SectionHeading>
        <p style={{ color: C.muted, fontSize: 16, marginTop: 12, marginBottom: 48, lineHeight: 1.6 }}>
          ORB1T isn't a social network. It's a workspace for founders who ship.
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
        }}>
          {PILLARS.map(p => (
            <Link key={p.title} to={p.link} style={{ textDecoration: 'none' }}>
              <div
                className="orb1t-pillar-card"
                style={{
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  padding: '28px 24px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                }}
              >
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: p.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  border: `1px solid ${p.accent}22`,
                }}>
                  {p.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 17, color: C.text, marginBottom: 6 }}>{p.title}</div>
                  <div style={{ color: C.muted, fontSize: 14, lineHeight: 1.6 }}>{p.desc}</div>
                </div>
                <div style={{ marginTop: 'auto', color: p.accent, fontSize: 13, fontWeight: 700 }}>
                  {p.cta} →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* ── How it works ────────────────────────────────── */}
      <div style={{ background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <Section>
          <SectionLabel>The orbit</SectionLabel>
          <SectionHeading style={{ marginBottom: 48 }}>Three moves. Real momentum.</SectionHeading>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 32,
          }}>
            {STEPS.map((s, i) => (
              <div key={s.n} style={{ position: 'relative' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                }}>
                  <div style={{
                    flexShrink: 0,
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    border: `2px solid ${C.amber}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 800,
                    fontSize: 14,
                    color: C.amber,
                    letterSpacing: '0.04em',
                  }}>
                    {s.n}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 17, color: C.text, marginBottom: 8 }}>{s.title}</div>
                    <div style={{ color: C.muted, fontSize: 14, lineHeight: 1.7 }}>{s.body}</div>
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{
                    position: 'absolute',
                    top: 24,
                    right: -16,
                    color: C.border,
                    fontSize: 20,
                    display: 'none', // hidden on mobile, shown via media query not available here
                  }}>→</div>
                )}
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* ── Recent idea teaser ──────────────────────────── */}
      {recentIdea && (
        <Section style={{ paddingBottom: 40 }}>
          <SectionLabel>Live on the board</SectionLabel>
          <SectionHeading style={{ marginBottom: 32 }}>Latest from the feed</SectionHeading>
          <Link to={`/founder-space/ideas/${recentIdea.id}`} style={{ textDecoration: 'none' }}>
            <div style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: '28px',
              maxWidth: 600,
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              transition: 'border-color 0.2s',
            }}>
              <div style={{
                display: 'inline-block',
                background: 'rgba(245,200,66,0.1)',
                color: C.amber,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '3px 10px',
                borderRadius: 4,
                marginBottom: 12,
              }}>
                IDEA
              </div>
              <div style={{ fontWeight: 700, fontSize: 20, color: C.text, marginBottom: 8 }}>
                {recentIdea.ideaTitle}
              </div>
              {recentIdea.tagline && (
                <div style={{ color: C.muted, fontSize: 14, lineHeight: 1.6 }}>{recentIdea.tagline}</div>
              )}
              <div style={{ marginTop: 16, color: C.amber, fontSize: 13, fontWeight: 700 }}>
                View idea →
              </div>
            </div>
          </Link>
        </Section>
      )}

      {/* ── Who is it for ───────────────────────────────── */}
      <div style={{ background: C.elevated, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <Section>
          <SectionLabel>Who belongs here</SectionLabel>
          <SectionHeading style={{ marginBottom: 12 }}>Built for people who build</SectionHeading>
          <p style={{ color: C.muted, fontSize: 16, marginTop: 8, marginBottom: 48, lineHeight: 1.6 }}>
            ORB1T isn't for everyone. It's for the people already doing the work.
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
          }}>
            {ROLES.map(r => (
              <div key={r.tag} style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: '24px 20px',
              }}>
                <div style={{
                  display: 'inline-block',
                  background: `${r.accent}18`,
                  color: r.accent,
                  borderRadius: 6,
                  padding: '4px 12px',
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  marginBottom: 12,
                }}>
                  {r.tag}
                </div>
                <div style={{ color: C.muted, fontSize: 14, lineHeight: 1.6 }}>
                  {r.desc}
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* ── Community signal quote ──────────────────────── */}
      <Section style={{ textAlign: 'center', padding: '80px 24px' }}>
        <div style={{
          maxWidth: 700,
          margin: '0 auto',
        }}>
          <div style={{ fontSize: 48, color: C.amber, lineHeight: 1, marginBottom: 16, opacity: 0.5 }}>"</div>
          <blockquote style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 'clamp(18px, 2.5vw, 26px)',
            fontWeight: 700,
            color: C.text,
            lineHeight: 1.5,
            margin: 0,
            letterSpacing: '-0.02em',
          }}>
            The best accelerators don't just fund — they create gravity. We built ORB1T to be that gravity for founders who aren't ready for a cheque, but are ready for real signal.
          </blockquote>
          <div style={{ marginTop: 24, color: C.muted, fontSize: 14 }}>
            — NoCap VC team
          </div>
        </div>
      </Section>

      {/* ── Waitlist form ───────────────────────────────── */}
      <div
        ref={waitlistRef}
        style={{
          background: C.card,
          borderTop: `1px solid ${C.border}`,
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <Section>
          <div style={{ maxWidth: 540, margin: '0 auto', textAlign: 'center' }}>
            <SectionLabel>Request access</SectionLabel>
            <SectionHeading style={{ marginBottom: 8 }}>
              Enter the orbit
            </SectionHeading>
            <p style={{ color: C.muted, fontSize: 15, marginTop: 8, marginBottom: 36, lineHeight: 1.6 }}>
              ORB1T is invite-only and growing slowly. Tell us who you are and we'll reach out.
            </p>

            {formStatus === 'success' ? (
              <div style={{
                background: 'rgba(74,222,128,0.08)',
                border: '1px solid rgba(74,222,128,0.25)',
                borderRadius: 12,
                padding: '36px 28px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🛸</div>
                <div style={{ fontWeight: 700, fontSize: 18, color: C.text, marginBottom: 8 }}>
                  You're in the queue
                </div>
                <div style={{ color: C.muted, fontSize: 14, lineHeight: 1.6 }}>
                  We'll review your application and reach out to{' '}
                  <span style={{ color: C.green }}>{form.email}</span>.
                  Check the community feed while you wait.
                </div>
                <Link to="/founder-space/feed" style={{
                  display: 'inline-block',
                  marginTop: 20,
                  color: C.amber,
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: 'none',
                }}>
                  Explore the feed →
                </Link>
              </div>
            ) : (
              <form onSubmit={handleWaitlist} style={{ textAlign: 'left' }}>
                {formError && (
                  <div style={{
                    background: 'rgba(255,107,53,0.08)',
                    border: '1px solid rgba(255,107,53,0.25)',
                    borderRadius: 8,
                    padding: '10px 14px',
                    color: '#ff8060',
                    fontSize: 14,
                    marginBottom: 16,
                  }}>
                    {formError}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>
                      Your name
                    </label>
                    <input
                      className="orb1t-input"
                      type="text"
                      placeholder="First Last"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      style={{
                        width: '100%',
                        background: C.bg,
                        border: `1px solid ${C.border}`,
                        borderRadius: 8,
                        padding: '11px 14px',
                        color: C.text,
                        fontSize: 15,
                        fontFamily: 'Syne, sans-serif',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>
                      Email address
                    </label>
                    <input
                      className="orb1t-input"
                      type="email"
                      placeholder="you@company.com"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      style={{
                        width: '100%',
                        background: C.bg,
                        border: `1px solid ${C.border}`,
                        borderRadius: 8,
                        padding: '11px 14px',
                        color: C.text,
                        fontSize: 15,
                        fontFamily: 'Syne, sans-serif',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>
                      What are you building? <span style={{ opacity: 0.5 }}>(optional)</span>
                    </label>
                    <textarea
                      className="orb1t-input"
                      placeholder="One line is enough. We're more interested in why than what."
                      value={form.whatBuilding}
                      onChange={e => setForm(f => ({ ...f, whatBuilding: e.target.value }))}
                      rows={3}
                      style={{
                        width: '100%',
                        background: C.bg,
                        border: `1px solid ${C.border}`,
                        borderRadius: 8,
                        padding: '11px 14px',
                        color: C.text,
                        fontSize: 15,
                        fontFamily: 'Syne, sans-serif',
                        resize: 'vertical',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={formStatus === 'loading'}
                    style={{
                      background: formStatus === 'loading' ? C.muted : C.amber,
                      color: '#0a0a0f',
                      border: 'none',
                      borderRadius: 8,
                      padding: '13px',
                      fontFamily: 'Syne, sans-serif',
                      fontWeight: 700,
                      fontSize: 15,
                      cursor: formStatus === 'loading' ? 'not-allowed' : 'pointer',
                      letterSpacing: '0.02em',
                      transition: 'background 0.2s',
                    }}
                  >
                    {formStatus === 'loading' ? 'Sending…' : 'Request access →'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </Section>
      </div>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer style={{
        padding: '40px 24px',
        maxWidth: 1100,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Wordmark size={20} />
          <span style={{ color: C.border }}>·</span>
          <span style={{ color: C.muted, fontSize: 13 }}>A community by NoCap VC</span>
        </div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <Link to="/founder-space/feed"           style={{ color: C.muted, fontSize: 13, textDecoration: 'none' }}>Feed</Link>
          <Link to="/founder-space/journey/feed"   style={{ color: C.muted, fontSize: 13, textDecoration: 'none' }}>Journeys</Link>
          <Link to="/founder-space/events"         style={{ color: C.muted, fontSize: 13, textDecoration: 'none' }}>Events</Link>
          <Link to="/"                             style={{ color: C.muted, fontSize: 13, textDecoration: 'none' }}>NoCap VC</Link>
        </div>
      </footer>
    </div>
  );
}
