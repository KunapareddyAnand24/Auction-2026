import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// Configured with user's project keys
const firebaseConfig = {
  apiKey: "AIzaSyD_HgWQilUyiuEpkabOucQB8o1vBtrU3Gw",
  authDomain: "auction-game-43de1.firebaseapp.com",
  databaseURL: "https://auction-game-43de1-default-rtdb.firebaseio.com",
  projectId: "auction-game-43de1",
  storageBucket: "auction-game-43de1.firebasestorage.app",
  messagingSenderId: "440355558828",
  appId: "1:440355558828:web:92c48837fabc9b1b7a5609",
  measurementId: "G-KK5FHK2QQY"
};

let auth = null;
let db = null;
let analytics = null;
let firestore = null;

try {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  
  // Enforce local persistence
  setPersistence(auth, browserLocalPersistence)
    .then(() => console.log("Persistence set to local"))
    .catch((err) => console.error("Persistence error:", err));

  db = getDatabase(app);
  analytics = getAnalytics(app);
  firestore = getFirestore(app);
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

export { auth, db, analytics, firestore };
