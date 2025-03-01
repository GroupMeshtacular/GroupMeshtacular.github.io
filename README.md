## 🌐 Welcome Hackers & Builders!

🚀 **Hello Everyone!** Welcome to the official landing page for **Group Meshtacular**! 

### **👥 Our Team**
- 🔥 **Sean Griffiths**
- 🏴‍☠️ **Luca Maddaleni**
- ⚡ **Robert Stanley**

This repository serves as our **documented journey** as we build our **networking-based website** and explore exciting **computer networking projects** together.

---

## 📌 **What is Meshtacular?**
Meshtacular is a **group of Undergrads at Georgia State University** focused on developing **secure, efficient, and innovative** software. This repository will serve as:
- 📂 A **landing page** for our group's progress.
- 📡 A hub for **our networking-based projects**.
- 🛠 A place to **document our coding journey** and discoveries.

---

## 🏗️ **Project Roadmap**
| Phase | Task | Status |
|-------|------|--------|
| 🟢 | **Host on Firebase with Database Functionality** | ✅ Completed |
| 🟡 | **Implement Website Design** | ✅ Completed |
| 🔴 | **Develop Core Networking Features** | ✅ Completed |
| 🟣 | **Optimize & Deploy** | ✅ Completed |

🔍 _We will continue updating this README as we make progress!_

---

## 🔒 **Security & Networking Features**
⚠️ This project follows **modern cybersecurity practices**, including:
- ✅ **DNS Handling**: Resolving domain **group-meshtacular.web.app** to an IP address.
- ✅ **IP Addressing**: Hosted via **Hosted on Firebase's infrastructure**.
- ✅ **HTTPS Encryption**: Secured using **SSL/TLS certificates**.
- ✅ **Networking Protocols**: Studying & implementing **HTTP, DNS, and more**.
- ✅ **SQL & XSS Attack Protection**: Sanitizes user input with**DOMPurify**.
- ✅ **Brute-Force Login Protection**: Preventing user abuse with a **Rate Limiter**.
- ✅ **Cookies & CSRF Protection**: Using a CORS config and **Cookie Parser**.

---

## 💻 **How to Access the Website**
🎯 Check out our **live site** here: [Meshtacular Website](https://group-meshtacular.web.app/)

## 🚀 **Running the Project Locally**

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)
- Firebase CLI: `npm install -g firebase-tools`

### Clone and Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/groupmeshtacular/groupmeshtacular.github.io.git
   cd groupmeshtacular.github.io
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Log in to Firebase:
   ```bash
   firebase login
   ```

4. Initialize Firebase in the project directory (select Hosting and Firestore when prompted):
   ```bash
   firebase init
   ```
   - When asked about the public directory, enter: `./`
   - Configure as a single-page app: `No`
   - Set up automatic builds and deploys: `No`

5. Add your Firebase configuration:
   - Create a `.env` file in the root directory
   - Add your Firebase config (get this from your Firebase console):
     ```
     FIREBASE_ADMIN_SDK={"type":"service_account","project_id":"your-project-id",...}
     ```

### Running the Server
1. Start the local server:
   ```bash
   node server.js
   ```

2. In a new terminal, serve the Firebase hosting:
   ```bash
   firebase serve
   ```

3. Access the website at `http://localhost:5000`

### Development Workflow
- Edit HTML, CSS, and JavaScript files directly
- The website will update when you refresh the browser
- For server changes, restart the Node.js server

### Deployment
If you want to deploy your version to Firebase:
```bash
firebase deploy
```

*Note: You'll need your own Firebase project and proper permissions to deploy.*

---

## 🛠 **Technologies Used**
🚀 This project is powered by:
- **🌍 HTML,CSS, Javascript** – Structuring, styling, and functionality for the website.
- **🎨 Custom Dark UI** – A hacker-style aesthetic.
- **🔧 Google Firebase** – Free hosting and Database.
- **🔐 Cybersecurity Best Practices** – HTTPS, DNS, IP handling.
- **📂 Database Integration** – Firebase Firestore, User Data Storage, Dynamic User Feedback Integration.
- **🚀 Deployment & Infrastructure** – Firebase Hosting & GitHub Actions Automated Deployment

---

## 🚀 **Stay Tuned!**
🛡️ As we develop this website, we'll continue to add **new features, security enhancements, and networking tools**. Stay tuned and follow our progress!

---

💻 _Happy Hacking!_ 🕶️