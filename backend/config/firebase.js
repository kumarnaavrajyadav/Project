const admin = require('firebase-admin');

// Ensure you set the FIREBASE_SERVICE_ACCOUNT_KEY env var with stringified JSON or path to JSON
if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin initialized');
  } catch (error) {
    console.error('Failed to parse Firebase Service Account JSON:', error);
  }
} else {
  console.warn('Firebase Admin not initialized: Missing FIREBASE_SERVICE_ACCOUNT_KEY');
}

module.exports = admin;
