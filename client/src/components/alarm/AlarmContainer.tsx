import * as React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlarmCard } from './AlarmCard';
import { QuoteSection } from '../shared/QuoteSection';
import { Plus, Bell, Info, Clock } from 'lucide-react';

export interface Alarm {
  id: string;
  name: string;
  time: string; // HH:MM format
  date: string; // YYYY-MM-DD format
  message: string;
  isActive: boolean;
  isRepeating: boolean;
  repeatDays: string[]; // ['monday', 'tuesday', etc.]
  soundEnabled: boolean;
  customSound?: string;
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

export function AlarmContainer() {
  const [alarms, setAlarms] = useState<Alarm[]>(() => {
    const saved = localStorage.getItem('alarms');
    return saved ? JSON.parse(saved) : [];
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [newAlarm, setNewAlarm] = useState<Partial<Alarm>>({
    name: '',
    time: '',
    date: new Date().toISOString().split('T')[0],
    message: '',
    isActive: true,
    isRepeating: false,
    repeatDays: [],
    soundEnabled: true,
  });

  useEffect(() => {
    localStorage.setItem('alarms', JSON.stringify(alarms));
    // Notify App component about alarm changes
    window.dispatchEvent(new CustomEvent('alarmsUpdated', { detail: { alarms } }));
  }, [alarms]);

  // Listen for updates from App component (floating controls)
  useEffect(() => {
    const handleUpdateFromApp = (event: CustomEvent) => {
      setAlarms(event.detail.alarms);
    };

    window.addEventListener('updateAlarmsFromApp', handleUpdateFromApp as EventListener);
    return () => window.removeEventListener('updateAlarmsFromApp', handleUpdateFromApp as EventListener);
  }, []);

  // Update current time display
  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false 
      }));
    };

    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  }, []);

  const addAlarm = () => {
    if (!newAlarm.name || !newAlarm.time) return;

    const alarm: Alarm = {
      id: Date.now().toString(),
      name: newAlarm.name,
      time: newAlarm.time,
      date: newAlarm.date || new Date().toISOString().split('T')[0],
      message: newAlarm.message || '',
      isActive: true,
      isRepeating: newAlarm.isRepeating || false,
      repeatDays: newAlarm.repeatDays || [],
      soundEnabled: newAlarm.soundEnabled !== false,
    };

    setAlarms(prev => [...prev, alarm]);
    setNewAlarm({
      name: '',
      time: '',
      date: new Date().toISOString().split('T')[0],
      message: '',
      isActive: true,
      isRepeating: false,
      repeatDays: [],
      soundEnabled: true,
    });
    setShowAddForm(false);
  };

  const updateAlarm = (id: string, updates: Partial<Alarm>) => {
    setAlarms(prev => prev.map(alarm => 
      alarm.id === id ? { ...alarm, ...updates } : alarm
    ));
  };

  const deleteAlarm = (id: string) => {
    setAlarms(prev => prev.filter(alarm => alarm.id !== id));
  };

  const toggleRepeatDay = (day: string) => {
    const repeatDays = newAlarm.repeatDays || [];
    const updatedDays = repeatDays.includes(day)
      ? repeatDays.filter(d => d !== day)
      : [...repeatDays, day];
    
    setNewAlarm(prev => ({ ...prev, repeatDays: updatedDays }));
  };

  return (
    <div className="space-y-6">
      <QuoteSection 
        quotes={[
          "Time is the most valuable thing we have. Use alarms to stay on track.",
          "A reminder at the right time can change everything.",
          "Discipline is remembering what you want.",
          "Success is about consistency, not perfection.",
          "The future depends on what you do today."
        ]}
      />
      
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Alarms</h2>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Current time: {currentTime}
          </div>
          <Button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Alarm
          </Button>
        </div>
      </div>

      {/* Request notification permission notice */}
      {'Notification' in window && Notification.permission !== 'granted' && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Enable Notifications
              </span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              Allow notifications to receive alarm alerts even when the app is in the background.
            </p>
            <Button 
              onClick={() => Notification.requestPermission()}
              size="sm"
              variant="outline"
            >
              Enable Notifications
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add alarm form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Add New Alarm
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="alarm-name">Alarm Name</Label>
                <Input
                  id="alarm-name"
                  value={newAlarm.name || ''}
                  onChange={(e) => setNewAlarm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Study Session"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="alarm-time">Time</Label>
                <Input
                  id="alarm-time"
                  type="time"
                  value={newAlarm.time || ''}
                  onChange={(e) => setNewAlarm(prev => ({ ...prev, time: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alarm-message">Message (Optional)</Label>
              <Textarea
                id="alarm-message"
                value={newAlarm.message || ''}
                onChange={(e) => setNewAlarm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Time to study!"
                rows={2}
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newAlarm.isRepeating || false}
                  onChange={(e) => setNewAlarm(prev => ({ ...prev, isRepeating: e.target.checked }))}
                />
                <span className="text-sm">Repeat alarm</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newAlarm.soundEnabled !== false}
                  onChange={(e) => setNewAlarm(prev => ({ ...prev, soundEnabled: e.target.checked }))}
                />
                <span className="text-sm">Play sound</span>
              </label>
            </div>

            {!newAlarm.isRepeating && (
              <div className="space-y-2">
                <Label htmlFor="alarm-date">Date</Label>
                <Input
                  id="alarm-date"
                  type="date"
                  value={newAlarm.date || ''}
                  onChange={(e) => setNewAlarm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
            )}

            {newAlarm.isRepeating && (
              <div className="space-y-2">
                <Label>Repeat on days</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map(day => (
                    <Button
                      key={day.value}
                      type="button"
                      variant={newAlarm.repeatDays?.includes(day.value) ? "default" : "outline"}
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
              <Button onClick={addAlarm} className="flex-1">
                Add Alarm
              </Button>
              <Button onClick={() => setShowAddForm(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alarms list */}
      <div className="space-y-4">
        {alarms.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No alarms set yet. Add your first alarm to get started!</p>
            </CardContent>
          </Card>
        ) : (
          alarms.map(alarm => (
            <AlarmCard
              key={alarm.id}
              alarm={alarm}
              onUpdate={updateAlarm}
              onDelete={deleteAlarm}
            />
          ))
        )}
      </div>
    </div>
  );
}
