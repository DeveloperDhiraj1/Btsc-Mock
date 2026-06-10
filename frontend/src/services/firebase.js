import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const cleanEnvValue = (value) => (
  typeof value === 'string'
    ? value.trim().replace(/^["']|["'],?$|,$/g, '')
    : value
);

const firebaseConfig = {
  apiKey: cleanEnvValue(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: cleanEnvValue(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: cleanEnvValue(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: cleanEnvValue(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: cleanEnvValue(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: cleanEnvValue(import.meta.env.VITE_FIREBASE_APP_ID),
  measurementId: cleanEnvValue(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID)
};

export const firebaseMissingConfig = Object.entries(firebaseConfig)
  .filter(([key, value]) => key !== 'measurementId' && !value)
  .map(([key]) => key);

export const isFirebaseConfigured = firebaseMissingConfig.length === 0;

export const firebaseApp = isFirebaseConfigured
  ? getApps()[0] || initializeApp(firebaseConfig)
  : null;

export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;
export const firebaseDb = firebaseApp ? getFirestore(firebaseApp) : null;
export const firebaseStorage = firebaseApp ? getStorage(firebaseApp) : null;

export const signInWithGooglePopup = async () => {
  if (!firebaseAuth) {
    throw new Error('Firebase is not configured. Add your Firebase values in frontend/.env first.');
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  let result;

  try {
    result = await signInWithPopup(firebaseAuth, provider);
  } catch (error) {
    if (error.code === 'auth/configuration-not-found') {
      throw new Error('Firebase Authentication is not enabled for this project. Enable Google provider in Firebase Console, then restart the dev server.');
    }
    throw error;
  }

  return {
    idToken: await result.user.getIdToken(),
    user: result.user
  };
};

export const getFirebaseAnalytics = async () => {
  if (!firebaseApp || typeof window === 'undefined' || !firebaseConfig.measurementId) {
    return null;
  }

  const { getAnalytics, isSupported } = await import('firebase/analytics');
  return (await isSupported()) ? getAnalytics(firebaseApp) : null;
};
