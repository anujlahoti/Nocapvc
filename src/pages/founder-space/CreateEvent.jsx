/**
 * Create Event — Founder Space
 * Route: /founder-space/events/create
 *
 * 90-second event creation. Single page, no multi-step.
 */

import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  collection, addDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../lib/auth';
import { withAuth } from '../../components/withAuth';
import { useToast } from '../../components/Toast';
import { EVENT_TYPES } from './EventsFeed';
import './FounderSpace.css';

const TAGS = ['Finance', 'Tech', 'Design', 'Legal', 'Operations', 'Marketing', 'AI', 'General'];

const TYPE_DESCRIPTIONS = {
  book_club:      'Read and discuss a book together, chapter by chapter.',
  project_sprint: 'Work on a project in a focused, time-boxed sprint.',
  meetup:         'Meet in person or online — talk, connect, and build.',
  open_collab:    'Open invitation to collaborate on something together.',
};

function CreateEvent() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    type:             '',
    title:            '',
    description:      '',
    format:           'online',
    meetingLink:      '',
    city:             '',
    venue:            '',
    date:             '',
    time:             '',
    isRecurring:      false,
    recurringPattern: 'weekly',
    capacityOpen:     true,
    capacity:         20,
    tags:             [],
  });
  const [submitting, setSubmitting] = useState(false);

  const set = useCallback((key, val) => setForm(prev => ({ ...prev, [key]: val })), []);

  function toggleTag(tag) {
    setForm(prev => {
      const has = prev.tags.includes(tag);
      if (!has && prev.tags.length >= 3) return prev;
      return { ...prev, tags: has ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag] };
    });
  }

  async function handleSubmit() {
    // Validate
    if (!form.type)        { showToast('Choose an event type.', 'error'); return; }
    if (!form.title.trim()){ showToast('Give your event a title.', 'error'); return; }
    if (!form.description.trim()){ showToast('Add a description.', 'error'); return; }
    if (!form.date || !form.time){ showToast('Set a date and time.', 'error'); return; }
    if (form.format === 'in_person' && !form.city.trim()) { showToast('Add a city for in-person events.', 'error'); return; }

    const startDateTime = new Date(`${form.date}T${form.time}:00`);
    if (isNaN(startDateTime.getTime())) { showToast('Invalid date or time.', 'error'); return; }

    setSubmitting(true);
    try {
      const payload = {
        creatorUid:       user.uid,
        creatorName:      userProfile?.name || user.displayName || 'Host',
        creatorPhoto:     userProfile?.photoURL || user.photoURL || '',
        type:             form.type,
        title:            form.title.trim(),
        description:      form.description.trim(),
        format:           form.format,
        meetingLink:      form.meetingLink.trim() || '',
        city:             form.city.trim() || '',
        venue:            form.venue.trim() || '',
        startDateTime:    startDateTime,
        isRecurring:      form.isRecurring,
        recurringPattern: form.isRecurring ? form.recurringPattern : null,
        capacity:         form.capacityOpen ? null : Number(form.capacity),
        tags:             form.tags,
        attendeeCount:    1,
        status:           'upcoming',
        createdAt:        serverTimestamp(),
        updatedAt:        serverTimestamp(),
      };

      const ref = await addDoc(collection(db, 'events'), payload);
      // Creator auto-joined
      await addDoc(collection(db, 'eventAttendees'), {
        eventId:  ref.id,
        userId:   user.uid,
        joinedAt: serverTimestamp(),
        status:   'confirmed',
      });

      showToast('Event pinned! 🎉', 'success');
      navigate(`/founder-space/events/${ref.id}`);
    } catch (err) {
      console.error('Create event error:', err);
      showToast('Something went wrong. Try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Shared label style ────────────────────────────
  const LBL = {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10, fontWeight: 700,
    letterSpacing: '0.16em', textTransform: 'uppercase',
    color: '#2c1f0e', marginBottom: 8, display: 'block',
  };
  const FIELD = {
    width: '100%', padding: '12px 16px',
    background: '#fdf6e8',
    border: '1.5px solid rgba(44,31,14,0.12)',
    borderRadius: 10, outline: 'none',
    fontFamily: "'Syne', sans-serif",
    fontSize: 14, color: '#2c1f0e',
    boxSizing: 'border-box', transition: 'border-color 0.15s',
  };

  return (
    <div className="fs-page" style={{ paddingBottom: 80 }}>

      {/* Nav */}
      <nav className="fs-nav">
        <Link to="/founder-space/events" className="fs-nav-logo">
          <span className="fs-nav-dot" />Founder Space
        </Link>
        <Link to="/founder-space/events" style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#7a5c3a', textDecoration: 'none' }}>
          ← Back to events
        </Link>
      </nav>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#c4a882', marginBottom: 8 }}>
            Build Together
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 900, color: '#2c1f0e', margin: '0 0 8px', lineHeight: 1.1 }}>
            Start something.
          </h1>
          <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, color: '#b09878', fontStyle: 'italic', margin: 0 }}>
            Fill this in — under 90 seconds. Really.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* 1. Event type */}
          <div>
            <label style={LBL}>01 — What kind of event?</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {Object.entries(EVENT_TYPES).map(([key, cfg]) => {
                const selected = form.type === key;
                return (
                  <button
                    key={key}
                    onClick={() => set('type', key)}
                    style={{
                      background: selected ? '#2c1f0e' : '#fff',
                      border: `1.5px solid ${selected ? '#2c1f0e' : 'rgba(44,31,14,0.12)'}`,
                      borderRadius: 12, padding: '16px',
                      cursor: 'pointer', textAlign: 'left',
                      position: 'relative', transition: 'all 0.15s',
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: 10, right: 10,
                      width: 8, height: 8, borderRadius: '50%',
                      background: cfg.tack,
                    }} />
                    <div style={{ fontSize: 20, marginBottom: 6 }}>{cfg.icon}</div>
                    <div style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 11, fontWeight: 700,
                      color: selected ? '#f5c842' : '#2c1f0e',
                      marginBottom: 4,
                    }}>
                      {cfg.label}
                    </div>
                    <div style={{
                      fontFamily: "'Syne', sans-serif",
                      fontSize: 11, color: selected ? 'rgba(253,246,232,0.6)' : '#7a5c3a',
                      lineHeight: 1.4,
                    }}>
                      {TYPE_DESCRIPTIONS[key]}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Title */}
          <div>
            <label style={LBL}>02 — What's it called?</label>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder='e.g. "Zero to One reading group" or "Weekend fintech sprint"'
              maxLength={80}
              style={FIELD}
              onFocus={e => e.target.style.borderColor = '#c4963a'}
              onBlur={e => e.target.style.borderColor = 'rgba(44,31,14,0.12)'}
            />
            <div style={{ textAlign: 'right', fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#c4a882', marginTop: 4 }}>
              {form.title.length}/80
            </div>
          </div>

          {/* 3. Description */}
          <div>
            <label style={LBL}>03 — What will people do and get out of this?</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder='Be specific. "We read Ch. 1–3 and discuss distribution." beats "Let's talk startup stuff."'
              maxLength={200}
              rows={3}
              style={{ ...FIELD, resize: 'vertical' }}
              onFocus={e => e.target.style.borderColor = '#c4963a'}
              onBlur={e => e.target.style.borderColor = 'rgba(44,31,14,0.12)'}
            />
            <div style={{ textAlign: 'right', fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#c4a882', marginTop: 4 }}>
              {form.description.length}/200
            </div>
          </div>

          {/* 4. Format */}
          <div>
            <label style={LBL}>04 — Online or in-person?</label>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              {[['online', '💻 Online'], ['in_person', '📍 In-person']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => set('format', val)}
                  style={{
                    flex: 1, padding: '12px',
                    borderRadius: 10,
                    border: `1.5px solid ${form.format === val ? '#2c1f0e' : 'rgba(44,31,14,0.12)'}`,
                    background: form.format === val ? '#2c1f0e' : '#fff',
                    color: form.format === val ? '#f5c842' : '#7a5c3a',
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            {form.format === 'online' && (
              <input
                type="text"
                value={form.meetingLink}
                onChange={e => set('meetingLink', e.target.value)}
                placeholder='Zoom/Meet/Discord link (optional — add after creating)'
                style={FIELD}
                onFocus={e => e.target.style.borderColor = '#c4963a'}
                onBlur={e => e.target.style.borderColor = 'rgba(44,31,14,0.12)'}
              />
            )}
            {form.format === 'in_person' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                  type="text"
                  value={form.city}
                  onChange={e => set('city', e.target.value)}
                  placeholder='City *'
                  style={FIELD}
                  onFocus={e => e.target.style.borderColor = '#c4963a'}
                  onBlur={e => e.target.style.borderColor = 'rgba(44,31,14,0.12)'}
                />
                <input
                  type="text"
                  value={form.venue}
                  onChange={e => set('venue', e.target.value)}
                  placeholder='Venue (optional)'
                  style={FIELD}
                  onFocus={e => e.target.style.borderColor = '#c4963a'}
                  onBlur={e => e.target.style.borderColor = 'rgba(44,31,14,0.12)'}
                />
              </div>
            )}
          </div>

          {/* 5. Date & time */}
          <div>
            <label style={LBL}>05 — When?</label>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <input
                type="date"
                value={form.date}
                onChange={e => set('date', e.target.value)}
                style={{ ...FIELD, flex: 1 }}
                onFocus={e => e.target.style.borderColor = '#c4963a'}
                onBlur={e => e.target.style.borderColor = 'rgba(44,31,14,0.12)'}
              />
              <input
                type="time"
                value={form.time}
                onChange={e => set('time', e.target.value)}
                style={{ ...FIELD, flex: 1 }}
                onFocus={e => e.target.style.borderColor = '#c4963a'}
                onBlur={e => e.target.style.borderColor = 'rgba(44,31,14,0.12)'}
              />
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#c4a882' }}>
              All times in IST
            </div>
            {/* Recurring */}
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => set('isRecurring', !form.isRecurring)}
                style={{
                  width: 40, height: 22, borderRadius: 11,
                  background: form.isRecurring ? '#2c1f0e' : 'rgba(44,31,14,0.1)',
                  border: 'none', cursor: 'pointer', position: 'relative',
                  transition: 'background 0.2s', flexShrink: 0,
                }}
              >
                <div style={{
                  position: 'absolute', top: 3,
                  left: form.isRecurring ? 21 : 3,
                  width: 16, height: 16, borderRadius: '50%',
                  background: form.isRecurring ? '#f5c842' : '#fff',
                  transition: 'left 0.2s',
                }} />
              </button>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#7a5c3a' }}>
                Recurring event
              </div>
              {form.isRecurring && (
                <div style={{ display: 'flex', gap: 8 }}>
                  {['weekly', 'biweekly'].map(p => (
                    <button key={p} onClick={() => set('recurringPattern', p)} style={{
                      padding: '4px 12px', borderRadius: 20,
                      border: `1.5px solid ${form.recurringPattern === p ? '#2c1f0e' : 'rgba(44,31,14,0.15)'}`,
                      background: form.recurringPattern === p ? '#2c1f0e' : '#fff',
                      color: form.recurringPattern === p ? '#f5c842' : '#7a5c3a',
                      fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 600,
                      cursor: 'pointer', textTransform: 'capitalize',
                    }}>
                      {p === 'biweekly' ? 'Biweekly' : 'Weekly'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 6. Capacity */}
          <div>
            <label style={LBL}>06 — How many people?</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <button
                onClick={() => set('capacityOpen', !form.capacityOpen)}
                style={{
                  width: 40, height: 22, borderRadius: 11,
                  background: form.capacityOpen ? '#2c1f0e' : 'rgba(44,31,14,0.1)',
                  border: 'none', cursor: 'pointer', position: 'relative',
                  transition: 'background 0.2s', flexShrink: 0,
                }}
              >
                <div style={{
                  position: 'absolute', top: 3,
                  left: form.capacityOpen ? 21 : 3,
                  width: 16, height: 16, borderRadius: '50%',
                  background: form.capacityOpen ? '#f5c842' : '#fff',
                  transition: 'left 0.2s',
                }} />
              </button>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#7a5c3a' }}>
                {form.capacityOpen ? 'Open — anyone can join' : 'Capped'}
              </div>
            </div>
            {!form.capacityOpen && (
              <input
                type="number"
                value={form.capacity}
                onChange={e => set('capacity', Math.min(500, Math.max(2, Number(e.target.value))))}
                min={2} max={500}
                placeholder='Max attendees'
                style={{ ...FIELD, width: 160 }}
                onFocus={e => e.target.style.borderColor = '#c4963a'}
                onBlur={e => e.target.style.borderColor = 'rgba(44,31,14,0.12)'}
              />
            )}
          </div>

          {/* 7. Tags */}
          <div>
            <label style={LBL}>07 — Tags (up to 3)</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {TAGS.map(tag => {
                const selected = form.tags.includes(tag);
                return (
                  <button key={tag} onClick={() => toggleTag(tag)} style={{
                    padding: '7px 14px', borderRadius: 20,
                    border: `1.5px solid ${selected ? '#2c1f0e' : 'rgba(44,31,14,0.15)'}`,
                    background: selected ? '#2c1f0e' : '#fff',
                    color: selected ? '#f5c842' : '#7a5c3a',
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}>
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              width: '100%', padding: '16px',
              borderRadius: 12, border: 'none',
              background: submitting ? 'rgba(44,31,14,0.4)' : '#2c1f0e',
              color: '#f5c842',
              fontFamily: "'DM Mono', monospace",
              fontSize: 13, fontWeight: 700, letterSpacing: '0.08em',
              cursor: submitting ? 'wait' : 'pointer',
              marginTop: 8,
            }}
          >
            {submitting ? 'Pinning…' : 'Pin this event →'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default withAuth(CreateEvent);
