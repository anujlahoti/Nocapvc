import { useState, useEffect } from 'react';
import './Navbar.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(function() {
    var onScroll = function() { setScrolled(window.scrollY > 60); };
    window.addEventListener('scroll', onScroll);
    return function() { window.removeEventListener('scroll', onScroll); };
  }, []);

  var scrollTo = function(id) {
    var el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMenuOpen(false);
  };

  return (
    <nav id="nav" className={scrolled ? 'scr' : ''}>
      <a href="#home" className="logo" onClick={function(e){ e.preventDefault(); scrollTo('home'); }}>
        <div className="logo-dot" />
        nocapvc
      </a>
      <ul className={'nav-links' + (menuOpen ? ' open' : '')} id="navLinks">
        <li><button onClick={function(){ scrollTo('how'); }}>How it works</button></li>
        <li><button onClick={function(){ scrollTo('feedback'); }}>Feedback</button></li>
        <li><button onClick={function(){ scrollTo('investors'); }}>For Investors</button></li>
        <li><button onClick={function(){ scrollTo('apply-form'); }}>Apply</button></li>
        <li><a href="/blog" className="nav-blog-link">Blog</a></li>
        {/* Founder Signal — hidden until ready
        <li>
          <a href="/school" className="nav-product-link school-link">
            Founder Signal <span className="nav-spark">✦</span>
          </a>
        </li>
        */}
        <li>
          <a href="/pe" className="nav-product-link pe-link">
            NoCap PE <span className="nav-pe-tag">MICRO PE</span>
          </a>
        </li>
      </ul>
      <button className="nav-cta" onClick={function(){ scrollTo('apply-form'); }}>Apply Now →</button>
      <button
        className="ham"
        id="ham"
        aria-label="Menu"
        onClick={function(){ setMenuOpen(!menuOpen); }}
      >
        <span className={menuOpen ? 'open' : ''} />
        <span className={menuOpen ? 'open' : ''} />
        <span className={menuOpen ? 'open' : ''} />
      </button>
    </nav>
  );
}
