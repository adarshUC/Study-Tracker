import * as React from 'react';
import { formatTime } from '@/utils/timeFormat';

interface TimeDisplayProps {
  time: number;
}

export function TimeDisplay({ time }: TimeDisplayProps) {
  return (
    <div className="text-right">
      <div className="text-2xl font-mono font-bold text-primary">
        {formatTime(time)}
      </div>
    </div>
  );
}