const express = require('express');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const path = require('path');
require('dotenv').config();
console.log("FIREBASE_ADMIN_SDK:", process.env.FIREBASE_ADMIN_SDK);

// 🚨 Check if FIREBASE_ADMIN_SDK is loaded properly
if (!process.env.FIREBASE_ADMIN_SDK || process.env.FIREBASE_ADMIN_SDK.trim().length < 50) {
    throw new Error("❌ FIREBASE_ADMIN_SDK is missing or incorrectly formatted. Check .env file.");
}

// ✅ Parse the Firebase Admin SDK JSON
let serviceAccount;
try {
    // ✅ Ensure we properly unescape \n in the private_key field
    const fixedJson = process.env.FIREBASE_ADMIN_SDK.replace(/\\\\n/g, '\\n');
    serviceAccount = JSON.parse(fixedJson);
} catch (error) {
    console.error("❌ Failed to parse FIREBASE_ADMIN_SDK JSON. Check .env formatting.", error);
    throw error;
}

const app = express();

//To serve the static files before applying Middleware
app.use(express.static(path.join(__dirname, 'public')));

//Middleware for Parsing Requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CSRF Protection
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

//Define rate limiter configuration to prevent Brute-Force Attacks
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,  //15 miniutes
    max: 100,   //limits IP up to 100 requests per window
    message: 'Too many requests from this IP, please try again in 15 minutes',
    headers: true, //include the RateLimit headers
});

//Apply rate limiter to all requests
app.use(limiter);

// Configure CORS to Allow Cookies (Must Be Before CSRF Middleware)
const cors = require("cors");
app.use(cors({
    origin: "https://group-meshtacular.web.app/", 
    credentials: true,  // Required to allow cookies in requests
}));


// CSRF Token Endpoint - Ensures Proper Headers
app.get("/csrf-token", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");  // Adjust this
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.json({ csrfToken: req.csrfToken() });
});

// CSRF Error Handling Middleware
app.use((err, req, res, next) => {
    if (err.code === "EBADCSRFTOKEN") {
        return res.status(403).json({ error: "CSRF Token Invalid. Please refresh and try again." });
    }
    next(err);
});

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};


const admin = require("firebase-admin");

if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`
    });
}

const db = admin.firestore();

// Assign Admin Role to a User (Run Once)
app.post("/set-admin", async (req, res) => {
    const { userId } = req.body; // Get the user ID from request body

    if (!userId) {
        return res.status(400).json({ error: "User ID is required." });
    }

    try {
        await admin.auth().setCustomUserClaims(userId, { admin: true });
        return res.status(200).json({ message: `User ${userId} is now an admin!` });
    } catch (error) {
        console.error("Error setting admin role:", error);
        return res.status(500).json({ error: "Failed to set admin role." });
    }
});


// Secure Route: Get All Feedback (Only for Firebase Admin Users)
app.get("/admin-feedback", async (req, res) => {
    const { userId } = req.query; // Get the requesting user's ID

    if (!userId) {
        return res.status(400).json({ error: "User ID is required for authentication." });
    }

    try {
        // Get the user from Firebase Authentication
        const userRecord = await admin.auth().getUser(userId);

        // Check if the user has admin privileges
        if (!userRecord.customClaims || !userRecord.customClaims.admin) {
            return res.status(403).json({ error: "Unauthorized access." });
        }

        // Retrieve all feedback from Firestore
        const snapshot = await db.collection("feedback").orderBy("timestamp", "desc").get();
        let allFeedback = [];
        snapshot.forEach((doc) => {
            allFeedback.push({ id: doc.id, ...doc.data() });
        });

        return res.status(200).json({ feedback: allFeedback });
    } catch (error) {
        console.error("Error retrieving all feedback:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

// Route to Submit Feedback
app.post("/submit-feedback", async (req, res) => {
    const { userId, message } = req.body;

    if (!userId || !message) {
        return res.status(400).json({ error: "User ID and message are required." });
    }

    try {
        // Save feedback to Firestore
        await db.collection("feedback").add({
            userId,
            message,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        return res.status(201).json({ message: "Feedback submitted successfully!" });
    } catch (error) {
        console.error("Error submitting feedback:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

// Secure Route: Get User's Own Feedback
app.get("/user-feedback", async (req, res) => {
    const { userId } = req.query; // Get the signed-in user's ID

    if (!userId) {
        return res.status(400).json({ error: "User ID is required." });
    }

    try {
        // Retrieve only the feedback of the signed-in user
        const snapshot = await db.collection("feedback").where("userId", "==", userId).orderBy("timestamp", "desc").get();
        
        let userFeedback = [];
        snapshot.forEach((doc) => {
            userFeedback.push({ id: doc.id, ...doc.data() });
        });

        return res.status(200).json({ feedback: userFeedback });
    } catch (error) {
        console.error("Error retrieving user feedback:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
});



//Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
