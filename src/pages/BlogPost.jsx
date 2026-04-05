import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getPostBySlug, posts, CATEGORIES } from '../blog/BlogData';
import ByajReviewWidget from '../components/ByajReviewWidget';
import './BlogPost.css';

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`bp-faq-item${open ? ' open' : ''}`}>
      <button className="bp-faq-q" onClick={() => setOpen(o => !o)}>
        <span>{q}</span>
        <svg className="bp-faq-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && <div className="bp-faq-a">{a}</div>}
    </div>
  );
}

export default function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const post = getPostBySlug(slug);
  const [progress, setProgress] = useState(0);
  const articleRef = useRef(null);

  useEffect(() => {
    if (!post) { navigate('/blog', { replace: true }); return; }
    window.scrollTo(0, 0);

    // Dynamic page title + meta description for SEO
    document.title = `${post.title} | Founder School`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', post.excerpt);

    // FAQ JSON-LD schema for Google + LLM citation
    if (post.faqs && post.faqs.length > 0) {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: post.faqs.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      };
      const existing = document.getElementById('faq-schema');
      if (existing) existing.remove();
      const script = document.createElement('script');
      script.id = 'faq-schema';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    }

    return () => {
      document.title = 'NoCap VC | One Form, Opens Many Funding Doors';
      const s = document.getElementById('faq-schema');
      if (s) s.remove();
    };
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
          <Link to="/blog" className="bp-nav-link">← Founder School</Link>
          <a href="/#apply-form" className="bp-nav-cta">Apply Now →</a>
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
            <span>By {post.author || 'NoCap VC Research'}</span>
            {post.linkedinUrl && (
              <a
                href={post.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bp-linkedin-btn"
                aria-label="Connect on LinkedIn"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </a>
            )}
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

      {/* ── FAQ SECTION ── */}
      {post.faqs && post.faqs.length > 0 && (
        <section className="bp-faq">
          <div className="bp-faq-inner">
            <div className="bp-faq-label">FREQUENTLY ASKED</div>
            <div className="bp-faq-list">
              {post.faqs.map((f, i) => (
                <FaqItem key={i} q={f.q} a={f.a} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── ARTICLE CTA ── */}
      {!post.hideCta && (
        <section className="bp-cta">
          <div className="bp-cta-inner">
            <div className="bp-cta-label">NOCAP VC</div>
            <h2 className="bp-cta-title">Ready to apply for funding?</h2>
            <p className="bp-cta-sub">
              Your application takes 12 minutes. AI screens it in 48 hours.<br />
              Structured feedback guaranteed. No ghosting.
            </p>
            <a href="/#apply-form" className="bp-cta-btn">Apply Now → nocapvc.in</a>
          </div>
        </section>
      )}

      {/* ── SURVEY BUTTON ── */}
      {post.surveyUrl && (
        <section className="bp-survey">
          <div className="bp-survey-inner">
            <div className="bp-survey-label">QUICK SURVEY</div>
            <p className="bp-survey-text">If you liked the idea, please fill the survey — it takes 2 mins.</p>
            <a
              href={post.surveyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bp-survey-btn"
            >
              Fill the Survey Form →
            </a>
          </div>
        </section>
      )}

      {/* ── REVIEW WIDGET ── */}
      {post.reviewWidget === 'byaj' && (
        <section className="bp-review-wrap">
          <div className="bp-review-inner">
            <div className="bp-review-label">COMMUNITY REVIEW</div>
            <ByajReviewWidget />
          </div>
        </section>
      )}

      {/* ── RELATED ARTICLES ── */}
      {related.length > 0 && (
        <section className="bp-related">
          <div className="bp-related-inner">
            <div className="bp-related-label">MORE FROM FOUNDER SCHOOL</div>
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
