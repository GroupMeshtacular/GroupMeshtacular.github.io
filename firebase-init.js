// firebase-init.js - This file will be committed to GitHub
// No sensitive information should be included here

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Load Firebase configuration from environment-specific location
// Note: This function will pull configuration from environment variables at build time
async function loadFirebaseConfig() {
  // For local development, you might have a local file that's git-ignored
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    try {
      // You would have this file locally but not in git
      const response = await fetch('/firebase-config-local.json');
      return await response.json();
    } catch (e) {
      console.error("Could not load local config, using environment variables");
    }
  }
  
  // In production, use Firebase hosting environment variables
  // These are set in the Firebase console and injected at build time
  return {
    apiKey: "__FIREBASE_API_KEY__",          // These placeholders will be replaced
    authDomain: "__FIREBASE_AUTH_DOMAIN__",  // during the build process by 
    projectId: "__FIREBASE_PROJECT_ID__",    // Firebase hosting
    storageBucket: "__FIREBASE_STORAGE_BUCKET__",
    messagingSenderId: "__FIREBASE_MESSAGING_SENDER_ID__",
    appId: "__FIREBASE_APP_ID__"
  };
}

// Initialize Firebase (without exposing config)
let app, auth, db;

async function initializeFirebase() {
  try {
    const firebaseConfig = await loadFirebaseConfig();
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("Firebase initialized successfully");
    
    // Trigger a custom event that other scripts can listen for
    document.dispatchEvent(new CustomEvent('firebaseInitialized'));
  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }
}

// Start initialization
initializeFirebase();

// Export a function to get the Firebase modules when they're ready
export function getFirebase() {
  return { app, auth, db };
}