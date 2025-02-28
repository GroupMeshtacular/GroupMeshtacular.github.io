// firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
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
    const db = getFirestore(app);
    
    // Make services available globally
    window.firebaseAuth = auth;
    window.firebaseDb = db;
    
    // Signal that Firebase is ready
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
initializeFirebase().then(services => {
  app = services.app;
  auth = services.auth;
  db = services.db;
});

// Export Firebase services
export { app, auth, db };

// Export getFirebase function
export function getFirebase() {
  if (!app) {
    console.warn("Firebase not initialized yet, services may be undefined");
  }
  return { app, auth, db };
}