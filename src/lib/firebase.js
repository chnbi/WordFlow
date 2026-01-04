// Firebase Configuration
import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
    apiKey: "AIzaSyCLNc1wtL9V8ni66AbzfA3mOQlv6Eytvo8",
    authDomain: "translation-wrapper.firebaseapp.com",
    projectId: "translation-wrapper",
    storageBucket: "translation-wrapper.firebasestorage.app",
    messagingSenderId: "897341964854",
    appId: "1:897341964854:web:759c3b467d3c767a760e97",
    measurementId: "G-7EXPJZEKTQ"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize services
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)

export default app
