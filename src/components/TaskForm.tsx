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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">{initialTask ? 'Edit Task' : 'Add New Task'}</h2>
          <button className="p-2 -mr-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors focus:ring-2 focus:ring-slate-300 outline-none" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1">Task Title <span className="text-rose-500">*</span></label>
              <input
                autoFocus
                required
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                placeholder="What needs to be done?"
                value={taskTitle}
                onChange={e => setTaskTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category</label>
                <div className="relative">
                  <select 
                    className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none appearance-none"
                    value={category} 
                    onChange={e => setCategory(e.target.value as Category)}
                  >
                    <option value="Assignment">Assignment</option>
                    <option value="Exam">Exam</option>
                    <option value="Practical">Practical</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Priority</label>
                <div className="relative">
                  <select 
                    className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none appearance-none"
                    value={priority} 
                    onChange={e => setPriority(e.target.value as Priority)}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1">Due Date & Time <span className="text-rose-500">*</span></label>
              <input
                type="datetime-local"
                required
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>

            <div className="pt-2 flex gap-3">
              <button type="button" className="flex-1 px-4 py-2.5 text-slate-600 bg-white border border-slate-300 rounded-xl font-semibold hover:bg-slate-50 transition-colors" onClick={onClose}>Cancel</button>
              <button type="submit" className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-white bg-indigo-600 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200">
                <Plus size={18} />
                {initialTask ? 'Update' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskForm;
