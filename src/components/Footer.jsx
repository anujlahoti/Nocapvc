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
        <div className="foot-copy">© 2025 NoCap VC · Built for founders who refuse to quit.</div>
      </div>
    </footer>
  );
}
