import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Bell, BellOff, Edit3, X, Check, Move, Minimize2, Maximize2 } from 'lucide-react';

interface FloatingAlarmProps {
  alarm: {
    id: string;
    name: string;
    time: string;
    date: string;
    message: string;
    isActive: boolean;
    isRepeating: boolean;
    repeatDays: string[];
    soundEnabled: boolean;
  };
  onUpdate?: (id: string, updates: any) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
  position: { x: number; y: number; width: number; height: number };
  onPositionChange: (position: { x: number; y: number; width?: number; height?: number }) => void;
  opacity: number;
}

export function FloatingAlarm({ alarm, onUpdate, onDelete, onClose, position, onPositionChange, opacity }: FloatingAlarmProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [editData, setEditData] = useState({
    name: alarm.name,
    time: alarm.time,
    message: alarm.message,
    soundEnabled: alarm.soundEnabled
  });
  const cardRef = useRef<HTMLDivElement>(null);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getTimeUntilAlarm = () => {
    const now = new Date();
    const [hours, minutes] = alarm.time.split(':').map(Number);
    
    let alarmTime = new Date();
    alarmTime.setHours(hours, minutes, 0, 0);
    
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

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(alarm.id, editData);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      name: alarm.name,
      time: alarm.time,
      message: alarm.message,
      soundEnabled: alarm.soundEnabled
    });
    setIsEditing(false);
  };

  const handleToggleActive = () => {
    if (onUpdate) {
      onUpdate(alarm.id, { isActive: !alarm.isActive });
    }
  };

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
            <div className="text-xs font-medium truncate">{alarm.name}</div>
            <div className="text-xs text-muted-foreground">{formatTime(alarm.time)}</div>
          </div>
          <div className="flex gap-1">
            <Button
              onClick={handleToggleActive}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              {alarm.isActive ? <Bell className="h-3 w-3" /> : <BellOff className="h-3 w-3" />}
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
        alarm.isActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : 'border-gray-200'
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
              <CardTitle className="text-sm flex items-center gap-2">
                {alarm.isActive ? (
                  <Bell className="h-4 w-4 text-blue-600" />
                ) : (
                  <BellOff className="h-4 w-4 text-gray-400" />
                )}
                {alarm.name}
              </CardTitle>
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
              onClick={() => setIsEditing(!isEditing)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              <Edit3 className="h-3 w-3" />
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
        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editData.name}
                onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Alarm name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-time">Time</Label>
              <Input
                id="edit-time"
                type="time"
                value={editData.time}
                onChange={(e) => setEditData(prev => ({ ...prev, time: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-message">Message</Label>
              <Textarea
                id="edit-message"
                value={editData.message}
                onChange={(e) => setEditData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Alarm message"
                rows={2}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={editData.soundEnabled}
                onCheckedChange={(checked) => setEditData(prev => ({ ...prev, soundEnabled: checked }))}
              />
              <Label>Sound enabled</Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} size="sm" className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button onClick={handleCancel} size="sm" variant="outline" className="flex-1">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">{formatTime(alarm.time)}</div>
              {alarm.isActive && (
                <div className="text-sm text-muted-foreground">
                  in {getTimeUntilAlarm()}
                </div>
              )}
            </div>
            
            {alarm.message && (
              <div className="p-3 bg-muted/50 rounded-md">
                <p className="text-sm italic">"{alarm.message}"</p>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <Label htmlFor={`alarm-${alarm.id}`} className="text-sm">
                {alarm.isActive ? 'Active' : 'Inactive'}
              </Label>
              <Switch
                id={`alarm-${alarm.id}`}
                checked={alarm.isActive}
                onCheckedChange={handleToggleActive}
              />
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
