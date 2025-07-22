import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Navigation } from './components/navigation/Navigation';
import { DailyPlanner } from './components/planner/DailyPlanner';
import { CalendarContainer } from './components/calendar/CalendarContainer';
import { TaskDump } from './components/tasks/TaskDump';
import { DataManager } from './components/data/DataManager';
import { ThemeToggle } from './components/shared/ThemeToggle';
import { FloatingControls } from './components/shared/FloatingControls';
import { TimerContainer } from './components/timer/TimerContainer';
import { StopwatchContainer } from './components/stopwatch/StopwatchContainer';
import { AlarmContainer } from './components/alarm/AlarmContainer';

type Section = 'planner' | 'calendar' | 'tasks' | 'timer' | 'stopwatch' | 'alarms';

interface Timer {
  id: string;
  name: string;
  duration: number;
  remainingTime: number;
  isRunning: boolean;
  isFinished: boolean;
  customAudioFile?: string;
}

interface Stopwatch {
  id: string;
  name: string;
  time: number;
  isRunning: boolean;
  totalTime: number;
}

interface Alarm {
  id: string;
  name: string;
  time: string;
  date: string;
  message: string;
  isActive: boolean;
  isRepeating: boolean;
  repeatDays: string[];
  soundEnabled: boolean;
}

function App() {
  const [activeSection, setActiveSection] = useState<Section>('planner');
  const [timers, setTimers] = useState<Timer[]>(() => {
    const saved = localStorage.getItem('timers');
    return saved ? JSON.parse(saved) : [];
  });
  const [stopwatches, setStopwatches] = useState<Stopwatch[]>(() => {
    const saved = localStorage.getItem('stopwatches');
    return saved ? JSON.parse(saved) : [];
  });
  const [alarms, setAlarms] = useState<Alarm[]>(() => {
    const saved = localStorage.getItem('alarms');
    return saved ? JSON.parse(saved) : [];
  });

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const alarmIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('timers', JSON.stringify(timers));
  }, [timers]);

  useEffect(() => {
    localStorage.setItem('stopwatches', JSON.stringify(stopwatches));
  }, [stopwatches]);

  useEffect(() => {
    localStorage.setItem('alarms', JSON.stringify(alarms));
  }, [alarms]);

  // Global timer management - runs regardless of active section
  useEffect(() => {
    const runningTimers = timers.filter(t => t.isRunning && !t.isFinished);
    
    if (runningTimers.length > 0) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      
      timerIntervalRef.current = setInterval(() => {
        setTimers(prev => prev.map(timer => {
          if (timer.isRunning && timer.remainingTime > 0) {
            const newRemainingTime = Math.max(0, timer.remainingTime - 1);
            
            // Check if timer just finished
            if (newRemainingTime === 0 && timer.remainingTime > 0) {
              // Show notification
              if ('Notification' in window && Notification.permission === 'granted') {
                const notification = new Notification(`Timer "${timer.name}" finished!`, {
                  body: `Your timer "${timer.name}" has completed!`,
                  icon: '/favicon.ico',
                  tag: timer.id,
                  requireInteraction: true
                });

                notification.onclick = () => {
                  window.focus();
                  notification.close();
                };

                // Auto-close after 30 seconds
                setTimeout(() => {
                  notification.close();
                }, 30000);
              }
              
              // Play notification sound
              playTimerNotificationSound(timer.customAudioFile);
              
              return { ...timer, remainingTime: 0, isRunning: false, isFinished: true };
            }
            
            return { ...timer, remainingTime: newRemainingTime };
          }
          return timer;
        }));
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timers]);

  // Enhanced global alarm management with more precise timing
  useEffect(() => {
    const activeAlarms = alarms.filter(a => a.isActive);
    
    if (activeAlarms.length > 0) {
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
      }
      
      // Check every 5 seconds for better accuracy
      alarmIntervalRef.current = setInterval(() => {
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5); // HH:MM
        const currentDate = now.toISOString().split('T')[0];
        const currentSeconds = now.getSeconds();
        
        // Only trigger alarms at the start of the minute (0-5 seconds)
        if (currentSeconds > 5) return;
        
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const currentDay = dayNames[now.getDay()];

        console.log('Checking alarms at:', currentTime, 'on', currentDay);

        alarms.forEach(alarm => {
          if (!alarm.isActive) return;

          const shouldTrigger = alarm.time === currentTime && (
            (!alarm.isRepeating && alarm.date === currentDate) ||
            (alarm.isRepeating && alarm.repeatDays.includes(currentDay))
          );

          if (shouldTrigger) {
            // Check if alarm was already triggered in this minute
            const triggerKey = `alarm-${alarm.id}-${currentDate}-${currentTime}`;
            const alreadyTriggered = sessionStorage.getItem(triggerKey);
            
            if (!alreadyTriggered) {
              console.log('Triggering alarm:', alarm.name, 'at', currentTime);
              sessionStorage.setItem(triggerKey, 'true');
              
              // Clean up old session keys (older than 24 hours)
              const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
              const yesterdayStr = yesterday.toISOString().split('T')[0];
              Object.keys(sessionStorage).forEach(key => {
                if (key.startsWith('alarm-') && key.includes(yesterdayStr)) {
                  sessionStorage.removeItem(key);
                }
              });
              
              triggerAlarm(alarm);
            }
          }
        });
      }, 5000); // Check every 5 seconds
    } else {
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
        alarmIntervalRef.current = null;
      }
    }

    return () => {
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
      }
    };
  }, [alarms]);

  // Listen for updates from timer section
  useEffect(() => {
    const handleTimersUpdated = (event: CustomEvent) => {
      setTimers(event.detail.timers);
    };

    window.addEventListener('timersUpdated', handleTimersUpdated as EventListener);
    return () => window.removeEventListener('timersUpdated', handleTimersUpdated as EventListener);
  }, []);

  // Listen for updates from stopwatch section
  useEffect(() => {
    const handleStopwatchesUpdated = (event: CustomEvent) => {
      setStopwatches(event.detail.stopwatches);
    };

    window.addEventListener('stopwatchesUpdated', handleStopwatchesUpdated as EventListener);
    return () => window.removeEventListener('stopwatchesUpdated', handleStopwatchesUpdated as EventListener);
  }, []);

  // Listen for updates from alarm section
  useEffect(() => {
    const handleAlarmsUpdated = (event: CustomEvent) => {
      setAlarms(event.detail.alarms);
    };

    window.addEventListener('alarmsUpdated', handleAlarmsUpdated as EventListener);
    return () => window.removeEventListener('alarmsUpdated', handleAlarmsUpdated as EventListener);
  }, []);

  // Request notification permission on app start and ensure it's granted
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          console.log('Notification permission:', permission);
          if (permission === 'granted') {
            // Test notification
            new Notification('Study Tracker', {
              body: 'Notifications are now enabled for timers and alarms!',
              icon: '/favicon.ico',
              tag: 'permission-granted',
              silent: true
            });
          }
        });
      } else if (Notification.permission === 'granted') {
        console.log('Notifications already enabled');
      } else {
        console.warn('Notifications are denied - alarms will not work properly');
      }
    }
  }, []);

  const playTimerNotificationSound = (customAudioFile?: string) => {
    if (customAudioFile) {
      const audio = new Audio(customAudioFile);
      audio.volume = 0.8;
      audio.play().catch(() => {
        playFallbackTimerSound();
      });
    } else {
      playFallbackTimerSound();
    }
  };

  const playFallbackTimerSound = () => {
    try {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          const context = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = context.createOscillator();
          const gainNode = context.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(context.destination);
          
          oscillator.frequency.value = 880;
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0, context.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.8, context.currentTime + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.8);
          
          oscillator.start();
          oscillator.stop(context.currentTime + 0.8);
        }, i * 900);
      }
    } catch (error) {
      console.log('Audio not supported');
    }
  };

  const triggerAlarm = (alarm: Alarm) => {
    console.log('Triggering alarm:', alarm.name, 'at', new Date().toLocaleTimeString());
    
    // Show browser notification with more aggressive settings
    if ('Notification' in window && Notification.permission === 'granted') {
      const notificationTitle = `⏰ ${alarm.name}`;
      const notificationBody = alarm.message || `It's time for "${alarm.name}"!`;
      
      const notification = new Notification(notificationTitle, {
        body: notificationBody,
        icon: '/favicon.ico',
        tag: `alarm-${alarm.id}`,
        requireInteraction: true,
        silent: !alarm.soundEnabled,
        vibrate: [200, 100, 200], // Vibration pattern for mobile
        timestamp: Date.now()
      });

      notification.onclick = () => {
        window.focus();
        // Switch to alarms section
        setActiveSection('alarms');
        notification.close();
      };

      // Auto-close after 1 minute
      setTimeout(() => {
        notification.close();
      }, 60000);
    } else {
      // Fallback alert if notifications aren't available
      const message = `⏰ ${alarm.name}\n\n${alarm.message || `It's time for "${alarm.name}"!`}`;
      alert(message);
    }

    // Play alarm sound
    if (alarm.soundEnabled) {
      playAlarmSound(alarm.customSound);
    }

    // If it's a one-time alarm, deactivate it
    if (!alarm.isRepeating) {
      setAlarms(prev => prev.map(a => 
        a.id === alarm.id ? { ...a, isActive: false } : a
      ));
    }
  };

  const playAlarmSound = (customSound?: string) => {
    if (customSound) {
      const audio = new Audio(customSound);
      audio.volume = 0.8;
      audio.play().catch(() => {
        playDefaultAlarmSound();
      });
    } else {
      playDefaultAlarmSound();
    }
  };

  const playDefaultAlarmSound = () => {
    try {
      // More aggressive alarm sound
      for (let i = 0; i < 8; i++) {
        setTimeout(() => {
          const context = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = context.createOscillator();
          const gainNode = context.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(context.destination);
          
          // Alternating frequencies for more attention-grabbing sound
          oscillator.frequency.value = i % 2 === 0 ? 800 : 1000;
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0, context.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.8, context.currentTime + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.8);
          
          oscillator.start();
          oscillator.stop(context.currentTime + 0.8);
        }, i * 1000);
      }
    } catch (error) {
      console.log('Audio not supported');
    }
  };

  const handleAddTimer = (name: string, minutes: number) => {
    const duration = minutes * 60;
    const newTimer: Timer = {
      id: Date.now().toString(),
      name,
      duration,
      remainingTime: duration,
      isRunning: false,
      isFinished: false,
    };
    setTimers(prev => {
      const updated = [...prev, newTimer];
      // Notify timer section
      window.dispatchEvent(new CustomEvent('updateTimersFromApp', { detail: { timers: updated } }));
      return updated;
    });
  };

  const handleAddStopwatch = () => {
    const newStopwatch: Stopwatch = {
      id: Date.now().toString(),
      name: `Stopwatch ${stopwatches.length + 1}`,
      time: 0,
      isRunning: false,
      totalTime: 0,
    };
    setStopwatches(prev => {
      const updated = [...prev, newStopwatch];
      // Notify stopwatch section
      window.dispatchEvent(new CustomEvent('updateStopwatchesFromApp', { detail: { stopwatches: updated } }));
      return updated;
    });
  };

  const handleAddAlarm = (name: string, time: string) => {
    const newAlarm: Alarm = {
      id: Date.now().toString(),
      name,
      time,
      date: new Date().toISOString().split('T')[0],
      message: '',
      isActive: true,
      isRepeating: false,
      repeatDays: [],
      soundEnabled: true,
    };
    setAlarms(prev => {
      const updated = [...prev, newAlarm];
      // Notify alarm section
      window.dispatchEvent(new CustomEvent('updateAlarmsFromApp', { detail: { alarms: updated } }));
      return updated;
    });
  };

  const handleUpdateTimer = (id: string, updates: Partial<Timer>) => {
    setTimers(prev => {
      const updated = prev.map(timer => 
        timer.id === id ? { ...timer, ...updates } : timer
      );
      // Notify timer section
      window.dispatchEvent(new CustomEvent('updateTimersFromApp', { detail: { timers: updated } }));
      return updated;
    });
  };

  const handleUpdateStopwatch = (id: string, updates: Partial<Stopwatch>) => {
    setStopwatches(prev => {
      const updated = prev.map(stopwatch => 
        stopwatch.id === id ? { ...stopwatch, ...updates } : stopwatch
      );
      // Notify stopwatch section
      window.dispatchEvent(new CustomEvent('updateStopwatchesFromApp', { detail: { stopwatches: updated } }));
      return updated;
    });
  };

  const handleUpdateAlarm = (id: string, updates: Partial<Alarm>) => {
    setAlarms(prev => {
      const updated = prev.map(alarm => 
        alarm.id === id ? { ...alarm, ...updates } : alarm
      );
      // Notify alarm section
      window.dispatchEvent(new CustomEvent('updateAlarmsFromApp', { detail: { alarms: updated } }));
      return updated;
    });
  };

  const handleDeleteTimer = (id: string) => {
    setTimers(prev => {
      const updated = prev.filter(timer => timer.id !== id);
      // Notify timer section
      window.dispatchEvent(new CustomEvent('updateTimersFromApp', { detail: { timers: updated } }));
      return updated;
    });
  };

  const handleDeleteStopwatch = (id: string) => {
    setStopwatches(prev => {
      const updated = prev.filter(stopwatch => stopwatch.id !== id);
      // Notify stopwatch section
      window.dispatchEvent(new CustomEvent('updateStopwatchesFromApp', { detail: { stopwatches: updated } }));
      return updated;
    });
  };

  const handleDeleteAlarm = (id: string) => {
    setAlarms(prev => {
      const updated = prev.filter(alarm => alarm.id !== id);
      // Notify alarm section
      window.dispatchEvent(new CustomEvent('updateAlarmsFromApp', { detail: { alarms: updated } }));
      return updated;
    });
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'planner':
        return <DailyPlanner />;
      case 'calendar':
        return <CalendarContainer />;
      case 'tasks':
        return <TaskDump />;
      case 'timer':
        return <TimerContainer />;
      case 'stopwatch':
        return <StopwatchContainer />;
      case 'alarms':
        return <AlarmContainer />;
      default:
        return <DailyPlanner />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="w-20"></div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">Study Tracker</h1>
              <p className="text-muted-foreground text-sm sm:text-base">For JEE Aspirants & Students</p>
            </div>
            <div className="w-20 flex justify-end">
              <ThemeToggle />
            </div>
          </div>
        </div>
        
        <div className="mb-6 sm:mb-8">
          <Navigation activeSection={activeSection} onSectionChange={setActiveSection} />
        </div>
        
        <div className="w-full">
          {renderSection()}
        </div>
      </div>
      
      <DataManager />
      
      <FloatingControls
        timers={timers}
        stopwatches={stopwatches}
        alarms={alarms}
        onAddTimer={handleAddTimer}
        onAddStopwatch={handleAddStopwatch}
        onAddAlarm={handleAddAlarm}
        onUpdateTimer={handleUpdateTimer}
        onUpdateStopwatch={handleUpdateStopwatch}
        onUpdateAlarm={handleUpdateAlarm}
        onDeleteTimer={handleDeleteTimer}
        onDeleteStopwatch={handleDeleteStopwatch}
        onDeleteAlarm={handleDeleteAlarm}
        currentSection={activeSection}
      />
    </div>
  );
}

export default App;
