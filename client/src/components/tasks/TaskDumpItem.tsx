import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { DumpTask } from './TaskDump';
import { Edit3, Check, X, Trash2, ArrowRight, Star } from 'lucide-react';

interface TaskDumpItemProps {
  task: DumpTask;
  onUpdate: (taskId: string, updates: Partial<DumpTask>) => void;
  onDelete: (taskId: string) => void;
  onMoveToPlanner: (task: DumpTask) => void;
}

export function TaskDumpItem({ task, onUpdate, onDelete, onMoveToPlanner }: TaskDumpItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempText, setTempText] = useState(task.text);
  const [tempCategory, setTempCategory] = useState(task.category);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    onUpdate(task.id, { text: tempText, category: tempCategory });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempText(task.text);
    setTempCategory(task.category);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handlePriorityChange = (priority: 'low' | 'medium' | 'high') => {
    onUpdate(task.id, { priority });
  };

  const handleMoveToPlanner = () => {
    // Get saved daily planner data
    const saved = localStorage.getItem('dailyPlanner');
    if (saved) {
      const plannerData = JSON.parse(saved);
      
      // Find the most recent day or create a new one
      let targetDay = plannerData[plannerData.length - 1];
      
      if (!targetDay) {
        // Create a new day if none exists
        const today = new Date();
        const todayStr = today.toLocaleDateString('en-GB');
        targetDay = {
          id: Date.now().toString(),
          dayNumber: 1,
          date: todayStr,
          streak: 1,
          wokeUp: '06:00',
          tasks: [],
          dayRating: 0,
          dayReflection: ''
        };
        plannerData.push(targetDay);
      }
      
      // Add task to the target day
      const newTask = {
        id: Date.now().toString(),
        text: task.text,
        status: 'pending',
        category: 'aaj ka kaam' // Default category
      };
      
      targetDay.tasks.push(newTask);
      
      // Save back to localStorage
      localStorage.setItem('dailyPlanner', JSON.stringify(plannerData));
      
      // Remove from task dump
      onDelete(task.id);
      
      // Show success message
      alert(`Task "${task.text}" moved to Daily Planner!`);
      
      // Dispatch event to refresh planner if it's open
      window.dispatchEvent(new CustomEvent('plannerUpdated'));
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 border-red-200 bg-red-50 dark:bg-red-950/20';
      case 'medium':
        return 'text-yellow-600 border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20';
      case 'low':
        return 'text-green-600 border-green-200 bg-green-50 dark:bg-green-950/20';
      default:
        return 'text-gray-600 border-gray-200 bg-gray-50 dark:bg-gray-950/20';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚫';
    }
  };

  return (
    <>
      <div className={`flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors ${getPriorityColor(task.priority)}`}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{getPriorityIcon(task.priority)}</span>
          <div className="text-xs text-muted-foreground">
            {task.priority.toUpperCase()}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-2">
              <Input
                ref={inputRef}
                value={tempText}
                onChange={(e) => setTempText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Task name"
                className="h-8"
              />
              <Input
                value={tempCategory}
                onChange={(e) => setTempCategory(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Category"
                className="h-8"
              />
            </div>
          ) : (
            <div className="cursor-pointer" onClick={() => setIsEditing(true)}>
              <div className="font-medium">{task.text}</div>
              <div className="text-xs text-muted-foreground">
                {task.category} • Added {task.createdAt}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button onClick={handleSave} size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Check className="h-4 w-4" />
              </Button>
              <Button onClick={handleCancel} size="sm" variant="ghost" className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Select value={task.priority} onValueChange={handlePriorityChange}>
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                onClick={handleMoveToPlanner}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                title="Move to Daily Planner"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
              
              <Button
                onClick={() => setIsEditing(true)}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                title="Edit task"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              
              <Button
                onClick={() => setShowDeleteDialog(true)}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                title="Delete task"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Task"
        description="Are you sure you want to delete this task? This action cannot be undone."
        onConfirm={() => onDelete(task.id)}
      />
    </>
  );
}
