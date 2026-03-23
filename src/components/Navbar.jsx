import { useState, useEffect } from 'react';
import './Navbar.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMenuOpen(false);
  };

  return (
    <nav id="nav" className={scrolled ? 'scr' : ''}>
      <a href="#home" className="logo" onClick={(e) => { e.preventDefault(); scrollTo('home'); }}>
        <div className="logo-dot" />
        nocapvc
      </a>

      <ul className={`nav-links ${menuOpen ? 'open' : ''}`} id="navLinks">
        <li><button onClick={() => scrollTo('how')}>How it works</button></li>
        <li><button onClick={() => scrollTo('feedback')}>Feedback</button></li>
        <li><button onClick={() => scrollTo('investors')}>For Investors</button></li>
        <li><button onClick={() => scrollTo('apply')}>Apply</button></li>
        <li>
          <a
            href="/school"
            className="nav-school-link"
            onClick={() => setMenuOpen(false)}
          >
            Founder School ✦
          </a>
        </li>
      </ul>

      <a href="/school" className="nav-school-btn">
        Founder School ✦
      </a>
      <button className="nav-cta" onClick={() => scrollTo('apply')}>Apply Now →</button>

      <button
        className="ham"
        id="ham"
        aria-label="Menu"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <span className={menuOpen ? 'open' : ''} />
        <span className={menuOpen ? 'open' : ''} />
        <span className={menuOpen ? 'open' : ''} />
      </button>
    </nav>
  );
}