import React from 'react';

export const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => {
  const r = 46;
  const circ = 2 * Math.PI * r;
  const offset = circ - (progress / 100) * circ;

  return (
    <div className="progress-ring-wrap">
      <svg width="120" height="120" viewBox="0 0 120 120" className="ring-svg">
        <circle className="ring-track" cx="60" cy="60" r={r} />
        <circle
          className="ring-fill"
          cx="60" cy="60" r={r}
          strokeDasharray={`${circ - offset} ${offset}`}
          strokeDashoffset={0}
        />
        <text x="60" y="56" textAnchor="middle" dominantBaseline="middle" className="ring-label">{progress}%</text>
        <text x="60" y="70" textAnchor="middle" dominantBaseline="middle" className="ring-sub">TODAY</text>
      </svg>
      <p>Today's Progress</p>
    </div>
  );
};
