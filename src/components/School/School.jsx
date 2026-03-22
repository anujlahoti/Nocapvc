import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import SchoolLogin from './SchoolLogin';
import SchoolOnboard from './SchoolOnboard';
import SchoolApp from './SchoolApp';
import './School.css';

export default function School() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, 'users', u.uid));
        if (snap.exists()) setProfile(snap.data());
        else setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleOnboardComplete = async () => {
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (snap.exists()) setProfile(snap.data());
  };

  if (loading) {
    return (
      <div className="school-loading">
        <div className="school-spinner" />
      </div>
    );
  }

  if (!user) return <SchoolLogin />;
  if (!profile) return <SchoolOnboard onComplete={handleOnboardComplete} />;
  return <SchoolApp user={user} profile={profile} />;
}