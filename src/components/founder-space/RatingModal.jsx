/**
 * RatingModal — 5-dimension star rating modal for Founder Space idea pages.
 *
 * Props:
 *   ideaId           string
 *   authorUid        string
 *   isOpen           boolean
 *   onClose          () => void
 *   existingRating   object | null
 *   onRatingSubmitted (newAggregates) => void
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  doc, addDoc, runTransaction,
  collection, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../lib/auth';

// ─────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────

const DIMENSIONS = [
  { key: 'problemClarity',       label: 'Problem Clarity',      desc: 'Did the problem land?'                   },
  { key: 'marketPotential',      label: 'Market Potential',     desc: 'Do you believe the market size?'         },
  { key: 'founderCredibility',   label: 'Founder Credibility',  desc: 'Do you trust this founder to execute?'   },
  { key: 'executionReadiness',   label: 'Execution Readiness',  desc: 'Is the plan actionable and real?'        },
  { key: 'overallInvestability', label: 'Overall Investability',desc: 'Would you back or join this?'            },
];

const STAR_LABELS = {
  1: 'Too early',
  2: 'Needs work',
  3: 'Promising',
  4: 'Strong',
  5: 'Back it now',
};

// ─────────────────────────────────────────────
//  StarRatingRow
// ─────────────────────────────────────────────

function StarRatingRow({ label, desc, value, onChange }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 0',
      borderBottom: '1px solid rgba(44,31,14,0.07)',
    }}>
      {/* Left */}
      <div style={{ flex: 1, paddingRight: 16, minWidth: 0 }}>
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 13, fontWeight: 700, color: '#2c1f0e',
          marginBottom: 2,
        }}>
          {label}
        </div>
        <div style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 11, color: '#b09878', lineHeight: 1.4,
        }}>
          {desc}
        </div>
        {value > 0 && (
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 9, color: '#f5a623',
            letterSpacing: '0.06em', marginTop: 3,
          }}>
            {STAR_LABELS[value]}
          </div>
        )}
      </div>

      {/* Stars */}
      <div
        style={{ display: 'flex', gap: 3, flexShrink: 0 }}
        onMouseLeave={() => setHovered(0)}
      >
        {[1, 2, 3, 4, 5].map(n => {
          const lit = n <= (hovered || value);
          return (
            <button
              key={n}
              onClick={() => onChange(n)}
              onMouseEnter={() => setHovered(n)}
              style={{
                background: 'none', border: 'none', padding: '2px',
                cursor: 'pointer', fontSize: 22, lineHeight: 1,
                color: lit ? '#f5c842' : '#e8dcc8',
                transition: 'color 0.1s, transform 0.1s',
                transform: hovered === n ? 'scale(1.2)' : 'scale(1)',
              }}
            >
              ★
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Tack SVG
// ─────────────────────────────────────────────

function TackPin({ color = '#e8391e' }) {
  return (
    <svg width="20" height="26" viewBox="0 0 20 26" fill="none">
      <circle cx="10" cy="8" r="7" fill={color} />
      <circle cx="10" cy="8" r="3.5" fill="rgba(255,255,255,0.35)" />
      <rect x="9" y="13" width="2" height="13" rx="1" fill={color} />
    </svg>
  );
}

// ─────────────────────────────────────────────
//  SuccessState
// ─────────────────────────────────────────────

function SuccessState({ ratings }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{
        display: 'flex', justifyContent: 'center', marginBottom: 20,
        animation: 'rm-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
      }}>
        <TackPin color="#2c8a4e" />
      </div>
      <div style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 22, fontWeight: 900, color: '#2c1f0e', marginBottom: 8,
      }}>
        Verdict pinned!
      </div>
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 10, color: '#7a5c3a', marginBottom: 20,
      }}>
        Thanks for rating this idea.
      </div>
      {/* Show star summary */}
      <div style={{ display: 'inline-flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        {DIMENSIONS.map(d => (
          <div key={d.key} style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 8, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: '#c4a882', marginBottom: 4,
            }}>
              {d.label.split(' ')[0]}
            </div>
            <div style={{ display: 'flex', gap: 1 }}>
              {[1, 2, 3, 4, 5].map(n => (
                <span key={n} style={{
                  fontSize: 12,
                  color: n <= (ratings[d.key] || 0) ? '#f5c842' : '#e8dcc8',
                }}>
                  ★
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  RatingModal
// ─────────────────────────────────────────────

export default function RatingModal({
  ideaId, authorUid, isOpen, onClose, existingRating, onRatingSubmitted,
}) {
  const { user, signIn } = useAuth();

  const [ratings,      setRatings]      = useState({ problemClarity: 0, marketPotential: 0, founderCredibility: 0, executionReadiness: 0, overallInvestability: 0 });
  const [quickTake,    setQuickTake]    = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [submitted,    setSubmitted]    = useState(false);
  const [error,        setError]        = useState('');

  // Pre-fill if updating
  useEffect(() => {
    if (existingRating) {
      setRatings({
        problemClarity:       existingRating.problemClarity       || 0,
        marketPotential:      existingRating.marketPotential      || 0,
        founderCredibility:   existingRating.founderCredibility   || 0,
        executionReadiness:   existingRating.executionReadiness   || 0,
        overallInvestability: existingRating.overallInvestability || 0,
      });
      setQuickTake(existingRating.quickTake || '');
    }
  }, [existingRating]);

  // Auto-close success state after 2.5s
  useEffect(() => {
    if (!submitted) return;
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [submitted, onClose]);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const allFilled = DIMENSIONS.every(d => ratings[d.key] > 0);

  const handleSubmit = useCallback(async () => {
    if (!allFilled || !user || !ideaId) return;
    setSubmitting(true);
    setError('');

    try {
      const overall = parseFloat(
        (DIMENSIONS.reduce((s, d) => s + ratings[d.key], 0) / DIMENSIONS.length).toFixed(2)
      );

      const ratingData = {
        ideaId,
        authorUid: user.uid,
        ...ratings,
        overall,
        quickTake: quickTake.trim(),
        updatedAt: serverTimestamp(),
      };

      let newAggregates;

      await runTransaction(db, async (tx) => {
        const ideaRef  = doc(db, 'ideas', ideaId);
        const ideaSnap = await tx.get(ideaRef);
        if (!ideaSnap.exists()) throw new Error('Idea not found');

        const ideaData = ideaSnap.data();
        const currentCount  = ideaData.ratingCount || 0;

        if (existingRating) {
          // Update existing rating document
          const ratingRef = doc(db, 'ratings', existingRating.id);
          tx.update(ratingRef, ratingData);

          // Recalculate: undo old, apply new, count stays same
          const count = Math.max(currentCount, 1);
          const aggUpdate = {};
          DIMENSIONS.forEach(d => {
            const aggKey = `avg${d.key.charAt(0).toUpperCase()}${d.key.slice(1)}`;
            const old = existingRating[d.key] || 0;
            const current = ideaData[aggKey] || 0;
            aggUpdate[aggKey] = parseFloat(
              ((current * count - old + ratings[d.key]) / count).toFixed(3)
            );
          });
          const oldOverall = existingRating.overall || 0;
          const curOverall = ideaData.avgOverall || 0;
          aggUpdate.avgOverall = parseFloat(
            ((curOverall * count - oldOverall + overall) / count).toFixed(3)
          );
          tx.update(ideaRef, aggUpdate);
          newAggregates = aggUpdate;

        } else {
          // New rating
          const newCount = currentCount + 1;
          const newRatingRef = doc(collection(db, 'ratings'));
          tx.set(newRatingRef, { ...ratingData, createdAt: serverTimestamp() });

          const aggUpdate = { ratingCount: newCount };
          DIMENSIONS.forEach(d => {
            const aggKey = `avg${d.key.charAt(0).toUpperCase()}${d.key.slice(1)}`;
            const current = ideaData[aggKey] || 0;
            aggUpdate[aggKey] = parseFloat(
              ((current * currentCount + ratings[d.key]) / newCount).toFixed(3)
            );
          });
          const curOverall = ideaData.avgOverall || 0;
          aggUpdate.avgOverall = parseFloat(
            ((curOverall * currentCount + overall) / newCount).toFixed(3)
          );
          tx.update(ideaRef, aggUpdate);
          newAggregates = aggUpdate;
        }
      });

      // If quickTake provided, add as auto-approved comment
      if (quickTake.trim()) {
        await addDoc(collection(db, 'comments'), {
          ideaId,
          authorUid: user.uid,
          body: quickTake.trim(),
          status: 'approved',
          source: 'rating',
          parentId: null,
          createdAt: serverTimestamp(),
        });
      }

      setSubmitted(true);
      onRatingSubmitted(newAggregates);

    } catch (err) {
      console.error('Rating submit failed:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [allFilled, user, ideaId, ratings, quickTake, existingRating, onRatingSubmitted]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
        }}
      >
        {/* Modal card */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: '#fdf6e8',
            borderRadius: 24,
            padding: '32px 28px',
            maxWidth: 480, width: '100%',
            border: '1px solid #e8dcc8',
            position: 'relative',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(44,31,14,0.2)',
          }}
        >
          {/* Decorative tack */}
          <div style={{
            position: 'absolute', top: -13, left: '50%',
            transform: 'translateX(-50%)',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))',
          }}>
            <TackPin color="#e8391e" />
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 14, right: 14,
              width: 30, height: 30, borderRadius: '50%',
              background: 'rgba(44,31,14,0.06)', border: 'none',
              cursor: 'pointer', fontSize: 16, color: '#7a5c3a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>

          {/* Auth gate */}
          {!user ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 20, fontWeight: 900, color: '#2c1f0e', marginBottom: 10,
              }}>
                Sign in to pin your verdict
              </div>
              <div style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 13, color: '#7a5c3a', marginBottom: 24,
              }}>
                Your rating stays anonymous to the public.
              </div>
              <button
                onClick={signIn}
                style={{
                  width: '100%', padding: '14px 0',
                  background: '#2c1f0e', color: '#f5c842',
                  borderRadius: 12, border: 'none',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
                  cursor: 'pointer',
                }}
              >
                Sign in with Google
              </button>
            </div>
          ) : submitted ? (
            <SuccessState ratings={ratings} />
          ) : (
            <>
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: 4, paddingTop: 8 }}>
                <div style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 20, fontWeight: 900, color: '#2c1f0e', marginBottom: 4,
                }}>
                  Pin your verdict
                </div>
                <div style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 12, color: '#8a7a66',
                }}>
                  Rate each dimension independently
                </div>
              </div>

              {/* Star rows */}
              <div>
                {DIMENSIONS.map(d => (
                  <StarRatingRow
                    key={d.key}
                    label={d.label}
                    desc={d.desc}
                    value={ratings[d.key]}
                    onChange={v => setRatings(prev => ({ ...prev, [d.key]: v }))}
                  />
                ))}
              </div>

              {/* Quick take */}
              <div style={{ marginTop: 16 }}>
                <div style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 9, letterSpacing: '0.14em',
                  textTransform: 'uppercase', color: '#c4a882',
                  marginBottom: 8,
                }}>
                  Your quick take (optional)
                </div>
                <textarea
                  value={quickTake}
                  onChange={e => setQuickTake(e.target.value)}
                  placeholder="What stood out — good or bad?"
                  maxLength={200}
                  rows={3}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: '#fff',
                    border: '1px solid #e8dcc8',
                    borderRadius: 12, outline: 'none',
                    padding: '10px 12px',
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 13, color: '#2c1f0e',
                    lineHeight: 1.6, resize: 'none',
                  }}
                  onFocus={e => e.target.style.borderColor = '#2c1f0e'}
                  onBlur={e => e.target.style.borderColor = '#e8dcc8'}
                />
                <div style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 9, color: '#c4a882',
                  textAlign: 'right', marginTop: 4,
                }}>
                  {200 - quickTake.length} left
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10, color: '#c0392b',
                  marginTop: 8, textAlign: 'center',
                }}>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!allFilled || submitting}
                style={{
                  width: '100%', padding: '14px 0',
                  marginTop: 16,
                  background: allFilled ? '#2c1f0e' : '#e8dcc8',
                  color: allFilled ? '#f5c842' : '#c4a882',
                  borderRadius: 12, border: 'none',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
                  cursor: allFilled && !submitting ? 'pointer' : 'not-allowed',
                  opacity: submitting ? 0.7 : 1,
                  transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {submitting ? (
                  <>
                    <span style={{
                      width: 14, height: 14, borderRadius: '50%',
                      border: '2px solid rgba(245,200,66,0.3)',
                      borderTopColor: '#f5c842',
                      display: 'inline-block',
                      animation: 'rm-spin 0.7s linear infinite',
                    }} />
                    Pinning…
                  </>
                ) : (
                  existingRating ? 'Update verdict →' : 'Pin my verdict →'
                )}
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes rm-pop {
          from { transform: scale(0); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        @keyframes rm-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
