const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  TaskTitle: { type: String, required: true },
  Category: { type: String, enum: ['Assignment', 'Exam', 'Practical'], required: true },
  DueDate: { type: Date, required: true },
  Priority: { type: String, enum: ['High', 'Medium', 'Low'], required: true },
  Status: { type: Boolean, default: false } // false = Pending, true = Completed
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
