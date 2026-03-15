// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA82-it9-dEp3zs5s-ZA1f6UBT0Xs_1mOQ",
  authDomain: "friendconnect-chat-app.firebaseapp.com",
  projectId: "friendconnect-chat-app",
  storageBucket: "friendconnect-chat-app.firebasestorage.app",
  messagingSenderId: "823021667360",
  appId: "1:823021667360:web:d11050d0d89e1cd202a845",
  measurementId: "G-RJGS2L5TKY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);