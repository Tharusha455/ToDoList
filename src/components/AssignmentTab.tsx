import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { format, isBefore, addHours } from 'date-fns';
import type { Assignment } from '../types';

interface AssignmentTabProps {
  assignments: Assignment[];
  onAdd: (assignment: Omit<Assignment, '_id' | 'status'>) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, status: 'Pending' | 'Completed') => void;
}

const AssignmentTab: React.FC<AssignmentTabProps> = ({ assignments, onAdd, onDelete, onToggleStatus }) => {
  const [showForm, setShowForm] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    subject: '',
    description: '',
    deadline: format(new Date(), "yyyy-MM-dd'T'HH:mm")
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignment.title || !newAssignment.subject || !newAssignment.deadline) return;
    onAdd(newAssignment);
    setNewAssignment({ title: '', subject: '', description: '', deadline: format(new Date(), "yyyy-MM-dd'T'HH:mm") });
    setShowForm(false);
  };

  const isUrgent = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    return isBefore(deadlineDate, addHours(now, 24)) && isBefore(now, deadlineDate);
  };

  return (
    <div className="tab-content">
      <div className="section-header">
        <h2 className="section-title">Assignments</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Add Assignment
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">New Assignment</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Assignment Title</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="e.g. Advanced Calculus HW"
                  value={newAssignment.title}
                  onChange={e => setNewAssignment({...newAssignment, title: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Subject</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="e.g. Mathematics"
                  value={newAssignment.subject}
                  onChange={e => setNewAssignment({...newAssignment, subject: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Deadline</label>
                <input 
                  type="datetime-local" 
                  className="form-control"
                  value={newAssignment.deadline}
                  onChange={e => setNewAssignment({...newAssignment, deadline: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea 
                  className="form-control"
                  value={newAssignment.description}
                  onChange={e => setNewAssignment({...newAssignment, description: e.target.value})}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="assignment-list">
        {assignments.length === 0 ? (
          <div className="empty-state">
            <p>No assignments found. Add one to get started!</p>
          </div>
        ) : (
          assignments.map(item => (
            <div key={item._id} className={`assignment-card ${item.status === 'Completed' ? 'completed' : ''}`}>
              <div className="assignment-main">
                <div className="assignment-info">
                  <h4 className="assignment-title">
                    {item.title}
                    {item.status === 'Pending' && isUrgent(item.deadline) && (
                      <span className="badge badge-urgent">
                        <AlertCircle size={12} /> Urgent
                      </span>
                    )}
                  </h4>
                  <p className="assignment-subject">{item.subject}</p>
                </div>
                <div className="assignment-actions">
                  <button 
                    className="btn-icon" 
                    onClick={() => onToggleStatus(item._id!, item.status === 'Pending' ? 'Completed' : 'Pending')}
                    title={item.status === 'Pending' ? "Mark as Done" : "Mark as Pending"}
                  >
                    <CheckCircle size={18} color={item.status === 'Completed' ? '#10b981' : '#94a3b8'} />
                  </button>
                  <button className="btn-icon text-danger" onClick={() => onDelete(item._id!)}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="assignment-footer">
                <div className="assignment-deadline">
                  <Clock size={14} />
                  <span>Due: {format(new Date(item.deadline), 'MMM d, h:mm a')}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AssignmentTab;
