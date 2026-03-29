const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Task = require('./models/Task');
const Schedule = require('./models/Schedule');

const app = express();

// CORS — allow requests from any localhost origin
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

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

// Standard export for Vercel serverless functions
module.exports = app;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Local Server running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
  });
}
