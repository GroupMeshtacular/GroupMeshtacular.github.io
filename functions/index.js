/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { createUserWithEmailAndPassword } from "firebase/auth";

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

async function loadUserFeedback(userId) {
    try {
        const response = await fetch(`/user-feedback?userId=${userId}`);
        const data = await response.json();

        if (data.error) {
            console.error("Error loading feedback:", data.error);
            return;
        }

        const feedbackList = document.getElementById("feedback-list");
        feedbackList.innerHTML = ""; // Clear previous data

        data.feedback.forEach(feedback => {
            const listItem = document.createElement("li");
            listItem.textContent = feedback.message;
            feedbackList.appendChild(listItem);
        });
    } catch (error) {
        console.error("Error fetching feedback:", error);
    }
}

const auth = getAuth();

async function registerUser() {
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("✅ User registered:", user.uid);

        alert("Registration successful! Please log in.");
    } catch (error) {
        console.error("❌ Registration failed:", error.message);
        alert(error.message);
    }
}

// Event listener for register button
document.getElementById("register-btn").addEventListener("click", registerUser);

// Call this function after login
// Example: loadUserFeedback("KdjxHqEzaFWcnW7cw5ArXmpRV7S2");


// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
