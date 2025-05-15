// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBF2kI0__GiotqhEtJqUuVK1umMTNjJhG8",
  authDomain: "gymtracker-a200f.firebaseapp.com",
  projectId: "gymtracker-a200f",
  storageBucket: "gymtracker-a200f.firebasestorage.app",
  messagingSenderId: "490929230003",
  appId: "1:490929230003:web:f7f9f658071a8d50be60c6",
  measurementId: "G-CB2JZT3MGJ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup, signOut };
