import { getApps, initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  type Auth,
} from 'firebase/auth';

function getFirebaseConfig() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  };

  const missingKeys = Object.entries(config)
    .filter(([key, value]) => key !== 'storageBucket' && key !== 'messagingSenderId' && !value)
    .map(([key]) => key);

  if (missingKeys.length) {
    throw new Error(`Missing Firebase web config: ${missingKeys.join(', ')}`);
  }

  return config;
}

export function getFirebaseAuth(): Auth {
  const app = getApps()[0] ?? initializeApp(getFirebaseConfig());
  const auth = getAuth(app);
  void setPersistence(auth, browserLocalPersistence);
  return auth;
}

export async function signInWithGoogleProvider(): Promise<string> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(getFirebaseAuth(), provider);
  return result.user.getIdToken();
}

export async function signInWithEmailPassword(email: string, password: string): Promise<string> {
  const result = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  return result.user.getIdToken();
}
