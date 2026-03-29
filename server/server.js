const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Task = require('./models/Task');
const Schedule = require('./models/Schedule');
const Assignment = require('./models/Assignment');
const User = require('./models/User');

const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const app = express();

const ALLOWED_ORIGINS = [
  'http://localhost:5173', 
  'http://localhost:5174', 
  'http://127.0.0.1:5173', 
  'http://127.0.0.1:5174',
  /\.vercel\.app$/ // Matches any Vercel deployment URL
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.some(pattern => typeof pattern === 'string' ? pattern === origin : pattern.test(origin))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

// ----- DATABASE CONNECTION (Serverless Optimized) -----
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  if (!MONGO_URI) {
    console.error('❌ MONGODB_URI is missing');
    return;
  }
  try {
    await mongoose.connect(MONGO_URI, { dbName: 'UniFlow' });
    console.log('✅ MongoDB Connected to UniFlow');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    throw err;
  }
};

// Middleware to ensure DB is connected before any API call
const ensureDB = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(503).json({ error: 'Database connection failed. Please try again.' });
  }
};

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' });
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ error: 'User no longer exists' });
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// ----- AUTH ROUTES -----
app.post('/api/auth/google', ensureDB, async (req, res) => {
  const { credential } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const { sub, email, name, picture } = ticket.getPayload();
    
    let user = await User.findOne({ googleId: sub });
    if (!user) {
      const userCount = await User.countDocuments();
      user = new User({
        googleId: sub,
        name,
        email,
        profilePic: picture,
        role: userCount === 0 ? 'admin' : 'student'
      });
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    console.log(`✅ User authenticated: ${user.email} (Role: ${user.role})`);
    
    res.status(200).json({ 
      token, 
      user: { 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        picture: user.profilePic 
      } 
    });
  } catch (err) {
    console.error('❌ Google Auth Error:', err.message);
    res.status(401).json({ error: 'Authentication failed' });
  }
});

app.get('/api/auth/me', authenticate, (req, res) => res.json(req.user));

// ----- TASK ROUTES -----
app.get('/api/tasks', ensureDB, authenticate, async (req, res) => {
  try {
    // RBAC: Students only see their own tasks, Admins see all
    const query = req.user.role === 'admin' ? {} : { user: req.user._id };
    const tasks = await Task.find(query).sort({ CreatedAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks', ensureDB, authenticate, async (req, res) => {
  try {
    const task = new Task({ ...req.body, user: req.user._id });
    const saved = await task.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Other task routes should also be protected and check ownership if not admin
app.put('/api/tasks/:id', ensureDB, authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (req.user.role !== 'admin' && task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const updated = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/tasks/:id', ensureDB, authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (req.user.role !== 'admin' && task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----- ASSIGNMENT ROUTES -----
app.get('/api/assignments', ensureDB, authenticate, async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { user: req.user._id };
    const assignments = await Assignment.find(query).sort({ deadline: 1 });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/assignments', ensureDB, authenticate, async (req, res) => {
  try {
    const assignment = new Assignment({ ...req.body, user: req.user._id });
    const saved = await assignment.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/assignments/:id', ensureDB, authenticate, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    if (req.user.role !== 'admin' && assignment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const updated = await Assignment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/assignments/:id', ensureDB, authenticate, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    if (req.user.role !== 'admin' && assignment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Assignment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----- SCHEDULE ROUTES -----
app.get('/api/schedule', ensureDB, async (req, res) => {
  try {
    const schedule = await Schedule.find().sort({ Day: 1, StartTime: 1 });
    res.json(schedule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/schedule', ensureDB, authenticate, async (req, res) => {
  try {
    const entry = new Schedule(req.body);
    const saved = await entry.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/schedule/:id', ensureDB, authenticate, async (req, res) => {
  try {
    const updated = await Schedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Schedule entry not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/schedule/:id', ensureDB, authenticate, async (req, res) => {
  try {
    await Schedule.findByIdAndDelete(req.params.id);
    res.json({ message: 'Schedule entry deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', async (req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  res.json({ status: 'ok', dbConnected: dbReady });
});

module.exports = app;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Local Server running on http://localhost:${PORT}`);
  });
}
