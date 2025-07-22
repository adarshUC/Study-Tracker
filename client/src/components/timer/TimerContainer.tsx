import * as React from 'react';
import { useState, useEffect } from 'react';
import { TimerCard } from './TimerCard';
import { TimerTemplates } from './TimerTemplates';
import { EyeProtectionTimer } from './EyeProtectionTimer';
import { QuoteSection } from '../shared/QuoteSection';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export interface Timer {
  id: string;
  name: string;
  duration: number; // in seconds
  remainingTime: number;
  isRunning: boolean;
  isFinished: boolean;
  customAudioFile?: string;
}

export function TimerContainer() {
  const [timers, setTimers] = useState<Timer[]>(() => {
    const saved = localStorage.getItem('timers');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('timers', JSON.stringify(timers));
    // Notify App component about timer changes
    window.dispatchEvent(new CustomEvent('timersUpdated', {
      detail: { timers }
    }));
  }, [timers]);

  // Listen for updates from App component (floating controls)
  useEffect(() => {
    const handleUpdateFromApp = (event: CustomEvent) => {
      setTimers(event.detail.timers);
    };

    window.addEventListener('updateTimersFromApp', handleUpdateFromApp as EventListener);
    return () => window.removeEventListener('updateTimersFromApp', handleUpdateFromApp as EventListener);
  }, []);

  useEffect(() => {
    // Listen for task timer events from daily planner
    const handleTaskTimer = (event: CustomEvent) => {
      const { taskName } = event.detail;
      addTimer(taskName, 25); // Default 25 minutes for tasks
    };

    window.addEventListener('startTaskTimer', handleTaskTimer as EventListener);
    
    return () => {
      window.removeEventListener('startTaskTimer', handleTaskTimer as EventListener);
    };
  }, []);

  const addTimer = (name: string, minutes: number) => {
    const duration = minutes * 60;
    const newTimer: Timer = {
      id: Date.now().toString(),
      name,
      duration,
      remainingTime: duration,
      isRunning: false,
      isFinished: false,
    };
    setTimers(prev => [...prev, newTimer]);
  };

  const updateTimer = (id: string, updates: Partial<Timer>) => {
    setTimers(prev => prev.map(timer => 
      timer.id === id ? { ...timer, ...updates } : timer
    ));
  };

  const deleteTimer = (id: string) => {
    setTimers(prev => prev.filter(timer => timer.id !== id));
  };

  const addCustomTimer = () => {
    addTimer('Custom Timer', 25); // Default 25 minutes
  };

  return (
    <div className="space-y-8">
      <QuoteSection 
        quotes={[
          "Every Second Counts for someone who really knows how valuable time is.",
          "Time management is life management.",
          "Focus on being productive instead of busy.",
          "The key is not to prioritize what's on your schedule, but to schedule your priorities.",
          "Time is what we want most, but what we use worst."
        ]}
      />
      
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Timer</h2>
      </div>

      <EyeProtectionTimer />
      
      {timers.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Active Timers</h3>
          <div className="space-y-4">
            {timers.map((timer) => (
              <TimerCard
                key={timer.id}
                timer={timer}
                onUpdate={updateTimer}
                onDelete={deleteTimer}
              />
            ))}
          </div>
        </div>
      )}
      
      <div>
        <h3 className="text-xl font-semibold mb-4">Quick Templates</h3>
        <TimerTemplates onAddTimer={addTimer} />
      </div>
      
      <div className="text-center">
        <Button onClick={addCustomTimer} variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Custom Timer
        </Button>
      </div>
    </div>
  );
}
