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
import { Link, useSearchParams } from 'react-router-dom';
import {
  collection, doc, addDoc, updateDoc, getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../lib/auth';
import { withAuth } from '../../components/withAuth';
import { uploadNodePhoto, uploadBranchPhoto, deletePhoto } from '../../lib/storage';
import { useImageUpload } from '../../hooks/useImageUpload';
import { PolaroidWallDiagram } from '../../components/founder-space/PolaroidWallDiagram';
import { useToast } from '../../components/Toast';
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
  // Branch notes (Step 2) — stored as array of objects
  branchNodes: [],
  // Idea identity (Step 2)
  ideaTitle: '', tagline: '', category: '', stage: '', location: '',
};

// ─────────────────────────────────────────────
//  Step 2 configs
// ─────────────────────────────────────────────

// Maps to NODES so branch notes know which parent they belong to
const PARENT_NODES = [
  { key: 'problem',  label: 'The Villain', color: '#e8391e' },
  { key: 'reveal',   label: 'The Reveal',  color: '#c4a882' },
  { key: 'solution', label: 'The Hero',    color: '#2c8a4e' },
  { key: 'market',   label: 'The Stakes',  color: '#1a6bb5' },
  { key: 'ask',      label: 'The Ask',     color: '#f5c842' },
];

const CATEGORIES = ['Fintech', 'Edtech', 'Healthtech', 'SaaS', 'Ecommerce', 'Deeptech', 'Other'];
const STAGES     = ['Idea stage', 'MVP built', 'Early stage', 'Growth stage'];

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
            <span className="fs-step-label" style={{
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

// ─────────────────────────────────────────────
//  AddBranchForm — inline form to create/edit a branch note
// ─────────────────────────────────────────────

const EMPTY_BRANCH = { parentKey: '', label: '', title: '', body: '', photoURL: '' };

function AddBranchForm({ ideaId, initial, onSave, onCancel }) {
  const [draft, setDraft] = useState(initial || EMPTY_BRANCH);
  const inputRef = useRef(null);

  const uploadFn = useCallback(
    (file, onProgress) => {
      if (!ideaId) throw new Error('Save draft first to enable photo upload.');
      const tempId = draft.id || Date.now().toString();
      return uploadBranchPhoto(ideaId, tempId, file, onProgress);
    },
    [ideaId, draft.id]
  );
  const { upload, uploading, progress, error: uploadError, reset: resetUpload } = useImageUpload(uploadFn);

  function set(key, val) { setDraft(d => ({ ...d, [key]: val })); }

  const parentNode = PARENT_NODES.find(n => n.key === draft.parentKey);
  const canSave = draft.parentKey && draft.label.trim() && draft.title.trim() && draft.body.trim();

  async function handleFileChange(file) {
    const url = await upload(file);
    if (url) set('photoURL', url);
  }

  return (
    <div style={{
      background: '#fdf6e8', border: '1.5px solid #e8dcc8',
      borderRadius: 14, padding: '20px 18px', marginBottom: 12,
    }}>
      {/* Parent node selector */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          fontFamily: "'DM Mono', monospace", fontSize: 9,
          letterSpacing: '0.16em', textTransform: 'uppercase',
          color: '#c4a882', marginBottom: 8,
        }}>
          Attach to node
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {PARENT_NODES.map(n => {
            const selected = draft.parentKey === n.key;
            return (
              <button
                key={n.key}
                onClick={() => set('parentKey', n.key)}
                style={{
                  padding: '5px 12px', borderRadius: 20,
                  border: `1.5px solid ${selected ? n.color : '#e8dcc8'}`,
                  background: selected ? n.color : '#fff',
                  color: selected ? '#fff' : '#7a5c3a',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10, fontWeight: 600,
                  letterSpacing: '0.08em',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {n.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Label */}
      <div style={{ marginBottom: 12 }}>
        <div style={{
          fontFamily: "'DM Mono', monospace", fontSize: 9,
          letterSpacing: '0.16em', textTransform: 'uppercase',
          color: '#c4a882', marginBottom: 6,
        }}>
          What kind of note is this?
        </div>
        <input
          type="text"
          value={draft.label}
          onChange={e => set('label', e.target.value)}
          placeholder='Risk layer, USP, Team edge…'
          maxLength={30}
          style={{
            width: '100%', background: '#fff',
            border: '1.5px solid #e8dcc8', borderRadius: 8, outline: 'none',
            padding: '8px 10px', boxSizing: 'border-box',
            fontFamily: "'DM Mono', monospace",
            fontSize: 11, color: '#2c1f0e',
          }}
          onFocus={e => e.target.style.borderColor = '#2c1f0e'}
          onBlur={e => e.target.style.borderColor = '#e8dcc8'}
        />
        <CharCounter value={draft.label} max={30} />
      </div>

      {/* Title */}
      <div style={{ marginBottom: 12 }}>
        <div style={{
          fontFamily: "'DM Mono', monospace", fontSize: 9,
          letterSpacing: '0.16em', textTransform: 'uppercase',
          color: '#c4a882', marginBottom: 6,
        }}>
          Short headline
        </div>
        <input
          ref={inputRef}
          type="text"
          value={draft.title}
          onChange={e => set('title', e.target.value)}
          placeholder='One sharp line…'
          maxLength={60}
          style={{
            width: '100%', background: '#fff',
            border: '1.5px solid #e8dcc8', borderRadius: 8, outline: 'none',
            padding: '8px 10px', boxSizing: 'border-box',
            fontFamily: "'Playfair Display', serif",
            fontSize: 14, fontWeight: 700, color: '#2c1f0e',
          }}
          onFocus={e => e.target.style.borderColor = '#2c1f0e'}
          onBlur={e => e.target.style.borderColor = '#e8dcc8'}
        />
        <CharCounter value={draft.title} max={60} />
      </div>

      {/* Body */}
      <div style={{ marginBottom: 12 }}>
        <div style={{
          fontFamily: "'DM Mono', monospace", fontSize: 9,
          letterSpacing: '0.16em', textTransform: 'uppercase',
          color: '#c4a882', marginBottom: 6,
        }}>
          Supporting detail
        </div>
        <textarea
          value={draft.body}
          onChange={e => set('body', e.target.value)}
          placeholder='Add the evidence, the caveat, the unfair advantage…'
          maxLength={150}
          rows={3}
          style={{
            width: '100%', background: '#fff',
            border: '1.5px solid #e8dcc8', borderRadius: 8, outline: 'none',
            padding: '8px 10px', boxSizing: 'border-box',
            fontFamily: "'Syne', sans-serif",
            fontSize: 13, color: '#2c1f0e', lineHeight: 1.6, resize: 'none',
          }}
          onFocus={e => e.target.style.borderColor = '#2c1f0e'}
          onBlur={e => e.target.style.borderColor = '#e8dcc8'}
        />
        <CharCounter value={draft.body} max={150} />
      </div>

      {/* Photo */}
      <div style={{ marginBottom: 16 }}>
        {draft.photoURL ? (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img src={draft.photoURL} alt="Branch evidence"
              style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, border: '2px solid #e8dcc8' }}
            />
            <button
              onClick={async () => { await deletePhoto(draft.photoURL); set('photoURL', ''); }}
              style={{
                position: 'absolute', top: -7, right: -7,
                width: 18, height: 18, borderRadius: '50%',
                background: '#2c1f0e', color: '#fdf6e8',
                border: 'none', cursor: 'pointer',
                fontSize: 10, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >×</button>
          </div>
        ) : (
          <>
            <input
              type="file" accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }} id="branch-photo-input"
              onChange={e => e.target.files[0] && handleFileChange(e.target.files[0])}
            />
            {uploading ? (
              <div style={{ height: 3, background: '#e8dcc8', borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
                <div style={{ height: '100%', width: `${progress}%`, background: '#c4963a', borderRadius: 2, transition: 'width 0.2s' }} />
              </div>
            ) : (
              <label
                htmlFor="branch-photo-input"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontFamily: "'DM Mono', monospace", fontSize: 10,
                  color: '#c4a882', cursor: 'pointer',
                  borderBottom: '1px dashed #e8dcc8',
                }}
                onClick={() => { if (!ideaId) { alert('Save draft first, then you can pin photos.'); return; } resetUpload(); }}
              >
                📎 Add photo (optional)
              </label>
            )}
            {uploadError && (
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#c0392b', marginTop: 4 }}>
                {uploadError}
              </div>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => {
            if (!canSave) return;
            onSave({
              ...draft,
              id: draft.id || Date.now().toString(),
              parentColor: PARENT_NODES.find(n => n.key === draft.parentKey)?.color || '#c4a882',
              parentLabel: PARENT_NODES.find(n => n.key === draft.parentKey)?.label || '',
            });
          }}
          disabled={!canSave}
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
            padding: '10px 18px', borderRadius: 8, border: 'none',
            background: canSave ? (parentNode?.color || '#2c1f0e') : '#e8dcc8',
            color: canSave ? '#fff' : '#c4a882',
            cursor: canSave ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s',
          }}
        >
          Pin this note ✓
        </button>
        <button
          onClick={onCancel}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: "'DM Mono', monospace", fontSize: 11,
            color: '#c4a882', letterSpacing: '0.06em',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  BranchNoteCard — saved branch note display
// ─────────────────────────────────────────────

function BranchNoteCard({ branch, onEdit, onDelete }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12,
      border: '1px solid rgba(44,31,14,0.1)',
      borderLeft: `4px solid ${branch.parentColor}`,
      padding: '12px 14px', marginBottom: 8,
      display: 'flex', alignItems: 'flex-start', gap: 10,
    }}>
      {branch.photoURL && (
        <img src={branch.photoURL} alt=""
          style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 8, fontWeight: 700, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: branch.parentColor,
            padding: '2px 7px', borderRadius: 4,
            background: `${branch.parentColor}18`,
          }}>
            {branch.label}
          </span>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 8, color: 'rgba(44,31,14,0.4)', letterSpacing: '0.08em',
          }}>
            Parent: {branch.parentLabel}
          </span>
        </div>
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 13, fontWeight: 700, color: '#2c1f0e',
          marginBottom: 2, lineHeight: 1.3,
        }}>
          {branch.title}
        </div>
        <div style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 11, color: '#7a5c3a', lineHeight: 1.5,
        }}>
          {branch.body.slice(0, 80)}{branch.body.length > 80 ? '…' : ''}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <button
          onClick={onEdit}
          title="Edit"
          style={{
            width: 26, height: 26, borderRadius: 6,
            border: '1px solid #e8dcc8', background: '#fff',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, color: '#7a5c3a',
          }}
        >
          ✏
        </button>
        <button
          onClick={onDelete}
          title="Delete"
          style={{
            width: 26, height: 26, borderRadius: 6,
            border: '1px solid #e8dcc8', background: '#fff',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, color: '#c0392b', fontWeight: 700,
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  PolaroidWallPreview — live read-only board
// ─────────────────────────────────────────────

function PolaroidWallPreview({ formData }) {
  const tilts = [-2, 1.5, -1, 2, -1.5];

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
      {/* Main nodes row */}
      <div style={{ display: 'flex', gap: 10, minWidth: 'max-content', paddingTop: 14 }}>
        {NODES.map((node, i) => {
          const title = formData[`${node.key}Title`];
          const photo = formData[`${node.key}PhotoURL`];
          const filled = title?.trim();

          return (
            <div key={node.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Mini polaroid */}
              <div style={{
                width: 100, background: '#fff',
                border: '1px solid rgba(44,31,14,0.1)',
                borderRadius: 8, padding: '8px 8px 24px',
                transform: `rotate(${tilts[i]}deg)`,
                boxShadow: '0 2px 8px rgba(44,31,14,0.1)',
                position: 'relative',
              }}>
                {/* Tack dot */}
                <div style={{
                  position: 'absolute', top: -5, left: '50%',
                  transform: 'translateX(-50%)',
                  width: 10, height: 10, borderRadius: '50%',
                  background: node.tackColor,
                  boxShadow: `0 1px 4px ${node.tackColor}88`,
                }} />
                {/* Image or number placeholder */}
                <div style={{
                  width: '100%', height: 60, borderRadius: 4,
                  overflow: 'hidden',
                  background: filled ? 'rgba(44,31,14,0.04)' : '#f5ece0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 4,
                }}>
                  {photo ? (
                    <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 28, fontWeight: 900,
                      color: filled ? 'rgba(44,31,14,0.12)' : '#e8dcc8',
                    }}>
                      {node.number}
                    </span>
                  )}
                </div>
                {/* Title */}
                <div style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 8, fontWeight: 700,
                  color: filled ? '#2c1f0e' : '#c4a882',
                  lineHeight: 1.3, wordBreak: 'break-word',
                }}>
                  {filled ? title.slice(0, 30) + (title.length > 30 ? '…' : '') : node.label}
                </div>
              </div>

              {/* Branch notes dangling below */}
              {formData.branchNodes
                .filter(b => b.parentKey === node.key)
                .map(b => (
                  <div key={b.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {/* String */}
                    <div style={{
                      width: 1, height: 16,
                      borderLeft: `1.5px dashed ${b.parentColor}`,
                    }} />
                    {/* Mini branch card */}
                    <div style={{
                      width: 88, background: '#fff',
                      border: `1.5px solid ${b.parentColor}44`,
                      borderLeft: `3px solid ${b.parentColor}`,
                      borderRadius: 6, padding: '5px 7px',
                      boxShadow: '0 1px 4px rgba(44,31,14,0.07)',
                    }}>
                      <div style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 7, fontWeight: 700,
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                        color: b.parentColor, marginBottom: 2,
                      }}>
                        {b.label}
                      </div>
                      <div style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: 8, fontWeight: 700,
                        color: '#2c1f0e', lineHeight: 1.3,
                      }}>
                        {b.title.slice(0, 24)}{b.title.length > 24 ? '…' : ''}
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Step 2 — Director's notes
// ─────────────────────────────────────────────

function Step2({ formData, onChange, ideaId }) {
  const [showForm, setShowForm]     = useState(false);
  const [editingBranch, setEditing] = useState(null); // branch object being edited
  const [previewOpen, setPreview]   = useState(false);
  const branches = formData.branchNodes || [];

  function saveBranch(branchData) {
    const existing = branches.find(b => b.id === branchData.id);
    const updated = existing
      ? branches.map(b => b.id === branchData.id ? branchData : b)
      : [...branches, branchData];
    onChange('branchNodes', updated);
    setShowForm(false);
    setEditing(null);
  }

  function deleteBranch(id) {
    onChange('branchNodes', branches.filter(b => b.id !== id));
  }

  function startEdit(branch) {
    setEditing(branch);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const maxReached = branches.length >= 4;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div className="fs-section-label" style={{ marginBottom: 10 }}>
          Director's notes
        </div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(24px, 4vw, 34px)',
          fontWeight: 700, color: '#2c1f0e',
          margin: '0 0 10px', lineHeight: 1.2,
        }}>
          Add depth to your story.
        </h1>
        <p style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 14, color: '#7a5c3a',
          margin: 0, lineHeight: 1.65,
        }}>
          Pin supporting evidence to any node. These hang below your main board.
        </p>
      </div>

      {/* ── Section A: Branch notes ── */}
      <div style={{
        background: '#fff', borderRadius: 16,
        border: '1px solid rgba(44,31,14,0.12)',
        padding: '24px 20px', marginBottom: 16,
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: -11, left: '50%',
          transform: 'translateX(-50%)',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
        }}>
          <Tack color="#c4a882" />
        </div>

        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 9, fontWeight: 700,
          letterSpacing: '0.22em', textTransform: 'uppercase',
          color: '#c4963a', marginBottom: 16,
        }}>
          Branch notes
        </div>

        {/* Saved branches */}
        {branches.map(b => (
          <BranchNoteCard
            key={b.id}
            branch={b}
            onEdit={() => startEdit(b)}
            onDelete={() => deleteBranch(b.id)}
          />
        ))}

        {/* Inline form */}
        {showForm && (
          <AddBranchForm
            ideaId={ideaId}
            initial={editingBranch}
            onSave={saveBranch}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        )}

        {/* Add button or cap message */}
        {!showForm && (
          maxReached ? (
            <div style={{
              fontFamily: "'DM Mono', monospace", fontSize: 10,
              color: '#c4a882', letterSpacing: '0.08em', textAlign: 'center',
              padding: '10px 0',
            }}>
              4 notes maximum — stay focused.
            </div>
          ) : (
            <button
              onClick={() => { setEditing(null); setShowForm(true); }}
              style={{
                width: '100%', padding: '10px 0',
                border: '1.5px dashed #c4a882', borderRadius: 12,
                background: 'transparent', cursor: 'pointer',
                fontFamily: "'DM Mono', monospace",
                fontSize: 11, letterSpacing: '0.1em', color: '#c4a882',
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#2c1f0e'; e.currentTarget.style.color = '#2c1f0e'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#c4a882'; e.currentTarget.style.color = '#c4a882'; }}
            >
              + Add a branch note
            </button>
          )
        )}
      </div>

      {/* ── Section B: Startup metadata ── */}
      <div style={{
        background: '#fff', borderRadius: 16,
        border: '1px solid rgba(44,31,14,0.12)',
        padding: '24px 20px', marginBottom: 16,
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: -11, left: '50%',
          transform: 'translateX(-50%)',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
        }}>
          <Tack color="#c4963a" />
        </div>

        {/* Divider label */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24,
        }}>
          <div style={{ flex: 1, height: 1, background: '#e8dcc8' }} />
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 9, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: '#c4a882',
            whiteSpace: 'nowrap',
          }}>
            About your startup
          </span>
          <div style={{ flex: 1, height: 1, background: '#e8dcc8' }} />
        </div>

        {/* Startup name */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontFamily: "'DM Mono', monospace", fontSize: 9,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: '#c4a882', marginBottom: 6,
          }}>
            What's it called? <span style={{ color: '#c4963a' }}>*</span>
          </div>
          <input
            type="text"
            value={formData.ideaTitle}
            onChange={e => onChange('ideaTitle', e.target.value)}
            placeholder="BYAJ"
            maxLength={60}
            style={{
              width: '100%', background: '#fdf6e8',
              border: `1.5px solid ${formData.ideaTitle ? 'rgba(44,31,14,0.2)' : '#e8dcc8'}`,
              borderRadius: 10, outline: 'none',
              padding: '10px 12px', boxSizing: 'border-box',
              fontFamily: "'Playfair Display', serif",
              fontSize: 24, fontWeight: 900, color: '#2c1f0e',
            }}
            onFocus={e => e.target.style.borderColor = '#2c1f0e'}
            onBlur={e => e.target.style.borderColor = formData.ideaTitle ? 'rgba(44,31,14,0.2)' : '#e8dcc8'}
          />
          <CharCounter value={formData.ideaTitle} max={60} />
        </div>

        {/* Tagline */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontFamily: "'DM Mono', monospace", fontSize: 9,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: '#c4a882', marginBottom: 6,
          }}>
            One sentence that makes people lean in <span style={{ color: '#c4963a' }}>*</span>
          </div>
          <textarea
            value={formData.tagline}
            onChange={e => onChange('tagline', e.target.value)}
            placeholder="Earn yield on idle stocks while you sleep — like FD, but for your demat."
            maxLength={100}
            rows={2}
            style={{
              width: '100%', background: '#fdf6e8',
              border: `1.5px solid ${formData.tagline ? 'rgba(44,31,14,0.2)' : '#e8dcc8'}`,
              borderRadius: 10, outline: 'none',
              padding: '10px 12px', boxSizing: 'border-box',
              fontFamily: "'Syne', sans-serif",
              fontSize: 14, color: '#2c1f0e', lineHeight: 1.6, resize: 'none',
            }}
            onFocus={e => e.target.style.borderColor = '#2c1f0e'}
            onBlur={e => e.target.style.borderColor = formData.tagline ? 'rgba(44,31,14,0.2)' : '#e8dcc8'}
          />
          <CharCounter value={formData.tagline} max={100} />
        </div>

        {/* Category pills */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontFamily: "'DM Mono', monospace", fontSize: 9,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: '#c4a882', marginBottom: 8,
          }}>
            Category <span style={{ color: '#c4963a' }}>*</span>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
            gap: 8,
          }}>
            {CATEGORIES.map(c => {
              const sel = formData.category === c;
              return (
                <button
                  key={c}
                  onClick={() => onChange('category', c)}
                  style={{
                    padding: '7px 10px', borderRadius: 8,
                    border: `1.5px solid ${sel ? 'transparent' : '#e8dcc8'}`,
                    background: sel ? '#2c1f0e' : '#fff',
                    color: sel ? '#f5c842' : '#7a5c3a',
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10, fontWeight: sel ? 700 : 400,
                    cursor: 'pointer', transition: 'all 0.15s',
                    textAlign: 'center',
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stage pills */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontFamily: "'DM Mono', monospace", fontSize: 9,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: '#c4a882', marginBottom: 8,
          }}>
            Stage <span style={{ color: '#c4963a' }}>*</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {STAGES.map(s => {
              const sel = formData.stage === s;
              return (
                <button
                  key={s}
                  onClick={() => onChange('stage', s)}
                  style={{
                    padding: '7px 16px', borderRadius: 20,
                    border: `1.5px solid ${sel ? 'transparent' : '#e8dcc8'}`,
                    background: sel ? '#2c1f0e' : '#fff',
                    color: sel ? '#f5c842' : '#7a5c3a',
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10, fontWeight: sel ? 700 : 400,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Location */}
        <div>
          <div style={{
            fontFamily: "'DM Mono', monospace", fontSize: 9,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: '#c4a882', marginBottom: 6,
          }}>
            Where are you building from?
            <span style={{ color: 'rgba(44,31,14,0.3)', fontWeight: 400, marginLeft: 6 }}>(optional)</span>
          </div>
          <input
            type="text"
            value={formData.location}
            onChange={e => onChange('location', e.target.value)}
            placeholder="Indore, India"
            maxLength={50}
            style={{
              width: '100%', background: '#fdf6e8',
              border: `1.5px solid ${formData.location ? 'rgba(44,31,14,0.2)' : '#e8dcc8'}`,
              borderRadius: 10, outline: 'none',
              padding: '10px 12px', boxSizing: 'border-box',
              fontFamily: "'Syne', sans-serif",
              fontSize: 13, color: '#2c1f0e',
            }}
            onFocus={e => e.target.style.borderColor = '#2c1f0e'}
            onBlur={e => e.target.style.borderColor = formData.location ? 'rgba(44,31,14,0.2)' : '#e8dcc8'}
          />
        </div>
      </div>

      {/* ── Section C: Live preview ── */}
      <div style={{
        background: '#fff', borderRadius: 16,
        border: '1px solid rgba(44,31,14,0.12)',
        padding: '20px', overflow: 'hidden',
      }}>
        {/* Header with mobile toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 9, fontWeight: 700,
            letterSpacing: '0.22em', textTransform: 'uppercase', color: '#c4963a',
          }}>
            Your board so far
          </div>
          <button
            onClick={() => setPreview(o => !o)}
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9, letterSpacing: '0.1em',
              color: '#c4a882', background: 'none', border: 'none',
              cursor: 'pointer', textDecoration: 'underline',
            }}
          >
            {previewOpen ? 'Hide' : 'Preview'}
          </button>
        </div>
        {/* Always visible on desktop via CSS, toggle on mobile */}
        <div className="fs-preview-block" style={{ display: previewOpen ? 'block' : 'none' }}>
          <PolaroidWallPreview formData={formData} />
        </div>
        <div className="fs-preview-desktop">
          <PolaroidWallPreview formData={formData} />
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .fs-preview-desktop { display: none !important; }
          .fs-preview-block { display: block !important; }
        }
        @media (min-width: 641px) {
          .fs-preview-desktop { display: block; }
          .fs-preview-block { display: none; }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
//  SuccessScreen — shown after submission
// ─────────────────────────────────────────────

function SuccessScreen({ userProfile, submittedAt, ideaId, editMode }) {
  const dateStr = submittedAt
    ? submittedAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const timeStr = submittedAt
    ? submittedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      {/* Checkmark animation */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: '#2c8a4e',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fs-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards',
        }}>
          <svg width="34" height="26" viewBox="0 0 34 26" fill="none">
            <path
              d="M2 13 L12 23 L32 2"
              stroke="#fff" strokeWidth="3.5"
              strokeLinecap="round" strokeLinejoin="round"
              style={{ animation: 'fs-draw 0.55s 0.3s ease forwards', strokeDasharray: 50, strokeDashoffset: 50 }}
            />
          </svg>
        </div>
      </div>

      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase',
        color: '#c4a882', marginBottom: 10,
      }}>
        {editMode ? 'Board updated' : 'Board pinned'}
      </div>
      <h2 style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 'clamp(26px, 5vw, 38px)',
        fontWeight: 900, color: '#2c1f0e',
        margin: '0 0 14px', lineHeight: 1.15,
      }}>
        {editMode ? 'Your updated board is back in review.' : 'Your board is pinned.'}
      </h2>
      <p style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 15, color: '#7a5c3a',
        margin: '0 0 6px', lineHeight: 1.65,
      }}>
        We'll review it within 48 hours
        {userProfile?.contactEmail && (
          <> and notify you at <strong style={{ color: '#2c1f0e' }}>{userProfile.contactEmail}</strong></>
        )}.
      </p>
      {dateStr && (
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 10, color: 'rgba(44,31,14,0.4)',
          letterSpacing: '0.08em', marginBottom: 36,
        }}>
          Submitted {dateStr} at {timeStr}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320, margin: '0 auto' }}>
        <a
          href={`/founder-space/profile/${userProfile?.uid || ''}`}
          style={{
            display: 'block', padding: '14px 0',
            background: '#2c1f0e', color: '#f5c842',
            borderRadius: 12, border: 'none',
            fontFamily: "'DM Mono', monospace",
            fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
            textDecoration: 'none', textAlign: 'center',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          View my profile →
        </a>
        <button
          onClick={() => window.location.reload()}
          style={{
            display: 'block', width: '100%', padding: '14px 0',
            background: '#fff', color: '#2c1f0e',
            borderRadius: 12, border: '1.5px solid #e8dcc8',
            fontFamily: "'DM Mono', monospace",
            fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
            cursor: 'pointer',
          }}
        >
          Submit another idea →
        </button>
      </div>

      <style>{`
        @keyframes fs-pop {
          from { transform: scale(0); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        @keyframes fs-draw {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Step 3 — Full preview + submission
// ─────────────────────────────────────────────

function Step3({ formData, ideaId, userProfile, onSubmit, onBack, submitting }) {
  const [confirmed, setConfirmed] = useState(false);

  const nodesFilled = [
    ['problem', 'The Villain'],
    ['reveal',  'The Reveal'],
    ['solution','The Hero'],
    ['market',  'The Stakes'],
    ['ask',     'The Ask'],
  ].map(([key, label]) => ({
    label,
    ok: !!(formData[`${key}Title`].trim() && formData[`${key}Body`].trim()),
  }));

  const branchCount = (formData.branchNodes || []).length;

  const today = new Date().toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div className="fs-section-label" style={{ marginBottom: 10 }}>
          Review & submit
        </div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(22px, 4vw, 30px)',
          fontWeight: 700, color: '#2c1f0e',
          margin: '0 0 8px', lineHeight: 1.2,
        }}>
          Your board is ready.
        </h1>
        <p style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 14, color: '#7a5c3a',
          margin: 0, lineHeight: 1.65,
        }}>
          Review how it looks, then submit for the NoCap VC team to approve.
        </p>
      </div>

      {/* ── 1. Full polaroid wall ── */}
      <div style={{ marginBottom: 20 }}>
        <PolaroidWallDiagram
          idea={formData}
          author={userProfile}
          readOnly={true}
        />
      </div>

      {/* ── 2. Submission checklist ── */}
      <div style={{
        background: '#fff', borderRadius: 18,
        border: '1px solid rgba(44,31,14,0.1)',
        padding: '22px 20px', marginBottom: 14,
      }}>
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 9, fontWeight: 700,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          color: '#c4963a', marginBottom: 14,
        }}>
          Your pitch covers:
        </div>

        {nodesFilled.map(({ label, ok }) => (
          <div key={label} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: 8,
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
              background: ok ? '#2c8a4e' : '#e8dcc8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {ok && (
                <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                  <path d="M1 3.5L3.5 6L8 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 13, color: ok ? '#2c1f0e' : '#c4a882',
            }}>
              {label}
            </span>
          </div>
        ))}

        <div style={{
          marginTop: 14, paddingTop: 14,
          borderTop: '1px solid #f0e8d8',
          display: 'flex', justifyContent: 'space-between',
          fontFamily: "'DM Mono', monospace", fontSize: 10,
          color: '#7a5c3a', letterSpacing: '0.06em',
        }}>
          <span>Branch notes</span>
          <span style={{ color: branchCount >= 2 ? '#2c8a4e' : '#c4a882', fontWeight: 700 }}>
            {branchCount} of 4 added
          </span>
        </div>

        <div style={{
          marginTop: 10,
          display: 'flex', justifyContent: 'space-between',
          fontFamily: "'DM Mono', monospace", fontSize: 10,
          color: '#7a5c3a', letterSpacing: '0.06em',
        }}>
          <span>Category</span>
          <span style={{ color: formData.category ? '#2c1f0e' : '#c4a882', fontWeight: 700 }}>
            {formData.category || '—'}
          </span>
        </div>

        <div style={{
          marginTop: 10,
          display: 'flex', justifyContent: 'space-between',
          fontFamily: "'DM Mono', monospace", fontSize: 10,
          color: '#7a5c3a', letterSpacing: '0.06em',
        }}>
          <span>Stage</span>
          <span style={{ color: formData.stage ? '#2c1f0e' : '#c4a882', fontWeight: 700 }}>
            {formData.stage || '—'}
          </span>
        </div>
      </div>

      {/* ── 3. Timestamp notice ── */}
      <div style={{
        background: '#fffbec',
        border: '1px solid #f5c842',
        borderRadius: 12, padding: '14px 16px',
        marginBottom: 14,
        display: 'flex', gap: 10, alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>⏱</span>
        <p style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 13, color: '#7a5c3a',
          margin: 0, lineHeight: 1.6,
        }}>
          Your idea will be timestamped <strong style={{ color: '#2c1f0e' }}>{today}</strong> the
          moment you submit. This is your proof of authorship.
        </p>
      </div>

      {/* ── 4. Submit section ── */}
      <div style={{
        background: '#fff', borderRadius: 18,
        border: '1px solid rgba(44,31,14,0.1)',
        padding: '22px 20px',
      }}>
        {/* Confirm checkbox */}
        <label style={{
          display: 'flex', gap: 12, alignItems: 'flex-start',
          cursor: 'pointer', marginBottom: 20,
        }}>
          <div
            onClick={() => setConfirmed(c => !c)}
            style={{
              width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 2,
              border: `1.5px solid ${confirmed ? '#2c8a4e' : '#c4a882'}`,
              background: confirmed ? '#2c8a4e' : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {confirmed && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.8 7L9 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <span style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 13, color: '#3d2810', lineHeight: 1.6,
          }}>
            I confirm this is my original concept and I'm happy for it to be
            publicly visible after review.
          </span>
        </label>

        {/* Submit button */}
        <button
          onClick={() => confirmed && !submitting && onSubmit()}
          disabled={!confirmed || submitting || !ideaId}
          style={{
            width: '100%', padding: '16px 0',
            background: confirmed ? '#2c1f0e' : '#e8dcc8',
            color: confirmed ? '#f5c842' : '#c4a882',
            borderRadius: 12, border: 'none',
            fontFamily: "'Playfair Display', serif",
            fontSize: 16, fontWeight: 900, letterSpacing: '0.02em',
            cursor: confirmed && !submitting && ideaId ? 'pointer' : 'not-allowed',
            opacity: submitting ? 0.7 : 1,
            transition: 'all 0.2s',
            marginBottom: 12,
          }}
        >
          {submitting ? 'Submitting…' : 'Submit for review →'}
        </button>

        {/* Back link */}
        <button
          onClick={onBack}
          style={{
            width: '100%', padding: '12px 0',
            background: 'none', border: '1.5px solid #e8dcc8',
            borderRadius: 12, cursor: 'pointer',
            fontFamily: "'DM Mono', monospace",
            fontSize: 11, color: '#7a5c3a', letterSpacing: '0.08em',
          }}
        >
          ← Edit my board
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Main Submit page
// ─────────────────────────────────────────────

function Submit() {
  const { user, userProfile } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const [ideaId,      setIdeaId]      = useState(null);
  const [step,        setStep]        = useState(1);
  const [formData,    setFormData]    = useState(EMPTY_FORM);
  const [saving,      setSaving]      = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitted,   setSubmitted]   = useState(false);
  const [submittedAt, setSubmittedAt] = useState(null);
  const [editMode,    setEditMode]    = useState(false);

  // Keep refs for beforeunload (closures can't see latest state)
  const formRef  = useRef(formData);
  const ideaRef  = useRef(ideaId);
  formRef.current  = formData;
  ideaRef.current  = ideaId;

  // ── Edit mode: pre-populate from ?ideaId= ───
  useEffect(() => {
    const editId = searchParams.get('ideaId');
    if (!editId || !user) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'ideas', editId));
        if (!snap.exists()) return;
        const data = snap.data();
        if (data.authorUid !== user.uid) return; // not your idea
        // Strip server fields, keep only form fields
        const { authorUid: _a, status: _s, createdAt: _c, updatedAt: _u,
                submittedAt: _sa, publishedAt: _pa, ...rest } = data;
        setFormData(prev => ({ ...prev, ...rest }));
        setIdeaId(editId);
        setEditMode(true);
      } catch (err) {
        console.error('Edit pre-populate failed:', err);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
        showToast('Draft saved ✓', 'success');
      } else {
        // Update existing
        await updateDoc(doc(db, 'ideas', currentIdeaId), {
          ...data,
          updatedAt: serverTimestamp(),
        });
        showToast('Draft saved ✓', 'success');
      }
    } catch (err) {
      console.error('Auto-save failed:', err);
    } finally {
      setSaving(false);
    }
  }, [user, showToast]);

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

  // ── Final submit ────────────────────────────
  async function handleSubmit() {
    if (!ideaId || !user) return;
    setSubmitting(true);
    try {
      const now = new Date();
      await updateDoc(doc(db, 'ideas', ideaId), {
        ...formData,
        status:      'pending_review',
        submittedAt: serverTimestamp(),
        updatedAt:   serverTimestamp(),
        ...(editMode && {
          editedAt: serverTimestamp(),
          editNote: 'Resubmitted after edit',
        }),
      });
      setSubmittedAt(now);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Submit failed:', err);
      showToast('Submit failed — try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Step validation ──────────────────────────
  const step1Complete = NODES.every(n =>
    formData[`${n.key}Title`].trim() && formData[`${n.key}Body`].trim()
  );

  const step2Complete = !!(
    formData.ideaTitle.trim() &&
    formData.tagline.trim() &&
    formData.category &&
    formData.stage
  );

  const filledCount = NODES.filter(n =>
    formData[`${n.key}Title`].trim() && formData[`${n.key}Body`].trim()
  ).length;

  // ── Success screen (replaces everything) ────
  if (submitted) {
    return (
      <div className="fs-page">
        <nav className="fs-nav">
          <Link to="/founder-space/feed" className="fs-nav-logo">
            <span className="fs-nav-dot" />
            Founder Space
          </Link>
        </nav>
        <div style={{ maxWidth: 520, margin: '0 auto', padding: '60px 24px' }}>
          <SuccessScreen
            userProfile={userProfile}
            submittedAt={submittedAt}
            ideaId={ideaId}
            editMode={editMode}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fs-page" style={{ paddingBottom: step === 3 ? 0 : 100 }}>
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
            <Step2 formData={formData} onChange={handleChange} ideaId={ideaId} />
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
          <Step3
            formData={formData}
            ideaId={ideaId}
            userProfile={userProfile}
            submitting={submitting}
            onSubmit={handleSubmit}
            onBack={() => { setStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          />
        )}

      </div>

      {/* ── Sticky bottom action bar (steps 1 & 2 only) ── */}
      {step < 3 && <div style={{
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
              onClick={async () => {
                await autoSave(formData, ideaId);
                setStep(3);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={!step2Complete}
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 12, fontWeight: 700,
                letterSpacing: '0.06em',
                padding: '12px 24px',
                borderRadius: 10, border: 'none',
                background: step2Complete ? '#2c1f0e' : '#e8dcc8',
                color: step2Complete ? '#f5c842' : '#c4a882',
                cursor: step2Complete ? 'pointer' : 'not-allowed',
                opacity: step2Complete ? 1 : 0.7,
                transition: 'all 0.2s',
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
      </div>}

      {/* ── Responsive ───────────────────────── */}
      <style>{`
        @media (max-width: 640px) {
          .fs-nav { padding: 14px 20px !important; }
          .fs-step-label { display: none !important; }
        }
      `}</style>
    </div>
  );
}

export default withAuth(Submit);
