import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBwd1pueh1UZsnZ9-21RS_4SLat0-8jFAU",
  authDomain: "nocapvc-school.firebaseapp.com",
  projectId: "nocapvc-school",
  storageBucket: "nocapvc-school.firebasestorage.app",
  messagingSenderId: "304765010232",
  appId: "1:304765010232:web:fb100bc34f285920a201cd"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);