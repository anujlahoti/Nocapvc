import { useState } from 'react';
import { Link } from 'react-router-dom';
import { posts, CATEGORIES, getFeaturedPost } from '../blog/BlogData';
import './Blog.css';

const TICKER_TEXT = '76K+ FOUNDERS IN COMMUNITY · 2 PARTNER INCUBATORS · 5 ANGEL INVESTORS & VCs · 100% RESPONSE GUARANTEED · INDIA\'S FOUNDER-FIRST FUNDING LAYER · AI-POWERED SCREENING · 14-DAY FEEDBACK GUARANTEE · ';

function CategoryTag({ categoryId, label, style }) {
  const cat = CATEGORIES.find(c => c.id === categoryId);
  const color = cat?.color || '#FFE034';
  const border = cat?.border;
  return (
    <span
      className="bl-cat-tag"
      style={border
        ? { color, border: `1px solid ${color}`, background: 'transparent', ...style }
        : { color, ...style }
      }
    >
      {label}
    </span>
  );
}

function ArticleCard({ post, size = 'normal' }) {
  return (
    <Link to={`/blog/${post.slug}`} className={`bl-card bl-card-${size}`}>
      <CategoryTag categoryId={post.category} label={post.categoryLabel} />
      <h3 className="bl-card-title">{post.title}</h3>
      <p className="bl-card-excerpt">{post.excerpt}</p>
      <div className="bl-card-meta">
        <span>{post.date}</span>
        <span className="bl-meta-dot">·</span>
        <span>{post.readTime}</span>
      </div>
    </Link>
  );
}

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const featured = getFeaturedPost();

  const filtered = activeCategory === 'all'
    ? posts
    : posts.filter(p => p.category === activeCategory);

  const rest = filtered.filter(p => p.slug !== featured.slug);

  return (
    <div className="bl-root">

      {/* ── TICKER ── */}
      <div className="bl-ticker">
        <div className="bl-ticker-inner">
          <span>{TICKER_TEXT}{TICKER_TEXT}</span>
        </div>
      </div>

      {/* ── BLOG NAV ── */}
      <nav className="bl-nav">
        <Link to="/" className="bl-nav-logo">
          <span className="bl-nav-dot" />
          nocapvc
        </Link>
        <div className="bl-nav-right">
          <Link to="/" className="bl-nav-link">← Home</Link>
          <Link to="/#apply" className="bl-nav-cta">Apply Now →</Link>
        </div>
      </nav>

      {/* ── HERO / FEATURED ── */}
      <section className="bl-hero">
        <div className="bl-hero-left">
          <CategoryTag categoryId={featured.category} label="NOCAP INTELLIGENCE" />
          <h1 className="bl-hero-title">{featured.title}</h1>
          <p className="bl-hero-excerpt">{featured.excerpt}</p>
          <div className="bl-hero-meta">By NoCap VC Research · {featured.readTime}</div>
          <Link to={`/blog/${featured.slug}`} className="bl-hero-cta">
            Read article →
          </Link>
        </div>
        <div className="bl-hero-right">
          <div className="bl-hero-num">001</div>
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="bl-divider">
        <div className="bl-divider-line" />
        <span className="bl-divider-label">LATEST INTELLIGENCE</span>
        <div className="bl-divider-line" />
      </div>

      {/* ── CATEGORY FILTER ── */}
      <div className="bl-filter-wrap">
        <div className="bl-filter">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`bl-filter-pill ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── ARTICLE GRID ── */}
      <section className="bl-grid-wrap">
        {filtered.length === 0 ? (
          <p className="bl-empty">No articles in this category yet.</p>
        ) : (
          <>
            {/* Row 1: 60/40 split */}
            {rest.length >= 2 && (
              <div className="bl-row bl-row-split">
                <ArticleCard post={rest[0]} size="large" />
                <ArticleCard post={rest[1]} size="medium" />
              </div>
            )}
            {/* Remaining: 3-col grid */}
            {rest.length > 2 && (
              <div className="bl-row bl-row-three">
                {rest.slice(2).map(post => (
                  <ArticleCard key={post.slug} post={post} />
                ))}
              </div>
            )}
            {/* Single article fallback */}
            {rest.length === 1 && (
              <div className="bl-row bl-row-one">
                <ArticleCard post={rest[0]} size="large" />
              </div>
            )}
            {/* Featured always shows if filtered includes it */}
            {!filtered.find(p => p.slug === featured.slug) ? null : rest.length === 0 && (
              <div className="bl-row bl-row-one">
                <ArticleCard post={featured} size="large" />
              </div>
            )}
          </>
        )}
      </section>

      {/* ── EMAIL CAPTURE ── */}
      <section className="bl-subscribe">
        <div className="bl-subscribe-inner">
          <div className="bl-subscribe-label">NOCAP INTELLIGENCE</div>
          <h2 className="bl-subscribe-title">Intelligence for founders who are serious.</h2>
          <p className="bl-subscribe-sub">Weekly insights from India's largest startup application database.</p>
          {subscribed ? (
            <p className="bl-subscribe-done">You're in. Watch your inbox.</p>
          ) : (
            <form className="bl-subscribe-form" onSubmit={e => { e.preventDefault(); if (email) setSubscribed(true); }}>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bl-subscribe-input"
                required
              />
              <button type="submit" className="bl-subscribe-btn">Subscribe →</button>
            </form>
          )}
        </div>
      </section>

    </div>
  );
}
