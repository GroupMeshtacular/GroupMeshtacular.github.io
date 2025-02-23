const express = require('express');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

//Define rate limiter configuration
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,  //15 miniutes
    max: 100,   //limits IP up to 100 requests per window
    message: 'Too many requests from this IP, please try again in 15 minutes'
});

//Apply rate limiter to all requests
app.use(limiter);

//To serve tthe static files
app.use(express.static(path.join(__dirname, 'public')));

//Start Server
const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
