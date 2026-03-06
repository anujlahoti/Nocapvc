import { useState, useEffect } from 'react';
import './PartnerModal.css';

const SCRIPT_URL = process.env.REACT_APP_GOOGLE_SCRIPT_URL || 'YOUR_APPS_SCRIPT_URL_HERE';

const initialForm = {
  org_name: '', org_type: '', contact_name: '', contact_email: '',
  org_website: '', org_linkedin: '',
  ts_fintech: false, ts_edtech: false, ts_health: false, ts_saas: false,
  ts_d2c: false, ts_agri: false, ts_climate: false, ts_ai: false,
  ts_impact: false, ts_any: false,
  st_idea: false, st_pre: false, st_seed: false, st_a: false,
  cheque_size: '', deals_per_year: '', feedback_commit: '',
  why_partner: '', heard_from: '',
};

export default function PartnerModal({ isOpen, onClose }) {
  const [form, setForm]       = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const required = ['org_name', 'org_type', 'contact_name', 'contact_email',
      'org_website', 'cheque_size', 'deals_per_year', 'feedback_commit', 'why_partner'];
    for (const field of required) {
      if (!form[field]) {
        setError(`Please fill in all required fields (missing: ${field.replace(/_/g, ' ')}).`);
        return;
      }
    }

    setLoading(true);
    try {
      const sectors = ['ts_fintech','ts_edtech','ts_health','ts_saas','ts_d2c',
        'ts_agri','ts_climate','ts_ai','ts_impact','ts_any']
        .filter(k => form[k])
        .map(k => ({
          ts_fintech:'Fintech', ts_edtech:'Edtech', ts_health:'Healthtech',
          ts_saas:'SaaS / B2B', ts_d2c:'D2C / Consumer', ts_agri:'Agritech',
          ts_climate:'Climate', ts_ai:'Deep Tech / AI', ts_impact:'Social Impact',
          ts_any:'Sector Agnostic'
        }[k]));

      const stages = ['st_idea','st_pre','st_seed','st_a']
        .filter(k => form[k])
        .map(k => ({ st_idea:'Idea Stage', st_pre:'Pre-seed', st_seed:'Seed', st_a:'Series A+' }[k]));

      const payload = {
        _type: 'partner',
        org_name:         form.org_name,
        org_type:         form.org_type,
        contact_name:     form.contact_name,
        contact_email:    form.contact_email,
        org_website:      form.org_website,
        org_linkedin:     form.org_linkedin,
        sectors:          sectors.join(', ') || 'None selected',
        stages:           stages.join(', ')  || 'None selected',
        cheque_size:      form.cheque_size,
        deals_per_year:   form.deals_per_year,
        feedback_commit:  form.feedback_commit,
        why_partner:      form.why_partner,
        heard_from:       form.heard_from,
        submitted_at:     new Date().toISOString(),
      };

      await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'no-cors',
      });

      setSuccess(true);
    } catch (err) {
      setError('Something went wrong. Please try again or DM us @nocapvc on Instagram.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pm-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pm-box">

        {/* Header */}
        <div className="pm-hd">
          <div>
            <div className="pm-tag">For Investors &amp; Incubators</div>
            <div className="pm-title">Partner Application</div>
          </div>
          <button className="pm-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="pm-body">
          {success ? (
            <div className="pm-success">
              <div className="pm-success-ico">🤝</div>
              <div className="pm-success-t">Application <em>received.</em></div>
              <p className="pm-success-b">
                We'll review your partner application and reach out within{' '}
                <strong>5 business days.</strong><br /><br />
                In the meantime — follow{' '}
                <span style={{ color: 'var(--yellow)' }}>@nocapvc</span>{' '}
                to see the founder community you'll be plugged into.
              </p>
              <button className="pm-success-btn" onClick={onClose}>Close</button>
            </div>
          ) : (
            <>
              <div className="pm-intro">
                You're applying for a <strong>NoCap VC Partner slot.</strong> Partners receive
                pre-screened founder applications filtered by sector and stage — and build brand
                with 76K+ founders by providing structured feedback.{' '}
                <strong>Limited slots available.</strong>
              </div>

              <form onSubmit={handleSubmit} noValidate>

                {/* SECTION 1 — Organisation */}
                <div className="pm-sec">
                  <div className="pm-sec-hd">
                    <span className="pm-sec-n">01 —</span>
                    <span className="pm-sec-t">Your Organisation</span>
                  </div>
                  <div className="pm-row">
                    <div className="pm-field">
                      <label className="pm-label">Organisation name <span className="req">*</span></label>
                      <input type="text" name="org_name" placeholder="e.g. NASSCOM 10000 Startups"
                        value={form.org_name} onChange={handleChange} required />
                    </div>
                    <div className="pm-field">
                      <label className="pm-label">Organisation type <span className="req">*</span></label>
                      <select name="org_type" value={form.org_type} onChange={handleChange} required>
                        <option value="" disabled>Select type</option>
                        {['Incubator','Accelerator','Angel Investor','Angel Network',
                          'Venture Capital Fund','Corporate VC','Family Office','Other']
                          .map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="pm-row">
                    <div className="pm-field">
                      <label className="pm-label">Your name <span className="req">*</span></label>
                      <input type="text" name="contact_name" placeholder="Decision maker's name"
                        value={form.contact_name} onChange={handleChange} required />
                    </div>
                    <div className="pm-field">
                      <label className="pm-label">Work email <span className="req">*</span></label>
                      <input type="email" name="contact_email" placeholder="you@organisation.com"
                        value={form.contact_email} onChange={handleChange} required />
                    </div>
                  </div>
                  <div className="pm-row">
                    <div className="pm-field">
                      <label className="pm-label">Website <span className="req">*</span></label>
                      <input type="url" name="org_website" placeholder="https://"
                        value={form.org_website} onChange={handleChange} required />
                    </div>
                    <div className="pm-field">
                      <label className="pm-label">LinkedIn <span className="pm-opt">optional</span></label>
                      <input type="url" name="org_linkedin" placeholder="https://linkedin.com/company/..."
                        value={form.org_linkedin} onChange={handleChange} />
                    </div>
                  </div>
                </div>

                {/* SECTION 2 — Thesis */}
                <div className="pm-sec">
                  <div className="pm-sec-hd">
                    <span className="pm-sec-n">02 —</span>
                    <span className="pm-sec-t">Investment Thesis</span>
                  </div>

                  <div className="pm-field">
                    <label className="pm-label">Sectors you focus on <span className="req">*</span></label>
                    <div className="pm-hint">Select all that apply</div>
                    <div className="pm-checks">
                      {[
                        ['ts_fintech','Fintech'], ['ts_edtech','Edtech'],
                        ['ts_health','Healthtech'], ['ts_saas','SaaS / B2B'],
                        ['ts_d2c','D2C / Consumer'], ['ts_agri','Agritech'],
                        ['ts_climate','Climate'], ['ts_ai','Deep Tech / AI'],
                        ['ts_impact','Social Impact'], ['ts_any','Sector Agnostic'],
                      ].map(([name, label]) => (
                        <div className="ci" key={name}>
                          <input type="checkbox" name={name} id={name}
                            checked={form[name]} onChange={handleChange} />
                          <label htmlFor={name}>{label}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pm-field" style={{ marginTop: '14px' }}>
                    <label className="pm-label">Stages you invest at <span className="req">*</span></label>
                    <div className="pm-checks">
                      {[
                        ['st_idea','Idea Stage'], ['st_pre','Pre-seed'],
                        ['st_seed','Seed'], ['st_a','Series A+'],
                      ].map(([name, label]) => (
                        <div className="ci" key={name}>
                          <input type="checkbox" name={name} id={name}
                            checked={form[name]} onChange={handleChange} />
                          <label htmlFor={name}>{label}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pm-row" style={{ marginTop: '14px' }}>
                    <div className="pm-field">
                      <label className="pm-label">Typical cheque size <span className="req">*</span></label>
                      <select name="cheque_size" value={form.cheque_size} onChange={handleChange} required>
                        <option value="" disabled>Select range</option>
                        {['Under ₹10L (Grants / Equity-free)','₹10L – ₹50L',
                          '₹50L – ₹2Cr','₹2Cr – ₹10Cr','₹10Cr+']
                          .map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="pm-field">
                      <label className="pm-label">Deals reviewed per year <span className="req">*</span></label>
                      <select name="deals_per_year" value={form.deals_per_year} onChange={handleChange} required>
                        <option value="" disabled>Select range</option>
                        {['Under 50','50 – 200','200 – 500','500+']
                          .map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECTION 3 — Commitment */}
                <div className="pm-sec">
                  <div className="pm-sec-hd">
                    <span className="pm-sec-n">03 —</span>
                    <span className="pm-sec-t">The Commitment</span>
                  </div>

                  <div className="pm-field">
                    <label className="pm-label">
                      Can you commit to structured feedback within 14 days?{' '}
                      <span className="req">*</span>
                    </label>
                    <div className="pm-hint">This is non-negotiable — it's the NoCap promise to every founder.</div>
                    <div className="rg">
                      {[
                        ['Yes — Committed', 'Yes — we commit to structured feedback within 14 days'],
                        ['Yes — With Conditions', 'Yes — but we need to discuss process'],
                        ['No', 'No — we can\'t commit to that timeline'],
                      ].map(([v, l]) => (
                        <div className="ri" key={v}>
                          <input type="radio" name="feedback_commit" id={`fc_${v}`}
                            value={v} checked={form.feedback_commit === v} onChange={handleChange} />
                          <label htmlFor={`fc_${v}`}>{l}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pm-field" style={{ marginTop: '14px' }}>
                    <label className="pm-label">
                      Why do you want to partner with NoCap VC? <span className="req">*</span>
                    </label>
                    <div className="pm-hint">What are you hoping to get from this? Be honest.</div>
                    <textarea name="why_partner"
                      placeholder="Deal flow quality, community access, brand building with founders..."
                      maxLength={500} value={form.why_partner} onChange={handleChange}
                      style={{ minHeight: '80px' }} required />
                  </div>

                  <div className="pm-field">
                    <label className="pm-label">
                      How did you hear about NoCap VC? <span className="pm-opt">optional</span>
                    </label>
                    <select name="heard_from" value={form.heard_from} onChange={handleChange}>
                      <option value="">Select</option>
                      {['Instagram (@nocapvc)','Referred by a founder','Referred by another investor',
                        'LinkedIn','Search / Google','Other']
                        .map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>

                {/* Submit */}
                <div className="pm-submit-area">
                  {error && <div className="err-ban show">⚠️ {error}</div>}
                  <button type="submit" className="btn-sub" disabled={loading}>
                    <span>{loading ? 'Submitting...' : 'Submit Partner Application'}</span>
                    {loading && <div className="spin" />}
                    {!loading && (
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2"
                          strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </div>

              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
