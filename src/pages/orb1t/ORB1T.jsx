import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  collection, addDoc, serverTimestamp, getCountFromServer,
  query, where, orderBy, limit, getDocs,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../lib/auth';
import './orb1t.css';

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────── */
const C = {
  bg:       '#0a0a0f',
  card:     '#111118',
  elevated: '#14141e',
  amber:    '#f5c842',
  orange:   '#ff6b35',
  purple:   '#8b5cf6',
  green:    '#4ade80',
  text:     '#f0ece0',
  muted:    '#7a7060',
  border:   '#1e1e2a',
};

const PILLARS = [
  {
    icon: '💡',
    num: '01',
    title: 'Idea Board',
    accent: C.amber,
    alphaAccent: 'rgba(245,200,66,0.08)',
    desc: "A thesis in orbit travels farther than one kept in your head. Pin it. Let the community's gravity test whether it has escape velocity — five structured axes, zero empty applause.",
    stat: 'axes of honest signal',
    statN: '5',
    link: '/founder-space/feed',
    cta: 'Enter the board',
  },
  {
    icon: '🛤️',
    num: '02',
    title: 'Journey Board',
    accent: C.purple,
    alphaAccent: 'rgba(139,92,246,0.08)',
    desc: 'Every orbit has an origin point. Share yours — where you launched from, what failed mid-flight, what you rebuilt. Your trajectory is the signal other builders navigate by.',
    stat: 'chapters in every trajectory',
    statN: '5',
    link: '/founder-space/journey/feed',
    cta: 'Read trajectories',
  },
  {
    icon: '⚡',
    num: '03',
    title: 'Launch Windows',
    accent: C.orange,
    alphaAccent: 'rgba(255,107,53,0.08)',
    desc: "In orbital mechanics, a launch window is a precise moment when conditions align for maximum velocity. Sprints, book clubs, open collabs — catch the window or drift.",
    stat: 'event formats. pick your window.',
    statN: '4',
    link: '/founder-space/events',
    cta: 'See open windows',
  },
  {
    icon: '📡',
    num: '04',
    title: 'Signal Ratings',
    accent: C.green,
    alphaAccent: 'rgba(74,222,128,0.08)',
    desc: "In space, everything emits signal — even dead stars. Rate other builders' ideas. Give honest, structured light. The community's collective signal is the product.",
    stat: 'minutes to give a full rating',
    statN: '<3',
    link: '/founder-space/feed',
    cta: 'Give signal',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Choose your trajectory',
    accent: C.amber,
    body: "Apply for a position in the orbit. We review every application — not to gatekeep, but because orbital stability depends on who's in the field.",
  },
  {
    n: '02',
    title: 'Emit your signal',
    accent: C.orange,
    body: 'Share an idea, publish a journey chapter, or open a launch window. Everything you put into the orbit becomes signal — discoverable, rateable, real.',
  },
  {
    n: '03',
    title: 'Create gravitational mass',
    accent: C.purple,
    body: 'Rate ideas. Join sprints. React to trajectories. The more signal you emit and the more honestly you engage, the more gravity you accumulate in the orbit.',
  },
];

const ROLES = [
  {
    tag: 'Building something',
    icon: '🚀',
    accent: C.amber,
    headline: 'Test your thesis before it costs you.',
    desc: "Product, project, startup, side thing — doesn't matter. Post it. Let the community's gravity tell you if it has escape velocity before you commit trajectory.",
  },
  {
    tag: 'Looking to collaborate',
    icon: '🔧',
    accent: C.orange,
    headline: 'Find builders in complementary orbits.',
    desc: "You have skills. You need the right problem or the right co-builder. ORB1T's launch windows and open collabs are how orbits intersect without cold DMs.",
  },
  {
    tag: 'Here to learn',
    icon: '📡',
    accent: C.purple,
    headline: 'Grow by staying close to real work.',
    desc: "Read trajectories. Rate ideas. Join book clubs. You don't need to be shipping something to belong — you need to be close to people who are. Proximity accelerates.",
  },
  {
    tag: 'Looking to push and be pushed',
    icon: '⚡',
    accent: C.green,
    headline: 'Find people who refuse to coast.',
    desc: "The best accountability isn't an app or a habit tracker. It's a community of builders in similar orbits who notice when you drift — and say something.",
  },
];

const MANIFESTO_LINES = [
  'In physics, an orbit is not falling.',
  "It's controlled movement — always pulled, always moving forward.",
  "The moment you stop moving, you don't hover. You fall back.",
  'ORB1T is built for builders who refuse to fall back.',
];

/* ─────────────────────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────────────────────── */

function Wordmark({ size = 32, style = {} }) {
  return (
    <span style={{
      fontFamily: 'Syne, sans-serif',
      fontWeight: 800,
      fontSize: size,
      letterSpacing: '-0.025em',
      color: C.text,
      lineHeight: 1,
      ...style,
    }}>
      ORB<span style={{ color: C.amber }}>1</span>T
    </span>
  );
}

function OrbitScene({ size = 480 }) {
  return (
    <div className="orb1t-scene" style={{ width: size, height: size }}>
      {/* Outermost faint ring */}
      <div className="orb1t-ring orb1t-ring-4">
        <div className="orb1t-dot orb1t-dot-green" />
      </div>
      {/* Ring 3 — purple */}
      <div className="orb1t-ring orb1t-ring-3">
        <div className="orb1t-dot orb1t-dot-purple" />
        <div className="orb1t-dot-2-purple" />
      </div>
      {/* Ring 2 — orange */}
      <div className="orb1t-ring orb1t-ring-2">
        <div className="orb1t-dot orb1t-dot-orange" />
        <div className="orb1t-dot-2-orange" />
      </div>
      {/* Ring 1 — amber (innermost) */}
      <div className="orb1t-ring orb1t-ring-1">
        <div className="orb1t-dot orb1t-dot-amber" />
        <div className="orb1t-dot-2-amber" />
      </div>
      {/* Core */}
      <div className="orb1t-core" />
      <div className="orb1t-core-inner" />
    </div>
  );
}

/* Floating background particles */
function Particles() {
  const shapes = [
    { cls: 'fp fp-a fp-circle', style: { width:18, height:18, top:'8%',  left:'6%',  borderColor:'rgba(245,200,66,0.25)' } },
    { cls: 'fp fp-b fp-square',  style: { width:12, height:12, top:'18%', left:'88%', borderColor:'rgba(139,92,246,0.3)', animationDelay:'1s' } },
    { cls: 'fp fp-c fp-circle', style: { width:8,  height:8,  top:'70%', left:'5%',  borderColor:'rgba(255,107,53,0.3)',  animationDelay:'2s' } },
    { cls: 'fp fp-d fp-circle', style: { width:22, height:22, top:'80%', left:'90%', borderColor:'rgba(245,200,66,0.18)', animationDelay:'0.5s' } },
    { cls: 'fp fp-e fp-square',  style: { width:10, height:10, top:'45%', left:'3%',  borderColor:'rgba(74,222,128,0.22)',  animationDelay:'3s' } },
    { cls: 'fp fp-f fp-circle', style: { width:6,  height:6,  top:'25%', left:'95%', borderColor:'rgba(245,200,66,0.35)', animationDelay:'1.5s' } },
    { cls: 'fp fp-g fp-diamond', style: { width:14, height:14, top:'60%', left:'92%', borderColor:'rgba(255,107,53,0.22)', animationDelay:'4s' } },
    { cls: 'fp fp-h fp-circle', style: { width:30, height:30, top:'90%', left:'12%', borderColor:'rgba(139,92,246,0.15)', animationDelay:'2.5s' } },
    { cls: 'fp fp-i fp-square',  style: { width:8,  height:8,  top:'5%',  left:'55%', borderColor:'rgba(74,222,128,0.2)',  animationDelay:'0.8s' } },
    { cls: 'fp fp-j fp-circle', style: { width:16, height:16, top:'55%', left:'96%', borderColor:'rgba(245,200,66,0.2)', animationDelay:'3.5s' } },
  ];
  return (
    <div className="orb1t-particles">
      {shapes.map((s, i) => (
        <div key={i} className={s.cls} style={s.style} />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   JOIN MODAL
───────────────────────────────────────────────────────────── */
function JoinModal({ onClose }) {
  const [form, setForm]           = useState({ name: '', email: '', linkedin: '', instagram: '', whatBuilding: '' });
  const [formStatus, setFormStatus] = useState('idle');
  const [formError, setFormError] = useState('');

  // Close on Escape
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setFormError('Name and email are required.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      setFormError('Enter a valid email address.');
      return;
    }
    setFormStatus('loading');
    setFormError('');
    try {
      await addDoc(collection(db, 'orb1t_interest'), {
        name:         form.name.trim(),
        email:        form.email.trim(),
        linkedin:     form.linkedin.trim(),
        instagram:    form.instagram.trim(),
        whatBuilding: form.whatBuilding.trim(),
        source:       'orb1t_landing',
        createdAt:    serverTimestamp(),
      });
      setFormStatus('success');
    } catch {
      setFormStatus('error');
      setFormError('Something went wrong. Please try again.');
    }
  }

  const inputStyle = {
    width: '100%',
    background: '#0a0a0f',
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: '11px 14px',
    color: C.text,
    fontSize: 15,
    fontFamily: 'Syne, sans-serif',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: C.muted,
    marginBottom: 7,
  };

  return (
    <div
      className="orb1t-modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        background: 'rgba(5,5,10,0.88)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="orb1t-modal-box"
        onClick={e => e.stopPropagation()}
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 18,
          width: '100%',
          maxWidth: 500,
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '36px 32px',
          position: 'relative',
          boxShadow: '0 0 0 1px rgba(245,200,66,0.08), 0 32px 80px rgba(0,0,0,0.7)',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${C.border}`,
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: C.muted,
            cursor: 'pointer',
            fontSize: 14,
            transition: 'background 0.2s',
          }}
        >
          ✕
        </button>

        {formStatus === 'success' ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            {/* Orbit animation mini */}
            <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 24px' }}>
              <div className="orb1t-ring" style={{ width: 80, height: 80, border: `1px dashed ${C.amber}44`, animation: 'orb-spin 8s linear infinite' }}>
                <div className="orb1t-dot orb1t-dot-amber" />
              </div>
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                width: 28, height: 28, background: C.amber,
                borderRadius: '50%', transform: 'translate(-50%,-50%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16,
              }}>🛸</div>
            </div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 24, color: C.text, marginBottom: 10 }}>
              You're in the orbit.
            </div>
            <div style={{ color: C.muted, fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
              Application received. We review every submission manually — we'll reach out to{' '}
              <span style={{ color: C.amber }}>{form.email}</span> within 48 hours.
            </div>
            <Link
              to="/founder-space/feed"
              onClick={onClose}
              style={{
                display: 'inline-block',
                background: C.amber,
                color: '#0a0a0f',
                borderRadius: 8,
                padding: '12px 24px',
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: 14,
                textDecoration: 'none',
              }}
            >
              Explore the feed while you wait →
            </Link>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ marginBottom: 28 }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(245,200,66,0.08)',
                border: `1px solid rgba(245,200,66,0.2)`,
                borderRadius: 20,
                padding: '4px 12px',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: C.amber,
                marginBottom: 16,
              }}>
                <span className="orb1t-live-dot" />
                Request access
              </div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, color: C.text, lineHeight: 1.2, marginBottom: 8 }}>
                Choose your <span className="orb1t-gradient-text">trajectory</span>
              </div>
              <div style={{ color: C.muted, fontSize: 14, lineHeight: 1.6 }}>
                Invite-only. Reviewed manually. An orbit is only as strong as the mass inside it.
              </div>
            </div>

            {formError && (
              <div style={{
                background: 'rgba(255,107,53,0.08)',
                border: '1px solid rgba(255,107,53,0.25)',
                borderRadius: 8,
                padding: '10px 14px',
                color: '#ff8060',
                fontSize: 13,
                marginBottom: 16,
              }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Name + Email row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Full name *</label>
                    <input
                      className="orb1t-input"
                      type="text"
                      placeholder="Arjun Sharma"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Email *</label>
                    <input
                      className="orb1t-input"
                      type="email"
                      placeholder="you@startup.com"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* LinkedIn + Instagram row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>LinkedIn URL <span style={{ opacity: 0.5, fontSize: 9 }}>(optional)</span></label>
                    <div style={{ position: 'relative' }}>
                      <span style={{
                        position: 'absolute', left: 12, top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: 13, color: C.muted, pointerEvents: 'none',
                      }}>in/</span>
                      <input
                        className="orb1t-input"
                        type="text"
                        placeholder="yourhandle"
                        value={form.linkedin}
                        onChange={e => setForm(f => ({ ...f, linkedin: e.target.value }))}
                        style={{ ...inputStyle, paddingLeft: 36 }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Instagram <span style={{ opacity: 0.5, fontSize: 9 }}>(optional)</span></label>
                    <div style={{ position: 'relative' }}>
                      <span style={{
                        position: 'absolute', left: 12, top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: 13, color: C.muted, pointerEvents: 'none',
                      }}>@</span>
                      <input
                        className="orb1t-input"
                        type="text"
                        placeholder="handle"
                        value={form.instagram}
                        onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))}
                        style={{ ...inputStyle, paddingLeft: 30 }}
                      />
                    </div>
                  </div>
                </div>

                {/* What building */}
                <div>
                  <label style={labelStyle}>What are you building? <span style={{ opacity: 0.5, fontSize: 9 }}>(optional)</span></label>
                  <textarea
                    className="orb1t-input"
                    placeholder="One sentence. We care more about why than what."
                    value={form.whatBuilding}
                    onChange={e => setForm(f => ({ ...f, whatBuilding: e.target.value }))}
                    rows={3}
                    style={{ ...inputStyle, resize: 'none' }}
                  />
                </div>

                <button
                  type="submit"
                  className="orb1t-btn-primary"
                  disabled={formStatus === 'loading'}
                  style={{
                    background: formStatus === 'loading' ? C.muted : C.amber,
                    color: '#0a0a0f',
                    border: 'none',
                    borderRadius: 10,
                    padding: '14px',
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 800,
                    fontSize: 15,
                    cursor: formStatus === 'loading' ? 'not-allowed' : 'pointer',
                    letterSpacing: '0.02em',
                    width: '100%',
                  }}
                >
                  {formStatus === 'loading' ? 'Sending…' : 'Request access →'}
                </button>

                <div style={{ textAlign: 'center', color: C.muted, fontSize: 12 }}>
                  No spam. No pitch decks solicited. Just the community.
                </div>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
export default function ORB1T() {
  const { user } = useAuth();
  const [showModal, setShowModal]   = useState(false);
  const [stats, setStats]           = useState({ ideas: 0, journeys: 0, events: 0, members: 0 });
  const [recentIdea, setRecentIdea] = useState(null);
  const [tickerIdx, setTickerIdx]   = useState(0);

  const openModal  = useCallback(() => setShowModal(true),  []);
  const closeModal = useCallback(() => setShowModal(false), []);

  const TICKER_ITEMS = [
    `${stats.ideas || 47} ideas in orbit — each five-axis rated`,
    `${stats.journeys || 23} trajectories published`,
    `${stats.events || 12} launch windows opened`,
    'Signal, not applause · Five structured axes',
    'Invite-only · Builders push builders',
  ];

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
          ideas:    ideasSnap.data().count    || 47,
          journeys: journeysSnap.data().count || 23,
          events:   eventsSnap.data().count   || 12,
          members:  ideasSnap.data().count + journeysSnap.data().count || 70,
        });
      } catch {
        setStats({ ideas: 47, journeys: 23, events: 12, members: 70 });
      }

      try {
        const snap = await getDocs(
          query(collection(db, 'ideas'), where('status', '==', 'published'), orderBy('publishedAt', 'desc'), limit(1))
        );
        if (!snap.empty) setRecentIdea({ id: snap.docs[0].id, ...snap.docs[0].data() });
      } catch {}
    }
    load();
  }, []);

  // Ticker rotation
  useEffect(() => {
    const t = setInterval(() => setTickerIdx(i => (i + 1) % TICKER_ITEMS.length), 3500);
    return () => clearInterval(t);
  }, [TICKER_ITEMS.length]);

  /* ── Layout helpers ─────────────────────────── */
  const Divider = () => <hr className="orb1t-divider" />;

  const Label = ({ children }) => (
    <div style={{
      fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
      textTransform: 'uppercase', color: C.amber, marginBottom: 14,
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span style={{ width: 20, height: 1, background: C.amber, display: 'inline-block', opacity: 0.5 }} />
      {children}
    </div>
  );

  const H2 = ({ children, style = {} }) => (
    <h2 style={{
      fontFamily: 'Syne, sans-serif', fontWeight: 800,
      fontSize: 'clamp(30px, 4vw, 48px)', color: C.text,
      lineHeight: 1.1, letterSpacing: '-0.03em', margin: 0, ...style,
    }}>
      {children}
    </h2>
  );

  const wrap = { maxWidth: 1100, margin: '0 auto', padding: '0 28px' };

  /* ────────────────────────────────────────────── */
  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: 'Syne, sans-serif', minHeight: '100vh', overflowX: 'hidden' }}>

      {showModal && <JoinModal onClose={closeModal} />}

      {/* ══ TOP NAV ════════════════════════════════ */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10,10,15,0.9)',
        backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${C.border}`,
        height: 56,
      }}>
        <div style={{ ...wrap, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>nocapvc /</span>
            <Wordmark size={17} />
          </Link>
          <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
            {[
              ['/founder-space/feed', 'Feed'],
              ['/founder-space/journey/feed', 'Journeys'],
              ['/founder-space/events', 'Events'],
            ].map(([to, label]) => (
              <Link key={to} to={to} style={{ color: C.muted, textDecoration: 'none', fontSize: 13, letterSpacing: '0.02em', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = C.text}
                onMouseLeave={e => e.target.style.color = C.muted}
              >
                {label}
              </Link>
            ))}
            {user ? (
              <Link to="/founder-space/feed" style={{
                background: C.amber, color: '#0a0a0f', borderRadius: 7,
                padding: '7px 16px', fontWeight: 700, fontSize: 13, textDecoration: 'none',
              }}>
                Open feed →
              </Link>
            ) : (
              <button
                className="orb1t-btn-primary"
                onClick={openModal}
                style={{
                  background: C.amber, color: '#0a0a0f', border: 'none',
                  borderRadius: 7, padding: '7px 16px', fontWeight: 700,
                  fontSize: 13, cursor: 'pointer',
                }}
              >
                Join now →
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ══ HERO ════════════════════════════════════ */}
      <section style={{ position: 'relative', minHeight: '96vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        {/* Ambient background glow */}
        <div style={{
          position: 'absolute', top: '20%', left: '55%',
          width: 700, height: 700,
          background: 'radial-gradient(circle, rgba(245,200,66,0.03) 0%, transparent 70%)',
          pointerEvents: 'none', transform: 'translate(-50%,-50%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', left: '5%',
          width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <Particles />

        <div style={{ ...wrap, width: '100%', paddingTop: 80, paddingBottom: 80 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 480px',
            gap: 64,
            alignItems: 'center',
          }}>
            {/* ── Copy ── */}
            <div style={{ position: 'relative', zIndex: 2 }}>
              {/* Status pill */}
              <div className="orb1t-u1" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(245,200,66,0.07)',
                border: `1px solid rgba(245,200,66,0.18)`,
                borderRadius: 20, padding: '5px 14px',
                fontSize: 11, fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: C.amber, marginBottom: 28,
              }}>
                <span className="orb1t-live-dot" />
                Now open · Invite-only community
              </div>

              {/* Headline — intentionally big */}
              <div className="orb1t-u2">
                <h1 style={{
                  fontFamily: 'Syne, sans-serif', fontWeight: 800,
                  fontSize: 'clamp(42px, 5.5vw, 76px)',
                  lineHeight: 1.02, letterSpacing: '-0.04em',
                  color: C.text, margin: 0,
                }}>
                  Create your<br />
                  <span className="orb1t-gradient-text">orbit.</span>
                </h1>
              </div>

              {/* Subheadline */}
              <p className="orb1t-u3" style={{
                fontSize: 'clamp(15px, 1.6vw, 19px)',
                color: C.muted, maxWidth: 520,
                lineHeight: 1.7, marginTop: 24, marginBottom: 0,
                fontWeight: 400,
              }}>
                Every signal you emit creates gravity. Share your idea, map your trajectory, open a launch window. ORB1T is where serious builders attract each other — and move faster together.
              </p>

              {/* Ticker */}
              <div className="orb1t-u4" style={{
                marginTop: 28,
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${C.border}`,
                borderRadius: 8, padding: '10px 16px',
                fontSize: 13, color: C.muted,
                overflow: 'hidden', height: 42,
              }}>
                <span style={{ color: C.green, fontSize: 9 }}>●</span>
                <span key={tickerIdx} className="orb1t-ticker-item" style={{ color: C.text }}>
                  {TICKER_ITEMS[tickerIdx]}
                </span>
              </div>

              {/* CTAs */}
              <div className="orb1t-u5" style={{ display: 'flex', gap: 12, marginTop: 36, flexWrap: 'wrap' }}>
                <button
                  onClick={openModal}
                  className="orb1t-btn-primary"
                  style={{
                    background: C.amber, color: '#0a0a0f',
                    border: 'none', borderRadius: 10,
                    padding: '14px 32px',
                    fontFamily: 'Syne, sans-serif', fontWeight: 800,
                    fontSize: 15, cursor: 'pointer', letterSpacing: '0.01em',
                    boxShadow: '0 4px 20px rgba(245,200,66,0.2)',
                  }}
                >
                  Join the orbit →
                </button>
                <Link
                  to="/founder-space/feed"
                  className="orb1t-btn-ghost"
                  style={{
                    background: 'transparent', color: C.text,
                    border: `1px solid ${C.border}`,
                    borderRadius: 10, padding: '14px 28px',
                    fontFamily: 'Syne, sans-serif', fontWeight: 600,
                    fontSize: 15, textDecoration: 'none', letterSpacing: '0.01em',
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                  }}
                >
                  Explore feed
                </Link>
              </div>

              {/* Social proof micro */}
              <div className="orb1t-u5" style={{
                display: 'flex', alignItems: 'center', gap: 6,
                marginTop: 20, color: C.muted, fontSize: 13,
              }}>
                <div style={{ display: 'flex', gap: -4 }}>
                  {['#f5c842','#ff6b35','#8b5cf6','#4ade80'].map((col, i) => (
                    <div key={i} style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: col, border: `2px solid ${C.bg}`,
                      marginLeft: i > 0 ? -7 : 0,
                    }} />
                  ))}
                </div>
                <span>
                  <span style={{ color: C.text, fontWeight: 700 }}>{stats.ideas + stats.journeys || 70}+ </span>
                  builders already in this orbit
                </span>
              </div>
            </div>

            {/* ── Orbit animation ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <OrbitScene size={480} />
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          color: C.muted, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          <div style={{
            width: 1, height: 40,
            background: `linear-gradient(to bottom, ${C.amber}44, transparent)`,
          }} />
          scroll
        </div>
      </section>

      {/* ══ STATS BAR ═══════════════════════════════ */}
      <Divider />
      <div style={{ background: C.card }}>
        <div style={{ ...wrap }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            padding: '40px 0',
            gap: 24,
          }}>
            {[
              { n: stats.ideas,    label: 'Ideas in orbit',          sub: 'Five-axis rated' },
              { n: stats.journeys, label: 'Trajectories shared',     sub: 'Real origin stories' },
              { n: stats.events,   label: 'Launch windows opened',   sub: 'Sprints & collabs' },
              { n: stats.ideas + stats.journeys + stats.events || 82, label: 'Total signals emitted', sub: 'Growing every day' },
            ].map((s, i) => (
              <div key={i} style={{
                textAlign: 'center',
                borderLeft: i > 0 ? `1px solid ${C.border}` : 'none',
                paddingLeft: i > 0 ? 24 : 0,
              }}>
                <span className="orb1t-stat-num">
                  {s.n < 10 ? `0${s.n}` : `${s.n}+`}
                </span>
                <div style={{ color: C.text, fontWeight: 600, fontSize: 14, marginTop: 6 }}>{s.label}</div>
                <div style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Divider />

      {/* ══ PROBLEM STATEMENT ════════════════════════ */}
      <section style={{ padding: '100px 0 80px', position: 'relative', overflow: 'hidden' }}>
        {/* Large decorative "?" */}
        <div className="orb1t-deco-num" style={{
          position: 'absolute', right: '-2%', top: '50%', transform: 'translateY(-50%)',
          fontSize: 320, color: 'rgba(245,200,66,0.025)', lineHeight: 1, pointerEvents: 'none',
        }}>
          ?
        </div>
        <div style={wrap}>
          <Label>The problem</Label>
          <div style={{ maxWidth: 780 }}>
            <H2>
              Most feedback is<br />
              <span style={{ color: C.amber }}>atmospheric drag.</span>
            </H2>
            <p style={{ color: C.muted, fontSize: 16, marginTop: 12, lineHeight: 1.6, marginBottom: 40 }}>
              Drag slows you down without telling you why you're falling. Most builder communities are full of it.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                { icon: '❌', text: "LinkedIn applause — solar wind. Looks impressive, carries zero navigational information." },
                { icon: '❌', text: 'Accelerator filters that select for pitch polish, not trajectory. They reward presentation, not orbit.' },
                { icon: '❌', text: 'Generic encouragement from people who have never left the launchpad themselves.' },
                { icon: '✓', accent: true, text: 'ORB1T gives you structured signal from builders who know what orbital mechanics feel like — because they\'re still in it.' },
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                  padding: '18px 20px',
                  background: item.accent ? 'rgba(245,200,66,0.06)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${item.accent ? 'rgba(245,200,66,0.2)' : C.border}`,
                  borderRadius: 10,
                }}>
                  <span style={{ fontSize: 16, flexShrink: 0, marginTop: 2 }}>{item.icon}</span>
                  <span style={{ color: item.accent ? C.text : C.muted, fontSize: 15, lineHeight: 1.6, fontWeight: item.accent ? 600 : 400 }}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ FOUR PILLARS ═════════════════════════════ */}
      <Divider />
      <section style={{ padding: '100px 0', background: C.card }}>
        {/* Large deco number */}
        <div className="orb1t-deco-num" style={{
          position: 'absolute', left: '-1%',
          fontSize: 260, color: 'rgba(245,200,66,0.025)', lineHeight: 1,
        }}>4</div>
        <div style={wrap}>
          <Label>Inside ORB1T</Label>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 56, flexWrap: 'wrap', gap: 16 }}>
            <H2>Four instruments<br />of the orbit</H2>
            <p style={{ color: C.muted, fontSize: 15, maxWidth: 360, lineHeight: 1.65, margin: 0 }}>
              ORB1T isn't a social network. It's a structured field where builders emit signal, attract gravity, and accelerate — together.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {PILLARS.map((p, i) => (
              <Link key={p.title} to={p.link} style={{ textDecoration: 'none' }}>
                <div
                  className="orb1t-card"
                  style={{
                    background: C.elevated,
                    border: `1px solid ${C.border}`,
                    borderRadius: 14,
                    padding: '28px 24px 24px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
                  }}
                >
                  {/* Subtle top accent line */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    height: 2, background: `linear-gradient(90deg, ${p.accent}00, ${p.accent}88, ${p.accent}00)`,
                  }} />
                  {/* Pillar number */}
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: p.accent, opacity: 0.6 }}>
                    {p.num}
                  </div>
                  {/* Icon */}
                  <div
                    className="orb1t-icon-box"
                    style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: p.alphaAccent,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22, border: `1px solid ${p.accent}22`,
                    }}
                  >
                    {p.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 18, color: C.text, marginBottom: 8 }}>{p.title}</div>
                    <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>{p.desc}</div>
                  </div>
                  {/* Mini stat */}
                  <div style={{
                    marginTop: 4,
                    display: 'flex', alignItems: 'baseline', gap: 6,
                    borderTop: `1px solid ${C.border}`, paddingTop: 14,
                  }}>
                    <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22, color: p.accent }}>{p.statN}</span>
                    <span style={{ color: C.muted, fontSize: 12 }}>{p.stat}</span>
                  </div>
                  <div style={{ color: p.accent, fontSize: 13, fontWeight: 700, marginTop: 'auto' }}>
                    {p.cta} →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ════════════════════════════ */}
      <Divider />
      <section style={{ padding: '100px 0', position: 'relative', overflow: 'hidden' }}>
        {/* Deco */}
        <div className="orb1t-deco-num" style={{
          position: 'absolute', right: '-1%', bottom: '10%',
          fontSize: 260, color: 'rgba(139,92,246,0.025)', lineHeight: 1,
        }}>3</div>
        <div style={wrap}>
          <Label>The orbit</Label>
          <H2 style={{ marginBottom: 64 }}>Orbital mechanics<br />in three moves.</H2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 0 }}>
            {STEPS.map((s, i) => (
              <div key={s.n} style={{ display: 'flex', gap: 0, position: 'relative' }}>
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div style={{
                    position: 'absolute',
                    top: 24, left: '55%',
                    width: '45%', height: 1,
                    background: `linear-gradient(90deg, ${s.accent}44, transparent)`,
                    zIndex: 0,
                  }} />
                )}
                <div style={{ padding: '0 32px 0 0', position: 'relative', zIndex: 1, flex: 1 }}>
                  {/* Step circle */}
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    border: `2px solid ${s.accent}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 20, background: `${s.accent}10`,
                  }}>
                    <span className="orb1t-step-n" style={{ color: s.accent }}>{s.n}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 20, color: C.text, marginBottom: 12 }}>{s.title}</div>
                  <div style={{ color: C.muted, fontSize: 14, lineHeight: 1.75 }}>{s.body}</div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA after steps */}
          <div style={{ marginTop: 56, display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={openModal}
              className="orb1t-btn-primary"
              style={{
                background: C.amber, color: '#0a0a0f', border: 'none',
                borderRadius: 10, padding: '13px 28px',
                fontFamily: 'Syne', fontWeight: 800, fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Start now →
            </button>
            <span style={{ color: C.muted, fontSize: 13 }}>Takes less than 2 minutes.</span>
          </div>
        </div>
      </section>

      {/* ══ WHO IS IT FOR ════════════════════════════ */}
      <Divider />
      <section style={{ padding: '100px 0', background: C.elevated }}>
        <div style={wrap}>
          <Label>Who belongs here</Label>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 56, flexWrap: 'wrap', gap: 16 }}>
            <H2>Different orbits.<br />Same gravity.</H2>
            <p style={{ color: C.muted, fontSize: 15, maxWidth: 360, lineHeight: 1.65, margin: 0 }}>
              ORB1T isn't just for startup founders. It's for anyone building something that matters — products, projects, skills, communities. If you're moving, you belong here.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {ROLES.map(r => (
              <div
                key={r.tag}
                className="orb1t-role-card orb1t-card"
                style={{
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 14, padding: '28px 24px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
                }}
              >
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
                }}>
                  <span style={{ fontSize: 24 }}>{r.icon}</span>
                  <span style={{
                    background: `${r.accent}18`, color: r.accent,
                    borderRadius: 6, padding: '4px 12px',
                    fontSize: 13, fontWeight: 700, letterSpacing: '0.04em',
                  }}>
                    {r.tag}
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 10, lineHeight: 1.3 }}>
                  {r.headline}
                </div>
                <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ MANIFESTO ════════════════════════════════ */}
      <Divider />
      <section style={{
        padding: '120px 28px',
        background: `linear-gradient(180deg, ${C.bg} 0%, #0c0c16 50%, ${C.bg} 100%)`,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Center ambient glow */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 600, height: 300,
          background: 'radial-gradient(ellipse, rgba(245,200,66,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 60, color: C.amber, lineHeight: 1, marginBottom: 24, opacity: 0.3 }}>"</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {MANIFESTO_LINES.map((line, i) => (
              <p key={i} style={{
                fontFamily: 'Syne', fontWeight: i === MANIFESTO_LINES.length - 1 ? 700 : 400,
                fontSize: i === 0 || i === 1 ? 'clamp(20px, 2.8vw, 32px)' : 'clamp(14px, 1.8vw, 20px)',
                color: i === MANIFESTO_LINES.length - 1 ? C.text : C.muted,
                lineHeight: 1.5, margin: '4px 0',
                letterSpacing: '-0.01em',
              }}>
                {line}
              </p>
            ))}
          </div>
          <div style={{ marginTop: 32, color: C.muted, fontSize: 13, letterSpacing: '0.04em' }}>
            — NoCap VC · built for builders who stay in motion
          </div>
        </div>
      </section>

      {/* ══ LIVE IDEA TEASER ═════════════════════════ */}
      {recentIdea && (
        <>
          <Divider />
          <section style={{ padding: '80px 0' }}>
            <div style={wrap}>
              <Label>Live on the board</Label>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
                <H2 style={{ fontSize: 28 }}>Latest from the community</H2>
                <Link to="/founder-space/feed" style={{ color: C.amber, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                  See all ideas →
                </Link>
              </div>
              <Link to={`/founder-space/ideas/${recentIdea.id}`} style={{ textDecoration: 'none' }}>
                <div className="orb1t-card" style={{
                  background: C.card, border: `1px solid ${C.border}`,
                  borderRadius: 14, padding: 28, maxWidth: 680,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                    background: `linear-gradient(90deg, ${C.amber}00, ${C.amber}88, ${C.amber}00)`,
                  }} />
                  <div style={{
                    display: 'inline-block',
                    background: 'rgba(245,200,66,0.1)',
                    color: C.amber, fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    padding: '3px 10px', borderRadius: 4, marginBottom: 14,
                  }}>
                    IDEA
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 22, color: C.text, marginBottom: 10, lineHeight: 1.3 }}>
                    {recentIdea.ideaTitle}
                  </div>
                  {recentIdea.tagline && (
                    <div style={{ color: C.muted, fontSize: 15, lineHeight: 1.6 }}>{recentIdea.tagline}</div>
                  )}
                  <div style={{ marginTop: 18, color: C.amber, fontSize: 13, fontWeight: 700 }}>
                    View idea & ratings →
                  </div>
                </div>
              </Link>
            </div>
          </section>
        </>
      )}

      {/* ══ JOIN CTA (large section) ══════════════════ */}
      <Divider />
      <section style={{
        padding: '100px 28px 120px',
        background: `linear-gradient(180deg, ${C.card} 0%, #0d0d18 100%)`,
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        {/* Mini orbit rings decorative */}
        <div style={{
          position: 'absolute', top: '50%', right: '8%',
          transform: 'translateY(-50%)',
          opacity: 0.12, pointerEvents: 'none',
        }}>
          <OrbitScene size={320} />
        </div>
        <div style={{
          position: 'absolute', top: '50%', left: '8%',
          transform: 'translateY(-50%) scaleX(-1)',
          opacity: 0.08, pointerEvents: 'none',
        }}>
          <OrbitScene size={240} />
        </div>

        <div style={{ maxWidth: 620, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <Label>Join now</Label>
          <H2 style={{ marginBottom: 16 }}>
            Gravity doesn't wait.<br />
            <span className="orb1t-gradient-text">Enter the orbit.</span>
          </H2>
          <p style={{ color: C.muted, fontSize: 16, lineHeight: 1.7, marginBottom: 40 }}>
            ORB1T is invite-only and growing intentionally. We review every application — not to gatekeep, but because an orbit is only as strong as the mass inside it. No pitch decks. Just who you are and what you're building.
          </p>
          <button
            onClick={openModal}
            className="orb1t-btn-primary"
            style={{
              background: C.amber, color: '#0a0a0f',
              border: 'none', borderRadius: 12,
              padding: '16px 48px',
              fontFamily: 'Syne', fontWeight: 800,
              fontSize: 17, cursor: 'pointer',
              boxShadow: '0 8px 40px rgba(245,200,66,0.25)',
            }}
          >
            Request access →
          </button>
          <div style={{ marginTop: 16, color: C.muted, fontSize: 13 }}>
            Takes 2 minutes · We reply within 48 hours
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════ */}
      <Divider />
      <footer style={{ padding: '36px 0' }}>
        <div style={{
          ...wrap,
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Wordmark size={18} />
            <span style={{ color: C.border }}>·</span>
            <span style={{ color: C.muted, fontSize: 12 }}>A community by NoCap VC</span>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              ['/founder-space/feed', 'Feed'],
              ['/founder-space/journey/feed', 'Journeys'],
              ['/founder-space/events', 'Events'],
              ['/', 'NoCap VC'],
            ].map(([to, label]) => (
              <Link key={to} to={to} style={{ color: C.muted, fontSize: 12, textDecoration: 'none', letterSpacing: '0.04em' }}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
