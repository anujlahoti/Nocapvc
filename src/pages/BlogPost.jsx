import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getPostBySlug, posts, CATEGORIES } from '../blog/BlogData';
import './BlogPost.css';

export default function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const post = getPostBySlug(slug);
  const [progress, setProgress] = useState(0);
  const articleRef = useRef(null);

  useEffect(() => {
    if (!post) { navigate('/blog', { replace: true }); return; }
    window.scrollTo(0, 0);
  }, [slug, post, navigate]);

  useEffect(() => {
    const handleScroll = () => {
      if (!articleRef.current) return;
      const { top, height } = articleRef.current.getBoundingClientRect();
      const scrolled = -top;
      const pct = Math.min(Math.max((scrolled / (height - window.innerHeight)) * 100, 0), 100);
      setProgress(pct);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!post) return null;

  const cat = CATEGORIES.find(c => c.id === post.category);
  const catColor = cat?.color || '#FFE034';
  const related = posts.filter(p => p.slug !== post.slug).slice(0, 3);

  return (
    <div className="bp-root" ref={articleRef}>

      {/* ── READING PROGRESS ── */}
      <div className="bp-progress-bar" style={{ width: `${progress}%` }} />

      {/* ── ARTICLE NAV ── */}
      <nav className="bp-nav">
        <Link to="/" className="bp-nav-logo">
          <span className="bp-nav-dot" />
          nocapvc
        </Link>
        <div className="bp-nav-right">
          <Link to="/blog" className="bp-nav-link">← All articles</Link>
          <a href="/#apply" className="bp-nav-cta">Apply Now →</a>
        </div>
      </nav>

      {/* ── ARTICLE HEADER ── */}
      <header className="bp-header">
        <div className="bp-header-inner">
          <span
            className="bp-header-cat"
            style={cat?.border
              ? { color: catColor, border: `1px solid ${catColor}55`, padding: '4px 10px', borderRadius: '3px' }
              : { color: catColor }
            }
          >
            {post.categoryLabel}
          </span>
          <h1 className="bp-header-title">{post.title}</h1>
          <p className="bp-header-excerpt">{post.excerpt}</p>
          <div className="bp-header-meta">
            <span>By NoCap VC Research</span>
            <span className="bp-meta-sep">·</span>
            <span>{post.date}</span>
            <span className="bp-meta-sep">·</span>
            <span>{post.readTime}</span>
          </div>
        </div>
      </header>

      {/* ── ARTICLE BODY ── */}
      <main className="bp-body-wrap">
        <article
          className="bp-body"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </main>

      {/* ── ARTICLE CTA ── */}
      <section className="bp-cta">
        <div className="bp-cta-inner">
          <div className="bp-cta-label">NOCAP VC</div>
          <h2 className="bp-cta-title">Ready to apply for funding?</h2>
          <p className="bp-cta-sub">
            Your application takes 12 minutes. AI screens it in 48 hours.<br />
            Structured feedback guaranteed. No ghosting.
          </p>
          <a href="/#apply" className="bp-cta-btn">Apply Now → nocapvc.in</a>
        </div>
      </section>

      {/* ── RELATED ARTICLES ── */}
      {related.length > 0 && (
        <section className="bp-related">
          <div className="bp-related-inner">
            <div className="bp-related-label">KEEP READING</div>
            <div className="bp-related-grid">
              {related.map(r => {
                const rCat = CATEGORIES.find(c => c.id === r.category);
                return (
                  <Link key={r.slug} to={`/blog/${r.slug}`} className="bp-related-card">
                    <span className="bp-related-cat" style={{ color: rCat?.color || '#FFE034' }}>
                      {r.categoryLabel}
                    </span>
                    <h3 className="bp-related-title">{r.title}</h3>
                    <div className="bp-related-meta">{r.date} · {r.readTime}</div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
