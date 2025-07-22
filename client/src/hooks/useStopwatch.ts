import { useState, useEffect, useRef } from 'react';

// Global stopwatch registry to track all stopwatches
const globalStopwatches = new Map<string, {
  time: number;
  isRunning: boolean;
  lastUpdate: number;
  callbacks: Set<(updates: any) => void>;
}>();

// Global interval for all stopwatches
let globalStopwatchInterval: NodeJS.Timeout | null = null;

function startGlobalStopwatch() {
  if (globalStopwatchInterval) return;
  
  globalStopwatchInterval = setInterval(() => {
    const now = Date.now();
    
    globalStopwatches.forEach((stopwatch, id) => {
      if (stopwatch.isRunning) {
        stopwatch.time += 1;
        stopwatch.lastUpdate = now;
        
        // Notify all callbacks
        stopwatch.callbacks.forEach(callback => {
          callback({
            time: stopwatch.time,
            isRunning: stopwatch.isRunning
          });
        });
        
        // Save to localStorage
        saveStopwatchToStorage(id, stopwatch);
      }
    });
    
    // Stop global stopwatch if no running stopwatches
    const hasRunningStopwatches = Array.from(globalStopwatches.values()).some(s => s.isRunning);
    if (!hasRunningStopwatches && globalStopwatchInterval) {
      clearInterval(globalStopwatchInterval);
      globalStopwatchInterval = null;
    }
  }, 1000);
}

function saveStopwatchToStorage(id: string, stopwatch: any) {
  const persistentData = JSON.parse(localStorage.getItem('persistentStopwatches') || '{}');
  persistentData[id] = {
    time: stopwatch.time,
    isRunning: stopwatch.isRunning,
    lastUpdate: stopwatch.lastUpdate
  };
  localStorage.setItem('persistentStopwatches', JSON.stringify(persistentData));
}

function loadStopwatchFromStorage(id: string): any | null {
  try {
    const persistentData = JSON.parse(localStorage.getItem('persistentStopwatches') || '{}');
    return persistentData[id] || null;
  } catch {
    return null;
  }
}

export function useStopwatch(initialTime = 0, stopwatchId?: string) {
  const [time, setTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const callbackRef = useRef<(updates: any) => void>();
  const stopwatchIdRef = useRef(stopwatchId || `stopwatch-${Date.now()}-${Math.random()}`);

  // Callback for updates from global stopwatch
  callbackRef.current = (updates: any) => {
    setTime(updates.time);
    setIsRunning(updates.isRunning);
  };

  useEffect(() => {
    const id = stopwatchIdRef.current;
    
    // Load from storage or create new stopwatch
    const savedStopwatch = loadStopwatchFromStorage(id);
    if (savedStopwatch) {
      // Calculate elapsed time since last update
      const elapsed = savedStopwatch.isRunning ? Math.floor((Date.now() - savedStopwatch.lastUpdate) / 1000) : 0;
      const adjustedTime = savedStopwatch.time + elapsed;
      
      globalStopwatches.set(id, {
        time: adjustedTime,
        isRunning: savedStopwatch.isRunning,
        lastUpdate: Date.now(),
        callbacks: new Set()
      });
      
      setTime(adjustedTime);
      setIsRunning(savedStopwatch.isRunning);
    } else {
      globalStopwatches.set(id, {
        time: initialTime,
        isRunning: false,
        lastUpdate: Date.now(),
        callbacks: new Set()
      });
    }
    
    // Add callback to global stopwatch
    if (callbackRef.current) {
      globalStopwatches.get(id)?.callbacks.add(callbackRef.current);
    }
    
    return () => {
      // Remove callback but keep stopwatch in global registry
      if (callbackRef.current) {
        globalStopwatches.get(id)?.callbacks.delete(callbackRef.current);
      }
    };
  }, [initialTime]);

  const start = () => {
    const id = stopwatchIdRef.current;
    const stopwatch = globalStopwatches.get(id);
    if (stopwatch) {
      stopwatch.isRunning = true;
      stopwatch.lastUpdate = Date.now();
      setIsRunning(true);
      saveStopwatchToStorage(id, stopwatch);
      startGlobalStopwatch();
    }
  };

  const pause = () => {
    const id = stopwatchIdRef.current;
    const stopwatch = globalStopwatches.get(id);
    if (stopwatch) {
      stopwatch.isRunning = false;
      stopwatch.lastUpdate = Date.now();
      setIsRunning(false);
      saveStopwatchToStorage(id, stopwatch);
    }
  };

  const reset = () => {
    const id = stopwatchIdRef.current;
    const stopwatch = globalStopwatches.get(id);
    if (stopwatch) {
      stopwatch.time = 0;
      stopwatch.isRunning = false;
      stopwatch.lastUpdate = Date.now();
      setTime(0);
      setIsRunning(false);
      saveStopwatchToStorage(id, stopwatch);
    }
  };

  const cleanup = () => {
    const id = stopwatchIdRef.current;
    globalStopwatches.delete(id);
    
    // Clean up localStorage
    const persistentData = JSON.parse(localStorage.getItem('persistentStopwatches') || '{}');
    delete persistentData[id];
    localStorage.setItem('persistentStopwatches', JSON.stringify(persistentData));
  };

  return { 
    time, 
    isRunning, 
    start, 
    pause, 
    reset,
    cleanup,
    stopwatchId: stopwatchIdRef.current
  };
}

// Export function to get all active stopwatches for the live indicator
export function getActiveStopwatches() {
  return Array.from(globalStopwatches.entries()).map(([id, stopwatch]) => ({
    id,
    time: stopwatch.time,
    isRunning: stopwatch.isRunning,
    type: 'stopwatch'
  })).filter(stopwatch => stopwatch.isRunning || stopwatch.time > 0);
}
