import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBWEhJL1JL1z6gLcbXVr8q0ijosUgrJx6g",
  authDomain: "telegram-clone-4e27b.firebaseapp.com",
  projectId: "telegram-clone-4e27b",
  storageBucket: "telegram-clone-4e27b.appspot.com",
  messagingSenderId: "206490094007",
  appId: "1:206490094007:web:6f6bb62eeee296d43f0032",
  measurementId: "G-KQ9BX63BSZ"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);
