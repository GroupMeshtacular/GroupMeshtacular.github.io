/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

/*const admin = require("firebase-admin");

// Ensure auth is only declared once
const auth = admin.auth();



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


async function registerUser() {
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;
    
    try {
        const user = await admin.auth().createUser({
            email: email,
            password: password
        });
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
*/

/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const admin = require("firebase-admin");
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const fetch = require("node-fetch");

admin.initializeApp();
const auth = admin.auth();

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

async function registerUser(req, res) {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
    }

    try {
        const user = await auth.createUser({
            email: email,
            password: password
        });
        console.log("✅ User registered:", user.uid);

        return res.status(201).json({ message: "Registration successful! Please log in.", uid: user.uid });
    } catch (error) {
        console.error("❌ Registration failed:", error.message);
        return res.status(500).json({ error: error.message });
    }
}

// Expose the registration function as an HTTP endpoint
exports.registerUser = onRequest(registerUser);

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
