const express = require('express');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const path = require('path');
require('dotenv').config();


const app = express();

//To serve the static files before applying Middleware
app.use(express.static(path.join(__dirname, 'public')));

//Middleware for Parsing Requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Define rate limiter configuration to prevent Brute-Force Attacks
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,  //15 miniutes
    max: 100,   //limits IP up to 100 requests per window
    message: 'Too many requests from this IP, please try again in 15 minutes',
    headers: true, //include the RateLimit headers
});

//Apply rate limiter to all requests
app.use(limiter);

//Secure Cookies & CSRF Protection
app.use(cookieParser());
app.use(csrf({ cookie: true }));

//CSRF Token Endpoint
app.get("/csrf-token", (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

//Error Handling for CSRF
app.use((err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
        return res.status(403).send("CSRF Token Invalid");
    }
    next(err);
});

const functions = require("firebase-functions");

const firebaseConfig = {
    apiKey: functions.config().config.firebase_api_key,
    authDomain: functions.config().config.firebase_auth_domain,
    projectId: functions.config().config.firebase_project_id,
    storageBucket: functions.config().config.firebase_storage_bucket,
    messagingSenderId: functions.config().config.firebase_messaging_sender_id,
    appId: functions.config().config.firebase_app_id
};

//Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
