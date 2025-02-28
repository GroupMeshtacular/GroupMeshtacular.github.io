// UPDATED firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

console.log("Initializing Firebase");

// Initialize Firebase with auto-configuration from Firebase Hosting
async function initializeFirebase() {
  try {
    // For Firebase Hosting deployment - automatically provides your project config
    const response = await fetch('/__/firebase/init.json');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Firebase config: ${response.status}`);
    }
    
    const config = await response.json();
    console.log("Firebase config loaded from Hosting");
    
    const app = initializeApp(config);
    const auth = getAuth(app);
    
    // Set persistence to LOCAL - this will maintain the session
    try {
      await setPersistence(auth, browserLocalPersistence);
      console.log("✅ Firebase auth persistence set to LOCAL");
    } catch (persistenceError) {
      console.error("❌ Error setting auth persistence:", persistenceError);
    }
    
    const db = getFirestore(app);
    
    // Make services available globally
    window.firebaseAuth = auth;
    window.firebaseDb = db;
    
    // Signal that Firebase is ready
    console.log("Firing firebaseInitialized event");
    document.dispatchEvent(new CustomEvent('firebaseInitialized'));
    
    return { app, auth, db };
  } catch (error) {
    console.error("Could not load Firebase config from Hosting:", error);
    
    // Don't include fallback config here - this makes it safe for GitHub
    alert("Firebase configuration could not be loaded. Please run this app using Firebase Hosting.");
    
    // Return null services - the app will show appropriate error messages
    return { app: null, auth: null, db: null };
  }
}

// We'll initialize Firebase and then export the services
let app, auth, db;

// Immediately execute the initialization
const firebasePromise = initializeFirebase().then(services => {
  app = services.app;
  auth = services.auth;
  db = services.db;
  
  // Set up auth state listener here directly to ensure it's attached early
  if (auth) {
    const { onAuthStateChanged } = firebase.auth;
    
    onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed (from init):", user ? "User logged in" : "User logged out");
      
      // Dispatch custom event to notify other parts of the application
      document.dispatchEvent(new CustomEvent('authStateChanged', { 
        detail: { user } 
      }));
    });
  }
});

// Export Firebase services
export { app, auth, db, firebasePromise };

// Export getFirebase function
export function getFirebase() {
  if (!app) {
    console.warn("Firebase not initialized yet, services may be undefined");
  }
  return { app, auth, db };
}