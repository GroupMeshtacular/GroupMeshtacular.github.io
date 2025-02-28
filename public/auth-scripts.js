// auth-scripts.js - Create this as a new file
import { getFirebase } from './firebase-init.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, addDoc, query, orderBy, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

console.log("Auth scripts loading...");

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
    signupForm.addEventListener("submit", (e) => {
        e.preventDefault();
        handleSignup();
    });

    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        handleLogin();
    });

    // Expose handlers to global scope for onclick attributes
    window.handleSignup = handleSignup;
    window.handleLogin = handleLogin;
    window.handleFeedbackSubmit = handleFeedbackSubmit;
});

// Try to get Firebase services directly
try {
    const { auth, db } = getFirebase();
    if (auth && db) {
        globalAuth = auth;
        globalDb = db;
        console.log("Firebase services accessed directly:", !!globalAuth, !!globalDb);
        
        // If we have both services, setup immediately
        if (globalAuth && globalDb) {
            console.log("Firebase services available, setting up immediately");
            setupAuthHandlers();
        }
    }
} catch (error) {
    console.log("Couldn't get Firebase services directly, waiting for initialization event");
}

// Wait for Firebase to initialize (as a backup)
document.addEventListener('firebaseInitialized', () => {
    console.log("Firebase initialized event received");
    setupAuthHandlers();
});

// Define handler functions for button clicks
// Global handler functions that can be called from HTML
function handleSignup() {
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
            alert("⚠️ " + error.message);
        });
}

function handleLogin() {
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
    
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
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
        
        // Immediate display of the new feedback without waiting for the listener
        const sanitizedFeedback = DOMPurify.sanitize(feedbackText);
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
    })
    .catch((error) => {
        console.error("Feedback submission error:", error);
        alert("⚠️ Error submitting feedback: " + error.message);
    });
}

function setupAuthHandlers() {
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
                feedbackMessages.innerHTML = "";
                
                alert("✅ Logged out successfully!");
            } catch (error) {
                console.error("Logout error:", error);
                alert("⚠️ " + error.message);
            }
        });
    }

    // Auth State Change Listener
    onAuthStateChanged(auth, (user) => {
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
}

// Load User Feedback from Firestore with Debug Logging
function loadUserFeedback(userId) {
    console.log("Loading feedback for user:", userId);
    
    if (!globalDb) {
        console.error("Firestore not initialized");
        if (feedbackMessages) {
            feedbackMessages.innerHTML = "<p>Error: Database connection not available</p>";
        }
        return;
    }
    
    if (!feedbackMessages) {
        feedbackMessages = document.getElementById("feedback-messages");
        if (!feedbackMessages) {
            console.error("Feedback messages element not found");
            return;
        }
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
                    
                    // Sanitize feedback using DOMPurify
                    const sanitizedFeedback = DOMPurify.sanitize(feedbackContent);
                    
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