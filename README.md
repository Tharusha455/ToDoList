# Campus Student Management System

A professional, 3-column SaaS task and lecture management system with MongoDB integration.

## 🚀 How to Run

Follow these steps to get the full application running:

### 1. Prerequisites
- **Node.js**: Ensure you have Node.js installed on your machine.
- **MongoDB**: The application is configured to connect to your specified MongoDB Atlas cluster. Ensure your current IP is whitelisted in your MongoDB Atlas Network Access settings.

### 2. Run the Backend Server
1. Open a terminal.
2. Navigate to the project root (`To Do List`).
3. Run the following command:
   ```bash
   node server/server.js
   ```
4. You should see: `🚀 Server running on http://localhost:5000` and `✅ Connected to MongoDB Cluster0`.

### 3. Run the Frontend Dashboard
1. Open a **new, separate** terminal window.
2. Navigate to the project root (`To Do List`).
3. Run the following command:
   ```bash
   npm run dev
   ```
4. You should see a message indicating the app is running (usually on `http://localhost:5173`).

### 4. View the App
1. Open your web browser.
2. Navigate to `http://localhost:5173`.

## 🛠 Features
- **3-Column SaaS Dashboard**: Unified view for Schedule, Tasks, and Progress.
- **Real-time Data**: Fully integrated with your MongoDB database.
- **Professional Aesthetic**: Navy/Off-White color palette with clear typography and minimalist cards.
- **Mobile Responsive**: Adapts across all device sizes.
