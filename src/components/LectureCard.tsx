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
    <div className="lecture-card-wrap">
      <div className="lecture-actions">
        <button onClick={() => onEdit(lecture)} title="Edit"><Edit3 size={13} /></button>
        <button onClick={() => onDelete(lecture._id!)} title="Delete"><Trash2 size={13} /></button>
      </div>
      <div className="lecture-subject">{lecture.Subject}</div>
      <div className="lecture-time">
        <Clock size={11} />
        {lecture.StartTime} – {lecture.EndTime}
      </div>
      <div className="lecture-venue">
        <MapPin size={11} />
        {lecture.Venue}
      </div>
    </div>
  );
};

export default LectureCard;
