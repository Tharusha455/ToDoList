const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  TaskTitle: {
    type: String,
    required: true,
    trim: true
  },
  Category: {
    type: String,
    enum: ['Assignment', 'Exam', 'Practical'],
    default: 'Assignment'
  },
  DueDate: {
    type: String,
    required: true
  },
  Priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  Status: {
    type: Boolean,
    default: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Task', taskSchema);
