/**
 * Founder Space — Auth context, hooks, and helpers
 *
 * Usage:
 *   Wrap your app with <AuthProvider>
 *   Call useAuth() in any component to get { user, userProfile, loading, signIn, signOut }
 *
 *   const { signIn } = useAuth();
 *   const result = await signIn();         // returns { user, hasProfile } or null
 *   if (result?.hasProfile) navigate('/founder-space/feed');
 *   else navigate('/founder-space/onboarding');
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, provider, db } from '../firebase';

// ──────────────────────────────────────────────
//  Context
// ──────────────────────────────────────────────

const AuthContext = createContext(null);

// ──────────────────────────────────────────────
//  AuthProvider — wrap App with this
// ──────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading]         = useState(true);

  /** Fetch a user profile document from Firestore. Returns null if not found. */
  const fetchProfile = useCallback(async (uid) => {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      return snap.exists() ? snap.data() : null;
    } catch {
      return null;
    }
  }, []);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const profile = await fetchProfile(firebaseUser.uid);
        setUserProfile(profile);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [fetchProfile]);

  /**
   * signIn — opens Google popup, checks Firestore for existing profile.
   * @returns {{ user: FirebaseUser, hasProfile: boolean } | null}
   *   Returns null if the user closed the popup without signing in.
   */
  const signIn = useCallback(async () => {
    try {
      const result  = await signInWithPopup(auth, provider);
      const profile = await fetchProfile(result.user.uid);
      setUser(result.user);
      setUserProfile(profile);
      return { user: result.user, hasProfile: !!profile };
    } catch (error) {
      // User closed the popup — not a real error
      if (error.code === 'auth/popup-closed-by-user' ||
          error.code === 'auth/cancelled-popup-request') {
        return null;
      }
      throw error;
    }
  }, [fetchProfile]);

  /**
   * signOut — signs out from Firebase and clears local state.
   */
  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setUserProfile(null);
  }, []);

  /**
   * refreshProfile — re-fetch profile from Firestore (call after onboarding saves).
   */
  const refreshProfile = useCallback(async () => {
    if (!user) return null;
    const profile = await fetchProfile(user.uid);
    setUserProfile(profile);
    return profile;
  }, [user, fetchProfile]);

  return (
    <AuthContext.Provider
      value={{ user, userProfile, loading, signIn, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ──────────────────────────────────────────────
//  useAuth hook
// ──────────────────────────────────────────────

/**
 * useAuth — access auth state in any component inside AuthProvider.
 * @returns {{ user, userProfile, loading, signIn, signOut, refreshProfile }}
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>.');
  return ctx;
}
