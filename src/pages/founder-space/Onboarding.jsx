/**
 * Founder Space — Onboarding (3-step profile creation)
 * Route: /founder-space/onboarding
 *
 * Step 1 — Who are you?        (name, title, what building, role)
 * Step 2 — Find you online     (linkedin, twitter, email, photo)
 * Step 3 — Launch              (preview card + save to Firestore)
 */

import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { doc, setDoc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../lib/auth';
import { withAuth } from '../../components/withAuth';
import { uploadUserAvatar } from '../../lib/storage';
import { useImageUpload } from '../../hooks/useImageUpload';
import UserProfileCard from '../../components/founder-space/UserProfileCard';
import './FounderSpace.css';

// ── Constants ─────────────────────────────────

const ROLES = [
  { id: 'founder',    label: '🚀 Founder'    },
  { id: 'investor',   label: '💼 Investor'   },
  { id: 'talent',     label: '⚡ Talent'     },
  { id: 'enthusiast', label: '🔥 Enthusiast' },
];

const TOTAL_STEPS = 3;

// ── Step indicator ────────────────────────────

function StepBar({ step }) {
  return (
    <div className="fs-steps">
      {[1, 2, 3].map((s, i) => (
        <React.Fragment key={s}>
          <div
            className={`fs-step-dot${step === s ? ' active' : step > s ? ' done' : ''}`}
            title={['Who are you?', 'Your links', 'Launch'][i]}
          />
          {s < 3 && <div className={`fs-step-line${step > s ? ' done' : ''}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Field wrapper ─────────────────────────────

function Field({ label, hint, error, children }) {
  return (
    <div className="fs-field">
      {label && <label className="fs-label">{label}</label>}
      {children}
      {hint && !error && <div className="fs-hint">{hint}</div>}
      {error && <div className="fs-error-msg">{error}</div>}
    </div>
  );
}

// ── Char counter ──────────────────────────────

function CharCount({ value, max }) {
  const remaining = max - (value?.length || 0);
  return (
    <span style={{
      fontFamily: "'DM Mono', monospace",
      fontSize: 10,
      color: remaining < 20 ? '#c0392b' : 'var(--fs-muted)',
      float: 'right',
      marginTop: 4,
    }}>
      {remaining} left
    </span>
  );
}

// ── Validation ────────────────────────────────

function validateStep1(data) {
  const errors = {};
  if (!data.name.trim())           errors.name = 'Your name is required.';
  if (!data.title.trim())          errors.title = 'Your tagline is required.';
  if (data.title.length > 80)      errors.title = 'Max 80 characters.';
  if (!data.whatImBuilding.trim()) errors.whatImBuilding = 'Tell us what you\'re up to.';
  if (data.whatImBuilding.length > 200) errors.whatImBuilding = 'Max 200 characters.';
  if (!data.role)                  errors.role = 'Pick the hat you wear most.';
  return errors;
}

function validateStep2(data) {
  const errors = {};
  if (!data.contactEmail.trim()) {
    errors.contactEmail = 'Contact email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail)) {
    errors.contactEmail = 'Enter a valid email address.';
  }
  if (data.linkedin && !data.linkedin.startsWith('http')) {
    errors.linkedin = 'Enter the full URL (starts with https://)';
  }
  if (data.twitter && !data.twitter.startsWith('http')) {
    errors.twitter = 'Enter the full URL (starts with https://)';
  }
  return errors;
}

// ── Step 1: Who are you? ──────────────────────

function Step1({ data, onChange, errors }) {
  return (
    <div>
      <div style={{ marginBottom: 36 }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(26px, 4vw, 36px)',
          fontWeight: 700,
          color: 'var(--fs-text)',
          margin: '0 0 8px',
          lineHeight: 1.2,
        }}>
          Who's behind the idea?
        </h2>
        <p style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 15,
          color: 'var(--fs-muted)',
          margin: 0,
          lineHeight: 1.6,
        }}>
          This is what investors, co-founders, and early adopters see first.
          Make it real.
        </p>
      </div>

      <Field label="Your name" error={errors.name}>
        <input
          className={`fs-input${errors.name ? ' fs-input-error' : ''}`}
          placeholder="Anuj Lahoti"
          value={data.name}
          onChange={e => onChange('name', e.target.value)}
          maxLength={60}
        />
      </Field>

      <Field
        label="Your tagline"
        hint='E.g. "Founder @ BYAJ | Fintech | GRE 170Q"'
        error={errors.title}
      >
        <input
          className={`fs-input${errors.title ? ' fs-input-error' : ''}`}
          placeholder="Founder @ __ | What you do"
          value={data.title}
          onChange={e => onChange('title', e.target.value)}
          maxLength={80}
        />
        <CharCount value={data.title} max={80} />
      </Field>

      <Field
        label="Tell the world what you're obsessed with"
        hint="What problem are you losing sleep over? What are you building — or want to build?"
        error={errors.whatImBuilding}
      >
        <textarea
          className={`fs-textarea${errors.whatImBuilding ? ' fs-input-error' : ''}`}
          placeholder="I'm building a platform to democratize stock lending for India's 8.5 crore retail investors..."
          value={data.whatImBuilding}
          onChange={e => onChange('whatImBuilding', e.target.value)}
          maxLength={200}
          rows={4}
        />
        <CharCount value={data.whatImBuilding} max={200} />
      </Field>

      <Field label="I wear the hat of a..." error={errors.role}>
        <div className="fs-role-pills">
          {ROLES.map(r => (
            <button
              key={r.id}
              type="button"
              className={`fs-role-pill${data.role === r.id ? ' active' : ''}`}
              onClick={() => onChange('role', r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </Field>
    </div>
  );
}

// ── Step 2: Links & contact ───────────────────

function Step2({ data, onChange, errors, user, onPhotoUpload }) {
  const { upload, uploading, progress, error: uploadError } = useImageUpload(
    useCallback(
      (file, onProgress) => uploadUserAvatar(user.uid, file, onProgress),
      [user.uid]
    )
  );

  async function handlePhotoSelect(file) {
    const url = await upload(file);
    if (url) onPhotoUpload(url);
  }

  return (
    <div>
      <div style={{ marginBottom: 36 }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(26px, 4vw, 36px)',
          fontWeight: 700,
          color: 'var(--fs-text)',
          margin: '0 0 8px',
          lineHeight: 1.2,
        }}>
          How do people find you?
        </h2>
        <p style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 15,
          color: 'var(--fs-muted)',
          margin: 0,
          lineHeight: 1.6,
        }}>
          Investors and co-founders will use these to reach you. The more you fill, the
          stronger your signal.
        </p>
      </div>

      {/* Profile photo */}
      <Field label="Profile photo (optional)">
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 8 }}>
          {(data.photoURL || user.photoURL) && (
            <img
              src={data.photoURL || user.photoURL}
              alt="Profile"
              style={{
                width: 64, height: 64, borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid var(--fs-border)',
              }}
            />
          )}
          <div>
            <label style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              cursor: uploading ? 'wait' : 'pointer',
              fontFamily: "'DM Mono', monospace",
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--fs-text)',
              padding: '10px 18px',
              border: '1.5px solid var(--fs-border)',
              borderRadius: 6,
              transition: 'border-color 0.15s',
            }}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                disabled={uploading}
                onChange={e => e.target.files[0] && handlePhotoSelect(e.target.files[0])}
              />
              {uploading ? `Uploading… ${progress}%` : data.photoURL ? 'Change photo' : 'Upload photo'}
            </label>
            {uploading && (
              <div style={{
                marginTop: 6, height: 3,
                background: 'var(--fs-border)', borderRadius: 2, overflow: 'hidden', width: 180,
              }}>
                <div style={{
                  height: '100%', width: `${progress}%`,
                  background: 'var(--fs-accent)', borderRadius: 2,
                  transition: 'width 0.2s',
                }} />
              </div>
            )}
            {uploadError && (
              <div className="fs-error-msg" style={{ marginTop: 4 }}>{uploadError}</div>
            )}
          </div>
        </div>
        <div className="fs-hint">Max 5MB · JPEG, PNG, WebP · Or we'll use your Google photo</div>
      </Field>

      <Field label="Contact email" error={errors.contactEmail}>
        <input
          className={`fs-input${errors.contactEmail ? ' fs-input-error' : ''}`}
          type="email"
          placeholder="anuj@nocapvc.in"
          value={data.contactEmail}
          onChange={e => onChange('contactEmail', e.target.value)}
        />
        <div className="fs-hint">Publicly visible. How the right people reach you.</div>
      </Field>

      <Field label="LinkedIn URL (optional)" error={errors.linkedin}>
        <input
          className={`fs-input${errors.linkedin ? ' fs-input-error' : ''}`}
          type="url"
          placeholder="https://linkedin.com/in/yourname"
          value={data.linkedin}
          onChange={e => onChange('linkedin', e.target.value)}
        />
      </Field>

      <Field label="X / Twitter URL (optional)" error={errors.twitter}>
        <input
          className={`fs-input${errors.twitter ? ' fs-input-error' : ''}`}
          type="url"
          placeholder="https://x.com/yourhandle"
          value={data.twitter}
          onChange={e => onChange('twitter', e.target.value)}
        />
      </Field>
    </div>
  );
}

// ── Step 3: Preview & Launch ──────────────────

function Step3({ data, user, saving }) {
  const previewProfile = {
    uid:            user.uid,
    name:           data.name || user.displayName || 'Your Name',
    title:          data.title,
    whatImBuilding: data.whatImBuilding,
    role:           data.role,
    linkedin:       data.linkedin,
    twitter:        data.twitter,
    contactEmail:   data.contactEmail,
    photoURL:       data.photoURL || user.photoURL || '',
  };

  return (
    <div>
      <div style={{ marginBottom: 36 }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(26px, 4vw, 36px)',
          fontWeight: 700,
          color: 'var(--fs-text)',
          margin: '0 0 8px',
          lineHeight: 1.2,
        }}>
          This is you.
        </h2>
        <p style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 15,
          color: 'var(--fs-muted)',
          margin: 0,
          lineHeight: 1.6,
        }}>
          Your Founder Space profile card. Investors, co-founders, and early adopters
          will see this. You can always edit it later.
        </p>
      </div>

      {/* Profile card preview — centred with polaroid tilt */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '32px 0 40px',
      }}>
        <UserProfileCard profile={previewProfile} size="lg" tilt={-1} />
      </div>

      {saving && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          fontFamily: "'DM Mono', monospace",
          fontSize: 12,
          color: 'var(--fs-muted)',
          marginBottom: 16,
        }}>
          <div className="fs-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
          Creating your profile…
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────

function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep]   = useState(1);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);

  const [data, setData] = useState({
    name:           user?.displayName || '',
    title:          '',
    whatImBuilding: '',
    role:           '',
    contactEmail:   user?.email || '',
    linkedin:       '',
    twitter:        '',
    photoURL:       user?.photoURL || '',
  });

  function updateField(key, value) {
    setData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  function handlePhotoUpload(url) {
    updateField('photoURL', url);
  }

  function handleNext() {
    let errs = {};
    if (step === 1) errs = validateStep1(data);
    if (step === 2) errs = validateStep2(data);

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleBack() {
    setStep(s => s - 1);
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleLaunch() {
    setSaving(true);
    setSubmitError(null);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const existingSnap = await getDoc(userDocRef);

      const profileFields = {
        uid:            user.uid,
        name:           data.name.trim(),
        title:          data.title.trim(),
        whatImBuilding: data.whatImBuilding.trim(),
        role:           data.role,
        contactEmail:   data.contactEmail.trim(),
        linkedin:       data.linkedin.trim(),
        twitter:        data.twitter.trim(),
        photoURL:       data.photoURL || user.photoURL || '',
        updatedAt:      serverTimestamp(),
      };

      if (existingSnap.exists()) {
        // Update without touching isAdmin — avoids rule denial when isAdmin is missing
        await updateDoc(userDocRef, profileFields);
      } else {
        // First-time create — must include isAdmin: false per security rule
        await setDoc(userDocRef, {
          ...profileFields,
          isAdmin:   false,
          createdAt: serverTimestamp(),
        });
      }

      await refreshProfile();
      navigate('/founder-space/feed', { replace: true });
    } catch (err) {
      console.error('Onboarding launch error:', err?.code, err?.message, err);
      setSubmitError(`Something went wrong: ${err?.code || err?.message || 'unknown error'}`);
      setSaving(false);
    }
  }

  return (
    <div className="fs-page">
      {/* Nav */}
      <nav className="fs-nav">
        <Link to="/founder-space" className="fs-nav-logo">
          <span className="fs-nav-dot" />
          Founder Space
        </Link>
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.16em',
          color: 'var(--fs-muted)',
          textTransform: 'uppercase',
        }}>
          Step {step} of {TOTAL_STEPS}
        </span>
      </nav>

      {/* Form container */}
      <div style={{
        maxWidth: 560,
        margin: '0 auto',
        padding: '60px 24px 80px',
      }}>
        <StepBar step={step} />

        {/* Step content */}
        {step === 1 && (
          <Step1 data={data} onChange={updateField} errors={errors} />
        )}
        {step === 2 && (
          <Step2
            data={data}
            onChange={updateField}
            errors={errors}
            user={user}
            onPhotoUpload={handlePhotoUpload}
          />
        )}
        {step === 3 && (
          <Step3 data={data} user={user} saving={saving} />
        )}

        {/* Submit error */}
        {submitError && (
          <div style={{
            background: '#fff5f5',
            border: '1px solid rgba(192,57,43,0.2)',
            borderRadius: 6,
            padding: '12px 16px',
            fontFamily: "'DM Mono', monospace",
            fontSize: 12,
            color: '#c0392b',
            marginBottom: 20,
          }}>
            {submitError}
          </div>
        )}

        {/* Navigation buttons */}
        <div style={{
          display: 'flex',
          justifyContent: step === 1 ? 'flex-end' : 'space-between',
          alignItems: 'center',
          marginTop: 8,
          gap: 12,
        }}>
          {step > 1 && (
            <button
              className="fs-btn-ghost"
              onClick={handleBack}
              disabled={saving}
            >
              ← Back
            </button>
          )}
          {step < 3 && (
            <button
              className="fs-btn-primary"
              onClick={handleNext}
            >
              Continue →
            </button>
          )}
          {step === 3 && (
            <button
              className="fs-btn-primary"
              onClick={handleLaunch}
              disabled={saving}
              style={{ gap: 10 }}
            >
              {saving && (
                <span className="fs-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
              )}
              {saving ? 'Creating profile…' : '🚀 Launch my profile'}
            </button>
          )}
        </div>

        {/* Fine print */}
        <p style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
          color: 'var(--fs-muted)',
          textAlign: 'center',
          marginTop: 32,
          lineHeight: 1.6,
          opacity: 0.7,
        }}>
          You can edit your profile any time after launch.<br />
          By continuing you agree to our community guidelines.
        </p>
      </div>
    </div>
  );
}

export default withAuth(Onboarding);
