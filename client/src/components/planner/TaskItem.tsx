import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlannerTask } from './DailyPlanner';
import { TaskContextMenu } from './TaskContextMenu';
import { APP_CONFIG } from '@/config/settings';
import { CheckCircle, Circle, Play, Edit3, Check, X, Trash2, ArrowUpDown, Clock, Bell } from 'lucide-react';

interface TaskItemProps {
  task: PlannerTask;
  onUpdate: (taskId: string, updates: Partial<PlannerTask>) => void;
  onDelete: (taskId: string) => void;
  onStartTimer?: (taskName: string) => void;
  onCategoryChange?: (category: string) => void;
  onTaskProgress?: (taskName: string, status: 'progress' | 'done', taskIndex: number, totalTasks: number) => void;
  availableCategories?: string[];
  taskIndex?: number;
  totalTasks?: number;
}

export function TaskItem({ 
  task, 
  onUpdate, 
  onDelete, 
  onStartTimer, 
  onCategoryChange,
  onTaskProgress,
  availableCategories = APP_CONFIG.DAILY_PLANNER.CATEGORIES,
  taskIndex = 0,
  totalTasks = 1
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempText, setTempText] = useState(task.text);
  const [tempScheduledTime, setTempScheduledTime] = useState(task.scheduledTime || '');
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [showCategorySelect, setShowCategorySelect] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [currentTime, setCurrentTime] = useState(0);
  const [showTaskTimer, setShowTaskTimer] = useState(false);
  const [taskTimerMinutes, setTaskTimerMinutes] = useState(25);
  const [taskTimerId, setTaskTimerId] = useState<NodeJS.Timeout | null>(null);
  const [timeNotificationSent, setTimeNotificationSent] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update current time for in-progress tasks ONLY
  useEffect(() => {
    if (task.status === 'progress' && task.startTime) {
      const updateTime = () => {
        const elapsed = Date.now() - task.startTime! + (task.timeSpent || 0);
        setCurrentTime(elapsed);
      };

      updateTime(); // Initial update
      intervalRef.current = setInterval(updateTime, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      // Clear interval when not in progress
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Show the accumulated time when not running
      setCurrentTime(task.timeSpent || 0);
    }
  }, [task.status, task.startTime, task.timeSpent]);

  // Check for scheduled time notifications using HH:MM:SS format
  useEffect(() => {
    if (task.scheduledTime && !timeNotificationSent) {
      const checkScheduledTime = () => {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        const currentTimeWithSeconds = `${hours}:${minutes}:${seconds}`;
        const currentTimeHHMM = `${hours}:${minutes}`; // For matching with scheduled time
        
        // Only trigger at the start of the minute (0-5 seconds)
        if (seconds !== '00' && parseInt(seconds) > 5) return;
        
        if (task.scheduledTime === currentTimeHHMM) {
          // Create unique key to prevent duplicate notifications
          const notificationKey = `task-${task.id}-${currentTimeHHMM}-${now.toISOString().split('T')[0]}`;
          const alreadySent = sessionStorage.getItem(notificationKey);
          
          if (!alreadySent) {
            sessionStorage.setItem(notificationKey, 'true');
            setTimeNotificationSent(true);
            
            // Clean up old session keys (older than 24 hours)
            const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            Object.keys(sessionStorage).forEach(key => {
              if (key.startsWith('task-') && key.includes(yesterdayStr)) {
                sessionStorage.removeItem(key);
              }
            });
            
            triggerScheduledTimeNotification();
          }
        }
      };

      timeCheckIntervalRef.current = setInterval(checkScheduledTime, 1000); // Check every second for precise timing
      
      return () => {
        if (timeCheckIntervalRef.current) {
          clearInterval(timeCheckIntervalRef.current);
        }
      };
    }
  }, [task.scheduledTime, task.id, timeNotificationSent]);

  // Reset notification flag when scheduled time changes
  useEffect(() => {
    setTimeNotificationSent(false);
  }, [task.scheduledTime]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const triggerScheduledTimeNotification = () => {
    console.log('Triggering scheduled time notification for task:', task.text, 'at', task.scheduledTime);
    
    // Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      const notificationTitle = `⏰ Scheduled Task: ${task.text}`;
      const notificationBody = `It's time for your scheduled task: "${task.text}" at ${task.scheduledTime}`;
      
      const notification = new Notification(notificationTitle, {
        body: notificationBody,
        icon: '/favicon.ico',
        tag: `task-${task.id}`,
        requireInteraction: true,
        silent: false,
        vibrate: [200, 100, 200],
        timestamp: Date.now()
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        // Optionally start the task if it's pending
        if (task.status === 'pending') {
          handleStatusClick();
        }
      };

      // Auto-close after 1 minute
      setTimeout(() => {
        notification.close();
      }, 60000);
    } else {
      // Fallback alert if notifications aren't available
      const message = `⏰ Scheduled Task Time!\n\n"${task.text}" is scheduled for ${task.scheduledTime}.\n\nWould you like to start this task now?`;
      if (confirm(message) && task.status === 'pending') {
        handleStatusClick();
      }
    }

    // Play notification sound
    playScheduledTimeNotificationSound();
  };

  const playScheduledTimeNotificationSound = () => {
    try {
      // More attention-grabbing sound for scheduled tasks
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          const context = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = context.createOscillator();
          const gainNode = context.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(context.destination);
          
          // Alternating frequencies for more attention
          oscillator.frequency.value = i % 2 === 0 ? 880 : 1100;
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0, context.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.8, context.currentTime + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1);
          
          oscillator.start();
          oscillator.stop(context.currentTime + 1);
        }, i * 1200);
      }
    } catch (error) {
      console.log('Audio not supported');
    }
  };

  const handleStatusClick = () => {
    let newStatus: PlannerTask['status'];
    let updates: Partial<PlannerTask> = {};
    
    switch (task.status) {
      case 'pending':
        // pending -> progress: Start timer
        newStatus = 'progress';
        updates = { 
          status: newStatus, 
          startTime: Date.now()
        };
        if (onStartTimer) {
          onStartTimer(task.text);
        }
        if (onTaskProgress) {
          onTaskProgress(task.text, 'progress', taskIndex, totalTasks);
        }
        break;
      case 'progress':
        // progress -> done: Complete task, save accumulated time
        newStatus = 'done';
        const currentSessionTime = task.startTime ? Date.now() - task.startTime : 0;
        const totalTimeSpent = (task.timeSpent || 0) + currentSessionTime;
        updates = { 
          status: newStatus, 
          timeSpent: totalTimeSpent, 
          startTime: undefined
        };
        if (onTaskProgress) {
          onTaskProgress(task.text, 'done', taskIndex, totalTasks);
        }
        break;
      case 'done':
        // done -> pending: Reset to pending but keep accumulated time
        newStatus = 'pending';
        updates = { 
          status: newStatus, 
          startTime: undefined
        };
        break;
    }
    
    onUpdate(task.id, updates);
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleContextStatusChange = (status: 'pending' | 'progress' | 'done') => {
    let updates: Partial<PlannerTask> = { status };

    if (status === 'progress') {
      // Start/resume timing
      updates.startTime = Date.now();
      if (onStartTimer) {
        onStartTimer(task.text);
      }
    } else if (status === 'done' && task.status === 'progress') {
      // Complete the task and save accumulated time
      const currentSessionTime = task.startTime ? Date.now() - task.startTime : 0;
      const totalTimeSpent = (task.timeSpent || 0) + currentSessionTime;
      updates.timeSpent = totalTimeSpent;
      updates.startTime = undefined;
    } else if (status === 'pending') {
      // Set to pending but preserve accumulated time
      if (task.status === 'progress' && task.startTime) {
        // Save current session time before going to pending
        const currentSessionTime = Date.now() - task.startTime;
        updates.timeSpent = (task.timeSpent || 0) + currentSessionTime;
      }
      updates.startTime = undefined;
    }

    onUpdate(task.id, updates);
  };

  const handleReset = () => {
    // Reset task completely
    onUpdate(task.id, { 
      status: 'pending', 
      startTime: undefined, 
      timeSpent: 0 
    });
  };

  const handleLongPress = () => {
    // Long press still resets everything
    handleReset();
  };

  const saveText = () => {
    onUpdate(task.id, { 
      text: tempText,
      scheduledTime: tempScheduledTime 
    });
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setTempText(task.text);
    setTempScheduledTime(task.scheduledTime || '');
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveText();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
      saveText();
    }
  };

  useEffect(() => {
    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isEditing]);

  const handleLongPressStart = () => {
    const timer = setTimeout(() => {
      handleLongPress();
    }, 800);
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleCategoryChange = (newCategory: string) => {
    if (onCategoryChange) {
      onCategoryChange(newCategory);
    }
    setShowCategorySelect(false);
  };

  const setTaskTimer = () => {
    if (taskTimerMinutes <= 0) return;
    
    const timerDuration = taskTimerMinutes * 60 * 1000; // Convert to milliseconds
    const timerId = setTimeout(() => {
      // Show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(`Task Timer: ${task.text}`, {
          body: `Your ${taskTimerMinutes} minute timer for "${task.text}" is complete!`,
          icon: '/favicon.ico',
          tag: task.id,
          requireInteraction: true,
          silent: false
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        // Auto-close after 1 minute
        setTimeout(() => {
          notification.close();
        }, 60000);
      }

      // Play notification sound
      playTaskNotificationSound();
      
      // Clear the timer
      setTaskTimerId(null);
      
      // Show alert as fallback
      setTimeout(() => {
        if (confirm(`Task Timer Complete!\n\nYour ${taskTimerMinutes} minute timer for "${task.text}" has finished.\n\nWould you like to mark this task as complete?`)) {
          onUpdate(task.id, { 
            status: 'done',
            timeSpent: (task.timeSpent || 0) + (task.startTime ? Date.now() - task.startTime : 0),
            startTime: undefined
          });
        }
      }, 500);
      
    }, timerDuration);
    
    setTaskTimerId(timerId);
    setShowTaskTimer(false);
    
    // Show confirmation notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Task Timer Set`, {
        body: `Timer set for ${taskTimerMinutes} minutes for "${task.text}"`,
        icon: '/favicon.ico',
        tag: `${task.id}-set`,
        silent: true
      });
    }
  };

  const cancelTaskTimer = () => {
    if (taskTimerId) {
      clearTimeout(taskTimerId);
      setTaskTimerId(null);
    }
  };

  const playTaskNotificationSound = () => {
    try {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          const context = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = context.createOscillator();
          const gainNode = context.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(context.destination);
          
          oscillator.frequency.value = 800 + (i * 50);
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0, context.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.8, context.currentTime + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1);
          
          oscillator.start();
          oscillator.stop(context.currentTime + 1);
        }, i * 1200);
      }
    } catch (error) {
      console.log('Audio not supported');
    }
  };

  const formatTimeSpent = (timeSpent?: number) => {
    if (!timeSpent) return '';
    
    const totalSeconds = Math.floor(timeSpent / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `   (took ${hours}h ${minutes}m ${seconds}s)`;
    } else if (minutes > 0) {
      return `   (took ${minutes}m ${seconds}s)`;
    } else if (seconds > 0) {
      return `   (took ${seconds}s)`;
    }
    return '';
  };

  const getStatusIcon = () => {
    switch (task.status) {
      case 'done':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'progress':
        return <Play className="h-4 w-4 text-yellow-600" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  const getDisplayTime = () => {
    if (task.status === 'progress' && currentTime > 0) {
      return formatTimeSpent(currentTime);
    } else if (task.timeSpent && task.timeSpent > 0) {
      return formatTimeSpent(task.timeSpent);
    }
    return '';
  };

  const getScheduledTimeDisplay = () => {
    if (task.scheduledTime) {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const currentTimeHHMM = `${hours}:${minutes}`;
      const isCurrentTime = task.scheduledTime === currentTimeHHMM;
      
      return (
        <span className={isCurrentTime ? "text-red-600 font-bold animate-pulse" : ""}>
          {` <${task.scheduledTime}>`}
          {isCurrentTime && " 🔔"}
        </span>
      );
    }
    return '';
  };

  return (
    <>
      <div className="flex items-center gap-2 p-2 border rounded group hover:bg-muted/50 relative">
        <Button
          onClick={handleStatusClick}
          onContextMenu={handleRightClick}
          onMouseDown={handleLongPressStart}
          onMouseUp={handleLongPressEnd}
          onMouseLeave={handleLongPressEnd}
          onTouchStart={handleLongPressStart}
          onTouchEnd={handleLongPressEnd}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          title="Click to cycle: pending → progress → done → pending"
        >
          {getStatusIcon()}
        </Button>
        
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2" ref={inputRef}>
              <div className="flex-1 space-y-2">
                <Input
                  value={tempText}
                  onChange={(e) => setTempText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="h-8"
                  placeholder="Task name"
                  autoFocus
                />
                <Input
                  type="time"
                  value={tempScheduledTime}
                  onChange={(e) => setTempScheduledTime(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="h-8"
                  placeholder="Scheduled time (optional)"
                />
              </div>
              <Button onClick={saveText} size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Check className="h-4 w-4" />
              </Button>
              <Button onClick={cancelEdit} size="sm" variant="ghost" className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsEditing(true)}>
              <span className={`flex-1 ${
                task.status === 'done' ? 'line-through text-muted-foreground' : 
                task.status === 'progress' ? 'text-yellow-700 dark:text-yellow-400 font-medium' : ''
              }`}>
                {task.text} {getDisplayTime()} {getScheduledTimeDisplay()}
              </span>
              <Edit3 className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
            </div>
          )}
        </div>
        
        {task.status === 'progress' && (
          <div className="text-xs text-yellow-600 font-medium px-2">
            In Progress
          </div>
        )}

        {taskTimerId && (
          <div className="text-xs text-blue-600 font-medium px-2 flex items-center gap-1">
            <Bell className="h-3 w-3" />
            Timer Active
          </div>
        )}

        <Button
          onClick={() => setShowTaskTimer(!showTaskTimer)}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Set task timer"
        >
          <Clock className="h-4 w-4" />
        </Button>

        <Button
          onClick={() => setShowCategorySelect(true)}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Move to category"
        >
          <ArrowUpDown className="h-4 w-4" />
        </Button>
        
        <Button
          onClick={() => onDelete(task.id)}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>

        {showTaskTimer && (
          <div className="absolute z-10 bg-background border rounded-md shadow-lg p-3 mt-2 top-full right-0 w-64">
            <div className="space-y-3">
              <div className="text-sm font-medium">Set Task Timer</div>
              <div className="space-y-2">
                <Label htmlFor="timer-minutes" className="text-xs">
                  Minutes
                </Label>
                <Input
                  id="timer-minutes"
                  type="number"
                  min="1"
                  max="1440"
                  value={taskTimerMinutes}
                  onChange={(e) => setTaskTimerMinutes(parseInt(e.target.value) || 25)}
                  className="h-8"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={setTaskTimer}
                  size="sm"
                  className="flex-1 gap-1"
                  disabled={taskTimerMinutes <= 0}
                >
                  <Bell className="h-3 w-3" />
                  Set Timer
                </Button>
                {taskTimerId && (
                  <Button
                    onClick={cancelTaskTimer}
                    size="sm"
                    variant="outline"
                    className="gap-1"
                  >
                    <X className="h-3 w-3" />
                    Cancel
                  </Button>
                )}
              </div>
              <Button
                onClick={() => setShowTaskTimer(false)}
                size="sm"
                variant="ghost"
                className="w-full text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        )}

        {showCategorySelect && (
          <div className="absolute z-10 bg-background border rounded-md shadow-lg p-2 mt-2 top-full right-0">
            <div className="text-xs font-medium mb-2">Move to:</div>
            {availableCategories.map(category => (
              <Button
                key={category}
                onClick={() => handleCategoryChange(category)}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs"
                disabled={category === task.category}
              >
                {category}
              </Button>
            ))}
            <Button
              onClick={() => setShowCategorySelect(false)}
              variant="outline"
              size="sm"
              className="w-full mt-2 text-xs"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      {showContextMenu && (
        <TaskContextMenu
          position={contextMenuPosition}
          onClose={() => setShowContextMenu(false)}
          onStatusChange={handleContextStatusChange}
          onReset={handleReset}
          currentStatus={task.status}
        />
      )}
    </>
  );
}
