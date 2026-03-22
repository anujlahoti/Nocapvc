import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import SignalFeed from './SignalFeed';
import PostSignal from './PostSignal';
import './School.css';

export default function SchoolApp({ user, profile }) {
  var [tab, setTab] = useState('feed');

  function handlePosted() {
    setTab('feed');
  }

  return (
    <div className="school-app">
      <div className="school-topbar">
        <div className="school-topbar-left">
          <span className="school-tag">FOUNDER SCHOOL</span>
          <span className="school-topbar-name">{profile.startup_name}</span>
        </div>
        <button className="school-signout" onClick={function() { signOut(auth); }}>
          Sign out
        </button>
      </div>

      <div className="school-main">
        {tab === 'feed' && <SignalFeed profile={profile} />}
        {tab === 'post' && <PostSignal profile={profile} onPosted={handlePosted} />}
        {tab === 'chats' && (
          <div className="school-placeholder">
            <div className="school-placeholder-icon">💬</div>
            <div className="school-placeholder-title">Conversations — coming Sprint 3</div>
            <p className="school-placeholder-sub">
              Your private chats with founders and experts who responded to your signals.
            </p>
          </div>
        )}
      </div>

      <div className="school-bottom-nav">
        <button
          className={'school-nav-btn' + (tab === 'feed' ? ' active' : '')}
          onClick={function() { setTab('feed'); }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M6.3 6.3a8 8 0 000 11.4M17.7 6.3a8 8 0 010 11.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span>Signals</span>
        </button>
        <button
          className={'school-nav-btn post' + (tab === 'post' ? ' active' : '')}
          onClick={function() { setTab('post'); }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>Post</span>
        </button>
        <button
          className={'school-nav-btn' + (tab === 'chats' ? ' active' : '')}
          onClick={function() { setTab('chats'); }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Chats</span>
        </button>
      </div>
    </div>
  );
}