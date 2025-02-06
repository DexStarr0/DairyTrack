import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // If using Firestore
import { getDatabase } from "firebase/database"; // If using Realtime Database

const firebaseConfig = {
  apiKey: "AIzaSyDLHvVkA_wQVeRAdX11vpexkY-7P_uEk7c",
  authDomain: "dairy-289e6.firebaseapp.com",
  projectId: "dairy-289e6",
  storageBucket: "dairy-289e6.firebasestorage.app",
  messagingSenderId: "517801463999",
  appId: "1:517801463999:web:cd4a74e639b5666d01760a",
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore or Realtime Database as needed
const firestore = getFirestore(app);
const database = getDatabase(app);

export { firestore, database };
