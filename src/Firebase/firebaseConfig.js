import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; 
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA1scW1QALdGdT5CiejTWQ6VafygbSJjsQ",
  authDomain: "finalproject359-35317.firebaseapp.com",
  projectId: "finalproject359-35317",
  storageBucket: "finalproject359-35317.firebasestorage.app",
  messagingSenderId: "186973510671",
  appId: "1:186973510671:web:786c41e385f0ac3e4dd77a",
  measurementId: "G-8TK371XZS6"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app); 
