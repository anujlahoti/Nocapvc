/**
 * DiagramSkeleton — pulsing placeholder for the PolaroidWallDiagram.
 * Use on the IdeaPage while the idea data is loading.
 */

import React from 'react';

const ROTATIONS = [-2, 1.5, -1, 2, -1.5];

export default function DiagramSkeleton() {
  return (
    <div style={{
      width: '100%',
      background: '#f5ede0',
      borderRadius: 24,
      padding: '28px 24px 24px',
      animation: 'diag-pulse 1.8s ease-in-out infinite',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ ...skel, height: 10, width: 80, marginBottom: 10 }} />
          <div style={{ ...skel, height: 26, width: 220, marginBottom: 8 }} />
          <div style={{ ...skel, height: 14, width: 160 }} />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <div style={{ ...skel, height: 22, width: 64, borderRadius: 20 }} />
          <div style={{ ...skel, height: 22, width: 80, borderRadius: 20 }} />
        </div>
      </div>

      {/* 5 polaroid card shapes */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', overflowX: 'auto' }}>
        {ROTATIONS.map((rot, i) => (
          <div key={i} style={{
            ...skel,
            flexShrink: 0,
            width: 140,
            height: 180,
            borderRadius: 8,
            transform: `rotate(${rot}deg)`,
          }} />
        ))}
      </div>

      <style>{`
        @keyframes diag-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

const skel = {
  background: 'rgba(44,31,14,0.1)',
  borderRadius: 4,
};
