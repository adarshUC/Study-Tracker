import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useTimer } from '@/hooks/useTimer';
import { Play, Pause, RotateCcw, Settings, X, Edit3, Check, Volume2, Upload, Move, Maximize2, Minimize2 } from 'lucide-react';

interface FloatingTimerProps {
  timer: {
    id: string;
    name: string;
    duration: number;
    remainingTime: number;
    isRunning: boolean;
    isFinished: boolean;
    customAudioFile?: string;
  };
  onUpdate: (id: string, updates: any) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  position: { x: number; y: number; width: number; height: number };
  onPositionChange: (position: { x: number; y: number; width?: number; height?: number }) => void;
  opacity: number;
}

export function FloatingTimer({ timer, onUpdate, onDelete, onClose, position, onPositionChange, opacity }: FloatingTimerProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(timer.name);
  const [customDuration, setCustomDuration] = useState(Math.floor(timer.duration / 60));
  const [alarmVolume, setAlarmVolume] = useState(0.8);
  const [customAudioFile, setCustomAudioFile] = useState<string | null>(timer.customAudioFile || null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isMinimized, setIsMinimized] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const { 
    remainingTime, 
    isRunning, 
    isFinished, 
    start, 
    pause, 
    reset,
    updateDuration 
  } = useTimer(timer.duration, timer.id);

  useEffect(() => {
    onUpdate(timer.id, { 
      remainingTime, 
      isRunning, 
      isFinished,
      duration: timer.duration,
      customAudioFile
    });
  }, [remainingTime, isRunning, isFinished, timer.id, onUpdate, timer.duration, customAudioFile]);

  // Background notification system
  useEffect(() => {
    if (isFinished) {
      // Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`${timer.name} notification`, {
          body: `Timer "${timer.name}" has finished!`,
          icon: '/favicon.ico',
          tag: timer.id,
          requireInteraction: true
        });
      }
    }
  }, [isFinished, timer.name, timer.id]);

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as Element).closest('.drag-handle')) {
      setIsDragging(true);
      const rect = cardRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
      e.preventDefault();
    }
  };

  // Handle resizing
  const handleResizeStart = (e: React.MouseEvent) => {
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: position.width,
      height: position.height
    });
    e.preventDefault();
    e.stopPropagation();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newPosition = {
          x: Math.max(0, Math.min(window.innerWidth - position.width, e.clientX - dragOffset.x)),
          y: Math.max(0, Math.min(window.innerHeight - position.height, e.clientY - dragOffset.y))
        };
        onPositionChange(newPosition);
      } else if (isResizing) {
        const newWidth = Math.max(250, resizeStart.width + (e.clientX - resizeStart.x));
        const newHeight = Math.max(200, resizeStart.height + (e.clientY - resizeStart.y));
        onPositionChange({
          x: position.x,
          y: position.y,
          width: newWidth,
          height: newHeight
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, resizeStart, position, onPositionChange]);

  const handleToggle = () => {
    if (isFinished) {
      reset();
    } else if (isRunning) {
      pause();
    } else {
      start();
    }
  };

  const handleReset = () => {
    reset();
  };

  const handleNameSave = () => {
    if (tempName.trim()) {
      onUpdate(timer.id, { name: tempName.trim() });
    }
    setIsEditingName(false);
  };

  const handleDurationChange = (minutes: number) => {
    const newDuration = minutes * 60;
    setCustomDuration(minutes);
    updateDuration(newDuration);
    onUpdate(timer.id, { duration: newDuration });
  };

  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomAudioFile(url);
      onUpdate(timer.id, { customAudioFile: url });
      localStorage.setItem(`timer_audio_${timer.id}`, url);
    }
  };

  const testCustomSound = () => {
    if (customAudioFile) {
      const audio = new Audio(customAudioFile);
      audio.volume = alarmVolume;
      audio.play().catch(err => {
        console.error('Failed to play custom audio:', err);
        alert('Failed to play custom audio. Please check the file format.');
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((timer.duration - remainingTime) / timer.duration) * 100;

  if (isMinimized) {
    return (
      <Card 
        ref={cardRef}
        className="fixed z-50 shadow-lg border-2 cursor-move bg-background"
        style={{ 
          left: position.x, 
          top: position.y,
          width: '200px',
          height: '60px',
          opacity: opacity / 100
        }}
        onMouseDown={handleMouseDown}
      >
        <CardContent className="p-2 flex items-center justify-between">
          <div className="flex-1">
            <div className="text-xs font-medium truncate">{timer.name}</div>
            <div className="text-xs text-muted-foreground">{formatTime(remainingTime)}</div>
          </div>
          <div className="flex gap-1">
            <Button
              onClick={handleToggle}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              {isRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </Button>
            <Button
              onClick={() => setIsMinimized(false)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      ref={cardRef}
      className={`fixed z-50 shadow-lg border-2 cursor-move ${
        isFinished ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 
        isRunning ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : 
        'border-gray-200'
      } ${isDragging || isResizing ? 'opacity-80' : ''}`}
      style={{ 
        left: position.x, 
        top: position.y,
        width: position.width,
        height: position.height,
        opacity: opacity / 100
      }}
      onMouseDown={handleMouseDown}
    >
      <CardHeader className="pb-3 drag-handle cursor-move">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <Move className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="text-sm font-semibold"
                    autoFocus
                  />
                  <Button onClick={handleNameSave} size="sm" variant="ghost" className="h-6 w-6 p-0">
                    <Check className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <CardTitle 
                  className="text-sm cursor-pointer flex items-center gap-2"
                  onClick={() => setIsEditingName(true)}
                >
                  {timer.name}
                  <Edit3 className="h-3 w-3 opacity-60" />
                </CardTitle>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              onClick={() => setIsMinimized(true)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              <Minimize2 className="h-3 w-3" />
            </Button>
            <Button
              onClick={() => setShowSettings(!showSettings)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              <Settings className="h-3 w-3" />
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 overflow-y-auto" style={{ height: `${position.height - 120}px` }}>
        <div className="text-center">
          <div className="text-2xl font-mono font-bold text-primary">
            {formatTime(remainingTime)}
          </div>
          {isFinished && (
            <div className="text-sm text-green-600 font-medium">
              Time's up!
            </div>
          )}
        </div>

        <Progress value={progress} className="h-2" />

        <div className="flex gap-2 justify-center">
          <Button
            onClick={handleToggle}
            variant={isRunning ? "secondary" : "default"}
            size="sm"
            className="gap-1"
          >
            {isFinished ? (
              <>
                <RotateCcw className="h-3 w-3" />
                Restart
              </>
            ) : isRunning ? (
              <>
                <Pause className="h-3 w-3" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-3 w-3" />
                Start
              </>
            )}
          </Button>
          
          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
            className="gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
        </div>

        {showSettings && (
          <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label className="text-xs">Duration (minutes)</Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[customDuration]}
                  onValueChange={(value) => handleDurationChange(value[0])}
                  max={180}
                  min={1}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs font-medium w-12 text-right">{customDuration}m</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Alarm Volume</Label>
              <div className="flex items-center gap-2">
                <Volume2 className="h-3 w-3" />
                <Slider
                  value={[alarmVolume * 100]}
                  onValueChange={(value) => setAlarmVolume(value[0] / 100)}
                  max={100}
                  min={0}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs font-medium w-12 text-right">{Math.round(alarmVolume * 100)}%</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Custom Alarm Sound</Label>
              <div className="flex gap-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1"
                >
                  <Upload className="h-3 w-3" />
                  Upload Sound
                </Button>
                {customAudioFile && (
                  <Button
                    onClick={testCustomSound}
                    variant="outline"
                    size="sm"
                    className="gap-1"
                  >
                    <Volume2 className="h-3 w-3" />
                    Test
                  </Button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  className="hidden"
                />
              </div>
              {customAudioFile && (
                <div className="text-xs text-green-600">Custom sound uploaded</div>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nw-resize"
        onMouseDown={handleResizeStart}
      >
        <div className="absolute bottom-1 right-1 w-2 h-2 bg-muted-foreground opacity-50"></div>
      </div>
    </Card>
  );
}
