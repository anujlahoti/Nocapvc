import './Footer.css';

export default function Footer() {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <footer>
      <div className="foot-in">
        <button className="foot-logo" onClick={() => scrollTo('home')}>
          <div className="logo-dot" />
          nocapvc
        </button>
        <ul className="foot-links">
          <li><button onClick={() => scrollTo('how')}>How it works</button></li>
          <li><button onClick={() => scrollTo('feedback')}>Feedback</button></li>
          <li><button onClick={() => scrollTo('investors')}>For investors</button></li>
          <li><a href="https://instagram.com/nocapvc" target="_blank" rel="noreferrer">Instagram</a></li>
        </ul>

        {/* Contact details */}
        <div className="foot-contact">
          <a href="mailto:contactus.nocapvc@gmail.com" className="foot-contact-item">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12v9H2V4z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 4l6 5 6-5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            contactus.nocapvc@gmail.com
          </a>
          <a href="https://www.instagram.com/nocapvc/" target="_blank" rel="noreferrer" className="foot-contact-item">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="12" height="12" rx="3.5" stroke="currentColor" strokeWidth="1.2"/>
              <circle cx="8" cy="8" r="2.8" stroke="currentColor" strokeWidth="1.2"/>
              <circle cx="11.2" cy="4.8" r="0.7" fill="currentColor"/>
            </svg>
            @nocapvc
          </a>
        </div>

        <div className="foot-copy">© 2025 NoCap VC · Built for founders who refuse to quit.</div>
      </div>
    </footer>
  );
}