import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA82-it9-dEp3zs5s-ZA1f6UBT0Xs_1mOQ",
  authDomain: "friendconnect-chat-app.firebaseapp.com",
  projectId: "friendconnect-chat-app",
  storageBucket: "friendconnect-chat-app.firebasestorage.app",
  messagingSenderId: "823021667360",
  appId: "1:823021667360:web:d11050d0d89e1cd202a845",
  measurementId: "G-RJGS2L5TKY",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export { signInWithPopup };
export default app;
