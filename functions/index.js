const admin = require("firebase-admin");
const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const crypto = require("crypto");

// Generate a CSRF token
exports.getCsrfToken = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    // Generate a random token
    const token = crypto.randomBytes(16).toString("hex");
    
    // Set a cookie with the token
    res.set("Set-Cookie", `csrfToken=${token}; HttpOnly; Secure; SameSite=Strict; Path=/`);
    
    // Return the token in the response
    res.status(200).json({ csrfToken: token });
  });
});


// ✅ Initialize Firebase Admin SDK
admin.initializeApp();
const auth = admin.auth();

// ✅ Register User (Backend)
exports.registerUser = functions.https.onRequest(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
    }

    try {
        const user = await auth.createUser({
            email: email,
            password: password
        });

        return res.status(201).json({ message: "Registration successful!", uid: user.uid });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

// ✅ Example function to fetch user data
exports.getUser = functions.https.onRequest(async (req, res) => {
    const { uid } = req.query;
    
    try {
        const user = await auth.getUser(uid);
        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
