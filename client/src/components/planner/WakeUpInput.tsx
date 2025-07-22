import * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit3 } from 'lucide-react';

interface WakeUpInputProps {
  value: string;
  onUpdate: (time: string) => void;
}

export function WakeUpInput({ value, onUpdate }: WakeUpInputProps) {
  const [isEditingHour, setIsEditingHour] = useState(false);
  const [isEditingMinute, setIsEditingMinute] = useState(false);
  const [tempHour, setTempHour] = useState('');
  const [tempMinute, setTempMinute] = useState('');

  const handleSave = () => {
    const [currentHour, currentMinute] = value.split(':');
    const finalHour = tempHour || currentHour;
    const finalMinute = tempMinute || currentMinute;
    const newTime = `${finalHour.padStart(2, '0')}:${finalMinute.padStart(2, '0')}`;
    onUpdate(newTime);
    setIsEditingHour(false);
    setIsEditingMinute(false);
    setTempHour('');
    setTempMinute('');
  };

  const handleCancel = () => {
    setIsEditingHour(false);
    setIsEditingMinute(false);
    setTempHour('');
    setTempMinute('');
  };

  const startEditingHour = () => {
    const [hour] = value.split(':');
    setTempHour(hour);
    setIsEditingHour(true);
  };

  const startEditingMinute = () => {
    const [, minute] = value.split(':');
    setTempMinute(minute);
    setIsEditingMinute(true);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  const [currentHour, currentMinute] = value.split(':');
  const isEditing = isEditingHour || isEditingMinute;

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <span>woke_up:</span>
        
        {isEditingHour ? (
          <div className="relative">
            <select 
              value={tempHour} 
              onChange={(e) => setTempHour(e.target.value)}
              className="w-16 h-8 text-sm border rounded px-1 bg-background"
              autoFocus
            >
              {hours.map(hour => (
                <option key={hour} value={hour}>{hour}</option>
              ))}
            </select>
          </div>
        ) : (
          <div 
            className="w-16 h-8 flex items-center justify-center text-sm border rounded cursor-pointer hover:bg-muted"
            onClick={startEditingHour}
          >
            {currentHour}
          </div>
        )}
        
        <span>:</span>
        
        {isEditingMinute ? (
          <div className="relative">
            <select 
              value={tempMinute} 
              onChange={(e) => setTempMinute(e.target.value)}
              className="w-16 h-8 text-sm border rounded px-1 bg-background"
              autoFocus
            >
              {minutes.map(minute => (
                <option key={minute} value={minute}>{minute}</option>
              ))}
            </select>
          </div>
        ) : (
          <div 
            className="w-16 h-8 flex items-center justify-center text-sm border rounded cursor-pointer hover:bg-muted"
            onClick={startEditingMinute}
          >
            {currentMinute}
          </div>
        )}
        
        <div className="flex gap-2">
          <Button onClick={handleSave} size="sm" variant="ghost" className="h-8 text-xs px-2">
            Save
          </Button>
          <Button onClick={handleCancel} size="sm" variant="ghost" className="h-8 text-xs px-2">
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 cursor-pointer" onClick={startEditingHour}>
      <span>woke_up: "{value}"</span>
      <Edit3 className="h-3 w-3 opacity-60" />
    </div>
  );
}