import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import './School.css';

const SECTORS = [
  'Fintech', 'Edtech', 'Healthtech', 'SaaS / B2B',
  'D2C / Consumer', 'Agritech', 'Climate / Sustainability',
  'Deep Tech / AI', 'Social Impact', 'Other'
];

const ROLES = ['Founder', 'Co-founder', 'Domain Expert', 'Consultant'];

export default function SchoolOnboard({ onComplete }) {
  const [form, setForm] = useState({ startup_name: '', sector: '', role: '', city: '' });
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [locEnabled, setLocEnabled] = useState(false);
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm(function(f) { return Object.assign({}, f, { [e.target.name]: e.target.value }); });
  };

  const getLocation = () => {
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      function(pos) {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocEnabled(true);
        setLocLoading(false);
      },
      function() {
        setError('Location denied. You can still use Founder School without it.');
        setLocLoading(false);
      }
    );
  };

  const handleSubmit = async () => {
    if (!form.startup_name || !form.sector || !form.role) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    try {
      var user = auth.currentUser;
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        photo: user.photoURL,
        startup_name: form.startup_name,
        sector: form.sector,
        role: form.role,
        city: form.city,
        lat: coords.lat,
        lng: coords.lng,
        joined_at: new Date().toISOString(),
      });
      onComplete();
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="school-onboard">
      <div className="school-onboard-box">
        <span className="school-tag">FOUNDER SCHOOL</span>
        <h2 className="school-onboard-title">Set up your profile</h2>
        <p className="school-onboard-sub">Takes 30 seconds. Helps us match you with the right founders.</p>

        <div className="school-field">
          <label className="school-label">Startup name *</label>
          <input
            type="text"
            name="startup_name"
            placeholder="Even if it is just an idea"
            value={form.startup_name}
            onChange={handleChange}
          />
        </div>

        <div className="school-field">
          <label className="school-label">Sector *</label>
          <select name="sector" value={form.sector} onChange={handleChange}>
            <option value="">Select your sector</option>
            {SECTORS.map(function(s) { return <option key={s} value={s}>{s}</option>; })}
          </select>
        </div>

        <div className="school-field">
          <label className="school-label">Your role *</label>
          <div className="school-radio-group">
            {ROLES.map(function(r) {
              return (
                <div
                  key={r}
                  className={'school-radio-pill' + (form.role === r ? ' active' : '')}
                  onClick={function() { setForm(function(f) { return Object.assign({}, f, { role: r }); }); }}
                >
                  {r}
                </div>
              );
            })}
          </div>
        </div>

        <div className="school-field">
          <label className="school-label">City <span className="school-opt">optional</span></label>
          <input
            type="text"
            name="city"
            placeholder="e.g. Indore, Mumbai, Bangalore"
            value={form.city}
            onChange={handleChange}
          />
        </div>

        <div className="school-field">
          <label className="school-label">Location <span className="school-opt">recommended</span></label>
          <p className="school-hint">Enables nearby signal matching. We never share your exact location.</p>
          <button
            className="school-loc-btn"
            onClick={getLocation}
            disabled={locLoading || locEnabled}
          >
            {locEnabled ? 'Location enabled' : locLoading ? 'Getting location...' : 'Enable location'}
          </button>
        </div>

        {error && <div className="school-error">{error}</div>}

        <button
          className="school-submit-btn"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Setting up...' : 'Enter Founder School'}
        </button>
      </div>
    </div>
  );
}