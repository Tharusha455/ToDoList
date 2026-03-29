import React from 'react';
import { CheckCircle2, Circle, Clock, Edit3, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import type { Task } from '../types/index';

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onToggle, onDelete, onEdit }) => {
  const priorityClass = task.Priority === 'High' 
    ? 'bg-rose-100 text-rose-700 border-rose-200' 
    : task.Priority === 'Medium' 
      ? 'bg-amber-100 text-amber-700 border-amber-200' 
      : 'bg-emerald-100 text-emerald-700 border-emerald-200';

  return (
    <div className={`group relative bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 ${task.Status ? 'opacity-75 bg-slate-50' : ''}`}>
      <div className="flex items-start gap-3 sm:gap-4">
        <button
          onClick={() => onToggle(task._id!)}
          className="mt-1 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full transition-transform active:scale-95 touch-manipulation"
          title={task.Status ? 'Mark pending' : 'Mark complete'}
        >
          {task.Status
            ? <CheckCircle2 size={24} className="text-emerald-500" />
            : <Circle size={24} className="text-slate-300 hover:text-blue-500 transition-colors" />
          }
        </button>

        <div className="flex-1 min-w-0">
          <h3 className={`text-base font-bold text-slate-800 break-words mb-2.5 leading-snug ${task.Status ? 'line-through text-slate-400' : ''}`}>
            {task.TaskTitle}
          </h3>
          
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`px-2 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border rounded-md shadow-sm ${priorityClass}`}>
              {task.Priority}
            </span>
            <span className="px-2 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md shadow-sm">
              {task.Category}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Clock size={13} className="text-slate-400" />
            {format(new Date(task.DueDate), 'MMM d, yyyy \u2022 h:mm a')}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(task)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation min-h-[44px] sm:min-h-0" title="Edit">
            <Edit3 size={18} className="sm:w-4 sm:h-4" />
          </button>
          <button onClick={() => onDelete(task._id!)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 touch-manipulation min-h-[44px] sm:min-h-0" title="Delete">
            <Trash2 size={18} className="sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
