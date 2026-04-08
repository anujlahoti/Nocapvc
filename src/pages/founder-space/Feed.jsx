/**
 * Founder Space — Feed
 * Route: /founder-space/feed
 *
 * Minimal placeholder. Idea cards will be built in the next phase.
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { withAuth } from '../../components/withAuth';
import UserProfileCard from '../../components/founder-space/UserProfileCard';
import './FounderSpace.css';

function Feed() {
  const { userProfile, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/founder-space', { replace: true });
  }

  return (
    <div className="fs-page">
      {/* Nav */}
      <nav className="fs-nav">
        <Link to="/founder-space" className="fs-nav-logo">
          <span className="fs-nav-dot" />
          Founder Space
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {userProfile && (
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              color: 'var(--fs-muted)',
            }}>
              {userProfile.name}
            </span>
          )}
          <button className="fs-btn-ghost" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 48px' }}>
        {/* Welcome banner */}
        <div style={{ marginBottom: 56 }}>
          <div className="fs-section-label" style={{ marginBottom: 12 }}>
            Welcome to Founder Space
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(28px, 4vw, 42px)',
            fontWeight: 700,
            color: 'var(--fs-text)',
            margin: '0 0 12px',
            lineHeight: 1.15,
          }}>
            Your profile is live. 🚀
          </h1>
          <p style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 16,
            color: 'var(--fs-muted)',
            margin: 0,
            lineHeight: 1.7,
            maxWidth: 560,
          }}>
            The idea feed is launching soon. In the meantime, your profile card is
            already discoverable. Share it with your network and start building traction
            before you write a single line of code.
          </p>
        </div>

        {/* Two-column: profile card + CTA */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 64,
          alignItems: 'start',
        }}>
          {/* Profile card */}
          {userProfile && (
            <div>
              <div className="fs-section-label" style={{ marginBottom: 20 }}>
                Your profile card
              </div>
              <UserProfileCard profile={userProfile} size="lg" tilt={-1} />
            </div>
          )}

          {/* Next actions */}
          <div>
            <div className="fs-section-label" style={{ marginBottom: 20 }}>
              What's next
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                {
                  num: '01',
                  title: 'Post your startup idea',
                  body: 'The idea submission form is coming in 72 hours. Drop your email and we\'ll notify you the moment it\'s live.',
                  soon: true,
                },
                {
                  num: '02',
                  title: 'Get rated by the community',
                  body: 'Problem clarity, market potential, founder credibility — the Founder Space community gives you structured signal, not random opinions.',
                  soon: true,
                },
                {
                  num: '03',
                  title: 'Find your co-founder',
                  body: '«Want to work on this» — one click for engineers, designers, and operators to signal intent. You pick the best fit.',
                  soon: true,
                },
              ].map(item => (
                <div
                  key={item.num}
                  className="fs-card"
                  style={{ padding: '20px 24px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 10,
                      color: 'var(--fs-accent)',
                      letterSpacing: '0.14em',
                      fontWeight: 600,
                    }}>
                      {item.num}
                    </div>
                    {item.soon && (
                      <span style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 9,
                        background: 'rgba(196,150,58,0.12)',
                        color: 'var(--fs-accent-dark)',
                        padding: '2px 8px',
                        borderRadius: 100,
                        letterSpacing: '0.1em',
                      }}>
                        COMING SOON
                      </span>
                    )}
                  </div>
                  <h3 style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 15,
                    fontWeight: 700,
                    color: 'var(--fs-text)',
                    margin: '0 0 6px',
                  }}>
                    {item.title}
                  </h3>
                  <p style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 13,
                    color: 'var(--fs-muted)',
                    margin: 0,
                    lineHeight: 1.6,
                  }}>
                    {item.body}
                  </p>
                </div>
              ))}
            </div>

            {/* Back to main site */}
            <div style={{ marginTop: 32 }}>
              <Link to="/" className="fs-btn-outline" style={{ fontSize: 12 }}>
                ← Back to NoCap VC
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .fs-page > div > div:last-child { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

export default withAuth(Feed);
