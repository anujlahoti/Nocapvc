import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import './School.css';

function timeAgo(iso) {
  var diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

function SignalCard(props) {
  var signal = props.signal;
  var onRespond = props.onRespond;
  var isOwn = signal.uid === auth.currentUser.uid;

  return (
    <div className="signal-card">
      <div className="signal-card-top">
        <span className="signal-category-tag">{signal.category}</span>
        <span className="signal-time">{timeAgo(signal.created_at)}</span>
      </div>
      <p className="signal-description">{signal.description}</p>
      <div className="signal-card-bottom">
        <div className="signal-meta">
          <span className="signal-author">{signal.anonymous ? 'Anonymous founder' : signal.name}</span>
          <span className="signal-dot">.</span>
          <span className="signal-sector">{signal.sector}</span>
          {signal.city ? <span className="signal-dot">.</span> : null}
          {signal.city ? <span className="signal-city">{signal.city}</span> : null}
        </div>
        {isOwn ? (
          <span className="signal-own-tag">Your signal</span>
        ) : (
          <button className="signal-respond-btn" onClick={function() { onRespond(signal); }}>
            I can help
          </button>
        )}
      </div>
    </div>
  );
}

export default function SignalFeed(props) {
  var profile = props.profile;
  var [signals, setSignals] = useState([]);
  var [filter, setFilter] = useState('all');
  var [loading, setLoading] = useState(true);
  var [responding, setResponding] = useState(null);
  var [message, setMessage] = useState('');
  var [sending, setSending] = useState(false);
  var [success, setSuccess] = useState('');

  var CATEGORIES = ['All', 'Fundraising', 'Product / Tech', 'Distribution / Sales', 'Marketing', 'Hiring', 'Legal / Finance', 'Mental Health', 'Other'];

  useEffect(function() {
    var q = query(
      collection(db, 'signals'),
      where('status', '==', 'active'),
      orderBy('created_at', 'desc')
    );
    var unsub = onSnapshot(q, function(snap) {
      var data = snap.docs.map(function(d) {
        return Object.assign({ id: d.id }, d.data());
      });
      setSignals(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  var filtered = filter === 'all'
    ? signals
    : signals.filter(function(s) { return s.category === filter; });

  var handleRespond = async function(signal) {
    if (!message.trim()) return;
    setSending(true);
    try {
      var user = auth.currentUser;
      await addDoc(collection(db, 'conversations'), {
        signal_id: signal.id,
        signal_uid: signal.uid,
        responder_uid: user.uid,
        responder_name: user.displayName,
        responder_startup: profile.startup_name,
        responder_sector: profile.sector,
        signal_description: signal.description,
        first_message: message,
        created_at: new Date().toISOString(),
        last_message: message,
        last_message_at: new Date().toISOString(),
        unread_signal_owner: 1,
        unread_responder: 0,
      });
      await updateDoc(doc(db, 'signals', signal.id), {
        response_count: increment(1)
      });
      setResponding(null);
      setMessage('');
      setSuccess('Response sent! Check your conversations.');
      setTimeout(function() { setSuccess(''); }, 3000);
    } catch (err) {
      console.error(err);
    }
    setSending(false);
  };

  return (
    <div className="signal-feed">
      <div className="feed-hd">
        <h2 className="feed-title">Signals near you</h2>
        <p className="feed-sub">Founders nearby who need help right now.</p>
      </div>

      <div className="feed-filter-scroll">
        {CATEGORIES.map(function(cat) {
          var val = cat === 'All' ? 'all' : cat;
          return (
            <div
              key={cat}
              className={filter === val ? 'feed-filter-pill active' : 'feed-filter-pill'}
              onClick={function() { setFilter(val); }}
            >
              {cat}
            </div>
          );
        })}
      </div>

      {success ? <div className="school-success">{success}</div> : null}

      {loading ? (
        <div className="feed-loading">
          <div className="school-spinner" />
        </div>
      ) : null}

      {!loading && filtered.length === 0 ? (
        <div className="feed-empty">
          <div className="feed-empty-icon">📡</div>
          <p className="feed-empty-title">No signals yet</p>
          <p className="feed-empty-sub">Be the first to post a signal. Tap Post below.</p>
        </div>
      ) : null}

      <div className="signal-list">
        {filtered.map(function(signal) {
          return (
            <SignalCard
              key={signal.id}
              signal={signal}
              onRespond={function(s) { setResponding(s); setMessage(''); }}
            />
          );
        })}
      </div>

      {responding ? (
        <div className="respond-overlay" onClick={function(e) { if (e.target === e.currentTarget) setResponding(null); }}>
          <div className="respond-box">
            <div className="respond-hd">
              <span className="school-tag">RESPONDING TO</span>
              <button className="respond-close" onClick={function() { setResponding(null); }}>x</button>
            </div>
            <p className="respond-signal-desc">{responding.description}</p>
            <textarea
              className="signal-textarea"
              placeholder="How can you help? Share your experience or suggest a quick call..."
              value={message}
              onChange={function(e) { setMessage(e.target.value); }}
              maxLength={300}
            />
            <button
              className="school-submit-btn"
              onClick={function() { handleRespond(responding); }}
              disabled={sending || !message.trim()}
            >
              {sending ? 'Sending...' : 'Send response'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}