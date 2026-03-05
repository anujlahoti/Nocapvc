import './Hero.css';

export default function Hero() {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="hero" id="home">
      <div className="hero-grid" />
      <div className="hero-orb" />
      <div className="hero-inner">
        <div className="eyebrow">India's Founder-First Funding Layer</div>
        <h1 className="h1">
          One Form.
          <em>Many Doors.</em>
        </h1>
        <div className="h1-sub">Zero Ghosting.</div>
        <p className="hero-desc">
          Stop writing 20 applications to hear nothing back.<br />
          <strong>NoCap VC routes your startup to curated incubators and angels</strong> — and every founder gets structured feedback within 14 days. Guaranteed.
        </p>
        <div className="hero-actions">
          <button className="btn" onClick={() => scrollTo('apply')}>
            <span>Apply for Free</span>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="btn-ghost" onClick={() => scrollTo('how')}>
            See how it works{' '}
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M7 3v8M3 9l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="stats-bar">
          <div className="stat"><span className="stat-n">76K+</span><span className="stat-l">Founders in community</span></div>
          <div className="stat"><span className="stat-n">2</span><span className="stat-l">Partner incubators</span></div>
          <div className="stat"><span className="stat-n">1</span><span className="stat-l">Angel investor</span></div>
          <div className="stat"><span className="stat-n">100%</span><span className="stat-l">Response guaranteed</span></div>
        </div>
      </div>
    </section>
  );
}
