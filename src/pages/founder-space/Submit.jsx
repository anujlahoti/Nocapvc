/**
 * Founder Space — Idea Submission Form
 * Route: /founder-space/submit
 *
 * 3 steps, all in one page via local state:
 *   Step 1 — Build your investigation board (5 core pitch nodes)
 *   Step 2 — Director's notes (branch nodes + metadata)
 *   Step 3 — Review & submit for approval
 *
 * Auto-saves to Firestore every 30 seconds and on beforeunload.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  collection, doc, addDoc, updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../lib/auth';
import { withAuth } from '../../components/withAuth';
import { uploadNodePhoto, deletePhoto } from '../../lib/storage';
import { useImageUpload } from '../../hooks/useImageUpload';
import './FounderSpace.css';

// ─────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────

const NODES = [
  {
    key:              'problem',
    number:           1,
    label:            'The Villain',
    tackColor:        '#e8391e',
    titlePrompt:      'Name the crime',
    bodyPrompt:       'Describe what\'s broken',
    titlePlaceholder: '₹4.25L Cr earns zero while institutions pocket 8–15% yield',
    bodyPlaceholder:  'What injustice are you here to fix? Be specific. Real numbers. Real pain.',
  },
  {
    key:              'reveal',
    number:           2,
    label:            'The Reveal',
    tackColor:        '#c4a882',
    titlePrompt:      'The plot twist',
    bodyPrompt:       'What does nobody know?',
    titlePlaceholder: 'It\'s been legal since 1997 — SEBI just never told retail investors',
    bodyPlaceholder:  'Your contrarian insight. The thing everyone overlooks. Why now?',
  },
  {
    key:              'solution',
    number:           3,
    label:            'The Hero',
    tackColor:        '#2c8a4e',
    titlePrompt:      'Introduce your solution',
    bodyPrompt:       'How does the hero win?',
    titlePlaceholder: 'BYAJ — your idle stocks staking for yield while you sleep',
    bodyPlaceholder:  'Your product in plain language. What does it do? How does it work?',
  },
  {
    key:              'market',
    number:           4,
    label:            'The Stakes',
    tackColor:        '#1a6bb5',
    titlePrompt:      'Paint the scale',
    bodyPrompt:       'How big is the prize?',
    titlePlaceholder: '₹85,000 Cr addressable market. 8.5 Cr demat accounts.',
    bodyPlaceholder:  'TAM, SAM, SOM. Who is your customer? How many of them exist?',
  },
  {
    key:              'ask',
    number:           5,
    label:            'The Ask',
    tackColor:        '#f5c842',
    titlePrompt:      'State your ask',
    bodyPrompt:       'What do you need to win?',
    titlePlaceholder: '₹2.5 Cr seed. Month 32 breakeven. 3.0x LTV/CAC.',
    bodyPlaceholder:  'Funding target, what it buys, and the milestone it unlocks.',
  },
];

const EMPTY_FORM = {
  problemTitle: '', problemBody: '', problemPhotoURL: '',
  revealTitle:  '', revealBody:  '', revealPhotoURL:  '',
  solutionTitle:'', solutionBody:'', solutionPhotoURL:'',
  marketTitle:  '', marketBody:  '', marketPhotoURL:  '',
  askTitle:     '', askBody:     '', askPhotoURL:     '',
  branchNodes:  [],
  ideaTitle: '', tagline: '', category: '', stage: '', location: '',
};

// ─────────────────────────────────────────────
//  Step indicator
// ─────────────────────────────────────────────

function StepIndicator({ step }) {
  const steps = [
    { n: 1, label: 'Investigation board' },
    { n: 2, label: 'Director\'s notes'   },
    { n: 3, label: 'Review & submit'     },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 40 }}>
      {steps.map((s, i) => (
        <React.Fragment key={s.n}>
          {/* Circle */}
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            background:   step > s.n ? '#2c1f0e' : step === s.n ? '#2c1f0e' : '#fff',
            border:       step < s.n ? '1.5px solid #e8dcc8' : 'none',
            color:        step > s.n ? '#f5c842' : step === s.n ? '#f5c842' : '#c4a882',
            fontFamily:   "'DM Mono', monospace",
            fontSize:     11, fontWeight: 700,
            transition:   'all 0.25s',
          }}>
            {step > s.n ? '✓' : s.n}
          </div>

          {/* Label (only on active) */}
          {step === s.n && (
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10, letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#2c1f0e', fontWeight: 600,
              marginLeft: 8, marginRight: 12,
              whiteSpace: 'nowrap',
            }}>
              {s.label}
            </span>
          )}

          {/* Connector */}
          {i < steps.length - 1 && (
            <div style={{
              flex: 1, height: 1.5, maxWidth: step === s.n ? 24 : 48,
              background: step > s.n ? '#2c1f0e' : '#e8dcc8',
              transition: 'background 0.25s',
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Tack SVG
// ─────────────────────────────────────────────

function Tack({ color }) {
  return (
    <svg width="18" height="22" viewBox="0 0 18 22" fill="none">
      <circle cx="9" cy="7" r="6" fill={color} />
      <circle cx="9" cy="7" r="3" fill="rgba(255,255,255,0.35)" />
      <rect x="8" y="11" width="2" height="11" rx="1" fill={color} />
    </svg>
  );
}

// ─────────────────────────────────────────────
//  Character counter
// ─────────────────────────────────────────────

function CharCounter({ value, max }) {
  const len = value?.length || 0;
  const color = len > max * 0.9 ? '#c0392b' : len > max * 0.75 ? '#c4963a' : '#aaa';
  return (
    <div style={{
      fontFamily: "'DM Mono', monospace", fontSize: 10,
      color, textAlign: 'right', marginTop: 3,
    }}>
      {max - len} left
    </div>
  );
}

// ─────────────────────────────────────────────
//  Photo upload zone
// ─────────────────────────────────────────────

function PhotoZone({ nodeKey, ideaId, photoURL, onUpload, onRemove }) {
  const inputRef = useRef(null);

  // Upload fn — only works once ideaId exists (auto-save creates it)
  const uploadFn = useCallback(
    (file, onProgress) => {
      if (!ideaId) throw new Error('Save draft first to enable photo upload.');
      return uploadNodePhoto(ideaId, nodeKey, file, onProgress);
    },
    [ideaId, nodeKey]
  );

  const { upload, uploading, progress, error, reset } = useImageUpload(uploadFn);

  async function handleFile(file) {
    const url = await upload(file);
    if (url) onUpload(url);
  }

  if (photoURL) {
    return (
      <div style={{ position: 'relative', width: 80, marginTop: 14 }}>
        <img
          src={photoURL} alt="Evidence"
          style={{
            width: 80, height: 80, objectFit: 'cover',
            borderRadius: 6, border: '2px solid rgba(44,31,14,0.1)',
          }}
        />
        <button
          onClick={async () => { await deletePhoto(photoURL); onRemove(); }}
          style={{
            position: 'absolute', top: -8, right: -8,
            width: 20, height: 20, borderRadius: '50%',
            background: '#2c1f0e', color: '#fdf6e8',
            border: 'none', cursor: 'pointer',
            fontSize: 11, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >×</button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 12 }}>
      <input
        ref={inputRef} type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={e => e.target.files[0] && handleFile(e.target.files[0])}
      />
      {uploading ? (
        <div>
          <div style={{
            height: 3, background: 'rgba(44,31,14,0.1)', borderRadius: 2, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', width: `${progress}%`,
              background: '#c4963a', borderRadius: 2, transition: 'width 0.2s',
            }} />
          </div>
          <div style={{
            fontFamily: "'DM Mono', monospace", fontSize: 10,
            color: '#7a5c3a', marginTop: 4,
          }}>
            Uploading… {progress}%
          </div>
        </div>
      ) : (
        <button
          onClick={() => {
            if (!ideaId) { alert('Click "Save draft" first, then you can pin evidence.'); return; }
            reset();
            inputRef.current?.click();
          }}
          style={{
            width: '100%', padding: '10px 0',
            border: '1.5px dashed rgba(44,31,14,0.2)',
            borderRadius: 8, background: 'transparent',
            cursor: 'pointer', fontFamily: "'DM Mono', monospace",
            fontSize: 10, letterSpacing: '0.1em',
            color: 'rgba(44,31,14,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(44,31,14,0.4)';
            e.currentTarget.style.color = 'rgba(44,31,14,0.7)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(44,31,14,0.2)';
            e.currentTarget.style.color = 'rgba(44,31,14,0.4)';
          }}
        >
          📎 Pin evidence (optional)
        </button>
      )}
      {error && (
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#c0392b', marginTop: 4 }}>
          {error}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  NodeCard
// ─────────────────────────────────────────────

function NodeCard({ node, ideaId, formData, onChange, onPhotoUpload, onPhotoRemove }) {
  const titleKey = `${node.key}Title`;
  const bodyKey  = `${node.key}Body`;
  const photoKey = `${node.key}PhotoURL`;
  const title    = formData[titleKey] || '';
  const body     = formData[bodyKey]  || '';
  const photoURL = formData[photoKey] || '';
  const filled   = title.trim() && body.trim();

  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      border: `1px solid ${filled ? 'rgba(44,31,14,0.15)' : '#e8dcc8'}`,
      padding: '28px 24px 22px',
      marginBottom: 16,
      position: 'relative',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      boxShadow: filled
        ? '0 4px 20px rgba(44,31,14,0.08)'
        : '0 1px 4px rgba(44,31,14,0.04)',
    }}>
      {/* Tack */}
      <div style={{
        position: 'absolute', top: -11, left: '50%',
        transform: 'translateX(-50%)',
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
      }}>
        <Tack color={node.tackColor} />
      </div>

      {/* Large muted number */}
      <div style={{
        position: 'absolute', top: 12, right: 16,
        fontFamily: "'Playfair Display', serif",
        fontSize: 64, fontWeight: 900,
        color: filled ? 'rgba(44,31,14,0.06)' : '#e8dcc8',
        lineHeight: 1, userSelect: 'none',
        transition: 'color 0.2s',
      }}>
        {node.number}
      </div>

      {/* Node label */}
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 9, fontWeight: 700,
        letterSpacing: '0.22em', textTransform: 'uppercase',
        color: node.tackColor, marginBottom: 20,
      }}>
        {String(node.number).padStart(2, '0')} — {node.label}
      </div>

      {/* Title input */}
      <div style={{ marginBottom: 0 }}>
        <label style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 9, letterSpacing: '0.16em',
          textTransform: 'uppercase', color: '#c4a882',
          display: 'block', marginBottom: 6,
        }}>
          {node.titlePrompt}
        </label>
        <input
          type="text"
          value={title}
          onChange={e => onChange(titleKey, e.target.value)}
          placeholder={node.titlePlaceholder}
          maxLength={60}
          style={{
            width: '100%', background: 'transparent',
            borderTop: 'none', borderLeft: 'none', borderRight: 'none',
            borderBottom: `2px solid ${title ? '#2c1f0e' : '#e8dcc8'}`,
            outline: 'none', padding: '8px 0',
            fontFamily: "'Playfair Display', serif",
            fontSize: 18, fontWeight: 700,
            color: '#2c1f0e', boxSizing: 'border-box',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderBottomColor = '#2c1f0e'}
          onBlur={e => e.target.style.borderBottomColor = title ? '#2c1f0e' : '#e8dcc8'}
        />
        <CharCounter value={title} max={60} />
      </div>

      {/* Body textarea */}
      <div style={{ marginTop: 16 }}>
        <label style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 9, letterSpacing: '0.16em',
          textTransform: 'uppercase', color: '#c4a882',
          display: 'block', marginBottom: 6,
        }}>
          {node.bodyPrompt}
        </label>
        <textarea
          value={body}
          onChange={e => onChange(bodyKey, e.target.value)}
          placeholder={node.bodyPlaceholder}
          maxLength={200}
          rows={3}
          style={{
            width: '100%', background: '#fdf6e8',
            border: `1.5px solid ${body ? 'rgba(44,31,14,0.2)' : '#e8dcc8'}`,
            borderRadius: 10, outline: 'none',
            padding: '10px 12px',
            fontFamily: "'Syne', sans-serif",
            fontSize: 13, color: '#2c1f0e',
            lineHeight: 1.65, resize: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = '#2c1f0e'}
          onBlur={e => e.target.style.borderColor = body ? 'rgba(44,31,14,0.2)' : '#e8dcc8'}
        />
        <CharCounter value={body} max={200} />
      </div>

      {/* Photo zone */}
      <PhotoZone
        nodeKey={node.key}
        ideaId={ideaId}
        photoURL={photoURL}
        onUpload={url => onPhotoUpload(photoKey, url)}
        onRemove={() => onPhotoRemove(photoKey)}
      />

      {/* Filled indicator */}
      {filled && (
        <div style={{
          position: 'absolute', bottom: 14, right: 16,
          width: 8, height: 8, borderRadius: '50%',
          background: '#2c8a4e',
        }} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Toast
// ─────────────────────────────────────────────

function Toast({ message, visible }) {
  return (
    <div style={{
      position: 'fixed', bottom: 88, left: '50%',
      transform: `translateX(-50%) translateY(${visible ? 0 : 20}px)`,
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.3s, transform 0.3s',
      background: '#2c1f0e', color: '#fdf6e8',
      fontFamily: "'DM Mono', monospace",
      fontSize: 11, letterSpacing: '0.1em',
      padding: '10px 20px', borderRadius: 8,
      pointerEvents: 'none', zIndex: 200,
      boxShadow: '0 4px 20px rgba(44,31,14,0.25)',
    }}>
      {message}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Step 2 placeholder (built next)
// ─────────────────────────────────────────────

function Step2({ formData, onChange }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16,
      border: '1px solid #e8dcc8', padding: 40,
      textAlign: 'center',
    }}>
      <div style={{
        fontFamily: "'DM Mono', monospace", fontSize: 10,
        letterSpacing: '0.2em', color: '#c4a882', marginBottom: 12,
        textTransform: 'uppercase',
      }}>
        Step 2 — Director's notes
      </div>
      <div style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 22, fontWeight: 700, color: '#2c1f0e',
      }}>
        Branch nodes coming next →
      </div>
    </div>
  );
}

function Step3({ formData }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16,
      border: '1px solid #e8dcc8', padding: 40,
      textAlign: 'center',
    }}>
      <div style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 22, fontWeight: 700, color: '#2c1f0e',
      }}>
        Review & Submit — coming next →
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Main Submit page
// ─────────────────────────────────────────────

function Submit() {
  const { user } = useAuth();

  const [ideaId,   setIdeaId]   = useState(null);
  const [step,     setStep]     = useState(1);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState({ visible: false, message: '' });

  // Keep refs for beforeunload (closures can't see latest state)
  const formRef  = useRef(formData);
  const ideaRef  = useRef(ideaId);
  formRef.current  = formData;
  ideaRef.current  = ideaId;

  // ── Toast helper ────────────────────────────
  function showToast(message) {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: '' }), 2500);
  }

  // ── Field change ────────────────────────────
  function handleChange(key, value) {
    setFormData(prev => ({ ...prev, [key]: value }));
  }

  // ── Auto-save to Firestore ──────────────────
  const autoSave = useCallback(async (data, currentIdeaId) => {
    if (!user) return;
    const hasContent = NODES.some(n =>
      data[`${n.key}Title`].trim() || data[`${n.key}Body`].trim()
    );
    if (!hasContent) return;

    setSaving(true);
    try {
      if (!currentIdeaId) {
        // First save — create document
        const docRef = await addDoc(collection(db, 'ideas'), {
          authorUid:  user.uid,
          status:     'draft',
          ...data,
          viewCount:        0,
          wantToWorkCount:  0,
          shareCount:       0,
          ratingCount:      0,
          avgOverall:       0,
          avgProblemClarity:      0,
          avgMarketPotential:     0,
          avgFounderCredibility:  0,
          avgExecutionReadiness:  0,
          avgOverallInvestability:0,
          createdAt:  serverTimestamp(),
          updatedAt:  serverTimestamp(),
        });
        setIdeaId(docRef.id);
        ideaRef.current = docRef.id;
        showToast('Draft saved ✓');
      } else {
        // Update existing
        await updateDoc(doc(db, 'ideas', currentIdeaId), {
          ...data,
          updatedAt: serverTimestamp(),
        });
        showToast('Draft saved ✓');
      }
    } catch (err) {
      console.error('Auto-save failed:', err);
    } finally {
      setSaving(false);
    }
  }, [user]);

  // ── 30-second interval auto-save ────────────
  useEffect(() => {
    const interval = setInterval(() => {
      autoSave(formRef.current, ideaRef.current);
    }, 30000);
    return () => clearInterval(interval);
  }, [autoSave]);

  // ── beforeunload save ───────────────────────
  useEffect(() => {
    function handleUnload() {
      autoSave(formRef.current, ideaRef.current);
    }
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [autoSave]);

  // ── Manual save ──────────────────────────────
  async function handleManualSave() {
    await autoSave(formData, ideaId);
  }

  // ── Step 1 → 2 ──────────────────────────────
  async function handleNext() {
    // Final save before advancing
    await autoSave(formData, ideaId);
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Step validation ──────────────────────────
  const step1Complete = NODES.every(n =>
    formData[`${n.key}Title`].trim() && formData[`${n.key}Body`].trim()
  );

  const filledCount = NODES.filter(n =>
    formData[`${n.key}Title`].trim() && formData[`${n.key}Body`].trim()
  ).length;

  return (
    <div className="fs-page" style={{ paddingBottom: 100 }}>
      {/* ── Nav ──────────────────────────────── */}
      <nav className="fs-nav">
        <Link to="/founder-space/feed" className="fs-nav-logo">
          <span className="fs-nav-dot" />
          Founder Space
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {saving && (
            <span style={{
              fontFamily: "'DM Mono', monospace", fontSize: 10,
              color: '#c4a882', letterSpacing: '0.1em',
            }}>
              Saving…
            </span>
          )}
          {ideaId && !saving && (
            <span style={{
              fontFamily: "'DM Mono', monospace", fontSize: 10,
              color: 'rgba(44,31,14,0.35)', letterSpacing: '0.1em',
            }}>
              Draft
            </span>
          )}
        </div>
      </nav>

      {/* ── Container ────────────────────────── */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px 24px 40px' }}>

        {/* Step indicator */}
        <StepIndicator step={step} />

        {/* ── STEP 1 ───────────────────────── */}
        {step === 1 && (
          <>
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
              <div className="fs-section-label" style={{ marginBottom: 10 }}>
                Build your investigation board
              </div>
              <h1 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(24px, 4vw, 34px)',
                fontWeight: 700, color: '#2c1f0e',
                margin: '0 0 10px', lineHeight: 1.2,
              }}>
                Every great startup is a great story.
              </h1>
              <p style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 14, color: '#7a5c3a',
                margin: 0, lineHeight: 1.65,
              }}>
                Fill in the 5 nodes below. Think of it as your pitch deck — but written
                like a film noir screenplay. Short, sharp, unforgettable.
              </p>
            </div>

            {/* Progress bar */}
            {filledCount > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontFamily: "'DM Mono', monospace", fontSize: 10,
                  color: '#7a5c3a', marginBottom: 6,
                }}>
                  <span>{filledCount} of 5 nodes filled</span>
                  <span>{Math.round((filledCount / 5) * 100)}%</span>
                </div>
                <div style={{
                  height: 3, background: '#e8dcc8',
                  borderRadius: 2, overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(filledCount / 5) * 100}%`,
                    background: filledCount === 5 ? '#2c8a4e' : '#c4963a',
                    borderRadius: 2, transition: 'width 0.4s ease',
                  }} />
                </div>
              </div>
            )}

            {/* Node cards */}
            {NODES.map(node => (
              <NodeCard
                key={node.key}
                node={node}
                ideaId={ideaId}
                formData={formData}
                onChange={handleChange}
                onPhotoUpload={(key, url) => setFormData(p => ({ ...p, [key]: url }))}
                onPhotoRemove={key => setFormData(p => ({ ...p, [key]: '' }))}
              />
            ))}
          </>
        )}

        {/* ── STEP 2 ───────────────────────── */}
        {step === 2 && (
          <>
            <Step2 formData={formData} onChange={handleChange} />
            <button
              onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="fs-btn-ghost"
              style={{ marginTop: 16 }}
            >
              ← Back to investigation board
            </button>
          </>
        )}

        {/* ── STEP 3 ───────────────────────── */}
        {step === 3 && (
          <>
            <Step3 formData={formData} />
            <button
              onClick={() => { setStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="fs-btn-ghost"
              style={{ marginTop: 16 }}
            >
              ← Back
            </button>
          </>
        )}

      </div>

      {/* ── Sticky bottom action bar ─────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(253,246,232,0.96)',
        backdropFilter: 'blur(8px)',
        borderTop: '1px solid rgba(44,31,14,0.1)',
        padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        zIndex: 100,
      }}>
        {/* Left: save draft */}
        <button
          onClick={handleManualSave}
          disabled={saving}
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 11, fontWeight: 600,
            letterSpacing: '0.08em',
            padding: '10px 18px',
            border: '1.5px solid #e8dcc8',
            borderRadius: 8,
            background: '#fff', color: '#2c1f0e',
            cursor: saving ? 'wait' : 'pointer',
            opacity: saving ? 0.6 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          {saving ? 'Saving…' : ideaId ? '✓ Save draft' : 'Save draft'}
        </button>

        {/* Right: next / progress indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {step === 1 && !step1Complete && (
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10, color: '#c4a882',
            }}>
              {5 - filledCount} more node{5 - filledCount !== 1 ? 's' : ''} to go
            </span>
          )}
          {step === 1 && (
            <button
              onClick={handleNext}
              disabled={!step1Complete}
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 12, fontWeight: 700,
                letterSpacing: '0.06em',
                padding: '12px 24px',
                borderRadius: 10, border: 'none',
                background: step1Complete ? '#2c1f0e' : '#e8dcc8',
                color: step1Complete ? '#f5c842' : '#c4a882',
                cursor: step1Complete ? 'pointer' : 'not-allowed',
                opacity: step1Complete ? 1 : 0.7,
                transition: 'all 0.2s',
              }}
            >
              Next — Director's notes →
            </button>
          )}
          {step === 2 && (
            <button
              onClick={() => { setStep(3); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 12, fontWeight: 700,
                letterSpacing: '0.06em',
                padding: '12px 24px',
                borderRadius: 10, border: 'none',
                background: '#2c1f0e', color: '#f5c842',
                cursor: 'pointer',
              }}
            >
              Next — Review & submit →
            </button>
          )}
          {step === 3 && (
            <button
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 12, fontWeight: 700,
                letterSpacing: '0.06em',
                padding: '12px 24px',
                borderRadius: 10, border: 'none',
                background: '#2c8a4e', color: '#fff',
                cursor: 'pointer',
              }}
            >
              Submit for review →
            </button>
          )}
        </div>
      </div>

      {/* ── Toast ────────────────────────────── */}
      <Toast message={toast.message} visible={toast.visible} />

      {/* ── Responsive ───────────────────────── */}
      <style>{`
        @media (max-width: 640px) {
          .fs-nav { padding: 14px 20px !important; }
        }
      `}</style>
    </div>
  );
}

export default withAuth(Submit);
