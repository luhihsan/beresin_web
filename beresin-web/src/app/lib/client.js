import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCppYxld9uCw2HTmVxEKFMCTakqT8pu6jc",
  authDomain: "beres-in-303b0.firebaseapp.com",
  projectId: "beres-in-303b0",
  storageBucket: "beres-in-303b0.firebasestorage.app",
  messagingSenderId: "499766438094",
  appId: "1:499766438094:web:8802a2e2f80e05489d889f",
  measurementId: "G-0W87SKMDLF"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);