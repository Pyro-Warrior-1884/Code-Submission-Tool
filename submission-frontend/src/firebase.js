import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

//Note: Get the firebase secret and import here
const firebaseConfig = {};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default db;
