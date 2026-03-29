import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle, Clock, AlertCircle, X } from 'lucide-react';
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
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Assignments</h2>
          <p className="text-sm text-slate-500 mt-1">Manage your coursework and approaching deadlines.</p>
        </div>
        <button 
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-all active:scale-95 shadow-sm shadow-indigo-200"
          onClick={() => setShowForm(true)}
        >
          <Plus size={18} /> Add Assignment
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">New Assignment</h3>
              <button 
                onClick={() => setShowForm(false)} 
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Assignment Title</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                    placeholder="e.g. Advanced Calculus HW"
                    value={newAssignment.title}
                    onChange={e => setNewAssignment({...newAssignment, title: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subject</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                    placeholder="e.g. Mathematics"
                    value={newAssignment.subject}
                    onChange={e => setNewAssignment({...newAssignment, subject: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Deadline</label>
                  <input 
                    type="datetime-local" 
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                    value={newAssignment.deadline}
                    onChange={e => setNewAssignment({...newAssignment, deadline: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description (Optional)</label>
                  <textarea 
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none resize-none min-h-[100px]"
                    placeholder="Add any links or notes here..."
                    value={newAssignment.description}
                    onChange={e => setNewAssignment({...newAssignment, description: e.target.value})}
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" className="flex-1 px-4 py-2.5 text-slate-600 bg-white border border-slate-300 rounded-xl font-bold hover:bg-slate-50 transition-colors" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2.5 text-white bg-indigo-600 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200">Create</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {assignments.length === 0 ? (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-white border-2 border-dashed border-slate-200 rounded-2xl">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mb-4">
              <span className="text-3xl">📝</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">No assignments yet</h3>
            <p className="text-sm text-slate-500 max-w-sm">You're all caught up! Click the button above to add a new assignment.</p>
          </div>
        ) : (
          assignments
            .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
            .map(assignment => (
            <div key={assignment._id} className={`group relative bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col ${assignment.status === 'Completed' ? 'opacity-60 bg-slate-50 grayscale-[50%]' : 'hover:-translate-y-1 hover:border-indigo-200'}`}>
              <div className="flex justify-between items-start mb-4">
                <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg shadow-sm">
                  {assignment.subject}
                </span>
                
                <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => onToggleStatus(assignment._id!, assignment.status === 'Pending' ? 'Completed' : 'Pending')}
                    className={`p-2 rounded-lg transition-colors focus:ring-2 focus:ring-offset-1 focus:outline-none min-h-[44px] md:min-h-0 touch-manipulation flex items-center justify-center shadow-sm border border-transparent ${assignment.status === 'Completed' ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-200' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 focus:ring-emerald-500 bg-white hover:border-emerald-200'}`}
                    title="Mark Complete"
                  >
                    <CheckCircle size={18} />
                  </button>
                  <button 
                    onClick={() => onDelete(assignment._id!)}
                    className="p-2 text-slate-400 bg-white shadow-sm border border-transparent hover:border-rose-200 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors focus:ring-2 focus:ring-offset-1 focus:outline-none focus:ring-rose-500 md:min-h-0 touch-manipulation min-h-[44px] flex items-center justify-center"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <h3 className={`text-base font-bold text-slate-800 mb-2 leading-snug ${assignment.status === 'Completed' ? 'line-through text-slate-500' : ''}`}>
                {assignment.title}
                {assignment.status === 'Pending' && isUrgent(assignment.deadline) && (
                  <span className="inline-flex items-center gap-1.5 ml-2 px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-bold uppercase tracking-wider rounded border border-rose-200 align-text-top">
                    <AlertCircle size={11} /> Urgent
                  </span>
                )}
              </h3>
              
              {assignment.description && (
                <p className="text-sm text-slate-500 mb-5 line-clamp-2 leading-relaxed">
                  {assignment.description}
                </p>
              )}

              <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className={`flex items-center gap-1.5 text-xs font-semibold ${assignment.status === 'Completed' ? 'text-slate-400' : isUrgent(assignment.deadline) ? 'text-rose-500' : 'text-slate-500'}`}>
                  <Clock size={14} />
                  <span>Due {format(new Date(assignment.deadline), 'MMM d, h:mm a')}</span>
                </div>
                <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border shadow-sm ${assignment.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-white text-slate-500 border-slate-200'}`}>
                  {assignment.status}
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
