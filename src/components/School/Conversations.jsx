import { useState, useEffect, useRef } from 'react';
import { db, auth } from '../../firebase';
import {
  collection, addDoc, query, where, orderBy,
  onSnapshot, serverTimestamp, doc, updateDoc, getDoc
} from 'firebase/firestore';

export default function Conversations({ signalId, signalUid, onBack }) {
  const user = auth.currentUser;
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [convId, setConvId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [convList, setConvList] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const bottomRef = useRef(null);

  // If opened from a signal, find or create the conversation
  useEffect(() => {
    if (!signalId || !user) return;

    const q = query(
      collection(db, 'conversations'),
      where('signal_id', '==', signalId),
      where('responder_uid', '==', user.uid)
    );

    const unsub = onSnapshot(q, async (snap) => {
      if (!snap.empty) {
        setConvId(snap.docs[0].id);
        setActiveConv({ id: snap.docs[0].id, ...snap.docs[0].data() });
      } else {
        // Create new conversation
        const signalDoc = await getDoc(doc(db, 'signals', signalId));
        const signalData = signalDoc.exists() ? signalDoc.data() : {};

        const newConv = await addDoc(collection(db, 'conversations'), {
          signal_id: signalId,
          signal_uid: signalUid,
          signal_text: signalData.problem || '',
          responder_uid: user.uid,
          responder_name: user.displayName || 'Founder',
          last_message: '',
          last_message_at: serverTimestamp(),
          created_at: serverTimestamp()
        });
        setConvId(newConv.id);
        setActiveConv({ id: newConv.id, signal_uid: signalUid });
      }
      setLoading(false);
    });

    return () => unsub();
  }, [signalId, signalUid, user]);

  // Load all conversations for this user (when no signalId)
  useEffect(() => {
    if (signalId || !user) return;

    const q1 = query(
      collection(db, 'conversations'),
      where('responder_uid', '==', user.uid),
      orderBy('last_message_at', 'desc')
    );

    const unsub1 = onSnapshot(q1, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setConvList(prev => {
        const ids = new Set(list.map(c => c.id));
        const filtered = prev.filter(c => !ids.has(c.id));
        return [...list, ...filtered].sort((a, b) => {
          const at = a.last_message_at?.toMillis?.() || 0;
          const bt = b.last_message_at?.toMillis?.() || 0;
          return bt - at;
        });
      });
      setLoading(false);
    });

    const q2 = query(
      collection(db, 'conversations'),
      where('signal_uid', '==', user.uid),
      orderBy('last_message_at', 'desc')
    );

    const unsub2 = onSnapshot(q2, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setConvList(prev => {
        const ids = new Set(list.map(c => c.id));
        const filtered = prev.filter(c => !ids.has(c.id));
        return [...list, ...filtered].sort((a, b) => {
          const at = a.last_message_at?.toMillis?.() || 0;
          const bt = b.last_message_at?.toMillis?.() || 0;
          return bt - at;
        });
      });
      setLoading(false);
    });

    return () => { unsub1(); unsub2(); };
  }, [signalId, user]);

  // Load messages for active conversation
  useEffect(() => {
    const cId = convId || activeConv?.id;
    if (!cId) return;

    const q = query(
      collection(db, 'conversations', cId, 'messages'),
      orderBy('created_at', 'asc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => unsub();
  }, [convId, activeConv]);

  const sendMessage = async () => {
    const cId = convId || activeConv?.id;
    if (!newMsg.trim() || !cId || !user) return;

    const text = newMsg.trim();
    setNewMsg('');

    await addDoc(collection(db, 'conversations', cId, 'messages'), {
      text,
      sender_uid: user.uid,
      sender_name: user.displayName || 'Founder',
      created_at: serverTimestamp()
    });

    await updateDoc(doc(db, 'conversations', cId), {
      last_message: text,
      last_message_at: serverTimestamp()
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Show conversation list if no active conversation and not from signal
  if (!signalId && !activeConv) {
    return (
      <div className="conv-list">
        <div className="school-header">
          <h2>Chats</h2>
        </div>

        {loading && <div className="school-loading">Loading conversations...</div>}

        {!loading && convList.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <p>No conversations yet</p>
            <span>When you respond to a signal or someone responds to yours, chats appear here.</span>
          </div>
        )}

        {convList.map(conv => (
          <div
            key={conv.id}
            className="conv-item"
            onClick={() => setActiveConv(conv)}
          >
            <div className="conv-avatar">
              {(conv.responder_uid === user?.uid ? conv.signal_uid : conv.responder_name || '?')[0]?.toUpperCase()}
            </div>
            <div className="conv-info">
              <div className="conv-name">
                {conv.responder_uid === user?.uid ? 'Signal owner' : conv.responder_name || 'Founder'}
              </div>
              <div className="conv-signal">{conv.signal_text?.slice(0, 60)}...</div>
              <div className="conv-last">{conv.last_message?.slice(0, 50) || 'No messages yet'}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Show chat view
  return (
    <div className="chat-view">
      <div className="chat-header">
        <button
          className="back-btn"
          onClick={() => {
            if (onBack) onBack();
            else setActiveConv(null);
          }}
        >
          ← Back
        </button>
        <div className="chat-title">
          {activeConv?.signal_text?.slice(0, 40) || 'Conversation'}
        </div>
      </div>

      <div className="chat-messages">
        {loading && <div className="school-loading">Loading...</div>}

        {messages.map(msg => (
          <div
            key={msg.id}
            className={`msg-bubble ${msg.sender_uid === user?.uid ? 'msg-mine' : 'msg-theirs'}`}
          >
            <div className="msg-text">{msg.text}</div>
            <div className="msg-meta">
              {msg.sender_name} · {msg.created_at?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'just now'}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-row">
        <textarea
          className="chat-input"
          placeholder="Type a message..."
          value={newMsg}
          onChange={e => setNewMsg(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button className="send-btn" onClick={sendMessage} disabled={!newMsg.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}