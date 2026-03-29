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
  const priorityClass = task.Priority === 'High' ? 'badge-high' : task.Priority === 'Medium' ? 'badge-medium' : 'badge-low';

  return (
    <div className="task-card-wrap">
      <button
        onClick={() => onToggle(task._id!)}
        className="task-check-btn"
        title={task.Status ? 'Mark pending' : 'Mark complete'}
      >
        {task.Status
          ? <CheckCircle2 size={20} color="var(--success)" />
          : <Circle size={20} color="#cbd5e1" />
        }
      </button>

      <div className="task-body">
        <div className={`task-title ${task.Status ? 'done' : ''}`}>{task.TaskTitle}</div>
        <div className="task-meta">
          <span className={`badge ${priorityClass}`}>{task.Priority}</span>
          <span className={`badge badge-info`}>{task.Category}</span>
          <span className="due-time">
            <Clock size={11} />
            {format(new Date(task.DueDate), 'MMM d, h:mm a')}
          </span>
        </div>
      </div>

      <div className="task-actions">
        <button onClick={() => onEdit(task)} title="Edit"><Edit3 size={14} /></button>
        <button onClick={() => onDelete(task._id!)} title="Delete"><Trash2 size={14} /></button>
      </div>
    </div>
  );
};

export default TaskCard;
