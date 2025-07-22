import * as React from 'react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Alarm } from './AlarmContainer';
import { Bell, BellOff, Edit3, Trash2, Clock, Calendar, Repeat, Volume2, Check, X } from 'lucide-react';

interface AlarmCardProps {
  alarm: Alarm;
  onUpdate: (id: string, updates: Partial<Alarm>) => void;
  onDelete: (id: string) => void;
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

export function AlarmCard({ alarm, onUpdate, onDelete }: AlarmCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: alarm.name,
    time: alarm.time,
    date: alarm.date,
    message: alarm.message,
    isRepeating: alarm.isRepeating,
    repeatDays: alarm.repeatDays,
    soundEnabled: alarm.soundEnabled,
  });

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatRepeatDays = (days: string[]) => {
    const dayMap: Record<string, string> = {
      monday: 'Mon',
      tuesday: 'Tue',
      wednesday: 'Wed',
      thursday: 'Thu',
      friday: 'Fri',
      saturday: 'Sat',
      sunday: 'Sun'
    };
    
    return days.map(day => dayMap[day]).join(', ');
  };

  const getTimeUntilAlarm = () => {
    const now = new Date();
    const [hours, minutes] = alarm.time.split(':').map(Number);
    
    let alarmTime = new Date();
    alarmTime.setHours(hours, minutes, 0, 0);
    
    // If alarm time has passed today, set for tomorrow
    if (alarmTime <= now) {
      alarmTime.setDate(alarmTime.getDate() + 1);
    }
    
    const diff = alarmTime.getTime() - now.getTime();
    const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
    const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hoursLeft > 0) {
      return `${hoursLeft}h ${minutesLeft}m`;
    } else {
      return `${minutesLeft}m`;
    }
  };

  const handleEdit = () => {
    setEditData({
      name: alarm.name,
      time: alarm.time,
      date: alarm.date,
      message: alarm.message,
      isRepeating: alarm.isRepeating,
      repeatDays: alarm.repeatDays,
      soundEnabled: alarm.soundEnabled,
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    onUpdate(alarm.id, editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const toggleRepeatDay = (day: string) => {
    const updatedDays = editData.repeatDays.includes(day)
      ? editData.repeatDays.filter(d => d !== day)
      : [...editData.repeatDays, day];
    
    setEditData(prev => ({ ...prev, repeatDays: updatedDays }));
  };

  if (isEditing) {
    return (
      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-blue-600" />
            <span className="text-blue-800 dark:text-blue-200">Edit Alarm</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-alarm-name">Alarm Name</Label>
              <Input
                id="edit-alarm-name"
                value={editData.name}
                onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Study Session"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-alarm-time">Time</Label>
              <Input
                id="edit-alarm-time"
                type="time"
                value={editData.time}
                onChange={(e) => setEditData(prev => ({ ...prev, time: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-alarm-message">Message (Optional)</Label>
            <Textarea
              id="edit-alarm-message"
              value={editData.message}
              onChange={(e) => setEditData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Time to study!"
              rows={2}
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editData.isRepeating}
                onChange={(e) => setEditData(prev => ({ ...prev, isRepeating: e.target.checked }))}
              />
              <span className="text-sm">Repeat alarm</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editData.soundEnabled}
                onChange={(e) => setEditData(prev => ({ ...prev, soundEnabled: e.target.checked }))}
              />
              <span className="text-sm">Play sound</span>
            </label>
          </div>

          {!editData.isRepeating && (
            <div className="space-y-2">
              <Label htmlFor="edit-alarm-date">Date</Label>
              <Input
                id="edit-alarm-date"
                type="date"
                value={editData.date}
                onChange={(e) => setEditData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
          )}

          {editData.isRepeating && (
            <div className="space-y-2">
              <Label>Repeat on days</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <Button
                    key={day.value}
                    type="button"
                    variant={editData.repeatDays.includes(day.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleRepeatDay(day.value)}
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSave} className="gap-2">
              <Check className="h-4 w-4" />
              Save Changes
            </Button>
            <Button onClick={handleCancel} variant="outline" className="gap-2">
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={`transition-all ${alarm.isActive ? 'border-blue-200 bg-blue-50/50 dark:bg-blue-950/10' : 'opacity-60'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {alarm.isActive ? (
                <Bell className="h-5 w-5 text-blue-600" />
              ) : (
                <BellOff className="h-5 w-5 text-gray-400" />
              )}
              <span className={alarm.isActive ? 'text-blue-800 dark:text-blue-200' : 'text-gray-500'}>
                {alarm.name}
              </span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor={`alarm-${alarm.id}`} className="text-sm">
                {alarm.isActive ? 'On' : 'Off'}
              </Label>
              <Switch
                id={`alarm-${alarm.id}`}
                checked={alarm.isActive}
                onCheckedChange={(checked) => onUpdate(alarm.id, { isActive: checked })}
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">{formatTime(alarm.time)}</div>
                  {alarm.isActive && (
                    <div className="text-xs text-muted-foreground">
                      in {getTimeUntilAlarm()}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              {alarm.isRepeating ? (
                <div className="flex items-center gap-2">
                  <Repeat className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Repeats</div>
                    <div className="text-xs text-muted-foreground">
                      {formatRepeatDays(alarm.repeatDays)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">One-time</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(alarm.date)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {alarm.message && (
            <div className="p-3 bg-muted/50 rounded-md">
              <p className="text-sm italic">"{alarm.message}"</p>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Sound {alarm.soundEnabled ? 'enabled' : 'disabled'}
              </span>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleEdit}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title="Edit alarm"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              
              <Button
                onClick={() => setShowDeleteDialog(true)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Alarm"
        description="Are you sure you want to delete this alarm? This action cannot be undone."
        onConfirm={() => onDelete(alarm.id)}
      />
    </>
  );
}
