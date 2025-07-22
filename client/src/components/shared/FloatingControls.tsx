import * as React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { FloatingTimer } from './FloatingTimer';
import { FloatingStopwatch } from './FloatingStopwatch';
import { FloatingAlarm } from './FloatingAlarm';
import { Timer, Play, Plus, X, Minimize2, Maximize2, Bell, Palette } from 'lucide-react';

interface FloatingControlsProps {
  timers: any[];
  stopwatches: any[];
  alarms?: any[];
  onAddTimer: (name: string, minutes: number) => void;
  onAddStopwatch: () => void;
  onAddAlarm?: (name: string, time: string) => void;
  onUpdateTimer: (id: string, updates: any) => void;
  onUpdateStopwatch: (id: string, updates: any) => void;
  onUpdateAlarm?: (id: string, updates: any) => void;
  onDeleteTimer: (id: string) => void;
  onDeleteStopwatch: (id: string) => void;
  onDeleteAlarm?: (id: string) => void;
  currentSection: string;
}

export function FloatingControls({
  timers,
  stopwatches,
  alarms = [],
  onAddTimer,
  onAddStopwatch,
  onAddAlarm,
  onUpdateTimer,
  onUpdateStopwatch,
  onUpdateAlarm,
  onDeleteTimer,
  onDeleteStopwatch,
  onDeleteAlarm,
  currentSection
}: FloatingControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTimers, setActiveTimers] = useState<string[]>([]);
  const [activeStopwatches, setActiveStopwatches] = useState<string[]>([]);
  const [activeAlarms, setActiveAlarms] = useState<string[]>([]);
  const [opacity, setOpacity] = useState(() => {
    const saved = localStorage.getItem('floatingOpacity');
    return saved ? parseInt(saved) : 80;
  });
  const [positions, setPositions] = useState<Record<string, { x: number; y: number; width: number; height: number }>>(() => {
    const saved = localStorage.getItem('floatingPositions');
    return saved ? JSON.parse(saved) : {};
  });

  // Save positions and opacity to localStorage
  useEffect(() => {
    localStorage.setItem('floatingPositions', JSON.stringify(positions));
  }, [positions]);

  useEffect(() => {
    localStorage.setItem('floatingOpacity', opacity.toString());
  }, [opacity]);

  const getActiveCount = () => {
    const runningTimers = timers.filter(t => t.isRunning || !t.isFinished).length;
    const runningStopwatches = stopwatches.filter(s => s.isRunning || s.time > 0).length;
    const activeAlarmsCount = alarms.filter(a => a.isActive).length;
    return runningTimers + runningStopwatches + activeAlarmsCount;
  };

  const getOpacityForSection = () => {
    // Full opacity for relevant sections
    if (currentSection === 'timer' || currentSection === 'stopwatch' || currentSection === 'alarms') {
      return 100;
    }
    // User-defined opacity for other sections
    return opacity;
  };

  const handleOpenTimer = (timerId: string) => {
    if (!activeTimers.includes(timerId)) {
      setActiveTimers(prev => [...prev, timerId]);
      
      if (!positions[timerId]) {
        const newPosition = {
          x: Math.random() * (window.innerWidth - 320) + 10,
          y: Math.random() * (window.innerHeight - 400) + 50,
          width: 320,
          height: 400
        };
        setPositions(prev => ({ ...prev, [timerId]: newPosition }));
      }
    }
  };

  const handleOpenStopwatch = (stopwatchId: string) => {
    if (!activeStopwatches.includes(stopwatchId)) {
      setActiveStopwatches(prev => [...prev, stopwatchId]);
      
      if (!positions[stopwatchId]) {
        const newPosition = {
          x: Math.random() * (window.innerWidth - 280) + 10,
          y: Math.random() * (window.innerHeight - 300) + 50,
          width: 280,
          height: 300
        };
        setPositions(prev => ({ ...prev, [stopwatchId]: newPosition }));
      }
    }
  };

  const handleOpenAlarm = (alarmId: string) => {
    if (!activeAlarms.includes(alarmId)) {
      setActiveAlarms(prev => [...prev, alarmId]);
      
      if (!positions[alarmId]) {
        const newPosition = {
          x: Math.random() * (window.innerWidth - 300) + 10,
          y: Math.random() * (window.innerHeight - 350) + 50,
          width: 300,
          height: 350
        };
        setPositions(prev => ({ ...prev, [alarmId]: newPosition }));
      }
    }
  };

  const handleCloseTimer = (timerId: string) => {
    setActiveTimers(prev => prev.filter(id => id !== timerId));
  };

  const handleCloseStopwatch = (stopwatchId: string) => {
    setActiveStopwatches(prev => prev.filter(id => id !== stopwatchId));
  };

  const handleCloseAlarm = (alarmId: string) => {
    setActiveAlarms(prev => prev.filter(id => id !== alarmId));
  };

  const handlePositionChange = (id: string, position: { x: number; y: number; width?: number; height?: number }) => {
    setPositions(prev => ({ 
      ...prev, 
      [id]: { 
        ...prev[id], 
        x: position.x, 
        y: position.y,
        width: position.width || prev[id]?.width || 320,
        height: position.height || prev[id]?.height || 400
      }
    }));
  };

  const handleAddCustomTimer = () => {
    const timerId = Date.now().toString();
    onAddTimer('Custom Timer', 25);
    setTimeout(() => {
      const newTimer = timers.find(t => t.name === 'Custom Timer');
      if (newTimer) {
        handleOpenTimer(newTimer.id);
      }
    }, 100);
  };

  const handleAddCustomStopwatch = () => {
    const stopwatchId = Date.now().toString();
    onAddStopwatch();
    setTimeout(() => {
      const newStopwatch = stopwatches[stopwatches.length - 1];
      if (newStopwatch) {
        handleOpenStopwatch(newStopwatch.id);
      }
    }, 100);
  };

  const handleAddCustomAlarm = () => {
    if (onAddAlarm) {
      const now = new Date();
      const time = `${now.getHours().toString().padStart(2, '0')}:${(now.getMinutes() + 1).toString().padStart(2, '0')}`;
      onAddAlarm('Custom Alarm', time);
      setTimeout(() => {
        const newAlarm = alarms[alarms.length - 1];
        if (newAlarm) {
          handleOpenAlarm(newAlarm.id);
        }
      }, 100);
    }
  };

  const activeCount = getActiveCount();
  const currentOpacity = getOpacityForSection();

  return (
    <>
      {/* Main floating control button */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-14 h-14 rounded-full shadow-lg relative"
          variant="default"
        >
          {isExpanded ? <X className="h-6 w-6" /> : <Timer className="h-6 w-6" />}
          {activeCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
              {activeCount}
            </div>
          )}
        </Button>
      </div>

      {/* Expanded menu */}
      {isExpanded && (
        <Card className="fixed bottom-24 right-6 z-40 w-80 shadow-xl max-h-[80vh] overflow-y-auto">
          <CardHeader className="pb-3">
            <CardTitle className="flex justify-between items-center">
              <span className="text-sm">Background Controls</span>
              <Button
                onClick={() => setIsExpanded(false)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Opacity Control */}
            {currentSection !== 'timer' && currentSection !== 'stopwatch' && currentSection !== 'alarms' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  <Label className="text-sm">Opacity on other sections</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[opacity]}
                    onValueChange={(value) => setOpacity(value[0])}
                    max={100}
                    min={0}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-12 text-right">{opacity}%</span>
                </div>
              </div>
            )}

            {/* Add Controls */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  onClick={handleAddCustomTimer}
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Timer
                </Button>
                <Button
                  onClick={handleAddCustomStopwatch}
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Stopwatch
                </Button>
              </div>
              {onAddAlarm && (
                <Button
                  onClick={handleAddCustomAlarm}
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                >
                  <Bell className="h-4 w-4" />
                  Add Alarm
                </Button>
              )}
            </div>

            {/* Timer list */}
            {timers.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Timers</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {timers.map((timer) => (
                    <div key={timer.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{timer.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {Math.floor(timer.remainingTime / 60)}:{(timer.remainingTime % 60).toString().padStart(2, '0')}
                          {timer.isRunning && <span className="text-blue-600 ml-1">Running</span>}
                          {timer.isFinished && <span className="text-green-600 ml-1">Finished</span>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          onClick={() => handleOpenTimer(timer.id)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
                          <Maximize2 className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={() => onDeleteTimer(timer.id)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stopwatch list */}
            {stopwatches.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Stopwatches</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {stopwatches.map((stopwatch) => (
                    <div key={stopwatch.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{stopwatch.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {Math.floor(stopwatch.time / 3600)}:{Math.floor((stopwatch.time % 3600) / 60).toString().padStart(2, '0')}:{(stopwatch.time % 60).toString().padStart(2, '0')}
                          {stopwatch.isRunning && <span className="text-blue-600 ml-1">Running</span>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          onClick={() => handleOpenStopwatch(stopwatch.id)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
                          <Maximize2 className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={() => onDeleteStopwatch(stopwatch.id)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alarms list */}
            {alarms.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Alarms</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {alarms.map((alarm) => (
                    <div key={alarm.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{alarm.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {alarm.time}
                          {alarm.isActive && <span className="text-blue-600 ml-1">Active</span>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          onClick={() => handleOpenAlarm(alarm.id)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
                          <Maximize2 className="h-3 w-3" />
                        </Button>
                        {onDeleteAlarm && (
                          <Button
                            onClick={() => onDeleteAlarm(alarm.id)}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Floating timer windows */}
      {activeTimers.map((timerId) => {
        const timer = timers.find(t => t.id === timerId);
        if (!timer) return null;

        return (
          <FloatingTimer
            key={timerId}
            timer={timer}
            onUpdate={onUpdateTimer}
            onDelete={onDeleteTimer}
            onClose={() => handleCloseTimer(timerId)}
            position={positions[timerId] || { x: 50, y: 50, width: 320, height: 400 }}
            onPositionChange={(pos) => handlePositionChange(timerId, pos)}
            opacity={currentOpacity}
          />
        );
      })}

      {/* Floating stopwatch windows */}
      {activeStopwatches.map((stopwatchId) => {
        const stopwatch = stopwatches.find(s => s.id === stopwatchId);
        if (!stopwatch) return null;

        return (
          <FloatingStopwatch
            key={stopwatchId}
            stopwatch={stopwatch}
            onUpdate={onUpdateStopwatch}
            onDelete={onDeleteStopwatch}
            onClose={() => handleCloseStopwatch(stopwatchId)}
            position={positions[stopwatchId] || { x: 50, y: 50, width: 280, height: 300 }}
            onPositionChange={(pos) => handlePositionChange(stopwatchId, pos)}
            opacity={currentOpacity}
          />
        );
      })}

      {/* Floating alarm windows */}
      {activeAlarms.map((alarmId) => {
        const alarm = alarms.find(a => a.id === alarmId);
        if (!alarm) return null;

        return (
          <FloatingAlarm
            key={alarmId}
            alarm={alarm}
            onUpdate={onUpdateAlarm}
            onDelete={onDeleteAlarm}
            onClose={() => handleCloseAlarm(alarmId)}
            position={positions[alarmId] || { x: 50, y: 50, width: 300, height: 350 }}
            onPositionChange={(pos) => handlePositionChange(alarmId, pos)}
            opacity={currentOpacity}
          />
        );
      })}
    </>
  );
}
