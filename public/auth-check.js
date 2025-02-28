// auth-check.js
// This ensures the auth state is checked immediately when the page loads

console.log("Auth check script loading...");

// Function to check auth state on page load
function checkAuthOnPageLoad() {
    console.log("Checking auth state on page load");
    
    // Try to get the current Firebase auth instance
    let firebaseAuth = window.firebaseAuth;
    
    // If Firebase auth isn't available yet, we'll need to wait
    if (!firebaseAuth) {
        console.log("Firebase auth not available yet, waiting...");
        
        // Set up a MutationObserver to check when the body is fully loaded
        const observer = new MutationObserver((mutations, obs) => {
            firebaseAuth = window.firebaseAuth;
            
            if (firebaseAuth) {
                console.log("Firebase auth became available");
                checkUserAndUpdateUI(firebaseAuth);
                obs.disconnect(); // Stop observing once we have auth
            }
        });
        
        // Start observing the document body for changes
        observer.observe(document.body, { 
            childList: true,
            subtree: true
        });
        
        // Also set a timeout as a fallback
        setTimeout(() => {
            firebaseAuth = window.firebaseAuth;
            if (firebaseAuth) {
                console.log("Firebase auth available after timeout");
                checkUserAndUpdateUI(firebaseAuth);
            }
        }, 1000);
    } else {
        // Firebase auth is already available
        checkUserAndUpdateUI(firebaseAuth);
    }
}

// Helper function to check user state and update UI
function checkUserAndUpdateUI(auth) {
    const currentUser = auth.currentUser;
    
    console.log("Auth check:", currentUser ? `User logged in: ${currentUser.email}` : "No user logged in");
    
    if (currentUser) {
        // Update UI elements for logged-in state
        const userEmailSpan = document.getElementById("user-email");
        const authSection = document.getElementById("auth-section");
        const dashboard = document.getElementById("dashboard");
        
        if (userEmailSpan) userEmailSpan.textContent = currentUser.email;
        if (authSection) authSection.style.display = "none";
        if (dashboard) dashboard.style.display = "block";
        
        // Trigger feedback loading if possible
        if (typeof loadUserFeedback === 'function') {
            loadUserFeedback(currentUser.uid);
        } else {
            console.log("loadUserFeedback function not available yet");
        }
    }
}

// Check auth state as soon as possible
document.addEventListener('DOMContentLoaded', checkAuthOnPageLoad);

// Also try to check immediately if the document is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log("Document already interactive or complete, checking auth immediately");
    checkAuthOnPageLoad();
}