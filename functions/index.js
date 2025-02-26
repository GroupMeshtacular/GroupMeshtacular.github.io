/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

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

// Call this function after login
// Example: loadUserFeedback("KdjxHqEzaFWcnW7cw5ArXmpRV7S2");


// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
