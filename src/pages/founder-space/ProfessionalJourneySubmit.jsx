/**
 * Professional Journey — Submission Form
 * Route: /founder-space/journey/submit
 *
 * 2 steps:
 *   Step 1 — 5 career polaroid nodes
 *   Step 2 — Identity + review & publish
 *
 * Auto-publishes (no approval queue needed for personal journeys).
 */

import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../lib/auth';
import { withAuth } from '../../components/withAuth';
import { uploadNodePhoto } from '../../lib/storage';
import { useToast } from '../../components/Toast';
import './FounderSpace.css';

// ─────────────────────────────────────────────
//  Node config
// ─────────────────────────────────────────────

const NODES = [
  {
    key:              'origin',
    number:           1,
    label:            'The Origin',
    tackColor:        '#7c3aed',
    titlePrompt:      'Where did you begin?',
    bodyPrompt:       'Your backstory — the moment it started',
    titlePlaceholder: 'Small-town kid who got obsessed with code at 14',
    bodyPlaceholder:  'Write your origin. Where did you grow up? What problem first grabbed you? What made you choose this path?',
  },
  {
    key:              'expertise',
    number:           2,
    label:            'The Craft',
    tackColor:        '#0d9488',
    titlePrompt:      'What did you master?',
    bodyPrompt:       'Skills, tools, domain knowledge you own',
    titlePlaceholder: 'Product strategy × data pipelines × zero-to-one building',
    bodyPlaceholder:  'What are you genuinely good at? What do people come to you for? What took years to learn that others underestimate?',
  },
  {
    key:              'impact',
    number:           3,
    label:            'The Proof',
    tackColor:        '#d97706',
    titlePrompt:      'Your defining result',
    bodyPrompt:       'The achievement that made people take notice',
    titlePlaceholder: 'Scaled lending product from 0 to ₹420 Cr disbursals in 18 months',
    bodyPlaceholder:  'Numbers, outcomes, and the team/context around it. Make it specific. Vague claims are ignored; precise achievements are remembered.',
  },
  {
    key:              'now',
    number:           4,
    label:            'The Now',
    tackColor:        '#2563eb',
    titlePrompt:      'What do you do today?',
    bodyPrompt:       'Your current role, responsibilities, obsessions',
    titlePlaceholder: 'Head of Product at Series B fintech — own the full 0→1 roadmap',
    bodyPlaceholder:  'What are you working on right now? What does your day-to-day look like? What problems are you solving?',
  },
  {
    key:              'next',
    number:           5,
    label:            'The Seek',
    tackColor:        '#db2777',
    titlePrompt:      'What are you open to?',
    bodyPrompt:       'What would make you say yes?',
    titlePlaceholder: 'Co-founder at a pre-seed B2B SaaS, or angel advising',
    bodyPlaceholder:  'Be honest and specific. Are you open to co-founding? Advising? A new role? What kind of mission gets you excited?',
  },
];

const INDUSTRIES = [
  'Fintech', 'Edtech', 'Healthtech', 'SaaS', 'Ecommerce', 'Deeptech',
  'Consulting', 'Finance', 'Engineering', 'Design', 'Marketing', 'Operations', 'Other',
];

const EXPERIENCE = ['0–2 years', '2–5 years', '5–10 years', '10–15 years', '15+ years'];

const EMPTY_FORM = {
  originTitle: '',    originBody: '',    originPhotoURL: '',
  expertiseTitle: '', expertiseBody: '', expertisePhotoURL: '',
  impactTitle: '',    impactBody: '',    impactPhotoURL: '',
  nowTitle: '',       nowBody: '',       nowPhotoURL: '',
  nextTitle: '',      nextBody: '',      nextPhotoURL: '',
  headline:   '',
  industry:   '',
  experience: '',
  location:   '',
};

// ─────────────────────────────────────────────
//  Step indicator
// ─────────────────────────────────────────────

function StepIndicator({ step }) {
  const steps = ['Career nodes', 'Your identity'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 36 }}>
      {steps.map((label, i) => {
        const n = i + 1;
        const active = step === n;
        const done   = step > n;
        return (
          <React.Fragment key={n}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: done ? '#2c1f0e' : active ? '#c4963a' : 'rgba(44,31,14,0.1)',
                color: (done || active) ? '#fff' : '#c4a882',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 700,
                transition: 'all 0.2s',
              }}>
                {done ? '✓' : n}
              </div>
              <div style={{
                fontFamily: "'DM Mono', monospace", fontSize: 9,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: active ? '#2c1f0e' : '#c4a882',
                whiteSpace: 'nowrap',
              }}>
                {label}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: 1.5, marginBottom: 18,
                background: step > n ? '#2c1f0e' : 'rgba(44,31,14,0.1)',
                transition: 'background 0.3s',
                minWidth: 40, maxWidth: 80,
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Node card (Step 1)
// ─────────────────────────────────────────────

function NodeCard({ node, values, onChange, uploading, onPhotoSelect }) {
  const title = values[`${node.key}Title`] || '';
  const body  = values[`${node.key}Body`]  || '';
  const photo = values[`${node.key}PhotoURL`] || '';
  const filled = title.trim() && body.trim();

  return (
    <div style={{
      background: '#fff',
      border: `1.5px solid ${filled ? node.tackColor + '44' : 'rgba(44,31,14,0.1)'}`,
      borderRadius: 16,
      padding: '20px 20px 20px 20px',
      position: 'relative',
      transition: 'border-color 0.2s',
    }}>
      {/* Tack + node label */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
      }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: node.tackColor,
          boxShadow: `0 1px 4px ${node.tackColor}88`,
          flexShrink: 0,
        }} />
        <div style={{
          fontFamily: "'DM Mono', monospace", fontSize: 8,
          fontWeight: 700, letterSpacing: '0.2em',
          textTransform: 'uppercase', color: node.tackColor,
        }}>
          {String(node.number).padStart(2, '0')} · {node.label}
        </div>
        {filled && (
          <div style={{
            marginLeft: 'auto',
            fontFamily: "'DM Mono', monospace", fontSize: 8,
            color: '#2c8a4e', letterSpacing: '0.1em',
          }}>
            ✓ FILLED
          </div>
        )}
      </div>

      {/* Title */}
      <div style={{ marginBottom: 10 }}>
        <div style={{
          fontFamily: "'DM Mono', monospace", fontSize: 9,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: '#c4a882', marginBottom: 5,
        }}>
          {node.titlePrompt}
        </div>
        <input
          type="text"
          value={title}
          onChange={e => onChange(`${node.key}Title`, e.target.value)}
          placeholder={node.titlePlaceholder}
          maxLength={120}
          style={{
            width: '100%', padding: '10px 12px',
            background: '#fdf6e8', border: '1.5px solid rgba(44,31,14,0.12)',
            borderRadius: 8, outline: 'none',
            fontFamily: "'Syne', sans-serif", fontSize: 14,
            color: '#2c1f0e', boxSizing: 'border-box',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = node.tackColor}
          onBlur={e => e.target.style.borderColor = 'rgba(44,31,14,0.12)'}
        />
        <div style={{
          textAlign: 'right', fontFamily: "'DM Mono', monospace",
          fontSize: 9, color: '#c4a882', marginTop: 3,
        }}>
          {title.length}/120
        </div>
      </div>

      {/* Body */}
      <div style={{ marginBottom: 10 }}>
        <div style={{
          fontFamily: "'DM Mono', monospace", fontSize: 9,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: '#c4a882', marginBottom: 5,
        }}>
          {node.bodyPrompt}
        </div>
        <textarea
          value={body}
          onChange={e => onChange(`${node.key}Body`, e.target.value)}
          placeholder={node.bodyPlaceholder}
          maxLength={600}
          rows={4}
          style={{
            width: '100%', padding: '10px 12px',
            background: '#fdf6e8', border: '1.5px solid rgba(44,31,14,0.12)',
            borderRadius: 8, outline: 'none', resize: 'vertical',
            fontFamily: "'Syne', sans-serif", fontSize: 13,
            color: '#2c1f0e', lineHeight: 1.6,
            boxSizing: 'border-box', transition: 'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = node.tackColor}
          onBlur={e => e.target.style.borderColor = 'rgba(44,31,14,0.12)'}
        />
        <div style={{
          textAlign: 'right', fontFamily: "'DM Mono', monospace",
          fontSize: 9, color: '#c4a882', marginTop: 3,
        }}>
          {body.length}/600
        </div>
      </div>

      {/* Photo upload */}
      <div>
        {photo ? (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img src={photo} alt="" style={{
              height: 64, borderRadius: 6, objectFit: 'cover',
              border: '1px solid rgba(44,31,14,0.12)',
            }} />
            <button
              onClick={() => onChange(`${node.key}PhotoURL`, '')}
              style={{
                position: 'absolute', top: -6, right: -6,
                width: 18, height: 18, borderRadius: '50%',
                background: '#e8391e', color: '#fff',
                border: 'none', cursor: 'pointer',
                fontSize: 10, lineHeight: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ×
            </button>
          </div>
        ) : (
          <label style={{ cursor: 'pointer' }}>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={e => onPhotoSelect(node.key, e.target.files[0])}
            />
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 6,
              border: '1px dashed rgba(44,31,14,0.2)',
              fontFamily: "'DM Mono', monospace", fontSize: 9,
              color: '#c4a882', cursor: 'pointer', letterSpacing: '0.08em',
            }}>
              {uploading ? '↑ Uploading…' : '+ Photo (optional)'}
            </div>
          </label>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Progress bar
// ─────────────────────────────────────────────

function ProgressBar({ form }) {
  const filled = NODES.filter(n =>
    (form[`${n.key}Title`] || '').trim() &&
    (form[`${n.key}Body`]  || '').trim()
  ).length;

  return (
    <div style={{
      background: '#fff', borderRadius: 12,
      border: '1px solid rgba(44,31,14,0.08)',
      padding: '14px 18px', marginBottom: 24,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontFamily: "'DM Mono', monospace", fontSize: 9,
        letterSpacing: '0.14em', textTransform: 'uppercase',
        color: '#7a5c3a', marginBottom: 8,
      }}>
        <span>Career nodes filled</span>
        <span style={{ color: filled === 5 ? '#2c8a4e' : '#c4963a' }}>{filled} / 5</span>
      </div>
      <div style={{
        height: 4, background: 'rgba(44,31,14,0.08)',
        borderRadius: 4, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 4,
          width: `${(filled / 5) * 100}%`,
          background: filled === 5
            ? 'linear-gradient(90deg, #2c8a4e, #1a5c33)'
            : 'linear-gradient(90deg, #c4963a, #d97706)',
          transition: 'width 0.4s ease',
        }} />
      </div>
      {filled === 5 && (
        <div style={{
          fontFamily: "'DM Mono', monospace", fontSize: 9,
          color: '#2c8a4e', marginTop: 6, textAlign: 'center',
          letterSpacing: '0.1em',
        }}>
          ✓ ALL NODES FILLED — READY TO CONTINUE
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Main component
// ─────────────────────────────────────────────

function ProfessionalJourneySubmit() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [step,    setStep]    = useState(1);
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const setField = useCallback((key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
  }, []);

  // Photo upload handler
  const handlePhotoSelect = useCallback(async (nodeKey, file) => {
    if (!file || !user) return;
    setUploading(prev => ({ ...prev, [nodeKey]: true }));
    try {
      const url = await uploadNodePhoto(
        `journey_${user.uid}`, nodeKey, file,
        () => {}
      );
      setField(`${nodeKey}PhotoURL`, url);
    } catch (err) {
      showToast(err.message || 'Upload failed.', 'error');
    } finally {
      setUploading(prev => ({ ...prev, [nodeKey]: false }));
    }
  }, [user, setField, showToast]);

  // Step 1 → Step 2
  const toStep2 = useCallback(() => {
    const incomplete = NODES.filter(n =>
      !(form[`${n.key}Title`] || '').trim() ||
      !(form[`${n.key}Body`]  || '').trim()
    );
    if (incomplete.length > 0) {
      showToast(`Fill in all 5 career nodes to continue.`, 'error');
      return;
    }
    setStep(2);
    window.scrollTo(0, 0);
  }, [form, showToast]);

  // Validate Step 2
  const validateStep2 = useCallback(() => {
    if (!(form.headline || '').trim())   { showToast('Add a professional headline.', 'error'); return false; }
    if (!(form.industry  || '').trim())  { showToast('Select your industry.', 'error');  return false; }
    if (!(form.experience || '').trim()) { showToast('Select your experience level.', 'error'); return false; }
    return true;
  }, [form, showToast]);

  // Submit → Firestore
  const handleSubmit = useCallback(async () => {
    if (!validateStep2()) return;
    setSubmitting(true);
    try {
      const payload = {
        authorUid:    user.uid,
        authorName:   userProfile?.name  || user.displayName || 'Professional',
        authorPhoto:  userProfile?.photoURL || user.photoURL || '',
        status:       'published',
        publishedAt:  serverTimestamp(),
        createdAt:    serverTimestamp(),
        viewCount:    0,

        originTitle:    form.originTitle,    originBody:    form.originBody,    originPhotoURL:    form.originPhotoURL,
        expertiseTitle: form.expertiseTitle, expertiseBody: form.expertiseBody, expertisePhotoURL: form.expertisePhotoURL,
        impactTitle:    form.impactTitle,    impactBody:    form.impactBody,    impactPhotoURL:    form.impactPhotoURL,
        nowTitle:       form.nowTitle,       nowBody:       form.nowBody,       nowPhotoURL:       form.nowPhotoURL,
        nextTitle:      form.nextTitle,      nextBody:      form.nextBody,      nextPhotoURL:      form.nextPhotoURL,

        headline:   form.headline,
        industry:   form.industry,
        experience: form.experience,
        location:   form.location || '',
      };

      const ref = await addDoc(collection(db, 'journeys'), payload);
      showToast('Your professional journey is live!', 'success');
      navigate(`/founder-space/journey/${ref.id}`);
    } catch (err) {
      console.error('Submit error:', err);
      showToast('Submit failed — try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [form, user, userProfile, navigate, showToast, validateStep2]);

  // ─── Render ────────────────────────────────

  return (
    <div className="fs-page" style={{ paddingBottom: 80 }}>

      {/* Nav */}
      <nav className="fs-nav">
        <Link to="/founder-space/journey/feed" className="fs-nav-logo">
          <span className="fs-nav-dot" />Professional Journey
        </Link>
        <Link
          to="/founder-space/journey/feed"
          style={{
            fontFamily: "'DM Mono', monospace", fontSize: 10,
            color: '#7a5c3a', textDecoration: 'none', letterSpacing: '0.06em',
          }}
        >
          ← Back to feed
        </Link>
      </nav>

      {/* Content */}
      <div style={{
        maxWidth: 720, margin: '0 auto',
        padding: '40px 24px',
      }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 9, letterSpacing: '0.24em',
            textTransform: 'uppercase', color: '#c4a882', marginBottom: 8,
          }}>
            Professional Journey
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 900,
            color: '#2c1f0e', margin: '0 0 8px', lineHeight: 1.1,
          }}>
            {step === 1 ? 'Pin your career story.' : 'Who are you?'}
          </h1>
          <p style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 14, color: '#b09878', fontStyle: 'italic',
            margin: 0,
          }}>
            {step === 1
              ? 'Five nodes. Your entire professional narrative. Honest, specific, and yours.'
              : 'The identity layer — what people see before they dive into your story.'}
          </p>
        </div>

        {/* Step indicator */}
        <StepIndicator step={step} />

        {/* ── STEP 1: Career nodes ───────────── */}
        {step === 1 && (
          <>
            <ProgressBar form={form} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {NODES.map(node => (
                <NodeCard
                  key={node.key}
                  node={node}
                  values={form}
                  onChange={setField}
                  uploading={uploading[node.key] || false}
                  onPhotoSelect={handlePhotoSelect}
                />
              ))}
            </div>

            <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={toStep2}
                style={{
                  padding: '14px 32px', borderRadius: 10,
                  background: '#2c1f0e', color: '#f5c842',
                  border: 'none', cursor: 'pointer',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
                }}
              >
                Continue →
              </button>
            </div>
          </>
        )}

        {/* ── STEP 2: Identity + review ──────── */}
        {step === 2 && (
          <>
            {/* Professional Headline */}
            <div style={{ marginBottom: 22 }}>
              <label className="fs-label">
                Your headline <span style={{ color: '#c0392b' }}>*</span>
              </label>
              <input
                type="text"
                value={form.headline}
                onChange={e => setField('headline', e.target.value)}
                placeholder='e.g. "Head of Product at fintech startup → building in AI"'
                maxLength={120}
                className="fs-input"
              />
              <div className="fs-hint">One line. Captures who you are and where you're going.</div>
            </div>

            {/* Industry */}
            <div style={{ marginBottom: 22 }}>
              <label className="fs-label">
                Industry <span style={{ color: '#c0392b' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {INDUSTRIES.map(ind => (
                  <button
                    key={ind}
                    onClick={() => setField('industry', ind)}
                    style={{
                      padding: '7px 14px', borderRadius: 20,
                      border: `1.5px solid ${form.industry === ind ? '#2c1f0e' : 'rgba(44,31,14,0.15)'}`,
                      background: form.industry === ind ? '#2c1f0e' : '#fff',
                      color: form.industry === ind ? '#f5c842' : '#7a5c3a',
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 10, fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {ind}
                  </button>
                ))}
              </div>
            </div>

            {/* Experience */}
            <div style={{ marginBottom: 22 }}>
              <label className="fs-label">
                Experience <span style={{ color: '#c0392b' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {EXPERIENCE.map(exp => (
                  <button
                    key={exp}
                    onClick={() => setField('experience', exp)}
                    style={{
                      padding: '7px 14px', borderRadius: 20,
                      border: `1.5px solid ${form.experience === exp ? '#2c1f0e' : 'rgba(44,31,14,0.15)'}`,
                      background: form.experience === exp ? '#2c1f0e' : '#fff',
                      color: form.experience === exp ? '#f5c842' : '#7a5c3a',
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 10, fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {exp}
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div style={{ marginBottom: 32 }}>
              <label className="fs-label">Location (optional)</label>
              <input
                type="text"
                value={form.location}
                onChange={e => setField('location', e.target.value)}
                placeholder='Mumbai, Bangalore, Remote…'
                maxLength={60}
                className="fs-input"
              />
            </div>

            {/* Journey preview */}
            <div style={{
              background: '#fff', borderRadius: 16,
              border: '1px solid rgba(44,31,14,0.1)',
              padding: '20px', marginBottom: 32,
            }}>
              <div style={{
                fontFamily: "'DM Mono', monospace", fontSize: 9,
                letterSpacing: '0.2em', textTransform: 'uppercase',
                color: '#c4963a', marginBottom: 16,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#e8391e' }} />
                Journey preview
              </div>
              <div style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 18, fontWeight: 900, color: '#2c1f0e',
                marginBottom: 4,
              }}>
                {form.headline || 'Your headline here'}
              </div>
              <div style={{
                fontFamily: "'DM Mono', monospace", fontSize: 10,
                color: '#7a5c3a', marginBottom: 12,
                display: 'flex', gap: 10, flexWrap: 'wrap',
              }}>
                {form.industry   && <span>{form.industry}</span>}
                {form.experience && <span>· {form.experience}</span>}
                {form.location   && <span>· {form.location}</span>}
              </div>
              {/* Mini node strip */}
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
                {NODES.map(n => (
                  <div key={n.key} style={{
                    width: 72, minWidth: 72, background: '#fdf6e8',
                    borderRadius: 6, padding: '6px 6px 14px',
                    border: '1px solid rgba(44,31,14,0.1)',
                    position: 'relative', flexShrink: 0,
                  }}>
                    <div style={{
                      position: 'absolute', top: -4, left: '50%',
                      transform: 'translateX(-50%)',
                      width: 7, height: 7, borderRadius: '50%',
                      background: n.tackColor,
                    }} />
                    <div style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 7, fontWeight: 700, color: n.tackColor,
                      letterSpacing: '0.1em', marginBottom: 3,
                    }}>
                      {n.label}
                    </div>
                    <div style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 7, color: '#2c1f0e', lineHeight: 1.3,
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {form[`${n.key}Title`] || '—'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA row */}
            <div style={{
              display: 'flex', gap: 12, justifyContent: 'space-between',
              flexWrap: 'wrap',
            }}>
              <button
                onClick={() => { setStep(1); window.scrollTo(0, 0); }}
                style={{
                  padding: '12px 24px', borderRadius: 10,
                  background: '#fff', color: '#2c1f0e',
                  border: '1.5px solid rgba(44,31,14,0.15)',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ← Edit nodes
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  padding: '14px 32px', borderRadius: 10,
                  background: '#2c1f0e', color: '#f5c842',
                  border: 'none', cursor: submitting ? 'wait' : 'pointer',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting ? 'Publishing…' : 'Publish journey →'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default withAuth(ProfessionalJourneySubmit);
