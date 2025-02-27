const express = require('express');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const path = require('path');
const cors = require("cors");
require('dotenv').config();

// Initialize Express App
const app = express();

// Serve Static Files First
app.use(express.static(path.join(__dirname, 'public')));

// Middleware for Parsing Requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Configure CORS (BEFORE CSRF)
app.use(cors({
    origin: [
        "http://localhost:3000",
        "https://group-meshtacular.web.app",
        "https://group-meshtacular.firebaseapp.com"
    ],
    methods: ["GET", "POST"],
    credentials: true
}));

// CSRF Protection
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

// Rate Limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 100,                  // 100 requests per window
    message: 'Too many requests from this IP, please try again in 15 minutes',
    standardHeaders: true,     // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false,      // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// Initialize Firebase Admin
let admin;
try {
    // Check if Firebase Admin SDK Config is available
    if (process.env.FIREBASE_ADMIN_SDK) {
        admin = require("firebase-admin");
        
        // Parse the service account JSON
        let serviceAccount;
        try {
            // Handle escaped newlines correctly
            const fixedJson = process.env.FIREBASE_ADMIN_SDK.replace(/\\\\n/g, '\\n');
            serviceAccount = JSON.parse(fixedJson);
            
            // Initialize Firebase Admin
            if (admin.apps.length === 0) {
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                });
                console.log("✅ Firebase Admin SDK initialized successfully");
            }
        } catch (error) {
            console.error("❌ Failed to parse FIREBASE_ADMIN_SDK:", error);
        }
    } else {
        console.warn("⚠️ FIREBASE_ADMIN_SDK not found in environment variables");
    }
} catch (error) {
    console.error("❌ Firebase Admin initialization failed:", error);
}

// Get Firestore Database
const db = admin ? admin.firestore() : null;

// CSRF Token Endpoint
app.get("/csrf-token", (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// Register User Endpoint
app.post("/api/register", async (req, res) => {
    if (!admin) {
        return res.status(500).json({ error: "Firebase Admin SDK not initialized" });
    }
    
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }
    
    try {
        const user = await admin.auth().createUser({
            email,
            password
        });
        
        // Create user document in Firestore
        await db.collection("users").doc(user.uid).set({
            email,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log("✅ User registered:", user.uid);
        return res.status(201).json({ 
            message: "Registration successful! Please log in.",
            uid: user.uid 
        });
    } catch (error) {
        console.error("❌ Registration failed:", error);
        return res.status(500).json({ error: error.message });
    }
});

// Submit Feedback Endpoint
app.post("/api/submit-feedback", async (req, res) => {
    if (!admin) {
        return res.status(500).json({ error: "Firebase Admin SDK not initialized" });
    }
    
    const { userId, message } = req.body;
    
    if (!userId || !message) {
        return res.status(400).json({ error: "User ID and message are required" });
    }
    
    try {
        // Save feedback to Firestore
        await db.collection("feedback").add({
            userId,
            message,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        
        return res.status(201).json({ message: "Feedback submitted successfully!" });
    } catch (error) {
        console.error("❌ Error submitting feedback:", error);
        return res.status(500).json({ error: error.message });
    }
});

// Get User's Feedback Endpoint
app.get("/api/user-feedback", async (req, res) => {
    if (!admin) {
        return res.status(500).json({ error: "Firebase Admin SDK not initialized" });
    }
    
    const { userId } = req.query;
    
    if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
    }
    
    try {
        // Retrieve only feedback for the specified user
        const snapshot = await db.collection("feedback")
            .where("userId", "==", userId)
            .orderBy("timestamp", "desc")
            .get();
        
        let userFeedback = [];
        snapshot.forEach((doc) => {
            userFeedback.push({ id: doc.id, ...doc.data() });
        });
        
        return res.status(200).json({ feedback: userFeedback });
    } catch (error) {
        console.error("❌ Error retrieving user feedback:", error);
        return res.status(500).json({ error: error.message });
    }
});

// CSRF Error Handling Middleware
app.use((err, req, res, next) => {
    if (err.code === "EBADCSRFTOKEN") {
        return res.status(403).json({ 
            error: "CSRF Token Invalid. Please refresh and try again." 
        });
    }
    next(err);
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});