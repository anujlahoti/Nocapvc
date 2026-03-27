import { useState, useEffect, useRef } from 'react';
import './NoCap_PE.css';

const SCRIPT_URL = process.env.REACT_APP_GOOGLE_SCRIPT_URL;

const SECTORS = [
  'Food & Beverage', 'Retail / E-commerce', 'SaaS / Tech',
  'Manufacturing', 'Healthcare / Wellness', 'Education',
  'Logistics / Supply Chain', 'Real Estate / Construction',
  'Media / Content', 'Hospitality / Travel', 'Agriculture',
  'Financial Services', 'Other'
];

const DEAL_TYPES = [
  { id: 'full', label: 'Full Acquisition', desc: 'Buyer acquires 100% ownership' },
  { id: 'majority', label: 'Majority Stake', desc: 'Buyer takes 51–80%, founder stays' },
  { id: 'growth', label: 'Growth Capital', desc: 'Investor takes 10–30% minority stake' },
];

const REVENUE_BANDS = [
  'Under ₹10L/year', '₹10L – ₹50L/year', '₹50L – ₹1Cr/year',
  '₹1Cr – ₹5Cr/year', '₹5Cr – ₹25Cr/year', 'Above ₹25Cr/year'
];

const ASKING_PRICE = [
  'Under ₹25L', '₹25L – ₹1Cr', '₹1Cr – ₹5Cr',
  '₹5Cr – ₹25Cr', 'Above ₹25Cr', 'Open to offers'
];

const BUYER_TICKET = [
  'Under ₹25L', '₹25L – ₹1Cr', '₹1Cr – ₹5Cr',
  '₹5Cr – ₹25Cr', 'Above ₹25Cr'
];

const YEARS_RUNNING = [
  'Under 1 year', '1–3 years', '3–7 years', '7–15 years', 'Above 15 years'
];

function AnimatedStat({ value, label }) {
  const [displayed, setDisplayed] = useState(0);
  const ref = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let start = 0;
          const target = parseInt(value);
          const step = Math.ceil(target / 40);
          const timer = setInterval(() => {
            start += step;
            if (start >= target) { setDisplayed(target); clearInterval(timer); }
            else setDisplayed(start);
          }, 30);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div className="pe-stat" ref={ref}>
      <div className="pe-stat-num">{typeof value === 'string' && isNaN(parseInt(value)) ? value : displayed}{typeof value === 'string' && value.includes('+') ? '+' : ''}</div>
      <div className="pe-stat-label">{label}</div>
    </div>
  );
}

function SellerForm({ onSuccess }) {
  const [form, setForm] = useState({
    business_name: '', founder_name: '', email: '', phone: '',
    sector: '', years_running: '', annual_revenue: '', ebitda_margin: '',
    asking_price: '', deal_type: '', reason_for_sale: '',
    what_buyer_needs: '', existing_team: '', website: '', linkedin: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => Object.assign({}, f, { [k]: v }));

  const handleSubmit = async () => {
    const required = ['business_name', 'founder_name', 'email', 'sector',
      'years_running', 'annual_revenue', 'asking_price', 'deal_type', 'reason_for_sale'];
    for (const f of required) {
      if (!form[f]) { setError('Please fill all required fields.'); return; }
    }
    setLoading(true);
    setError('');
    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.assign({}, form, { _type: 'pe_seller' }),),
        mode: 'no-cors'
      });
      onSuccess('seller');
    } catch (e) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="pe-form-inner">
      <div className="pe-form-section">
        <div className="pe-form-section-title">01 — The Business</div>
        <div className="pe-field">
          <label>Business name <span className="pe-req">*</span></label>
          <input type="text" placeholder="What is your business called?" value={form.business_name} onChange={e => set('business_name', e.target.value)} />
        </div>
        <div className="pe-field-row">
          <div className="pe-field">
            <label>Sector <span className="pe-req">*</span></label>
            <select value={form.sector} onChange={e => set('sector', e.target.value)}>
              <option value="">Select sector</option>
              {SECTORS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="pe-field">
            <label>Years in operation <span className="pe-req">*</span></label>
            <select value={form.years_running} onChange={e => set('years_running', e.target.value)}>
              <option value="">Select</option>
              {YEARS_RUNNING.map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <div className="pe-field-row">
          <div className="pe-field">
            <label>Annual revenue <span className="pe-req">*</span></label>
            <select value={form.annual_revenue} onChange={e => set('annual_revenue', e.target.value)}>
              <option value="">Select range</option>
              {REVENUE_BANDS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="pe-field">
            <label>EBITDA margin <span className="pe-opt">optional</span></label>
            <input type="text" placeholder="e.g. 18%" value={form.ebitda_margin} onChange={e => set('ebitda_margin', e.target.value)} />
          </div>
        </div>
        <div className="pe-field">
          <label>Website <span className="pe-opt">optional</span></label>
          <input type="url" placeholder="https://" value={form.website} onChange={e => set('website', e.target.value)} />
        </div>
      </div>

      <div className="pe-form-section">
        <div className="pe-form-section-title">02 — The Deal</div>
        <div className="pe-field">
          <label>Deal type <span className="pe-req">*</span></label>
          <div className="pe-deal-type-grid">
            {DEAL_TYPES.map(dt => (
              <div key={dt.id} className={'pe-deal-pill' + (form.deal_type === dt.id ? ' active' : '')} onClick={() => set('deal_type', dt.id)}>
                <div className="pe-deal-pill-label">{dt.label}</div>
                <div className="pe-deal-pill-desc">{dt.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="pe-field">
          <label>Asking price <span className="pe-req">*</span></label>
          <div className="pe-pill-group">
            {ASKING_PRICE.map(p => (
              <div key={p} className={'pe-pill' + (form.asking_price === p ? ' active' : '')} onClick={() => set('asking_price', p)}>{p}</div>
            ))}
          </div>
        </div>
        <div className="pe-field">
          <label>Why are you selling? <span className="pe-req">*</span></label>
          <textarea placeholder="Be honest. Buyers respect transparency — retirement, pivot, health, new venture..." value={form.reason_for_sale} onChange={e => set('reason_for_sale', e.target.value)} maxLength={500} />
          <div className="pe-char-count">{form.reason_for_sale.length}/500</div>
        </div>
        <div className="pe-field">
          <label>What do you need from a buyer? <span className="pe-opt">optional</span></label>
          <textarea placeholder="Domain expertise, operational involvement, growth capital, brand alignment..." value={form.what_buyer_needs} onChange={e => set('what_buyer_needs', e.target.value)} maxLength={300} />
        </div>
        <div className="pe-field">
          <label>Team size <span className="pe-opt">optional</span></label>
          <input type="text" placeholder="e.g. 8 full-time employees" value={form.existing_team} onChange={e => set('existing_team', e.target.value)} />
        </div>
      </div>

      <div className="pe-form-section">
        <div className="pe-form-section-title">03 — About You</div>
        <div className="pe-field-row">
          <div className="pe-field">
            <label>Your name <span className="pe-req">*</span></label>
            <input type="text" placeholder="Full name" value={form.founder_name} onChange={e => set('founder_name', e.target.value)} />
          </div>
          <div className="pe-field">
            <label>Email <span className="pe-req">*</span></label>
            <input type="email" placeholder="you@email.com" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
        </div>
        <div className="pe-field-row">
          <div className="pe-field">
            <label>Phone <span className="pe-opt">optional</span></label>
            <input type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={e => set('phone', e.target.value)} />
          </div>
          <div className="pe-field">
            <label>LinkedIn <span className="pe-opt">optional</span></label>
            <input type="url" placeholder="linkedin.com/in/..." value={form.linkedin} onChange={e => set('linkedin', e.target.value)} />
          </div>
        </div>
      </div>

      {error && <div className="pe-error">{error}</div>}
      <button className="pe-submit-btn" onClick={handleSubmit} disabled={loading}>
        {loading ? 'Submitting...' : 'List My Business →'}
      </button>
      <p className="pe-form-note">Your listing is confidential. Business name and identity are never shared without your consent.</p>
    </div>
  );
}

function BuyerForm({ onSuccess }) {
  const [form, setForm] = useState({
    buyer_name: '', email: '', phone: '',
    buyer_type: '', sectors: [], deal_types: [],
    ticket_size: '', value_add: '', timeline: '',
    linkedin: '', experience: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => Object.assign({}, f, { [k]: v }));

  const toggleArr = (key, val) => {
    setForm(f => {
      const arr = f[key];
      const next = arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
      return Object.assign({}, f, { [key]: next });
    });
  };

  const handleSubmit = async () => {
    const required = ['buyer_name', 'email', 'buyer_type', 'ticket_size', 'value_add'];
    for (const f of required) {
      if (!form[f]) { setError('Please fill all required fields.'); return; }
    }
    if (form.sectors.length === 0) { setError('Please select at least one sector.'); return; }
    setLoading(true);
    setError('');
    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.assign({}, form, {
          _type: 'pe_buyer',
          sectors: form.sectors.join(', '),
          deal_types: form.deal_types.join(', ')
        })),
        mode: 'no-cors'
      });
      onSuccess('buyer');
    } catch (e) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const BUYER_TYPES = ['Individual Operator', 'HNI / Family Office', 'Micro-PE Fund', 'Strategic Acquirer', 'Search Fund'];

  return (
    <div className="pe-form-inner">
      <div className="pe-form-section">
        <div className="pe-form-section-title">01 — Who You Are</div>
        <div className="pe-field">
          <label>Buyer type <span className="pe-req">*</span></label>
          <div className="pe-pill-group wrap">
            {BUYER_TYPES.map(t => (
              <div key={t} className={'pe-pill' + (form.buyer_type === t ? ' active' : '')} onClick={() => set('buyer_type', t)}>{t}</div>
            ))}
          </div>
        </div>
        <div className="pe-field">
          <label>Your relevant experience <span className="pe-req">*</span></label>
          <textarea placeholder="What have you operated, built, or invested in before? Specifics matter." value={form.experience} onChange={e => set('experience', e.target.value)} maxLength={400} />
          <div className="pe-char-count">{form.experience.length}/400</div>
        </div>
      </div>

      <div className="pe-form-section">
        <div className="pe-form-section-title">02 — What You Want</div>
        <div className="pe-field">
          <label>Sectors of interest <span className="pe-req">*</span></label>
          <div className="pe-pill-group wrap">
            {SECTORS.map(s => (
              <div key={s} className={'pe-pill sm' + (form.sectors.includes(s) ? ' active' : '')} onClick={() => toggleArr('sectors', s)}>{s}</div>
            ))}
          </div>
        </div>
        <div className="pe-field">
          <label>Deal types open to</label>
          <div className="pe-deal-type-grid">
            {DEAL_TYPES.map(dt => (
              <div key={dt.id} className={'pe-deal-pill' + (form.deal_types.includes(dt.id) ? ' active' : '')} onClick={() => toggleArr('deal_types', dt.id)}>
                <div className="pe-deal-pill-label">{dt.label}</div>
                <div className="pe-deal-pill-desc">{dt.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="pe-field-row">
          <div className="pe-field">
            <label>Ticket size <span className="pe-req">*</span></label>
            <div className="pe-pill-group wrap">
              {BUYER_TICKET.map(t => (
                <div key={t} className={'pe-pill' + (form.ticket_size === t ? ' active' : '')} onClick={() => set('ticket_size', t)}>{t}</div>
              ))}
            </div>
          </div>
        </div>
        <div className="pe-field">
          <label>Timeline to close</label>
          <div className="pe-pill-group">
            {['1-3 months', '3-6 months', '6-12 months', 'Flexible'].map(t => (
              <div key={t} className={'pe-pill' + (form.timeline === t ? ' active' : '')} onClick={() => set('timeline', t)}>{t}</div>
            ))}
          </div>
        </div>
        <div className="pe-field">
          <label>What value do you bring beyond capital? <span className="pe-req">*</span></label>
          <textarea placeholder="Network, domain expertise, operational playbooks, distribution — be specific." value={form.value_add} onChange={e => set('value_add', e.target.value)} maxLength={400} />
          <div className="pe-char-count">{form.value_add.length}/400</div>
        </div>
      </div>

      <div className="pe-form-section">
        <div className="pe-form-section-title">03 — Contact</div>
        <div className="pe-field-row">
          <div className="pe-field">
            <label>Full name <span className="pe-req">*</span></label>
            <input type="text" placeholder="Your name" value={form.buyer_name} onChange={e => set('buyer_name', e.target.value)} />
          </div>
          <div className="pe-field">
            <label>Email <span className="pe-req">*</span></label>
            <input type="email" placeholder="you@email.com" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
        </div>
        <div className="pe-field-row">
          <div className="pe-field">
            <label>Phone <span className="pe-opt">optional</span></label>
            <input type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={e => set('phone', e.target.value)} />
          </div>
          <div className="pe-field">
            <label>LinkedIn <span className="pe-opt">optional</span></label>
            <input type="url" placeholder="linkedin.com/in/..." value={form.linkedin} onChange={e => set('linkedin', e.target.value)} />
          </div>
        </div>
      </div>

      {error && <div className="pe-error">{error}</div>}
      <button className="pe-submit-btn" onClick={handleSubmit} disabled={loading}>
        {loading ? 'Submitting...' : 'Register as Buyer →'}
      </button>
      <p className="pe-form-note">Your profile is shared only with businesses that match your criteria.</p>
    </div>
  );
}

export default function NoCap_PE() {
  const [mode, setMode] = useState(null);
  const [success, setSuccess] = useState(null);
  const formRef = useRef(null);

  const handleIntent = (intent) => {
    setMode(intent);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const handleSuccess = (type) => {
    setSuccess(type);
    setMode(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="pe-root">

      {/* HERO */}
      <section className="pe-hero">
        <div className="pe-hero-bg">
          <div className="pe-grid-lines" />
          <div className="pe-orb pe-orb-1" />
          <div className="pe-orb pe-orb-2" />
        </div>
        <div className="pe-hero-inner">
          <div className="pe-eyebrow">
            <span className="pe-dot" />
            NOCAP PE — PRIVATE EQUITY FOR INDIA
          </div>
          <h1 className="pe-h1">
            India's businesses<br />
            are changing hands.<br />
            <em>Be on the right side.</em>
          </h1>
          <p className="pe-hero-sub">
            The first structured marketplace for buying and selling Indian SMBs and startups.
            From ₹25L to ₹25Cr. Confidential. Verified. Deal-room ready.
          </p>
          <div className="pe-intent-cards">
            <div className="pe-intent-card seller" onClick={() => handleIntent('seller')}>
              <div className="pe-intent-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="pe-intent-label">I want to sell</div>
              <div className="pe-intent-desc">List your business confidentially. Get matched with verified buyers and investors.</div>
              <div className="pe-intent-arrow">List my business →</div>
            </div>
            <div className="pe-intent-card buyer" onClick={() => handleIntent('buyer')}>
              <div className="pe-intent-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M21 21l-4.35-4.35M11 8v6M8 11h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="pe-intent-label">I want to buy</div>
              <div className="pe-intent-desc">Register your acquisition criteria. Get matched with off-market deal flow.</div>
              <div className="pe-intent-arrow">Register as buyer →</div>
            </div>
          </div>
        </div>
      </section>

      {/* SUCCESS */}
      {success && (
        <section className="pe-success-section">
          <div className="pe-success-box">
            <div className="pe-success-check">✓</div>
            <h2 className="pe-success-title">
              {success === 'seller' ? 'Your listing is in.' : 'Buyer profile registered.'}
            </h2>
            <p className="pe-success-sub">
              {success === 'seller'
                ? 'We review every listing manually. Expect a response within 48 hours. Your identity stays confidential until you choose to reveal it.'
                : 'We will match you with relevant listings as they come in. Expect your first matches within 5 business days.'}
            </p>
            <a href="https://instagram.com/nocapvc" target="_blank" rel="noreferrer" className="pe-btn-outline">Follow @nocapvc for deal insights →</a>
          </div>
        </section>
      )}

      {/* STATS */}
      <section className="pe-stats-section">
        <div className="pe-stats-inner">
          <div className="pe-stats-label">THE OPPORTUNITY</div>
          <div className="pe-stats-grid">
            <AnimatedStat value="63" label="million SMBs in India" />
            <AnimatedStat value="₹4.2Cr" label="average business valuation we serve" />
            <AnimatedStat value="48" label="hour listing to first match" />
            <AnimatedStat value="0%" label="upfront fee — success only" />
          </div>
        </div>
      </section>

      {/* THE GAP */}
      <section className="pe-gap-section">
        <div className="pe-gap-inner">
          <div className="pe-eyebrow-dark">THE PROBLEM WE SOLVE</div>
          <h2 className="pe-h2">The market that never existed.</h2>
          <div className="pe-gap-grid">
            <div className="pe-gap-card">
              <div className="pe-gap-num">01</div>
              <div className="pe-gap-title">Brokers ignore small businesses</div>
              <p>Traditional M&A advisors only serve companies doing ₹10Cr+ revenue. The ₹25L–₹5Cr segment is completely ignored — left to WhatsApp forwards and cold calls.</p>
            </div>
            <div className="pe-gap-card">
              <div className="pe-gap-num">02</div>
              <div className="pe-gap-title">Buyers have no deal flow</div>
              <p>Thousands of operators, HNIs, and micro-PE funds want to buy running businesses. They have no structured pipeline. They miss deals because the market is opaque.</p>
            </div>
            <div className="pe-gap-card">
              <div className="pe-gap-num">03</div>
              <div className="pe-gap-title">Deals die in due diligence</div>
              <p>Even when buyer and seller connect, deals fall apart. No framework. No NDA. No valuation reference. No accountability. NoCap PE gives every deal a structure.</p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="pe-how-section">
        <div className="pe-how-inner">
          <div className="pe-how-cols">
            <div className="pe-how-col">
              <div className="pe-eyebrow-dark">FOR SELLERS</div>
              <h3 className="pe-h3">Exit with clarity.</h3>
              <div className="pe-steps">
                <div className="pe-step">
                  <div className="pe-step-num">01</div>
                  <div className="pe-step-content">
                    <div className="pe-step-title">List confidentially</div>
                    <p>Fill a structured listing form. Your business goes live anonymously — financials and story visible, identity hidden.</p>
                  </div>
                </div>
                <div className="pe-step">
                  <div className="pe-step-num">02</div>
                  <div className="pe-step-content">
                    <div className="pe-step-title">Get matched</div>
                    <p>NoCap PE matches your listing to verified buyers whose sector, ticket size, and deal type align. Only serious buyers reach you.</p>
                  </div>
                </div>
                <div className="pe-step">
                  <div className="pe-step-num">03</div>
                  <div className="pe-step-content">
                    <div className="pe-step-title">Enter the deal room</div>
                    <p>Once you approve a buyer, we open a private deal room — NDA, due diligence checklist, valuation reference, and a direct channel.</p>
                  </div>
                </div>
                <div className="pe-step">
                  <div className="pe-step-num">04</div>
                  <div className="pe-step-content">
                    <div className="pe-step-title">Close on your terms</div>
                    <p>We facilitate. You decide. No pressure. No auction. Your business, your timeline, your terms.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="pe-how-col">
              <div className="pe-eyebrow-dark">FOR BUYERS</div>
              <h3 className="pe-h3">Acquire with conviction.</h3>
              <div className="pe-steps">
                <div className="pe-step">
                  <div className="pe-step-num">01</div>
                  <div className="pe-step-content">
                    <div className="pe-step-title">Register your criteria</div>
                    <p>Tell us what you want — sector, ticket size, deal type, what value you bring. We create your buyer profile.</p>
                  </div>
                </div>
                <div className="pe-step">
                  <div className="pe-step-num">02</div>
                  <div className="pe-step-content">
                    <div className="pe-step-title">Get curated deal flow</div>
                    <p>When a matching business lists, you get a structured deal brief — financials, story, seller intent, asking price. No noise. Just relevant deals.</p>
                  </div>
                </div>
                <div className="pe-step">
                  <div className="pe-step-num">03</div>
                  <div className="pe-step-content">
                    <div className="pe-step-title">Submit intent and close</div>
                    <p>Submit a structured LOI through NoCap PE. If the seller approves, the deal room opens. We guide both sides to close.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DEAL TYPES */}
      <section className="pe-deals-section">
        <div className="pe-deals-inner">
          <div className="pe-eyebrow-dark">DEAL TYPES WE FACILITATE</div>
          <h2 className="pe-h2">Three ways to transact.</h2>
          <div className="pe-deals-grid">
            <div className="pe-deal-card">
              <div className="pe-deal-card-tag">Full Acquisition</div>
              <div className="pe-deal-card-icon">⬛</div>
              <h4>100% ownership transfer</h4>
              <p>The seller exits completely. The buyer takes full operational control. Clean, final, and complete.</p>
              <div className="pe-deal-card-meta">Best for: Retiring founders, career pivots, distressed exits</div>
            </div>
            <div className="pe-deal-card featured">
              <div className="pe-deal-card-tag featured-tag">Most Common</div>
              <div className="pe-deal-card-icon">🔶</div>
              <h4>Majority Stake</h4>
              <p>Buyer takes 51–80%. Founder stays operationally involved. Growth capital plus expertise — both sides win.</p>
              <div className="pe-deal-card-meta">Best for: Founders who want a partner, not a replacement</div>
            </div>
            <div className="pe-deal-card">
              <div className="pe-deal-card-tag">Growth Capital</div>
              <div className="pe-deal-card-icon">📈</div>
              <h4>10–30% minority stake</h4>
              <p>Investor takes a minority position. Founder retains control. Capital and network enter, ownership stays.</p>
              <div className="pe-deal-card-meta">Best for: Profitable businesses that need a growth push</div>
            </div>
          </div>
        </div>
      </section>

      {/* FORM SECTION */}
      <section className="pe-form-section" ref={formRef} id="pe-form">
        <div className="pe-form-outer">
          {!mode && !success && (
            <div className="pe-form-choose">
              <div className="pe-eyebrow-dark">GET STARTED</div>
              <h2 className="pe-h2">What describes you?</h2>
              <div className="pe-choose-cards">
                <div className="pe-choose-card" onClick={() => setMode('seller')}>
                  <div className="pe-choose-title">I own a business and want to sell or raise capital</div>
                  <div className="pe-choose-arrow">List my business →</div>
                </div>
                <div className="pe-choose-card" onClick={() => setMode('buyer')}>
                  <div className="pe-choose-title">I want to buy or invest in a running business</div>
                  <div className="pe-choose-arrow">Register as buyer →</div>
                </div>
              </div>
            </div>
          )}

          {mode && (
            <div className="pe-form-container">
              <div className="pe-form-header">
                <button className="pe-back-btn" onClick={() => setMode(null)}>← Back</button>
                <div className="pe-form-title">
                  {mode === 'seller' ? 'List Your Business' : 'Register as Buyer'}
                </div>
                <div className="pe-form-subtitle">
                  {mode === 'seller'
                    ? 'Confidential. Your identity is protected until you choose to reveal it.'
                    : 'Your profile is matched to relevant listings. No spam, no cold calls.'}
                </div>
              </div>
              {mode === 'seller' ? <SellerForm onSuccess={handleSuccess} /> : <BuyerForm onSuccess={handleSuccess} />}
            </div>
          )}
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="pe-footer-cta">
        <div className="pe-footer-cta-inner">
          <div className="pe-footer-cta-label">NOCAP PE</div>
          <h2 className="pe-footer-h2">India's businesses deserve a better market.</h2>
          <p>We are building the infrastructure for SMB transactions in India. The brokers had their era. This is ours.</p>
          <div className="pe-footer-cta-btns">
            <button className="pe-btn-primary" onClick={() => handleIntent('seller')}>List a Business</button>
            <button className="pe-btn-secondary" onClick={() => handleIntent('buyer')}>Register as Buyer</button>
          </div>
        </div>
      </section>

    </div>
  );
}