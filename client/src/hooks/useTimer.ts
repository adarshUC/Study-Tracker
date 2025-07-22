import { useState, useEffect, useRef } from 'react';

// Global timer registry to track all timers
const globalTimers = new Map<string, {
  remainingTime: number;
  isRunning: boolean;
  isFinished: boolean;
  duration: number;
  lastUpdate: number;
  callbacks: Set<(updates: any) => void>;
}>();

// Global interval for all timers
let globalTimerInterval: NodeJS.Timeout | null = null;

function startGlobalTimer() {
  if (globalTimerInterval) return;
  
  globalTimerInterval = setInterval(() => {
    const now = Date.now();
    
    globalTimers.forEach((timer, id) => {
      if (timer.isRunning && timer.remainingTime > 0) {
        timer.remainingTime = Math.max(0, timer.remainingTime - 1);
        timer.lastUpdate = now;
        
        if (timer.remainingTime === 0) {
          timer.isRunning = false;
          timer.isFinished = true;
          
          // Play notification sound
          playNotificationSound();
          
          // Show notification
          if (Notification.permission === 'granted') {
            new Notification(`Timer finished!`);
          }
        }
        
        // Notify all callbacks
        timer.callbacks.forEach(callback => {
          callback({
            remainingTime: timer.remainingTime,
            isRunning: timer.isRunning,
            isFinished: timer.isFinished
          });
        });
        
        // Save to localStorage
        saveTimerToStorage(id, timer);
      }
    });
    
    // Stop global timer if no running timers
    const hasRunningTimers = Array.from(globalTimers.values()).some(t => t.isRunning);
    if (!hasRunningTimers && globalTimerInterval) {
      clearInterval(globalTimerInterval);
      globalTimerInterval = null;
    }
  }, 1000);
}

function playNotificationSound() {
  try {
    for (let i = 0; i < 3; i++) {
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
      }, i * 500);
    }
  } catch (error) {
    console.log('Audio not supported');
  }
}

function saveTimerToStorage(id: string, timer: any) {
  const persistentData = JSON.parse(localStorage.getItem('persistentTimers') || '{}');
  persistentData[id] = {
    remainingTime: timer.remainingTime,
    isRunning: timer.isRunning,
    isFinished: timer.isFinished,
    duration: timer.duration,
    lastUpdate: timer.lastUpdate
  };
  localStorage.setItem('persistentTimers', JSON.stringify(persistentData));
}

function loadTimerFromStorage(id: string): any | null {
  try {
    const persistentData = JSON.parse(localStorage.getItem('persistentTimers') || '{}');
    return persistentData[id] || null;
  } catch {
    return null;
  }
}

export function useTimer(initialTime: number, timerId?: string) {
  const [remainingTime, setRemainingTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const callbackRef = useRef<(updates: any) => void>();
  const timerIdRef = useRef(timerId || `timer-${Date.now()}-${Math.random()}`);

  // Callback for updates from global timer
  callbackRef.current = (updates: any) => {
    setRemainingTime(updates.remainingTime);
    setIsRunning(updates.isRunning);
    setIsFinished(updates.isFinished);
  };

  useEffect(() => {
    const id = timerIdRef.current;
    
    // Load from storage or create new timer
    const savedTimer = loadTimerFromStorage(id);
    if (savedTimer) {
      // Calculate elapsed time since last update
      const elapsed = Math.floor((Date.now() - savedTimer.lastUpdate) / 1000);
      const adjustedTime = savedTimer.isRunning ? Math.max(0, savedTimer.remainingTime - elapsed) : savedTimer.remainingTime;
      
      globalTimers.set(id, {
        remainingTime: adjustedTime,
        isRunning: savedTimer.isRunning && adjustedTime > 0,
        isFinished: adjustedTime === 0 || savedTimer.isFinished,
        duration: savedTimer.duration || initialTime,
        lastUpdate: Date.now(),
        callbacks: new Set()
      });
      
      setRemainingTime(adjustedTime);
      setIsRunning(savedTimer.isRunning && adjustedTime > 0);
      setIsFinished(adjustedTime === 0 || savedTimer.isFinished);
    } else {
      globalTimers.set(id, {
        remainingTime: initialTime,
        isRunning: false,
        isFinished: false,
        duration: initialTime,
        lastUpdate: Date.now(),
        callbacks: new Set()
      });
    }
    
    // Add callback to global timer
    if (callbackRef.current) {
      globalTimers.get(id)?.callbacks.add(callbackRef.current);
    }
    
    return () => {
      // Remove callback but keep timer in global registry
      if (callbackRef.current) {
        globalTimers.get(id)?.callbacks.delete(callbackRef.current);
      }
    };
  }, [initialTime]);

  const start = () => {
    const id = timerIdRef.current;
    const timer = globalTimers.get(id);
    if (timer && timer.remainingTime > 0) {
      timer.isRunning = true;
      timer.lastUpdate = Date.now();
      setIsRunning(true);
      saveTimerToStorage(id, timer);
      startGlobalTimer();
    }
  };

  const pause = () => {
    const id = timerIdRef.current;
    const timer = globalTimers.get(id);
    if (timer) {
      timer.isRunning = false;
      timer.lastUpdate = Date.now();
      setIsRunning(false);
      saveTimerToStorage(id, timer);
    }
  };

  const reset = () => {
    const id = timerIdRef.current;
    const timer = globalTimers.get(id);
    if (timer) {
      timer.remainingTime = timer.duration;
      timer.isRunning = false;
      timer.isFinished = false;
      timer.lastUpdate = Date.now();
      setRemainingTime(timer.duration);
      setIsRunning(false);
      setIsFinished(false);
      saveTimerToStorage(id, timer);
    }
  };

  const restart = () => {
    reset();
    setTimeout(() => start(), 100);
  };

  const updateDuration = (newDuration: number) => {
    const id = timerIdRef.current;
    const timer = globalTimers.get(id);
    if (timer) {
      timer.duration = newDuration;
      timer.remainingTime = newDuration;
      timer.isRunning = false;
      timer.isFinished = false;
      timer.lastUpdate = Date.now();
      setRemainingTime(newDuration);
      setIsRunning(false);
      setIsFinished(false);
      saveTimerToStorage(id, timer);
    }
  };

  const cleanup = () => {
    const id = timerIdRef.current;
    globalTimers.delete(id);
    
    // Clean up localStorage
    const persistentData = JSON.parse(localStorage.getItem('persistentTimers') || '{}');
    delete persistentData[id];
    localStorage.setItem('persistentTimers', JSON.stringify(persistentData));
  };

  return { 
    remainingTime, 
    isRunning, 
    isFinished, 
    start, 
    pause, 
    reset, 
    restart,
    updateDuration,
    cleanup,
    timerId: timerIdRef.current
  };
}

// Export function to get all active timers for the live indicator
export function getActiveTimers() {
  return Array.from(globalTimers.entries()).map(([id, timer]) => ({
    id,
    remainingTime: timer.remainingTime,
    isRunning: timer.isRunning,
    isFinished: timer.isFinished,
    type: 'timer'
  })).filter(timer => timer.isRunning || !timer.isFinished);
}
