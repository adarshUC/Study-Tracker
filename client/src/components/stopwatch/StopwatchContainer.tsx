import * as React from 'react';
import { useState, useEffect } from 'react';
import { StopwatchCard } from './StopwatchCard';
import { QuoteSection } from '../shared/QuoteSection';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface Stopwatch {
  id: string;
  name: string;
  time: number;
  isRunning: boolean;
  totalTime: number;
}

export function StopwatchContainer() {
  const [stopwatches, setStopwatches] = useState<Stopwatch[]>(() => {
    const saved = localStorage.getItem('stopwatches');
    if (saved) {
      return JSON.parse(saved);
    }
    // Default stopwatches if none saved
    return [
      { id: '1', name: 'Stopwatch 1', time: 0, isRunning: false, totalTime: 0 },
      { id: '2', name: 'Stopwatch 2', time: 0, isRunning: false, totalTime: 0 },
      { id: '3', name: 'Stopwatch 3', time: 0, isRunning: false, totalTime: 0 },
    ];
  });

  useEffect(() => {
    localStorage.setItem('stopwatches', JSON.stringify(stopwatches));
    // Notify App component about stopwatch changes
    window.dispatchEvent(new CustomEvent('stopwatchesUpdated', {
      detail: { stopwatches }
    }));
  }, [stopwatches]);

  // Listen for updates from App component (floating controls)
  useEffect(() => {
    const handleUpdateFromApp = (event: CustomEvent) => {
      setStopwatches(event.detail.stopwatches);
    };

    window.addEventListener('updateStopwatchesFromApp', handleUpdateFromApp as EventListener);
    return () => window.removeEventListener('updateStopwatchesFromApp', handleUpdateFromApp as EventListener);
  }, []);

  const handleAddStopwatch = () => {
    const nextNumber = stopwatches.length + 1;
    const newId = Date.now().toString();
    const newStopwatch: Stopwatch = {
      id: newId,
      name: `Stopwatch ${nextNumber}`,
      time: 0,
      isRunning: false,
      totalTime: 0,
    };
    setStopwatches(prev => [...prev, newStopwatch]);
  };

  const handleDeleteStopwatch = (id: string) => {
    setStopwatches(prev => prev.filter(sw => sw.id !== id));
  };

  const handleUpdateStopwatch = (id: string, updates: Partial<Stopwatch>) => {
    setStopwatches(prev => 
      prev.map(sw => sw.id === id ? { ...sw, ...updates } : sw)
    );
  };

  return (
    <div className="space-y-6">
      <QuoteSection 
        quotes={[
          "Every Second Counts. Notice how much time you're giving to distractions/irrelevant things/actual goal",
          "Time is the most valuable thing we have and the easiest to waste.",
          "What we do today matters most.",
          "Every moment is a fresh beginning.",
          "Time is precious, but truth is more precious than time."
        ]}
      />
      
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Stopwatch</h2>
      </div>

      <div className="space-y-4">
        {stopwatches.map((stopwatch) => (
          <StopwatchCard
            key={stopwatch.id}
            id={stopwatch.id}
            initialName={stopwatch.name}
            initialTime={stopwatch.time}
            initialTotalTime={stopwatch.totalTime}
            onDelete={handleDeleteStopwatch}
            onUpdate={handleUpdateStopwatch}
          />
        ))}
        
        <div className="text-center pt-4">
          <Button 
            onClick={handleAddStopwatch}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add New Stopwatch
          </Button>
        </div>
      </div>
    </div>
  );
}
