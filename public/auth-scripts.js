// auth-scripts.js
import { getFirebase } from './firebase-init.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, addDoc, query, orderBy, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

console.log("Auth scripts loading...");

// Flag to track Firebase initialization status
let firebaseInitialized = false;

// Create error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
});

// Setup debug logging for form submissions
const debugEvent = (name) => {
    return (...args) => {
        console.log(`Event '${name}' triggered with:`, args);
    };
};

// Monitor for clicks
document.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        console.log("Button clicked:", e.target.textContent, e.target);
    }
});

// Clean up URL if it contains the _csrf parameter
if (window.location.search.includes('_csrf=')) {
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
    console.log("URL cleaned from CSRF parameter");
}

// DOM Elements
let authSection, dashboard, userEmailSpan, signupForm, loginForm, feedbackForm, feedbackMessages, logoutButton;

// Global variables for Firebase services
let globalAuth, globalDb;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded, initializing elements");
    
    // Initialize DOM elements
    authSection = document.getElementById("auth-section");
    dashboard = document.getElementById("dashboard");
    userEmailSpan = document.getElementById("user-email");
    signupForm = document.getElementById("signup-form");
    loginForm = document.getElementById("login-form");
    feedbackForm = document.getElementById("feedback-form");
    feedbackMessages = document.getElementById("feedback-messages");
    logoutButton = document.getElementById("logout");

    // Add event listeners to forms
    if (signupForm) {
        signupForm.addEventListener("submit", (e) => {
            e.preventDefault();
            handleSignup();
        });
    } else {
        console.warn("Signup form element not found");
    }

    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            handleLogin();
        });
    } else {
        console.warn("Login form element not found");
    }

    if (feedbackForm) {
        feedbackForm.addEventListener("submit", (e) => {
            e.preventDefault();
            handleFeedbackSubmit();
        });
    }

    // Expose handlers to global scope for onclick attributes
    window.handleSignup = handleSignup;
    window.handleLogin = handleLogin;
    window.handleFeedbackSubmit = handleFeedbackSubmit;
    
    // Try to initialize Firebase if it's already available
    tryInitializeFirebase();
});

// Try to get Firebase services directly
function tryInitializeFirebase() {
    try {
        const { auth, db } = getFirebase();
        if (auth && db) {
            globalAuth = auth;
            globalDb = db;
            console.log("Firebase services accessed directly:", !!globalAuth, !!globalDb);
            
            // If we have both services, setup immediately
            if (globalAuth && globalDb) {
                console.log("Firebase services available, setting up immediately");
                firebaseInitialized = true;
                setupAuthHandlers();
            }
        } else {
            console.log("Firebase services not available yet, waiting for initialization event");
        }
    } catch (error) {
        console.log("Couldn't get Firebase services directly:", error);
        console.log("Waiting for firebaseInitialized event");
    }
}

// Wait for Firebase to initialize (as a backup)
document.addEventListener('firebaseInitialized', () => {
    console.log("Firebase initialized event received in auth-scripts.js");
    firebaseInitialized = true;
    setupAuthHandlers();
});

// Define handler functions for button clicks
function handleSignup() {
    if (!firebaseInitialized) {
        console.warn("Firebase not initialized yet");
        alert("⚠️ Please wait, Firebase is still initializing");
        return;
    }
    
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    
    if (!email || !password) {
        alert("⚠️ Email and password are required");
        return;
    }
    
    // Access Firebase Auth from the window object or global variable
    const auth = window.firebaseAuth || globalAuth;
    
    if (!auth) {
        alert("⚠️ Firebase authentication not initialized");
        return;
    }
    
    createUserWithEmailAndPassword(auth, email, password)
        .then(userCredential => {
            alert("✅ Signup successful!");
            document.getElementById("signup-form").reset();
        })
        .catch(error => {
            console.error("Signup error:", error);
            alert("⚠️ " + error.message);
        });
}

function handleLogin() {
    if (!firebaseInitialized) {
        console.warn("Firebase not initialized yet");
        alert("⚠️ Please wait, Firebase is still initializing");
        return;
    }
    
    // Get the Firebase auth from the global variable
    const auth = window.firebaseAuth || globalAuth;
    
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    
    if (!email || !password) {
        alert("⚠️ Email and password are required");
        return;
    }
    
    if (!auth) {
        alert("⚠️ Firebase authentication not initialized");
        return;
    }
    
    console.log("Attempting to sign in with:", email);
    
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log("Login successful");
            const user = userCredential.user;
            userEmailSpan.textContent = user.email;
            
            // Show dashboard, hide auth section
            authSection.style.display = "none";
            dashboard.style.display = "block";
            
            // Load user's feedback
            loadUserFeedback(user.uid);
        })
        .catch((error) => {
            console.error("Login error:", error);
            alert("⚠️ " + error.message);
        });
}

function handleFeedbackSubmit() {
    if (!firebaseInitialized) {
        console.warn("Firebase not initialized yet");
        alert("⚠️ Please wait, Firebase is still initializing");
        return;
    }
    
    // Get the Firebase auth from the global variable
    const auth = window.firebaseAuth || globalAuth;
    const db = window.firebaseDb || globalDb;
    
    if (!auth || !db) {
        alert("⚠️ Firebase not initialized");
        return;
    }
    
    const user = auth.currentUser;
    const feedbackText = document.getElementById("feedback").value;
    
    if (!user) {
        alert("⚠️ You must be logged in to submit feedback.");
        return;
    }
    
    if (!feedbackText.trim()) {
        alert("⚠️ Please enter some feedback before submitting.");
        return;
    }
    
    console.log("Submitting feedback for user:", user.uid);
    
    // Create a timestamp to use in the feedback document
    const timestamp = new Date();
    
    // Add the feedback document to Firestore
    addDoc(collection(db, "feedback"), {
        userId: user.uid,
        email: user.email,
        feedback: feedbackText,
        timestamp: timestamp
    })
    .then((docRef) => {
        console.log("Feedback submitted with ID:", docRef.id);
        
        alert("✅ Feedback submitted successfully!");
        feedbackForm.reset();
        
        // Make sure DOMPurify is available
        if (typeof DOMPurify === 'undefined') {
            console.warn("DOMPurify not found, using basic sanitization");
            // Basic sanitization as fallback
            const sanitizedFeedback = feedbackText
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
                
            displayNewFeedback(sanitizedFeedback, timestamp);
        } else {
            // Use DOMPurify if available
            const sanitizedFeedback = DOMPurify.sanitize(feedbackText);
            displayNewFeedback(sanitizedFeedback, timestamp);
        }
    })
    .catch((error) => {
        console.error("Feedback submission error:", error);
        alert("⚠️ Error submitting feedback: " + error.message);
    });
}

// Helper function to display new feedback
function displayNewFeedback(sanitizedFeedback, timestamp) {
    if (!feedbackMessages) {
        feedbackMessages = document.getElementById("feedback-messages");
        if (!feedbackMessages) {
            console.error("Feedback messages element not found");
            return;
        }
    }
    
    const dateDisplay = timestamp.toLocaleString();
    
    // Add at the beginning of the feedback list
    const newFeedbackItem = document.createElement('div');
    newFeedbackItem.className = 'feedback-item';
    newFeedbackItem.innerHTML = `
        <p class="feedback-text">${sanitizedFeedback}</p>
        <p class="feedback-date">${dateDisplay}</p>
    `;
    
    // If there was a "no feedback" message, remove it first
    if (feedbackMessages.innerHTML.includes("No feedback submitted yet")) {
        feedbackMessages.innerHTML = "";
    }
    
    feedbackMessages.insertBefore(newFeedbackItem, feedbackMessages.firstChild);
}

function setupAuthHandlers() {
    console.log("Setting up auth handlers");
    
    try {
        const { auth, db } = getFirebase();
        
        // Store Firebase services in global variables for the handlers
        globalAuth = auth;
        globalDb = db;
        
        if (!auth || !db) {
            console.error("Firebase auth or db not initialized");
            return;
        }

        // Make sure DOM elements are initialized
        if (!logoutButton) {
            logoutButton = document.getElementById("logout");
        }

        // Logout Handler
        if (logoutButton) {
            logoutButton.addEventListener("click", async () => {
                try {
                    await signOut(auth);
                    
                    // Show auth section, hide dashboard
                    authSection.style.display = "block";
                    dashboard.style.display = "none";
                    
                    // Clear feedback messages
                    if (feedbackMessages) {
                        feedbackMessages.innerHTML = "";
                    }
                    
                    alert("✅ Logged out successfully!");
                } catch (error) {
                    console.error("Logout error:", error);
                    alert("⚠️ " + error.message);
                }
            });
        } else {
            console.warn("Logout button not found");
        }

        // Auth State Change Listener
        onAuthStateChanged(auth, (user) => {
            console.log("Auth state changed:", user ? "User logged in" : "User logged out");
            
            if (user) {
                // User is signed in
                if (userEmailSpan) userEmailSpan.textContent = user.email;
                if (authSection) authSection.style.display = "none";
                if (dashboard) dashboard.style.display = "block";
                loadUserFeedback(user.uid);
            } else {
                // User is signed out
                if (authSection) authSection.style.display = "block";
                if (dashboard) dashboard.style.display = "none";
            }
        });
    } catch (error) {
        console.error("Error in setupAuthHandlers:", error);
    }
}

// Load User Feedback from Firestore with Debug Logging
function loadUserFeedback(userId) {
    console.log("Loading feedback for user:", userId);
    
    if (!globalDb) {
        console.error("Firestore not initialized", { 
            firebaseInitialized, 
            windowDb: !!window.firebaseDb,
            globalAuth: !!globalAuth
        });
        
        if (feedbackMessages) {
            feedbackMessages.innerHTML = "<p class='error'>Error: Database connection not available. Refreshing the page might help.</p>";
        }
        return;
    }
    
    // Check if collection() function exists
    if (typeof collection !== 'function') {
        console.error("Firestore collection function not available");
        feedbackMessages.innerHTML = "<p class='error'>Error: Firestore functions not loaded correctly.</p>";
        return;
    }
    
    try {
        // Try to get a reference to the feedback collection
        const feedbackCollection = collection(globalDb, "feedback");
        
        // Log to verify collection access
        console.log("Accessing feedback collection");
        
        // Create query for user's feedback
        const q = query(
            feedbackCollection, 
            where("userId", "==", userId)
        );
        
        console.log("Query created, setting up real-time listener");
        
        // Listen for real-time updates
        onSnapshot(q, (snapshot) => {
            console.log("Feedback snapshot received, documents count:", snapshot.size);
            feedbackMessages.innerHTML = "";
            
            if (snapshot.empty) {
                console.log("No feedback found for this user");
                feedbackMessages.innerHTML = "<p>No feedback submitted yet. Try adding some!</p>";
            } else {
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    console.log("Feedback document:", doc.id, data);
                    
                    // Check for either feedback or message field
                    const feedbackContent = data.feedback || data.message || "No content";
                    
                    // Handle different timestamp formats
                    let dateDisplay = "Unknown date";
                    if (data.timestamp) {
                        try {
                            // Try to handle Firestore timestamp objects
                            if (typeof data.timestamp.toDate === 'function') {
                                dateDisplay = data.timestamp.toDate().toLocaleString();
                            } else {
                                // Handle regular Date objects or timestamps
                                dateDisplay = new Date(data.timestamp).toLocaleString();
                            }
                        } catch (err) {
                            console.error("Error formatting date:", err);
                        }
                    }
                    
                    // Sanitize feedback using DOMPurify or fallback
                    let sanitizedFeedback;
                    if (typeof DOMPurify !== 'undefined') {
                        sanitizedFeedback = DOMPurify.sanitize(feedbackContent);
                    } else {
                        // Basic sanitization as fallback
                        sanitizedFeedback = feedbackContent
                            .replace(/&/g, "&amp;")
                            .replace(/</g, "&lt;")
                            .replace(/>/g, "&gt;")
                            .replace(/"/g, "&quot;")
                            .replace(/'/g, "&#039;");
                    }
                    
                    // Add the feedback item to the display
                    feedbackMessages.innerHTML += `
                        <div class="feedback-item">
                            <p class="feedback-text">${sanitizedFeedback}</p>
                            <p class="feedback-date">${dateDisplay}</p>
                        </div>
                    `;
                });
            }
        }, error => {
            console.error("Error loading feedback:", error);
            feedbackMessages.innerHTML = `<p class="error">Error loading feedback: ${error.message}</p>`;
        });
    } catch (error) {
        console.error("Error setting up feedback listener:", error);
        feedbackMessages.innerHTML = `<p class="error">Error setting up feedback listener: ${error.message}</p>`;
    }
}