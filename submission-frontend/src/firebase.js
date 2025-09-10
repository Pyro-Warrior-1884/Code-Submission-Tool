import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBOdS5onemFUTg8x4VBrVQSAjYuGNKOIc4",
    authDomain: "water-depth.firebaseapp.com",
    databaseURL: "https://water-depth-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "water-depth",
    storageBucket: "water-depth.firebasestorage.app",
    messagingSenderId: "567497131253",
    appId: "1:567497131253:web:a0479941d5fbc75778b1bc",
    measurementId: "G-Y84VZBJ168"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default db;
