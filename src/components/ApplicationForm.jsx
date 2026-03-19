import { useState, useRef } from 'react';
import './ApplicationForm.css';

const GOOGLE_SCRIPT_URL = process.env.REACT_APP_GOOGLE_SCRIPT_URL || 'YOUR_APPS_SCRIPT_URL_HERE';

const TOTAL_FIELDS = 20;

const initialForm = {
  name: '', email: '', linkedin_url: '',
  startup_name: '', sector: '', one_liner: '',
  why_this: '', stage: '', founder_type: '',
  cofounder_name: '', cofounder_linkedin: '',
  biggest_challenge: '', applied_before: '',
  why_not_job: '', success_vision: '',
  need_funding: false, need_mentorship: false,
  need_network: false, need_validation: false, need_technical: false,
  problem_gap: '', target_customer: '', product_description: '',
  domain_expertise: '', competitors: '', revenue_model: '',
  video_url: '', website: '',
  pitchdeck: null,
};

export default function ApplicationForm() {
  const [form, setForm] = useState(initialForm);
  const [answered, setAnswered] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [fileName, setFileName] = useState('');
  const [hasCofounder, setHasCofounder] = useState(false);
  const fileRef = useRef(null);

  const progress = Math.round((answered.size / TOTAL_FIELDS) * 100);

  const track = (name, value) => {
    setAnswered(prev => {
      const next = new Set(prev);
      if (value && value !== '') next.add(name); else next.delete(name);
      return next;
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setForm(f => ({ ...f, [name]: checked }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
      track(name, value);
    }
  };

  const handleRadio = (name, value) => {
    setForm(f => ({ ...f, [name]: value }));
    track(name, value);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Please upload a PDF file only.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('PDF must be under 10MB.');
        return;
      }
      setForm(f => ({ ...f, pitchdeck: file }));
      setFileName(file.name);
      setError('');
    }
  };

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const required = ['name', 'email', 'startup_name', 'sector', 'one_liner',
      'why_this', 'stage', 'founder_type', 'biggest_challenge',
      'applied_before', 'why_not_job', 'success_vision',
      'problem_gap', 'target_customer', 'product_description',
      'domain_expertise', 'competitors', 'revenue_model',
      'video_url'];
    for (const field of required) {
      if (!form[field]) {
        setError(`Please fill in all required fields (missing: ${field.replace(/_/g, ' ')}).`);
        return;
      }
    }
    if (!form.linkedin_url) {
      setError('Please enter your LinkedIn URL.');
      return;
    }
    if (!form.pitchdeck) {
      setError('Please upload your pitch deck (PDF required).');
      return;
    }

    setLoading(true);

    try {
      const needs = [];
      if (form.need_funding) needs.push('Funding');
      if (form.need_mentorship) needs.push('Mentorship');
      if (form.need_network) needs.push('Network');
      if (form.need_validation) needs.push('Validation');
      if (form.need_technical) needs.push('Technical Help');

      const payload = {
        name: form.name,
        email: form.email,
        linkedin_url: form.linkedin_url,
        startup_name: form.startup_name,
        sector: form.sector,
        one_liner: form.one_liner,
        why_this: form.why_this,
        stage: form.stage,
        founder_type: form.founder_type,
        cofounder_details: hasCofounder
          ? `${form.cofounder_name} | ${form.cofounder_linkedin}`
          : 'Solo',
        biggest_challenge: form.biggest_challenge,
        applied_before: form.applied_before,
        why_not_job: form.why_not_job,
        success_vision: form.success_vision,
        needs: needs.join(', ') || 'None selected',
        problem_gap: form.problem_gap,
        target_customer: form.target_customer,
        product_description: form.product_description,
        domain_expertise: form.domain_expertise,
        competitors: form.competitors,
        revenue_model: form.revenue_model,
        video_url: form.video_url,
        website: form.website,
        submitted_at: new Date().toISOString(),
      };

      if (form.pitchdeck) {
        payload.pitchdeck_name = form.pitchdeck.name;
        payload.pitchdeck_base64 = await toBase64(form.pitchdeck);
      }

      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'no-cors',
      });

      setSuccess(true);
      window.scrollTo({ top: document.getElementById('apply').offsetTop, behavior: 'smooth' });
    } catch (err) {
      setError('Something went wrong. Please try again or DM us @nocapvc on Instagram.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="form-box">
        <div className="success">
          <div className="success-ico">🎯</div>
          <div className="success-t">You're <em>in.</em></div>
          <p className="success-b">
            Application submitted successfully.<br /><br />
            Our partners will review it within <strong>14 days.</strong><br />
            You'll receive structured feedback — what worked, what didn't, exactly what to fix.<br /><br />
            <span style={{ color: 'var(--yellow)' }}>No ghosting. That's the NoCap promise.</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="form-box">
      <div className="prog-wrap">
        <div className="prog-meta">
          <span className="prog-lbl">Progress</span>
          <span className="prog-cnt">{answered.size} / {TOTAL_FIELDS} answered</span>
        </div>
        <div className="prog-bar">
          <div className="prog-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>

        {/* SECTION 1: BASICS */}
        <div className="fsec">
          <div className="fsec-hd">
            <span className="fsec-n">01 —</span>
            <span className="fsec-t">The Basics</span>
          </div>

          <div className="frow">
            <div className="ff">
              <label className="fl">Full name <span className="req">*</span></label>
              <input type="text" name="name" placeholder="Your name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="ff">
              <label className="fl">Email <span className="req">*</span></label>
              <input type="email" name="email" placeholder="your@email.com" value={form.email} onChange={handleChange} required />
            </div>
          </div>

          <div className="ff">
            <label className="fl">Founder LinkedIn profile <span className="req">*</span></label>
            <div className="fh">Your LinkedIn profile as a founder</div>
            <input type="url" name="linkedin_url" placeholder="https://linkedin.com/in/yourprofile" value={form.linkedin_url} onChange={handleChange} required />
          </div>

          <div className="frow">
            <div className="ff">
              <label className="fl">Startup name <span className="req">*</span></label>
              <input type="text" name="startup_name" placeholder="Even if it's just an idea" value={form.startup_name} onChange={handleChange} required />
            </div>
            <div className="ff">
              <label className="fl">Sector <span className="req">*</span></label>
              <select name="sector" value={form.sector} onChange={handleChange} required>
                <option value="" disabled>Select sector</option>
                {['Fintech','Edtech','Healthtech','SaaS / B2B','D2C / Consumer','Agritech','Climate / Sustainability','Deep Tech / AI','Social Impact','Other'].map(s => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="ff">
            <label className="fl">Describe your startup in one sentence <span className="req">*</span></label>
            <div className="fh">We help [who] do [what] by [how]</div>
            <textarea name="one_liner" placeholder="Keep it simple and direct..." maxLength={200} value={form.one_liner} onChange={handleChange} style={{ minHeight: '66px' }} required />
            <div className="cc">{form.one_liner.length} / 200</div>
          </div>
        </div>

        {/* SECTION 2: REALITY CHECK */}
        <div className="fsec">
          <div className="fsec-hd">
            <span className="fsec-n">02 —</span>
            <span className="fsec-t">The Reality Check</span>
          </div>

          <div className="ff">
            <label className="fl">Why did you pick this idea? <span className="req">*</span></label>
            <div className="fh">Personal stories beat polished pitches. Why you, why this?</div>
            <textarea name="why_this" placeholder="What happened that led you here?" maxLength={600} value={form.why_this} onChange={handleChange} style={{ minHeight: '100px' }} required />
            <div className={`cc ${form.why_this.length > 528 ? 'warn' : ''}`}>{form.why_this.length} / 600</div>
          </div>

          <div className="ff">
            <label className="fl">Current stage <span className="req">*</span></label>
            <div className="rg">
              {[
                { v: 'Idea — Not Built Yet', l: 'Idea — Not Built Yet' },
                { v: 'Prototype / MVP', l: 'Prototype / MVP — no real users yet' },
                { v: 'Launched — No Revenue', l: 'Launched — have users but no revenue' },
                { v: 'Generating Revenue', l: 'Generating Revenue (even ₹1 counts)' },
              ].map(({ v, l }) => (
                <div className="ri" key={v}>
                  <input type="radio" name="stage" id={`stage_${v}`} value={v} checked={form.stage === v} onChange={() => handleRadio('stage', v)} />
                  <label htmlFor={`stage_${v}`}>{l}</label>
                </div>
              ))}
            </div>
          </div>

          <div className="ff">
            <label className="fl">Founder setup <span className="req">*</span></label>
            <div className="rg h">
              {[['Solo Founder','Solo'],['2 Co-founders','2 founders'],['3+ Founders','3+ founders']].map(([v,l]) => (
                <div className="ri" key={v}>
                  <input type="radio" name="founder_type" id={`ft_${v}`} value={v} checked={form.founder_type === v} onChange={() => handleRadio('founder_type', v)} />
                  <label htmlFor={`ft_${v}`}>{l}</label>
                </div>
              ))}
            </div>
          </div>

          <div className="ff cofounder-toggle">
            <label className="fl">Do you have a Co-founder?</label>
            <div className="rg h">
              <div className="ri">
                <input type="radio" name="has_cofounder" id="cf_yes" value="yes" checked={hasCofounder} onChange={() => setHasCofounder(true)} />
                <label htmlFor="cf_yes">Yes</label>
              </div>
              <div className="ri">
                <input type="radio" name="has_cofounder" id="cf_no" value="no" checked={!hasCofounder} onChange={() => setHasCofounder(false)} />
                <label htmlFor="cf_no">No</label>
              </div>
            </div>
          </div>

          {hasCofounder && (
            <div className="cofounder-fields">
              <div className="cofounder-label">Co-founder Details</div>
              <div className="frow">
                <div className="ff">
                  <label className="fl">Co-founder Name</label>
                  <input type="text" name="cofounder_name" placeholder="Full name" value={form.cofounder_name} onChange={handleChange} />
                </div>
                <div className="ff">
                  <label className="fl">Co-founder LinkedIn</label>
                  <input type="url" name="cofounder_linkedin" placeholder="https://linkedin.com/in/..." value={form.cofounder_linkedin} onChange={handleChange} />
                </div>
              </div>
            </div>
          )}

          <div className="ff">
            <label className="fl">Biggest challenge right now <span className="req">*</span></label>
            <div className="fh">"We need money" is not an answer. What's the actual hard problem?</div>
            <textarea name="biggest_challenge" placeholder="The one thing keeping you up at night..." maxLength={500} value={form.biggest_challenge} onChange={handleChange} style={{ minHeight: '80px' }} required />
            <div className={`cc ${form.biggest_challenge.length > 440 ? 'warn' : ''}`}>{form.biggest_challenge.length} / 500</div>
          </div>

          <div className="ff">
            <label className="fl">Previous applications <span className="req">*</span></label>
            <div className="rg">
              {[
                ['No — First Time', 'No — this is my first time'],
                ['Yes — No Response', 'Yes — applied but never heard back'],
                ['Yes — Rejected No Feedback', 'Yes — got rejected with zero feedback'],
                ['Yes — Reached Interview', 'Yes — made it to interview stage'],
              ].map(([v, l]) => (
                <div className="ri" key={v}>
                  <input type="radio" name="applied_before" id={`ab_${v}`} value={v} checked={form.applied_before === v} onChange={() => handleRadio('applied_before', v)} />
                  <label htmlFor={`ab_${v}`}>{l}</label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 3: AMBITION */}
        <div className="fsec">
          <div className="fsec-hd">
            <span className="fsec-n">03 —</span>
            <span className="fsec-t">The Ambition Signal</span>
          </div>

          <div className="ff">
            <label className="fl">Why can't you just get a job? <span className="req">*</span></label>
            <div className="fh">Honest answers only. What would you lose if you quit tomorrow?</div>
            <textarea name="why_not_job" placeholder="What makes this non-negotiable for you?" maxLength={500} value={form.why_not_job} onChange={handleChange} style={{ minHeight: '80px' }} required />
            <div className={`cc ${form.why_not_job.length > 440 ? 'warn' : ''}`}>{form.why_not_job.length} / 500</div>
          </div>

          <div className="ff">
            <label className="fl">What does success look like in 2 years? <span className="req">*</span></label>
            <textarea name="success_vision" placeholder="In 2 years, we will have..." maxLength={400} value={form.success_vision} onChange={handleChange} style={{ minHeight: '72px' }} required />
            <div className={`cc ${form.success_vision.length > 352 ? 'warn' : ''}`}>{form.success_vision.length} / 400</div>
          </div>

          <div className="ff">
            <label className="fl">What do you need most? <span className="req">*</span></label>
            <div className="cg">
              {[
                ['need_funding','Funding (seed / pre-seed capital)'],
                ['need_mentorship','Mentorship (domain expertise)'],
                ['need_network','Network (customers, partners, co-founders)'],
                ['need_validation','Validation (feedback on idea or product)'],
                ['need_technical','Technical help (building the product)'],
              ].map(([name, label]) => (
                <div className="ci" key={name}>
                  <input type="checkbox" name={name} id={name} checked={form[name]} onChange={handleChange} />
                  <label htmlFor={name}>{label}</label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 4: THE BUSINESS CASE */}
        <div className="fsec">
          <div className="fsec-hd">
            <span className="fsec-n">04 —</span>
            <span className="fsec-t">The Business Case</span>
          </div>

          <div className="ff">
            <label className="fl">What problem or gap are you solving? <span className="req">*</span></label>
            <div className="fh">Who has this problem today? Why does it exist? Be specific.</div>
            <textarea name="problem_gap" placeholder="The problem is... It exists because... People currently solve it by..." maxLength={300} value={form.problem_gap} onChange={handleChange} style={{ minHeight: '80px' }} required />
            <div className={`cc ${form.problem_gap.length > 264 ? 'warn' : ''}`}>{form.problem_gap.length} / 300</div>
          </div>

          <div className="ff">
            <label className="fl">Who is your target customer + what is your TAM? <span className="req">*</span></label>
            <div className="fh">Describe your customer precisely. Include an estimate of how large this market is.</div>
            <textarea name="target_customer" placeholder="Our customer is... There are approximately X of them in India / globally... The TAM is estimated at..." maxLength={300} value={form.target_customer} onChange={handleChange} style={{ minHeight: '80px' }} required />
            <div className={`cc ${form.target_customer.length > 264 ? 'warn' : ''}`}>{form.target_customer.length} / 300</div>
          </div>

          <div className="ff">
            <label className="fl">What exactly is your product? <span className="req">*</span></label>
            <div className="fh">What does it do or will it do? How does it solve the problem above?</div>
            <textarea name="product_description" placeholder="Our product is... It works by... The customer experience is..." maxLength={300} value={form.product_description} onChange={handleChange} style={{ minHeight: '80px' }} required />
            <div className={`cc ${form.product_description.length > 264 ? 'warn' : ''}`}>{form.product_description.length} / 300</div>
          </div>

          <div className="ff">
            <label className="fl">Why are you the right person to build this? <span className="req">*</span></label>
            <div className="fh">Domain expertise, unfair insight, personal experience. Why you and not someone else?</div>
            <textarea name="domain_expertise" placeholder="I have X years in this space... I've personally experienced this problem... My unfair advantage is..." maxLength={300} value={form.domain_expertise} onChange={handleChange} style={{ minHeight: '80px' }} required />
            <div className={`cc ${form.domain_expertise.length > 264 ? 'warn' : ''}`}>{form.domain_expertise.length} / 300</div>
          </div>

          <div className="ff">
            <label className="fl">Who are your competitors? <span className="req">*</span></label>
            <div className="fh">Name them. What do you understand about this market that they don't?</div>
            <textarea name="competitors" placeholder="Direct competitors are... Indirect alternatives are... We're different because..." maxLength={300} value={form.competitors} onChange={handleChange} style={{ minHeight: '80px' }} required />
            <div className={`cc ${form.competitors.length > 264 ? 'warn' : ''}`}>{form.competitors.length} / 300</div>
          </div>

          <div className="ff">
            <label className="fl">How will you make money? <span className="req">*</span></label>
            <div className="fh">Revenue model + realistic estimate of how much you could make.</div>
            <textarea name="revenue_model" placeholder="We charge... Our unit economics are... In Year 1 we expect... At scale this could be..." maxLength={300} value={form.revenue_model} onChange={handleChange} style={{ minHeight: '80px' }} required />
            <div className={`cc ${form.revenue_model.length > 264 ? 'warn' : ''}`}>{form.revenue_model.length} / 300</div>
          </div>
        </div>

        {/* SECTION 5: YOUR VOICE */}
        <div className="fsec">
          <div className="fsec-hd">
            <span className="fsec-n">05 —</span>
            <span className="fsec-t">Your Voice</span>
          </div>

          <div className="ff">
            <label className="fl">60-second video intro <span className="req">*</span></label>
            <div className="fh">Record on your phone. Raw is real. Founders with videos get 3× more responses.</div>
            <input type="url" name="video_url" placeholder="https://youtu.be/... or Google Drive link" value={form.video_url} onChange={handleChange} required />
          </div>

          <div className="ff">
            <label className="fl">Website or prototype <span className="otag">optional</span></label>
            <input type="url" name="website" placeholder="https://" value={form.website} onChange={handleChange} />
          </div>

          <div className="ff">
            <label className="fl">Pitch Deck <span className="req">*</span> <span className="otag">PDF only</span></label>
            <div className="fh">Upload your pitch deck as a PDF (max 10MB)</div>
            <div
              className={`file-drop ${fileName ? 'has-file' : ''}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) handleFile({ target: { files: [file] } });
              }}
            >
              <input
                type="file"
                ref={fileRef}
                accept=".pdf,application/pdf"
                onChange={handleFile}
                style={{ display: 'none' }}
              />
              {fileName ? (
                <div className="file-chosen">
                  <span className="file-icon">📄</span>
                  <div>
                    <div className="file-name">{fileName}</div>
                    <div className="file-hint">Click to change file</div>
                  </div>
                  <button
                    type="button"
                    className="file-remove"
                    onClick={(e) => { e.stopPropagation(); setForm(f => ({...f, pitchdeck: null})); setFileName(''); }}
                  >✕</button>
                </div>
              ) : (
                <div className="file-empty">
                  <span className="file-upload-icon">↑</span>
                  <div className="file-upload-text">Drop PDF here or <span className="file-link">browse files</span></div>
                  <div className="file-upload-hint">PDF · Max 10MB</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SUBMIT */}
        <div className="sub-area">
          <p className="sub-note">
            Your application goes to our partner incubators and investors.<br />
            <strong>Structured feedback guaranteed within 14 days. No ghosting.</strong>
          </p>
          {error && <div className="err-ban show">⚠️ {error}</div>}
          <button type="submit" className="btn-sub" disabled={loading}>
            <span className="sub-t">{loading ? 'Submitting...' : 'Submit Application'}</span>
            {loading && <div className="spin" />}
            {!loading && (
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}