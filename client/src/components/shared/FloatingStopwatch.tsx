import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStopwatch } from '@/hooks/useStopwatch';
import { Play, Pause, RotateCcw, X, Edit3, Check, Move } from 'lucide-react';

interface FloatingStopwatchProps {
  stopwatch: {
    id: string;
    name: string;
    time: number;
    isRunning: boolean;
    totalTime: number;
  };
  onUpdate: (id: string, updates: any) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  position: { x: number; y: number };
  onPositionChange: (position: { x: number; y: number }) => void;
}

export function FloatingStopwatch({ stopwatch, onUpdate, onDelete, onClose, position, onPositionChange }: FloatingStopwatchProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(stopwatch.name);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const { time, isRunning, start, pause, reset } = useStopwatch(stopwatch.time, stopwatch.id);

  useEffect(() => {
    onUpdate(stopwatch.id, { 
      time, 
      isRunning, 
      totalTime: stopwatch.totalTime + time 
    });
  }, [time, isRunning, stopwatch.id, onUpdate, stopwatch.totalTime]);

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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newPosition = {
          x: Math.max(0, Math.min(window.innerWidth - 280, e.clientX - dragOffset.x)),
          y: Math.max(0, Math.min(window.innerHeight - 300, e.clientY - dragOffset.y))
        };
        onPositionChange(newPosition);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, onPositionChange]);

  const handleToggle = () => {
    if (isRunning) {
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
      onUpdate(stopwatch.id, { name: tempName.trim() });
    }
    setIsEditingName(false);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card 
      ref={cardRef}
      className={`fixed z-50 w-72 shadow-lg border-2 cursor-move ${
        isRunning ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : 'border-gray-200'
      } ${isDragging ? 'opacity-80' : ''}`}
      style={{ 
        left: position.x, 
        top: position.y 
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
                  {stopwatch.name}
                  <Edit3 className="h-3 w-3 opacity-60" />
                </CardTitle>
              )}
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-2xl font-mono font-bold text-primary">
            {formatTime(time)}
          </div>
        </div>

        <div className="flex gap-2 justify-center">
          <Button
            onClick={handleToggle}
            variant={isRunning ? "secondary" : "default"}
            size="sm"
            className="gap-1"
          >
            {isRunning ? (
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
      </CardContent>
    </Card>
  );
}