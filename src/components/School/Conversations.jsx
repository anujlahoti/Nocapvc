import { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, doc, updateDoc, or } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import './School.css';

function timeAgo(iso) {
  var diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

function ChatScreen(props) {
  var convo = props.convo;
  var profile = props.profile;
  var onBack = props.onBack;
  var user = auth.currentUser;
  var [messages, setMessages] = useState([]);
  var [text, setText] = useState('');
  var [sending, setSending] = useState(false);
  var bottomRef = useRef(null);

  var otherName = convo.signal_uid === user.uid
    ? convo.responder_name
    : convo.responder_name === user.displayName ? 'You' : convo.responder_name;

  var otherLabel = convo.signal_uid === user.uid
    ? (convo.responder_startup || convo.responder_name)
    : 'Signal owner';

  useEffect(function() {
    var q = query(
      collection(db, 'conversations', convo.id, 'messages'),
      orderBy('created_at', 'asc')
    );
    var unsub = onSnapshot(q, function(snap) {
      var msgs = snap.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); });
      if (msgs.length === 0 && convo.first_message) {
        setMessages([{
          id: 'first',
          text: convo.first_message,
          uid: convo.responder_uid,
          sender: convo.responder_name,
          created_at: convo.created_at,
        }]);
      } else {
        setMessages(msgs);
      }
    });
    return unsub;
  }, [convo]);

  useEffect(function() {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  var handleSend = async function() {
    if (!text.trim()) return;
    setSending(true);
    var msgText = text;
    setText('');
    try {
      await addDoc(collection(db, 'conversations', convo.id, 'messages'), {
        text: msgText,
        uid: user.uid,
        sender: user.displayName,
        created_at: new Date().toISOString(),
      });
      await updateDoc(doc(db, 'conversations', convo.id), {
        last_message: msgText,
        last_message_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error(err);
    }
    setSending(false);
  };

  var handleKey = function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-screen">
      <div className="chat-header">
        <button className="chat-back-btn" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="chat-header-info">
          <div className="chat-header-name">{convo.signal_uid === user.uid ? convo.responder_name : 'Signal owner'}</div>
          <div className="chat-header-sub">{convo.signal_uid === user.uid ? (convo.responder_startup || convo.responder_sector) : convo.responder_sector}</div>
        </div>
      </div>

      <div className="chat-context-bar">
        <span className="chat-context-label">Signal:</span>
        <span className="chat-context-text">{convo.signal_description}</span>
      </div>

      <div className="chat-messages">
        {messages.map(function(msg) {
          var isMe = msg.uid === user.uid;
          return (
            <div key={msg.id} className={isMe ? 'chat-msg chat-msg-me' : 'chat-msg chat-msg-them'}>
              <div className="chat-bubble">{msg.text}</div>
              <div className="chat-msg-time">{timeAgo(msg.created_at)}</div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-bar">
        <textarea
          className="chat-input"
          placeholder="Type a message..."
          value={text}
          onChange={function(e) { setText(e.target.value); }}
          onKeyDown={handleKey}
          rows={1}
        />
        <button
          className="chat-send-btn"
          onClick={handleSend}
          disabled={sending || !text.trim()}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function Conversations(props) {
  var profile = props.profile;
  var user = auth.currentUser;
  var [convos, setConvos] = useState([]);
  var [loading, setLoading] = useState(true);
  var [active, setActive] = useState(null);
  var [tab, setTab] = useState('helping');

  useEffect(function() {
    var q1 = query(collection(db, 'conversations'), where('responder_uid', '==', user.uid), orderBy('last_message_at', 'desc'));
    var q2 = query(collection(db, 'conversations'), where('signal_uid', '==', user.uid), orderBy('last_message_at', 'desc'));

    var all = {};

    var unsub1 = onSnapshot(q1, function(snap) {
      snap.docs.forEach(function(d) { all[d.id] = Object.assign({ id: d.id }, d.data()); });
      setConvos(Object.values(all));
      setLoading(false);
    });

    var unsub2 = onSnapshot(q2, function(snap) {
      snap.docs.forEach(function(d) { all[d.id] = Object.assign({ id: d.id }, d.data()); });
      setConvos(Object.values(all));
      setLoading(false);
    });

    return function() { unsub1(); unsub2(); };
  }, []);

  if (active) {
    return <ChatScreen convo={active} profile={profile} onBack={function() { setActive(null); }} />;
  }

  var helping = convos.filter(function(c) { return c.responder_uid === user.uid; });
  var mySignals = convos.filter(function(c) { return c.signal_uid === user.uid; });
  var shown = tab === 'helping' ? helping : mySignals;

  return (
    <div className="conversations">
      <div className="convos-hd">
        <h2 className="convos-title">Conversations</h2>
      </div>

      <div className="convos-tabs">
        <div
          className={tab === 'helping' ? 'convos-tab active' : 'convos-tab'}
          onClick={function() { setTab('helping'); }}
        >
          Helping others ({helping.length})
        </div>
        <div
          className={tab === 'mine' ? 'convos-tab active' : 'convos-tab'}
          onClick={function() { setTab('mine'); }}
        >
          My signals ({mySignals.length})
        </div>
      </div>

      {loading ? (
        <div className="feed-loading"><div className="school-spinner" /></div>
      ) : null}

      {!loading && shown.length === 0 ? (
        <div className="feed-empty">
          <div className="feed-empty-icon">💬</div>
          <p className="feed-empty-title">No conversations yet</p>
          <p className="feed-empty-sub">
            {tab === 'helping'
              ? 'Tap "I can help" on a signal to start a conversation.'
              : 'Post a signal to get responses from nearby founders.'}
          </p>
        </div>
      ) : null}

      <div className="convos-list">
        {shown.map(function(convo) {
          var isResponder = convo.responder_uid === user.uid;
          var otherName = isResponder ? 'Signal owner' : convo.responder_name;
          var otherSub = isResponder ? convo.responder_sector : (convo.responder_startup || convo.responder_sector);
          return (
            <div key={convo.id} className="convo-item" onClick={function() { setActive(convo); }}>
              <div className="convo-avatar">
                {otherName ? otherName[0].toUpperCase() : 'F'}
              </div>
              <div className="convo-info">
                <div className="convo-name">{otherName}</div>
                <div className="convo-sub">{otherSub}</div>
                <div className="convo-last">{convo.last_message}</div>
              </div>
              <div className="convo-meta">
                <div className="convo-time">{timeAgo(convo.last_message_at)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}