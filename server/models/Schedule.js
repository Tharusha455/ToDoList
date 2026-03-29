const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  Subject: { type: String, required: true },
  Day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], required: true },
  StartTime: { type: String, required: true }, // HH:mm
  EndTime: { type: String, required: true }, // HH:mm
  Venue: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
