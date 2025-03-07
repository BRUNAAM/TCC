import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDvMMiGK-2uh96pBfLcWj92QvKB-LOcyQA",
    authDomain: "tcc-68536.firebaseapp.com",
    projectId: "tcc-68536",
    storageBucket: "tcc-68536.firebasestorage.app",
    messagingSenderId: "444429744740",
    appId: "1:444429744740:web:78783ef2398b70283f3d71"
  };

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };


