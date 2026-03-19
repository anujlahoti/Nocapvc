import './InstagramFeed.css';

export default function InstagramFeed() {
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

        <div className="ig-widget-wrap">
          <iframe
            src="https://app.behold.so/feeds/jPZawaMbbo5X3Vb30DUS/"
            title="NoCap VC Instagram Feed"
            frameBorder="0"
            scrolling="no"
            className="ig-iframe"
          />
        </div>

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