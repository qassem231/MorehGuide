import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyANtTxYCGRT4Tm0eFnVUM9Amt1yHx4PHAE",
  authDomain: "morehguide.firebaseapp.com",
  projectId: "morehguide",
  storageBucket: "morehguide.firebasestorage.app",
  messagingSenderId: "62190544314",
  appId: "1:62190544314:web:df73207a604aec5b2a6983",
  measurementId: "G-MR5M3N8YC0"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Storage and get a reference to the service
export const storage = getStorage(app);