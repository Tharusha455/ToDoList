import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import type { Task, Category, Priority } from '../types/index';

interface TaskFormProps {
  onSave: (task: any) => void;
  onClose: () => void;
  initialTask?: Task | null;
}

const TaskForm: React.FC<TaskFormProps> = ({ onSave, onClose, initialTask }) => {
  const [taskTitle, setTaskTitle] = useState(initialTask?.TaskTitle || '');
  const [category, setCategory] = useState<Category>(initialTask?.Category || 'Assignment');
  const [priority, setPriority] = useState<Priority>(initialTask?.Priority || 'Medium');
  const [dueDate, setDueDate] = useState(
    initialTask?.DueDate
      ? new Date(initialTask.DueDate).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      _id: initialTask?._id,
      TaskTitle: taskTitle,
      Category: category,
      Priority: priority,
      DueDate: new Date(dueDate).toISOString(),
      Status: initialTask?.Status || false
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{initialTask ? 'Edit Task' : 'Add New Task'}</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Task Title</label>
            <input
              autoFocus
              required
              placeholder="What needs to be done?"
              value={taskTitle}
              onChange={e => setTaskTitle(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <div className="select-wrap">
                <select value={category} onChange={e => setCategory(e.target.value as Category)}>
                  <option value="Assignment">Assignment</option>
                  <option value="Exam">Exam</option>
                  <option value="Practical">Practical</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <div className="select-wrap">
                <select value={priority} onChange={e => setPriority(e.target.value as Priority)}>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Due Date & Time</label>
            <input
              type="datetime-local"
              required
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-submit">
            <Plus size={16} />
            {initialTask ? 'Update Task' : 'Create Task'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;
