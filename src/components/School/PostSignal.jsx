import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import './School.css';

const CATEGORIES = [
  'Fundraising',
  'Product / Tech',
  'Distribution / Sales',
  'Marketing',
  'Hiring',
  'Legal / Finance',
  'Mental Health',
  'Other'
];

const RADIUS_OPTIONS = [
  { label: 'My city', value: 50 },
  { label: '25 km', value: 25 },
  { label: '100 km', value: 100 },
  { label: 'All India', value: 99999 }
];

export default function PostSignal({ profile, onPosted }) {
  const [form, setForm] = useState({ category: '', description: '', radius: 50, anonymous: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.category) { setError('Please select a problem category.'); return; }
    if (!form.description || form.description.length < 20) { setError('Please describe your problem (at least 20 characters).'); return; }
    setLoading(true);
    setError('');
    try {
      var user = auth.currentUser;
      await addDoc(collection(db, 'signals'), {
        uid: user.uid,
        name: form.anonymous ? 'Anonymous Founder' : user.displayName,
        startup: form.anonymous ? '' : profile.startup_name,
        sector: profile.sector,
        category: form.category,
        description: form.description,
        radius: form.radius,
        lat: profile.lat || null,
        lng: profile.lng || null,
        city: profile.city || '',
        anonymous: form.anonymous,
        status: 'active',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        response_count: 0,
      });
      onPosted();
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="post-signal">
      <div className="post-signal-hd">
        <h2 className="post-signal-title">Post a signal</h2>
        <p className="post-signal-sub">Describe your blocker. Get help from founders nearby.</p>
      </div>

      <div className="school-field">
        <label className="school-label">What kind of problem? *</label>
        <div className="signal-cat-grid">
          {CATEGORIES.map(function(cat) {
            return (
              <div
                key={cat}
                className={'signal-cat-pill' + (form.category === cat ? ' active' : '')}
                onClick={function() { setForm(function(f) { return Object.assign({}, f, { category: cat }); }); }}
              >
                {cat}
              </div>
            );
          })}
        </div>
      </div>

      <div className="school-field">
        <label className="school-label">Describe your blocker * <span className="char-count">{form.description.length}/200</span></label>
        <textarea
          className="signal-textarea"
          placeholder="What exactly is the problem? What have you already tried? Be specific — the more specific you are, the better help you get."
          maxLength={200}
          value={form.description}
          onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { description: e.target.value }); }); }}
        />
      </div>

      <div className="school-field">
        <label className="school-label">Who should see this?</label>
        <div className="radius-grid">
          {RADIUS_OPTIONS.map(function(opt) {
            return (
              <div
                key={opt.value}
                className={'radius-pill' + (form.radius === opt.value ? ' active' : '')}
                onClick={function() { setForm(function(f) { return Object.assign({}, f, { radius: opt.value }); }); }}
              >
                {opt.label}
              </div>
            );
          })}
        </div>
      </div>

      <div className="school-field">
        <div
          className={'anon-toggle' + (form.anonymous ? ' active' : '')}
          onClick={function() { setForm(function(f) { return Object.assign({}, f, { anonymous: !f.anonymous }); }); }}
        >
          <div className="anon-toggle-dot" />
          <span className="anon-toggle-label">Post anonymously</span>
        </div>
        <p className="school-hint">Your name and startup won't be shown to other founders.</p>
      </div>

      {error && <div className="school-error">{error}</div>}

      <button className="school-submit-btn" onClick={handleSubmit} disabled={loading}>
        {loading ? 'Posting...' : 'Fire signal'}
      </button>

      <p className="school-hint" style={{ textAlign: 'center', marginTop: '12px' }}>
        Signal expires automatically after 48 hours.
      </p>
    </div>
  );
}