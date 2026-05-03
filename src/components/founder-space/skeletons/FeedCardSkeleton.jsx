/**
 * FeedCardSkeleton — pulsing placeholder matching FeedIdeaCard dimensions.
 * Use in the feed while ideas are loading.
 */

import React from 'react';

const pulse = {
  background: '#e8dcc8',
  borderRadius: 4,
  animation: 'skel-pulse 1.8s ease-in-out infinite',
};

export default function FeedCardSkeleton() {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 18,
      border: '1px solid rgba(44,31,14,0.1)',
      padding: '18px 18px 16px',
    }}>
      {/* Mini polaroid strip: 5 rectangles */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} style={{
            ...pulse,
            width: 64, height: 58,
            borderRadius: 6,
            transform: `rotate(${(i % 2 === 0 ? -1 : 1) * 1.5}deg)`,
          }} />
        ))}
      </div>

      {/* Startup name */}
      <div style={{ ...pulse, height: 22, width: '60%', marginBottom: 10 }} />

      {/* Tagline: 2 lines */}
      <div style={{ ...pulse, height: 14, width: '85%', marginBottom: 6 }} />
      <div style={{ ...pulse, height: 14, width: '70%', marginBottom: 14 }} />

      {/* Badges */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        <div style={{ ...pulse, height: 18, width: 56, borderRadius: 20 }} />
        <div style={{ ...pulse, height: 18, width: 72, borderRadius: 20 }} />
      </div>

      {/* Divider */}
      <div style={{ ...pulse, height: 1, marginBottom: 12, borderRadius: 1 }} />

      {/* Founder row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ ...pulse, width: 28, height: 28, borderRadius: '50%' }} />
          <div>
            <div style={{ ...pulse, height: 10, width: 80, marginBottom: 4 }} />
            <div style={{ ...pulse, height: 8, width: 52 }} />
          </div>
        </div>
        {/* Stats */}
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ ...pulse, height: 10, width: 32 }} />
          <div style={{ ...pulse, height: 10, width: 24 }} />
        </div>
      </div>

      <style>{`
        @keyframes skel-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.45; }
        }
      `}</style>
    </div>
  );
}
