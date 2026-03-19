import { useState, useEffect } from 'react';
import './InstagramFeed.css';

const FEED_URL = 'https://feeds.behold.so/jPZawaMbbo5X3Vb30DUS';

export default function InstagramFeed() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch(FEED_URL)
      .then(r => r.json())
      .then(data => setPosts((data.posts || []).slice(0, 9)))
      .catch(() => {});
  }, []);

  const getImage = (post) =>
    post.sizes?.medium?.mediaUrl ||
    post.thumbnailUrl ||
    post.mediaUrl ||
    '';

  return (
    <section className="ig-sec" id="instagram">
      <div className="sec-inner">
        <div className="ig-hd">
          <div className="tag">From the Feed</div>
          <h2 className="sh2">Daily content for founders.<br /><em>Follow along.</em></h2>
          <a
            href="https://www.instagram.com/nocapvc/"
            target="_blank"
            rel="noreferrer"
            className="ig-handle"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="12" height="12" rx="3.5" stroke="currentColor" strokeWidth="1.2"/>
              <circle cx="8" cy="8" r="2.8" stroke="currentColor" strokeWidth="1.2"/>
              <circle cx="11.2" cy="4.8" r="0.7" fill="currentColor"/>
            </svg>
            @nocapvc
          </a>
        </div>

        {posts.length > 0 && (
          <div className="ig-grid">
            {posts.map(post => (
              <a
                key={post.id}
                href={post.permalink}
                target="_blank"
                rel="noreferrer"
                className="ig-post"
              >
                <img
                  src={getImage(post)}
                  alt={post.prunedCaption?.slice(0, 60) || 'NoCap VC post'}
                  loading="lazy"
                />
                <div className="ig-overlay">
                  <span className="ig-type">
                    {post.isReel ? '▶ Reel' : post.mediaType === 'CAROUSEL_ALBUM' ? '⊞ Carousel' : '◻ Post'}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}

        <div className="ig-cta">
          <a
            href="https://www.instagram.com/nocapvc/"
            target="_blank"
            rel="noreferrer"
            className="btn-outline"
          >
            See all posts on Instagram →
          </a>
        </div>
      </div>
    </section>
  );
}