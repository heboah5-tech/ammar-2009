
import { initializeApp, getApps } from "firebase/app"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
    apiKey: "AIzaSyAlTDyrStDLFU-4gOisNqI3k5DQe5SVJVE",
    authDomain: "mnmyf-e2a1f.firebaseapp.com",
    databaseURL: "https://mnmyf-e2a1f-default-rtdb.firebaseio.com",
    projectId: "mnmyf-e2a1f",
    storageBucket: "mnmyf-e2a1f.firebasestorage.app",
    messagingSenderId: "423118881361",
    appId: "1:423118881361:web:03e76378f19dc9e7f9ae70",
    measurementId: "G-B1CQC966C2"
}

// Initialize Firebase (only once)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const db = getFirestore(app)

export { db }
