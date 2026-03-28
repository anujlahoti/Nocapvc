import { useState, useRef, useEffect } from 'react';
import './NoCap_PE.css';

const SCRIPT_URL = process.env.REACT_APP_GOOGLE_SCRIPT_URL;

const SECTORS = [
  'Food & Beverage','Retail / E-commerce','SaaS / Tech',
  'Manufacturing','Healthcare / Wellness','Education',
  'Logistics / Supply Chain','Real Estate / Construction',
  'Media / Content','Hospitality / Travel','Agriculture',
  'Financial Services','Fashion / Apparel','Beauty / Personal Care','Other'
];

const DEAL_TYPES = [
  { id: 'full', label: 'Full Acquisition', sub: '100% ownership transfer' },
  { id: 'majority', label: 'Majority Stake', sub: '51–80%, founder stays' },
  { id: 'growth', label: 'Growth Capital', sub: '10–30% minority stake' },
];

const REVENUE_BANDS = ['Under ₹10L/year','₹10L–₹50L/year','₹50L–₹1Cr/year','₹1Cr–₹5Cr/year','₹5Cr–₹25Cr/year','Above ₹25Cr/year'];
const ASKING_PRICE = ['Under ₹25L','₹25L–₹1Cr','₹1Cr–₹5Cr','₹5Cr–₹25Cr','₹25Cr–₹100Cr','Above ₹100Cr','Open to offers'];
const EBITDA_OPTIONS = ['Negative / Pre-revenue','0–5%','5–15%','15–25%','25–40%','Above 40%'];
const YEARS_RUNNING = ['Under 1 year','1–3 years','3–7 years','7–15 years','Above 15 years'];
const EMPLOYEE_COUNT = ['Solo / Founder only','2–5 employees','6–20 employees','21–50 employees','51–200 employees','200+ employees'];
const GROWTH_RATE = ['Declining','Flat (0–5%)','Moderate (5–20%)','Strong (20–50%)','Hyper-growth (50%+)'];
const CUSTOMER_TYPE = ['B2C — direct consumers','B2B — businesses','B2B2C — both','Government / Institutional','D2C — direct to consumer'];
const GEOGRAPHY = ['Single city','State-wide','Pan India','India + International'];

function useScrollReveal() {
  useEffect(function() {
    var els = document.querySelectorAll('.pe-reveal');
    var obs = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) { e.target.classList.add('pe-revealed'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.1 });
    els.forEach(function(el) { obs.observe(el); });
    return function() { obs.disconnect(); };
  }, []);
}

function StatCounter(props) {
  var value = props.value;
  var suffix = props.suffix || '';
  var label = props.label;
  var ref = useRef(null);
  var [n, setN] = useState(0);
  var done = useRef(false);
  useEffect(function() {
    var obs = new IntersectionObserver(function(entries) {
      if (entries[0].isIntersecting && !done.current) {
        done.current = true;
        var target = parseFloat(value);
        var steps = 40;
        var step = target / steps;
        var i = 0;
        var t = setInterval(function() {
          i++;
          setN(Math.min(parseFloat((step * i).toFixed(1)), target));
          if (i >= steps) clearInterval(t);
        }, 30);
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return function() { obs.disconnect(); };
  }, [value]);
  return (
    <div className="pe-stat-block" ref={ref}>
      <div className="pe-stat-val">{Number.isInteger(parseFloat(value)) ? Math.round(n) : n}{suffix}</div>
      <div className="pe-stat-lbl">{label}</div>
    </div>
  );
}

function SellerForm(props) {
  var onSuccess = props.onSuccess;
  var [form, setForm] = useState({
    business_name:'', trading_name:'', founder_name:'', co_founders:'',
    email:'', phone:'', linkedin:'', city:'', state:'',
    sector:'', business_model:'', geography:'', years_running:'',
    employee_count:'', annual_revenue:'', revenue_growth:'', ebitda_margin:'',
    gross_margin:'', monthly_burn:'', cash_in_bank:'', debt:'',
    customer_type:'', active_customers:'', top_customers:'', churn_rate:'',
    key_products:'', tech_ip:'', physical_assets:'',
    deal_type:'', asking_price:'', valuation_basis:'',
    reason_for_sale:'', founder_post_deal:'', what_buyer_needs:'',
    existing_team:'', key_person_risk:'', website:'', pitchdeck_url:'',
    additional_info:''
  });
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState('');

  var set = function(k, v) { setForm(function(f) { return Object.assign({}, f, {[k]: v}); }); };

  var handleSubmit = async function() {
    var required = [
      'business_name','trading_name','city','state','sector','business_model',
      'geography','years_running','employee_count',
      'annual_revenue','revenue_growth','ebitda_margin','gross_margin',
      'monthly_burn','cash_in_bank','debt',
      'customer_type','active_customers','churn_rate','top_customers',
      'key_products','tech_ip','physical_assets','key_person_risk','existing_team',
      'deal_type','asking_price','valuation_basis',
      'reason_for_sale','founder_post_deal','what_buyer_needs',
      'founder_name','email','phone','linkedin'
    ];
    for (var i = 0; i < required.length; i++) {
      if (!form[required[i]]) { setError('Please fill all required fields marked with *.'); return; }
    }
    setLoading(true);
    setError('');
    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(Object.assign({}, form, {_type: 'pe_seller'})),
        mode: 'no-cors'
      });
      onSuccess();
    } catch(e) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="pe-form-wrap">

      <div className="pe-form-block">
        <div className="pe-form-block-title"><span>01</span> Business Identity</div>
        <div className="pe-row">
          <div className="pe-f">
            <label>Registered business name <span className="rq">*</span></label>
            <input type="text" placeholder="Legal entity name" value={form.business_name} onChange={function(e){set('business_name',e.target.value);}} />
          </div>
          <div className="pe-f">
            <label>Trading / brand name <span className="rq">*</span></label>
            <input type="text" placeholder="Name customers know you by (or same as above)" value={form.trading_name} onChange={function(e){set('trading_name',e.target.value);}} />
          </div>
        </div>
        <div className="pe-row">
          <div className="pe-f">
            <label>City <span className="rq">*</span></label>
            <input type="text" placeholder="e.g. Mumbai" value={form.city} onChange={function(e){set('city',e.target.value);}} />
          </div>
          <div className="pe-f">
            <label>State <span className="rq">*</span></label>
            <input type="text" placeholder="e.g. Maharashtra" value={form.state} onChange={function(e){set('state',e.target.value);}} />
          </div>
        </div>
        <div className="pe-f">
          <label>Sector <span className="rq">*</span></label>
          <select value={form.sector} onChange={function(e){set('sector',e.target.value);}}>
            <option value="">Select sector</option>
            {SECTORS.map(function(s){ return <option key={s} value={s}>{s}</option>; })}
          </select>
        </div>
        <div className="pe-row">
          <div className="pe-f">
            <label>Business model <span className="rq">*</span></label>
            <input type="text" placeholder="e.g. SaaS, marketplace, services, manufacturing" value={form.business_model} onChange={function(e){set('business_model',e.target.value);}} />
          </div>
          <div className="pe-f">
            <label>Geographic presence <span className="rq">*</span></label>
            <select value={form.geography} onChange={function(e){set('geography',e.target.value);}}>
              <option value="">Select</option>
              {GEOGRAPHY.map(function(g){ return <option key={g} value={g}>{g}</option>; })}
            </select>
          </div>
        </div>
        <div className="pe-row">
          <div className="pe-f">
            <label>Years in operation <span className="rq">*</span></label>
            <select value={form.years_running} onChange={function(e){set('years_running',e.target.value);}}>
              <option value="">Select</option>
              {YEARS_RUNNING.map(function(y){ return <option key={y} value={y}>{y}</option>; })}
            </select>
          </div>
          <div className="pe-f">
            <label>Total employees <span className="rq">*</span></label>
            <select value={form.employee_count} onChange={function(e){set('employee_count',e.target.value);}}>
              <option value="">Select</option>
              {EMPLOYEE_COUNT.map(function(ec){ return <option key={ec} value={ec}>{ec}</option>; })}
            </select>
          </div>
        </div>
        <div className="pe-f">
          <label>Website <span className="opt">optional</span></label>
          <input type="url" placeholder="https://yourbusiness.com" value={form.website} onChange={function(e){set('website',e.target.value);}} />
        </div>
      </div>

      <div className="pe-form-block">
        <div className="pe-form-block-title"><span>02</span> Financial Snapshot</div>
        <p className="pe-form-note-inline">All figures are kept confidential. This is used only for buyer matching.</p>
        <div className="pe-row">
          <div className="pe-f">
            <label>Annual revenue (FY24) <span className="rq">*</span></label>
            <select value={form.annual_revenue} onChange={function(e){set('annual_revenue',e.target.value);}}>
              <option value="">Select range</option>
              {REVENUE_BANDS.map(function(r){ return <option key={r} value={r}>{r}</option>; })}
            </select>
          </div>
          <div className="pe-f">
            <label>Revenue growth rate <span className="rq">*</span></label>
            <select value={form.revenue_growth} onChange={function(e){set('revenue_growth',e.target.value);}}>
              <option value="">Select</option>
              {GROWTH_RATE.map(function(g){ return <option key={g} value={g}>{g}</option>; })}
            </select>
          </div>
        </div>
        <div className="pe-row">
          <div className="pe-f">
            <label>EBITDA margin <span className="rq">*</span></label>
            <select value={form.ebitda_margin} onChange={function(e){set('ebitda_margin',e.target.value);}}>
              <option value="">Select</option>
              {EBITDA_OPTIONS.map(function(eo){ return <option key={eo} value={eo}>{eo}</option>; })}
            </select>
          </div>
          <div className="pe-f">
            <label>Gross margin <span className="rq">*</span></label>
            <input type="text" placeholder="e.g. 62%" value={form.gross_margin} onChange={function(e){set('gross_margin',e.target.value);}} />
          </div>
        </div>
        <div className="pe-row">
          <div className="pe-f">
            <label>Monthly burn / fixed costs <span className="rq">*</span></label>
            <input type="text" placeholder="e.g. ₹8L/month" value={form.monthly_burn} onChange={function(e){set('monthly_burn',e.target.value);}} />
          </div>
          <div className="pe-f">
            <label>Cash in bank <span className="rq">*</span></label>
            <input type="text" placeholder="e.g. ₹45L" value={form.cash_in_bank} onChange={function(e){set('cash_in_bank',e.target.value);}} />
          </div>
        </div>
        <div className="pe-f">
          <label>Outstanding debt / liabilities <span className="rq">*</span></label>
          <input type="text" placeholder="e.g. ₹12L bank loan, or 'None'" value={form.debt} onChange={function(e){set('debt',e.target.value);}} />
        </div>
      </div>

      <div className="pe-form-block">
        <div className="pe-form-block-title"><span>03</span> Customers & Revenue Quality</div>
        <div className="pe-f">
          <label>Customer type <span className="rq">*</span></label>
          <div className="pe-chips">
            {CUSTOMER_TYPE.map(function(c){
              return <div key={c} className={'pe-chip' + (form.customer_type === c ? ' on' : '')} onClick={function(){set('customer_type',c);}}>{c}</div>;
            })}
          </div>
        </div>
        <div className="pe-row">
          <div className="pe-f">
            <label>Number of active customers <span className="rq">*</span></label>
            <input type="text" placeholder="e.g. 340 active clients" value={form.active_customers} onChange={function(e){set('active_customers',e.target.value);}} />
          </div>
          <div className="pe-f">
            <label>Monthly churn rate <span className="rq">*</span></label>
            <input type="text" placeholder="e.g. 2% monthly, or 'N/A' for B2B contracts" value={form.churn_rate} onChange={function(e){set('churn_rate',e.target.value);}} />
          </div>
        </div>
        <div className="pe-f">
          <label>Top customers / revenue concentration <span className="rq">*</span></label>
          <textarea rows="2" placeholder="e.g. Top 3 clients = 40% of revenue. No single client above 20%." value={form.top_customers} onChange={function(e){set('top_customers',e.target.value);}} />
        </div>
      </div>

      <div className="pe-form-block">
        <div className="pe-form-block-title"><span>04</span> Business Assets & Moat</div>
        <div className="pe-f">
          <label>Key products / services <span className="rq">*</span></label>
          <textarea rows="2" placeholder="What does the business actually sell? What are your top 3 revenue drivers?" value={form.key_products} onChange={function(e){set('key_products',e.target.value);}} />
        </div>
        <div className="pe-f">
          <label>Technology / IP / proprietary assets <span className="rq">*</span></label>
          <textarea rows="2" placeholder="Software, patents, brand, proprietary process, licenses — or 'None'" value={form.tech_ip} onChange={function(e){set('tech_ip',e.target.value);}} />
        </div>
        <div className="pe-f">
          <label>Physical / hard assets <span className="rq">*</span></label>
          <input type="text" placeholder="e.g. 2 delivery vehicles, 5000 sqft warehouse — or 'None'" value={form.physical_assets} onChange={function(e){set('physical_assets',e.target.value);}} />
        </div>
        <div className="pe-f">
          <label>Key person risk <span className="rq">*</span></label>
          <input type="text" placeholder="Is the business dependent on you or one person? Be honest." value={form.key_person_risk} onChange={function(e){set('key_person_risk',e.target.value);}} />
        </div>
        <div className="pe-f">
          <label>Team details <span className="rq">*</span></label>
          <textarea rows="2" placeholder="Who are the key people? Will they stay post-acquisition? Any employment contracts?" value={form.existing_team} onChange={function(e){set('existing_team',e.target.value);}} />
        </div>
      </div>

      <div className="pe-form-block">
        <div className="pe-form-block-title"><span>05</span> The Deal</div>
        <div className="pe-f">
          <label>Deal type <span className="rq">*</span></label>
          <div className="pe-deal-grid">
            {DEAL_TYPES.map(function(dt){
              return (
                <div key={dt.id} className={'pe-deal-card' + (form.deal_type === dt.id ? ' on' : '')} onClick={function(){set('deal_type',dt.id);}}>
                  <div className="pe-deal-lbl">{dt.label}</div>
                  <div className="pe-deal-sub">{dt.sub}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="pe-f">
          <label>Asking price / valuation expectation <span className="rq">*</span></label>
          <div className="pe-chips wrap">
            {ASKING_PRICE.map(function(p){
              return <div key={p} className={'pe-chip' + (form.asking_price === p ? ' on' : '')} onClick={function(){set('asking_price',p);}}>{p}</div>;
            })}
          </div>
        </div>
        <div className="pe-f">
          <label>Valuation basis <span className="rq">*</span></label>
          <input type="text" placeholder="e.g. 3x revenue, 6x EBITDA, asset value, comparable transactions..." value={form.valuation_basis} onChange={function(e){set('valuation_basis',e.target.value);}} />
        </div>
        <div className="pe-f">
          <label>Why are you selling? <span className="rq">*</span></label>
          <textarea rows="3" placeholder="Be specific and honest. Buyers respect transparency. Retirement, pivot, health, new venture, founder disagreement..." value={form.reason_for_sale} onChange={function(e){set('reason_for_sale',e.target.value);}} maxLength={600} />
          <div className="pe-cc">{form.reason_for_sale.length}/600</div>
        </div>
        <div className="pe-f">
          <label>Your role post-transaction <span className="rq">*</span></label>
          <input type="text" placeholder="e.g. Will stay 12 months for handover. Open to advisory. Full exit preferred." value={form.founder_post_deal} onChange={function(e){set('founder_post_deal',e.target.value);}} />
        </div>
        <div className="pe-f">
          <label>What do you need from the right buyer? <span className="rq">*</span></label>
          <textarea rows="2" placeholder="Domain expertise, distribution network, brand upgrade, operational bandwidth, just capital..." value={form.what_buyer_needs} onChange={function(e){set('what_buyer_needs',e.target.value);}} />
        </div>
        <div className="pe-f">
          <label>Pitch deck / financials (Google Drive link) <span className="opt">optional</span></label>
          <input type="url" placeholder="https://drive.google.com/..." value={form.pitchdeck_url} onChange={function(e){set('pitchdeck_url',e.target.value);}} />
        </div>
      </div>

      <div className="pe-form-block">
        <div className="pe-form-block-title"><span>06</span> About the Founder</div>
        <div className="pe-row">
          <div className="pe-f">
            <label>Your full name <span className="rq">*</span></label>
            <input type="text" placeholder="Full name" value={form.founder_name} onChange={function(e){set('founder_name',e.target.value);}} />
          </div>
          <div className="pe-f">
            <label>Co-founders <span className="opt">optional</span></label>
            <input type="text" placeholder="Names and roles, or leave blank if sole founder" value={form.co_founders} onChange={function(e){set('co_founders',e.target.value);}} />
          </div>
        </div>
        <div className="pe-row">
          <div className="pe-f">
            <label>Email <span className="rq">*</span></label>
            <input type="email" placeholder="your@email.com" value={form.email} onChange={function(e){set('email',e.target.value);}} />
          </div>
          <div className="pe-f">
            <label>Phone <span className="rq">*</span></label>
            <input type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={function(e){set('phone',e.target.value);}} />
          </div>
        </div>
        <div className="pe-f">
          <label>LinkedIn <span className="rq">*</span></label>
          <input type="url" placeholder="linkedin.com/in/yourprofile" value={form.linkedin} onChange={function(e){set('linkedin',e.target.value);}} />
        </div>
        <div className="pe-f">
          <label>Anything else you want us to know? <span className="opt">optional</span></label>
          <textarea rows="3" placeholder="Industry awards, certifications, pending contracts, strategic partnerships, future pipeline..." value={form.additional_info} onChange={function(e){set('additional_info',e.target.value);}} />
        </div>
      </div>

      {error && <div className="pe-error-box">{error}</div>}

      <button className="pe-cta-btn" onClick={handleSubmit} disabled={loading}>
        {loading ? 'Submitting your listing...' : 'Submit Business Listing →'}
      </button>
      <p className="pe-privacy-note">
        Strictly confidential. Your business identity is never shared without explicit written consent.
        NoCap PE reviews every listing manually before matching begins.
      </p>
    </div>
  );
}

function SuccessScreen(props) {
  var refId = props.refId;
  var nextSteps = [
    {
      n: '01',
      t: 'Manual review — within 24 hours',
      b: 'Our deal team reviews your submission for completeness, financial credibility, and deal readiness. Every listing is assessed individually before any buyer is approached.'
    },
    {
      n: '02',
      t: 'Buyer matching — within 48 hours',
      b: 'We identify 2–5 qualified buyers whose investment mandate, sector focus, and deal size align precisely with your listing. No blind introductions. No unsolicited outreach to your competitors.'
    },
    {
      n: '03',
      t: 'Your approval — always required',
      b: 'Before any buyer learns your identity, you review and approve the match. We share only an anonymised business summary until you give explicit written consent. You stay in control at every step.'
    },
    {
      n: '04',
      t: 'Deal room activation — on your signal',
      b: 'Once you approve a match, we activate a private deal room: NDA, due diligence framework, valuation benchmarks, and a direct channel. Structured from the first conversation.'
    },
  ];

  return (
    <div className="pe-success-screen">
      <div className="pe-ss-check-wrap">
        <div className="pe-ss-check">✓</div>
      </div>
      <div className="pe-ss-ref">Listing Reference · {refId}</div>
      <h2 className="pe-ss-title">Your listing has been received.</h2>
      <p className="pe-ss-lead">
        What happens next is structured, confidential, and designed to protect your interests at every stage.
        You will not be contacted by any buyer without your prior written approval.
      </p>

      <div className="pe-ss-divider" />

      <div className="pe-ss-steps-label">WHAT HAPPENS NEXT</div>
      <div className="pe-ss-steps">
        {nextSteps.map(function(s) {
          return (
            <div key={s.n} className="pe-ss-step">
              <div className="pe-ss-step-num">{s.n}</div>
              <div className="pe-ss-step-body">
                <div className="pe-ss-step-title">{s.t}</div>
                <div className="pe-ss-step-text">{s.b}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pe-ss-divider" />

      <div className="pe-ss-contact-block">
        <div className="pe-ss-contact-label">YOUR POINT OF CONTACT</div>
        <div className="pe-ss-contact-email">help.nocappe@gmail.com</div>
        <div className="pe-ss-contact-note">
          Expect your first communication within 2 business days.
          All correspondence from NoCap PE will originate from this address — treat any other contact as unsolicited.
        </div>
      </div>

      <div className="pe-ss-footer-note">
        You built something real. It deserves a structured, dignified exit — not a broker's cold call or a WhatsApp negotiation.
        We will treat your business with the seriousness it has earned.
      </div>

      <a href="/" className="pe-ss-home-btn">← Return to NoCap VC</a>
    </div>
  );
}

export default function NoCap_PE() {
  useScrollReveal();
  var [view, setView] = useState('home');
  var [refId, setRefId] = useState('');
  var formRef = useRef(null);

  var goToForm = function() {
    setView('form');
    setTimeout(function() {
      formRef.current && formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  var handleSuccess = function() {
    var id = 'PE-' + String(Date.now()).slice(-6);
    setRefId(id);
    setView('success');
    setTimeout(function() {
      formRef.current && formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  return (
    <div className="pe-root">

      {/* TOP NAV */}
      <nav className="pe-nav">
        <a href="/" className="pe-nav-logo">
          <span className="pe-nav-logo-dot" />
          nocapvc
        </a>
        <div className="pe-nav-badge">NOCAP PE · MICRO PRIVATE EQUITY</div>
        <button className="pe-nav-cta" onClick={goToForm}>List Your Business →</button>
      </nav>

      {/* HERO */}
      <section className="pe-hero">
        <div className="pe-hero-canvas">
          <div className="pe-scanlines" />
          <div className="pe-hero-grid" />
          <div className="pe-glow g1" />
          <div className="pe-glow g2" />
          <div className="pe-glow g3" />
        </div>

        <div className="pe-hero-body">
          <div className="pe-hero-tag pe-reveal">
            <span className="pe-live-dot" />
            INDIA'S FIRST MICRO-PE MARKETPLACE
          </div>

          <h1 className="pe-hero-h1 pe-reveal">
            Every great business<br />
            deserves a <span className="pe-accent">great exit.</span>
          </h1>

          <p className="pe-hero-p pe-reveal">
            Sixty-three million Indian SMBs. Thousands of operators ready to acquire.
            No structured market connecting them — until now.
            NoCap PE is micro private equity, democratised.
          </p>

          <div className="pe-hero-actions pe-reveal">
            <button className="pe-btn-green" onClick={goToForm}>
              List My Business
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <a href="mailto:pe@nocapvc.in" className="pe-btn-ghost">I want to acquire →</a>
          </div>

          <div className="pe-hero-scroll pe-reveal">
            <div className="pe-scroll-line" />
            <span>scroll to explore</span>
          </div>
        </div>

        <div className="pe-hero-ticker">
          <div className="pe-ticker-inner">
            {['FULL ACQUISITION','MAJORITY STAKE','GROWTH CAPITAL','MICRO PE','CONFIDENTIAL','VERIFIED BUYERS','STRUCTURED DEALS','DEAL ROOM READY','INDIA SMB','NO BROKER FEES'].concat(['FULL ACQUISITION','MAJORITY STAKE','GROWTH CAPITAL','MICRO PE','CONFIDENTIAL','VERIFIED BUYERS','STRUCTURED DEALS','DEAL ROOM READY','INDIA SMB','NO BROKER FEES']).map(function(t,i){
              return <span key={i} className="pe-tick-item">{t}</span>;
            })}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="pe-stats-row pe-reveal">
        <StatCounter value="63" suffix="M" label="Indian SMBs eligible" />
        <div className="pe-stat-divider" />
        <StatCounter value="48" suffix="hr" label="listing to first match" />
        <div className="pe-stat-divider" />
        <StatCounter value="0" suffix="%" label="upfront fee" />
        <div className="pe-stat-divider" />
        <StatCounter value="3" suffix="" label="deal types facilitated" />
      </section>

      {/* THE GAP */}
      <section className="pe-gap">
        <div className="pe-gap-inner">
          <div className="pe-section-tag pe-reveal">THE PROBLEM</div>
          <h2 className="pe-section-h2 pe-reveal">
            India's SMB exit market<br />is broken.
          </h2>
          <div className="pe-gap-grid">
            <div className="pe-gap-item pe-reveal">
              <div className="pe-gap-num">01</div>
              <div className="pe-gap-content">
                <h4>Brokers only serve ₹10Cr+</h4>
                <p>Traditional M&A advisors ignore businesses below ₹10Cr revenue. The ₹25L–₹5Cr segment — which represents the majority of India's SMBs — has no formal exit infrastructure.</p>
              </div>
            </div>
            <div className="pe-gap-item pe-reveal">
              <div className="pe-gap-num">02</div>
              <div className="pe-gap-content">
                <h4>Buyers have zero deal flow</h4>
                <p>Thousands of operators, HNIs, and micro-PE funds want to acquire running businesses. They have no structured pipeline. Deals happen on WhatsApp — slow, opaque, and often fall apart.</p>
              </div>
            </div>
            <div className="pe-gap-item pe-reveal">
              <div className="pe-gap-num">03</div>
              <div className="pe-gap-content">
                <h4>No structure means no deals</h4>
                <p>Even when buyer meets seller, deals die in due diligence. No NDA framework. No valuation benchmark. No accountability. NoCap PE installs the structure every deal needs.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="pe-how">
        <div className="pe-how-inner">
          <div className="pe-section-tag pe-reveal">THE PROCESS</div>
          <h2 className="pe-section-h2 pe-reveal">Four steps to a closed deal.</h2>
          <div className="pe-how-steps">
            {[
              { n:'01', t:'Submit a confidential listing', b:'Fill our structured form — the same information a Sequoia deal team would want to see. Takes 12 minutes. Your name stays hidden until you say otherwise.' },
              { n:'02', t:'Get matched with verified buyers', b:'NoCap PE manually reviews your listing and matches you to buyers whose sector, ticket size, and deal type align. No spray and pray.' },
              { n:'03', t:'Enter the private deal room', b:'Once you approve a match, we open a secure deal room — NDA, due diligence checklist, valuation reference, and a direct channel. Structured from day one.' },
              { n:'04', t:'Close on your terms', b:'We facilitate, you decide. No pressure, no auction, no unsolicited sharing. Your business, your timeline, your exit.' },
            ].map(function(s, i) {
              return (
                <div key={i} className="pe-how-step pe-reveal">
                  <div className="pe-how-num">{s.n}</div>
                  <div className="pe-how-content">
                    <h4>{s.t}</h4>
                    <p>{s.b}</p>
                  </div>
                  {i < 3 && <div className="pe-how-arrow">↓</div>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* DEAL TYPES */}
      <section className="pe-deals">
        <div className="pe-deals-inner">
          <div className="pe-section-tag pe-reveal">DEAL STRUCTURES</div>
          <h2 className="pe-section-h2 pe-reveal">Three ways to transact.</h2>
          <div className="pe-deal-cards pe-reveal">
            <div className="pe-deal-type-card">
              <div className="pe-dtc-tag">Full Acquisition</div>
              <div className="pe-dtc-pct">100%</div>
              <p>Complete ownership transfer. Seller exits fully. Buyer takes operational control. Clean and final.</p>
              <div className="pe-dtc-for">Best for retirement, pivots, and distressed exits</div>
            </div>
            <div className="pe-deal-type-card featured">
              <div className="pe-dtc-tag">Majority Stake</div>
              <div className="pe-dtc-pct">51–80%</div>
              <p>Buyer takes control. Founder stays involved. Capital, expertise, and continuity — all in one structure.</p>
              <div className="pe-dtc-for">Most common structure on NoCap PE</div>
            </div>
            <div className="pe-deal-type-card">
              <div className="pe-dtc-tag">Growth Capital</div>
              <div className="pe-dtc-pct">10–30%</div>
              <p>Investor takes minority position. Founder keeps control. Growth capital plus strategic value added.</p>
              <div className="pe-dtc-for">Best for profitable businesses that need scale</div>
            </div>
          </div>
        </div>
      </section>

      {/* FORM / SUCCESS SECTION */}
      <section className="pe-form-section" ref={formRef} id="list">
        {view === 'home' && (
          <div className="pe-form-cta-wrap pe-reveal">
            <div className="pe-section-tag">LIST YOUR BUSINESS</div>
            <h2 className="pe-section-h2">Ready to find the right buyer?</h2>
            <p className="pe-form-cta-sub">The most detailed, most confidential business listing form in India. Built with the same rigour Sequoia's deal team would expect. Takes 12 minutes.</p>
            <button className="pe-btn-green large" onClick={goToForm}>
              Start Listing My Business
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}

        {view === 'form' && (
          <div className="pe-form-page">
            <div className="pe-form-page-header">
              <button className="pe-back" onClick={function(){setView('home');}}>← Back</button>
              <div className="pe-form-page-title">List Your Business</div>
              <div className="pe-form-page-sub">
                Confidential. Structured. Sequoia-grade information request.<br />
                Your identity is never shared without explicit written consent.
              </div>
            </div>
            <SellerForm onSuccess={handleSuccess} />
          </div>
        )}

        {view === 'success' && (
          <SuccessScreen refId={refId} />
        )}
      </section>

      {/* FOOTER */}
      <footer className="pe-footer">
        <div className="pe-footer-inner">
          <div className="pe-footer-left">
            <div className="pe-footer-brand">NOCAP PE</div>
            <div className="pe-footer-sub">A product of NoCap VC · India's founder-first platform</div>
          </div>
          <div className="pe-footer-right">
            <a href="/">NoCap VC</a>
            <a href="/school">Founder School</a>
            <a href="mailto:pe@nocapvc.in">Contact</a>
            <a href="https://instagram.com/nocapvc" target="_blank" rel="noreferrer">@nocapvc</a>
          </div>
        </div>
        <div className="pe-footer-line">© 2025 NoCap VC · NoCap PE · Micro Private Equity for India</div>
      </footer>

    </div>
  );
}
