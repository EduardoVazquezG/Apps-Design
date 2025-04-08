import Constants from "expo-constants"
import { getAnalytics } from "firebase/analytics"
import { initializeApp } from "firebase/app"
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth"
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    orderBy,
    query,
    setDoc,
    updateDoc,
    where,
} from "firebase/firestore"

const firebaseConfig = {
    apiKey: Constants.expoConfig.extra.apiKey,
    authDomain: Constants.expoConfig.extra.authDomain,
    projectId: Constants.expoConfig.extra.projectId,
    storageBucket: Constants.expoConfig.extra.storageBucket,
    messagingSenderId: Constants.expoConfig.extra.messagingSenderId,
    appId: Constants.expoConfig.extra.appId,
    databaseURL: Constants.expoConfig.extra.databaseURL,
}

const app = initializeApp(firebaseConfig)
const analytics = getAnalytics(app)
const auth = getAuth(app)
const db = getFirestore(app)

export {
    addDoc,
    analytics,
    auth,
    collection,
    db,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    onAuthStateChanged,
    orderBy,
    query,
    setDoc,
    signInWithEmailAndPassword,
    signOut,
    updateDoc,
    where
}

