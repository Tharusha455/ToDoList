import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import type { Schedule, DayOfWeek } from '../types/index';

interface LectureFormProps {
  onSave: (lecture: any) => void;
  onClose: () => void;
  initialLecture?: Schedule | null;
}

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const LectureForm: React.FC<LectureFormProps> = ({ onSave, onClose, initialLecture }) => {
  const [subject, setSubject] = useState(initialLecture?.Subject || '');
  const [day, setDay] = useState<DayOfWeek>(initialLecture?.Day || 'Monday');
  const [startTime, setStartTime] = useState(initialLecture?.StartTime || '09:00');
  const [endTime, setEndTime] = useState(initialLecture?.EndTime || '10:30');
  const [venue, setVenue] = useState(initialLecture?.Venue || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      _id: initialLecture?._id,
      Subject: subject,
      Day: day,
      StartTime: startTime,
      EndTime: endTime,
      Venue: venue
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{initialLecture ? 'Edit Lecture' : 'Add New Lecture'}</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Subject Name</label>
            <input
              autoFocus
              required
              placeholder="e.g. Advanced Mathematics"
              value={subject}
              onChange={e => setSubject(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Day of the Week</label>
            <div className="select-wrap">
              <select value={day} onChange={e => setDay(e.target.value as DayOfWeek)}>
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Start Time</label>
              <input type="time" required value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">End Time</label>
              <input type="time" required value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Venue or Link</label>
            <input
              placeholder="Room 302 or https://zoom.us/..."
              value={venue}
              onChange={e => setVenue(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-submit">
            <Plus size={16} />
            {initialLecture ? 'Update Lecture' : 'Add Lecture'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LectureForm;
