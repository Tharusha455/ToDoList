import React from 'react';
import { Clock, MapPin, Edit3, Trash2 } from 'lucide-react';
import type { Schedule } from '../types/index';

interface LectureCardProps {
  lecture: Schedule;
  onDelete: (id: string) => void;
  onEdit: (lecture: Schedule) => void;
}

const LectureCard: React.FC<LectureCardProps> = ({ lecture, onDelete, onEdit }) => {
  return (
    <div className="group relative bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 flex flex-col h-full border-l-4 border-l-indigo-500">
      <div className="flex justify-between items-start gap-3 mb-4">
        <h4 className="text-sm sm:text-base font-bold text-slate-800 leading-snug flex-1">
          {lecture.Subject}
        </h4>
        <div className="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity shrink-0 -mr-1 -mt-1">
          <button onClick={() => onEdit(lecture)} className="p-2 sm:p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 touch-manipulation min-h-[40px] sm:min-h-0" title="Edit">
            <Edit3 size={18} className="sm:w-3.5 sm:h-3.5" />
          </button>
          <button onClick={() => onDelete(lecture._id!)} className="p-2 sm:p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 touch-manipulation min-h-[40px] sm:min-h-0" title="Delete">
            <Trash2 size={18} className="sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      </div>
      
      <div className="mt-auto space-y-2">
        <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-600 bg-slate-50 py-2 px-2.5 rounded-lg border border-slate-100">
          <Clock size={14} className="text-indigo-500 shrink-0" />
          <span className="truncate">{lecture.StartTime} – {lecture.EndTime}</span>
        </div>
        <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-600 bg-slate-50 py-2 px-2.5 rounded-lg border border-slate-100">
          <MapPin size={14} className="text-rose-500 shrink-0" />
          <span className="truncate">{lecture.Venue}</span>
        </div>
      </div>
    </div>
  );
};

export default LectureCard;
