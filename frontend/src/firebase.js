import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
} from "firebase/auth";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// ── MUST be set BEFORE initializeApp ──────────────────────────────────
// Generates a debug token, logs it to browser console.
// Register that token in: Firebase Console → App Check → Web App → Debug tokens
if (typeof self !== "undefined") {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

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

// Initialize App Check (uses debug token on localhost automatically)
try {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider("6LcJKhQqAAAAAPVmGp_OcTiRQdEN_hfvFa0l2y0F"),
    isTokenAutoRefreshEnabled: true,
  });
} catch (_) {}

export const auth = getAuth(app);

// Disable real reCAPTCHA for phone auth - ONLY works with test phone numbers
// added in Firebase Console → Authentication → Phone → Test phone numbers
auth.settings.appVerificationDisabledForTesting = true;

export const provider = new GoogleAuthProvider();
export { RecaptchaVerifier, signInWithPhoneNumber, signInWithPopup };
export default app;
