const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Task = require('./models/Task');
const Schedule = require('./models/Schedule');
const Assignment = require('./models/Assignment');
const User = require('./models/User');

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const jwt = require('jsonwebtoken');

const app = express();

// CORS — allow requests from any localhost origin
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Session & Passport Setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });
      
      if (!user) {
        // If it's the first user ever, make them admin
        const userCount = await User.countDocuments();
        user = new User({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          profilePic: profile.photos[0].value,
          role: userCount === 0 ? 'admin' : 'student'
        });
        await user.save();
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

const PORT = process.env.PORT || 5000;
// Use MONGODB_URI (Vercel standard) or MONGO_URI (.env)
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb+srv://todo:Password123@cluster0.yrxbtpb.mongodb.net/UniFlow?retryWrites=true&w=majority";

let isDBConnected = false;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas (UniFlow Database)');
    isDBConnected = true;
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Error Details:', err);
    console.log('⚠️  Server running without DB — API will return empty arrays');
  });

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', dbConnected: isDBConnected });
});

// ----- TASK ROUTES -----
app.get('/api/tasks', async (req, res) => {
  if (!isDBConnected) return res.json([]);
  try {
    const tasks = await Task.find().sort({ DueDate: 1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  if (!isDBConnected) return res.status(503).json({ error: 'Database not connected' });
  try {
    const task = new Task(req.body);
    const saved = await task.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  if (!isDBConnected) return res.status(503).json({ error: 'Database not connected' });
  try {
    const updated = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: 'Task not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  if (!isDBConnected) return res.status(503).json({ error: 'Database not connected' });
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----- SCHEDULE ROUTES -----
app.get('/api/schedule', async (req, res) => {
  if (!isDBConnected) return res.json([]);
  try {
    const schedules = await Schedule.find().sort({ Day: 1, StartTime: 1 });
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/schedule', async (req, res) => {
  if (!isDBConnected) return res.status(503).json({ error: 'Database not connected' });
  try {
    const entry = new Schedule(req.body);
    const saved = await entry.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/schedule/:id', async (req, res) => {
  if (!isDBConnected) return res.status(503).json({ error: 'Database not connected' });
  try {
    const updated = await Schedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Schedule entry not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/schedule/:id', async (req, res) => {
  if (!isDBConnected) return res.status(503).json({ error: 'Database not connected' });
  try {
    await Schedule.findByIdAndDelete(req.params.id);
    res.json({ message: 'Schedule entry deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----- ASSIGNMENT ROUTES -----
app.get('/api/assignments', async (req, res) => {
  if (!isDBConnected) return res.json([]);
  try {
    const assignments = await Assignment.find().sort({ deadline: 1 });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/assignments', async (req, res) => {
  if (!isDBConnected) return res.status(503).json({ error: 'Database not connected' });
  try {
    const assignment = new Assignment(req.body);
    const saved = await assignment.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/assignments/:id', async (req, res) => {
  if (!isDBConnected) return res.status(503).json({ error: 'Database not connected' });
  try {
    const updated = await Assignment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Assignment not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/assignments/:id', async (req, res) => {
  if (!isDBConnected) return res.status(503).json({ error: 'Database not connected' });
  try {
    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Assignment deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----- AUTH ROUTES -----
app.get('/api/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/api/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Generate JWT
    const token = jwt.sign(
      { id: req.user._id, role: req.user.role },
      process.env.JWT_SECRET || 'jwt_fallback',
      { expiresIn: '7d' }
    );
    
    // Redirect back to frontend with token
    res.redirect(`http://localhost:5173?token=${token}`);
  }
);

app.get('/api/auth/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwt_fallback');
    const user = await User.findById(decoded.id);
    res.json(user);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Standard export for Vercel serverless functions
module.exports = app;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Local Server running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
  });
}
