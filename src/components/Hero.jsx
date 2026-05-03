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
          One Form,
          <em>Opens Many Funding Doors.</em>
        </h1>
        <div className="h1-sub">Zero Ghosting.</div>
        <p className="hero-desc">
          Stop writing 20 applications to hear nothing back.<br />
          <strong>NoCap VC routes your startup to curated incubators and angels</strong> — and every founder gets structured feedback within 14 days. Guaranteed.
        </p>
        <div className="hero-actions">
          <button className="btn" onClick={() => scrollTo('apply-form')}>
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
          <div className="stat"><span className="stat-n">5</span><span className="stat-l">Angel investors & VCs</span></div>
          <div className="stat"><span className="stat-n">100%</span><span className="stat-l">Response guaranteed</span></div>
        </div>

        {/* Products strip */}
        <div className="hero-products">
          <a href="/founder-space" className="hero-product-card hero-product-fs">
            <div className="hero-product-eyebrow">New ✦</div>
            <div className="hero-product-name">Founder Space</div>
            <div className="hero-product-desc">The place where your startup idea stops being a secret</div>
            <div className="hero-product-cta">Explore →</div>
            <div className="hero-product-deco">
              {['problem','reveal','solution','market','ask'].map((k, i) => (
                <div key={k} className="hero-product-polaroid" style={{ '--r': `${(i % 2 === 0 ? -1 : 1) * (i + 1) * 1.5}deg`, '--d': `${i * 60}ms` }} />
              ))}
            </div>
          </a>
          <a href="/blog" className="hero-product-card hero-product-school">
            <div className="hero-product-eyebrow">Read ✦</div>
            <div className="hero-product-name">Founder School</div>
            <div className="hero-product-desc">Playbooks, teardowns, and frameworks for Indian founders</div>
            <div className="hero-product-cta">Read →</div>
          </a>
          <a href="/pe" className="hero-product-card hero-product-pe">
            <div className="hero-product-eyebrow">Micro PE ✦</div>
            <div className="hero-product-name">NoCap PE</div>
            <div className="hero-product-desc">Acquire profitable micro businesses. No VC, no dilution.</div>
            <div className="hero-product-cta">Learn more →</div>
          </a>
        </div>
      </div>
    </section>
  );
}
