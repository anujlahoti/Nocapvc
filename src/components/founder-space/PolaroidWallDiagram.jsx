/**
 * PolaroidWallDiagram — the polaroid cork-board layout for an idea.
 *
 * Props:
 *   idea    {object}  — Firestore idea document (or formData shape)
 *   author  {object}  — Firestore user profile
 *   readOnly  {bool}  — hides empty branch placeholders when true (default: true)
 *   compact   {bool}  — smaller sizing for embed contexts (default: false)
 */

import React from 'react';

// ─────────────────────────────────────────────
//  Node configuration
// ─────────────────────────────────────────────

const NODE_CONFIG = [
  { key: 'problem',  number: 1, label: 'The Villain', tackColor: '#e8391e', rotation: -1.5 },
  { key: 'reveal',   number: 2, label: 'The Reveal',  tackColor: '#c4a882', rotation: 1    },
  { key: 'solution', number: 3, label: 'The Hero',    tackColor: '#2c8a4e', rotation: -0.8 },
  { key: 'market',   number: 4, label: 'The Stakes',  tackColor: '#1a6bb5', rotation: 1.2  },
  { key: 'ask',      number: 5, label: 'The Ask',     tackColor: '#f5c842', rotation: -0.6 },
];

const CONNECTOR_COLORS = ['#e8391e', '#c4a882', '#e8391e', '#c4a882'];

// ─────────────────────────────────────────────
//  PolaroidCard
// ─────────────────────────────────────────────

function PolaroidCard({ number, label, title, body, photoURL, rotation, tackColor, compact }) {
  return (
    <div style={{
      position: 'relative',
      background: '#fff',
      borderRadius: 8,
      padding: compact ? '10px 10px 24px' : '12px 12px 32px',
      minWidth: compact ? 110 : 130,
      maxWidth: compact ? 120 : 145,
      border: '1px solid #e8dcc8',
      boxShadow: '2px 3px 0 #d4c4b0',
      transform: `rotate(${rotation}deg)`,
      flexShrink: 0,
    }}>
      {/* Tack */}
      <div style={{
        position: 'absolute', top: -5, left: '50%',
        transform: 'translateX(-50%)',
        width: 10, height: 10, borderRadius: '50%',
        background: tackColor,
        boxShadow: `0 1px 4px ${tackColor}99`,
      }} />

      {/* Photo area */}
      <div style={{
        width: '100%',
        height: compact ? 56 : 72,
        background: '#f0e8d8',
        borderRadius: 4,
        marginBottom: 6,
        overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {photoURL ? (
          <img
            src={photoURL} alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 28, fontWeight: 900,
            color: '#c4a882', opacity: 0.4,
          }}>
            {number}
          </span>
        )}
      </div>

      {/* Title */}
      <div style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 11, fontWeight: 700,
        color: title ? '#2c1f0e' : '#c4a882',
        lineHeight: 1.3, marginBottom: 3,
        wordBreak: 'break-word',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {title || '—'}
      </div>

      {/* Body */}
      {body && (
        <div style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 9, color: '#b09878',
          fontStyle: 'italic', lineHeight: 1.5,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {body}
        </div>
      )}

      {/* Label at bottom */}
      <div style={{
        position: 'absolute', bottom: 6, left: 4, right: 4,
        fontFamily: "'DM Mono', monospace",
        fontSize: 7, fontWeight: 900,
        letterSpacing: '0.2em', textTransform: 'uppercase',
        color: '#c4a882', textAlign: 'center',
      }}>
        {label}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  StringConnector
// ─────────────────────────────────────────────

function StringConnector({ color, reversed }) {
  const c = color || '#c4a882';
  const cpX = reversed ? 4 : 28;
  const cpX2 = reversed ? 28 : 4;
  return (
    <svg
      width="32" height="80" viewBox="0 0 32 80" fill="none"
      style={{ flexShrink: 0, alignSelf: 'flex-start', marginTop: 22 }}
    >
      <path
        d={`M 16 0 C ${cpX} 20 ${cpX2} 50 16 70`}
        stroke={c}
        strokeWidth="1.5"
        strokeDasharray="4 3"
        strokeLinecap="round"
      />
      {/* Arrowhead */}
      <path
        d="M 10 65 L 16 72 L 22 65"
        stroke={c}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

// ─────────────────────────────────────────────
//  BranchCard (smaller, more rotation)
// ─────────────────────────────────────────────

function BranchCard({ branch, nodeIndex, compact }) {
  const rot = nodeIndex % 2 === 0 ? 2.5 : -2.2;
  return (
    <div style={{
      background: '#fff',
      borderRadius: 6,
      padding: compact ? '7px 7px 18px' : '8px 8px 20px',
      minWidth: compact ? 90 : 110,
      maxWidth: compact ? 100 : 120,
      border: `1.5px solid ${branch.parentColor || '#c4a882'}44`,
      borderLeft: `3px solid ${branch.parentColor || '#c4a882'}`,
      boxShadow: '1px 2px 0 #d4c4b0',
      transform: `rotate(${rot}deg)`,
      position: 'relative',
      flexShrink: 0,
    }}>
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 7, fontWeight: 700,
        letterSpacing: '0.14em', textTransform: 'uppercase',
        color: branch.parentColor || '#c4a882', marginBottom: 3,
      }}>
        {branch.label}
      </div>
      <div style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 9, fontWeight: 700,
        color: '#2c1f0e', lineHeight: 1.3, wordBreak: 'break-word',
      }}>
        {branch.title.length > 28 ? branch.title.slice(0, 28) + '…' : branch.title}
      </div>
      <div style={{
        position: 'absolute', bottom: 4, left: 4, right: 4,
        fontFamily: "'DM Mono', monospace",
        fontSize: 6, letterSpacing: '0.16em',
        textTransform: 'uppercase', color: '#c4a882',
        textAlign: 'center',
      }}>
        {branch.parentLabel}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  PolaroidWallDiagram — main export
// ─────────────────────────────────────────────

export function PolaroidWallDiagram({ idea, author, readOnly = true, compact = false }) {
  if (!idea) return null;

  return (
    <div style={{
      background: '#f5ede0',
      borderRadius: 24,
      padding: compact ? '20px 16px' : '32px 24px',
      overflowX: 'auto',
    }}>
      {/* ── Header ───────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16, marginBottom: 28,
        flexWrap: 'wrap',
      }}>
        {/* Left */}
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 8, fontWeight: 600,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: '#c4a882', marginBottom: 6,
          }}>
            Founder Space · Investigation board
          </div>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: compact ? 18 : 26, fontWeight: 900,
            color: '#2c1f0e', letterSpacing: '-0.02em',
            lineHeight: 1.15, marginBottom: 5,
          }}>
            {idea.ideaTitle || 'Untitled'}
          </div>
          {idea.tagline && (
            <div style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 12, fontStyle: 'italic',
              color: '#b09878', lineHeight: 1.5,
            }}>
              {idea.tagline}
            </div>
          )}
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          {/* Category + Stage badges */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {idea.category && (
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9, fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                padding: '4px 10px', borderRadius: 20,
                background: '#2c1f0e', color: '#f5c842',
              }}>
                {idea.category}
              </span>
            )}
            {idea.stage && (
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9, fontWeight: 600,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                padding: '4px 10px', borderRadius: 20,
                background: 'rgba(44,31,14,0.08)', color: '#2c1f0e',
              }}>
                {idea.stage}
              </span>
            )}
          </div>

          {/* Author chip */}
          {author && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.75)',
              borderRadius: 24, padding: '5px 12px',
            }}>
              {author.photoURL ? (
                <img
                  src={author.photoURL} alt={author.name}
                  style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #c4963a 0%, #2c1f0e 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: '#fff',
                  fontFamily: "'Playfair Display', serif",
                }}>
                  {(author.name || 'F').charAt(0).toUpperCase()}
                </div>
              )}
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10, fontWeight: 600, color: '#2c1f0e',
              }}>
                {author.name}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Main node row ─────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        gap: 0, minWidth: 'max-content',
        paddingBottom: 8,
      }}>
        {NODE_CONFIG.map((node, i) => {
          const title    = idea[`${node.key}Title`]    || '';
          const body     = idea[`${node.key}Body`]     || '';
          const photoURL = idea[`${node.key}PhotoURL`] || '';
          const branches = (idea.branchNodes || []).filter(b => b.parentKey === node.key);

          return (
            <React.Fragment key={node.key}>
              {/* Column: main card + branches below */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <PolaroidCard
                  number={node.number}
                  label={node.label}
                  title={title}
                  body={body}
                  photoURL={photoURL}
                  rotation={node.rotation}
                  tackColor={node.tackColor}
                  compact={compact}
                />

                {/* Branches */}
                {branches.map(b => (
                  <div
                    key={b.id}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 4 }}
                  >
                    <div style={{
                      width: 1, height: 18,
                      borderLeft: `1.5px dashed ${b.parentColor || node.tackColor}77`,
                    }} />
                    <BranchCard branch={b} nodeIndex={i} compact={compact} />
                  </div>
                ))}

                {/* Empty placeholder (edit mode) */}
                {!readOnly && branches.length === 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 4 }}>
                    <div style={{ width: 1, height: 18, borderLeft: '1.5px dashed #e8dcc8' }} />
                    <div style={{
                      width: compact ? 90 : 110, height: 40, borderRadius: 6,
                      border: '1.5px dashed #e8dcc8',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: "'DM Mono', monospace", fontSize: 14, color: '#e8dcc8',
                    }}>
                      +
                    </div>
                  </div>
                )}
              </div>

              {/* String connector */}
              {i < NODE_CONFIG.length - 1 && (
                <StringConnector
                  color={CONNECTOR_COLORS[i]}
                  reversed={i % 2 === 1}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

export default PolaroidWallDiagram;
