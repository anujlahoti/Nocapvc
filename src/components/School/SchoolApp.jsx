import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import SignalFeed from './SignalFeed';
import PostSignal from './PostSignal';
import Conversations from './Conversations';
import './School.css';

export default function SchoolApp(props) {
  var profile = props.profile;
  var [tab, setTab] = useState('feed');

  function handlePosted() {
    setTab('feed');
  }

  return (
    <div className="school-root">
      <div className="school-topnav">
        <div className="school-topnav-logo">
          FOUNDER SCHOOL
        </div>
        <div className="school-topnav-badge">
          {profile.startup_name || 'NoCap VC'}
        </div>
        <button className="school-signout" onClick={function() { signOut(auth); }}>
          Sign out
        </button>
      </div>

      <div className="school-content">
        {tab === 'feed' ? <SignalFeed profile={profile} /> : null}
        {tab === 'post' ? <PostSignal profile={profile} onPosted={handlePosted} /> : null}
        {tab === 'chats' ? <Conversations profile={profile} /> : null}
      </div>

      <div className="school-bottom-nav">
        <button
          className={tab === 'feed' ? 'school-nav-btn active' : 'school-nav-btn'}
          onClick={function() { setTab('feed'); }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M6.3 6.3a8 8 0 000 11.4M17.7 6.3a8 8 0 010 11.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span className="school-nav-label">Signals</span>
        </button>

        <button
          className="school-nav-post"
          onClick={function() { setTab('post'); }}
        >
          +
        </button>

        <button
          className={tab === 'chats' ? 'school-nav-btn active' : 'school-nav-btn'}
          onClick={function() { setTab('chats'); }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="school-nav-label">Chats</span>
        </button>
      </div>
    </div>
  );
}