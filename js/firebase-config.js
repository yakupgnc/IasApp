// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAHO8CF9hMZOBEyFOrcjTjsqQkel9EJafo",
    authDomain: "iasapp-d67f1.firebaseapp.com",
    projectId: "iasapp-d67f1",
    storageBucket: "iasapp-d67f1.firebasestorage.app",
    messagingSenderId: "960532063320",
    appId: "1:960532063320:web:b85aff9810eb2f95a0962d"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Set language to Turkish
auth.languageCode = 'tr';
