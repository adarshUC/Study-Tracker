import * as React from 'react';
import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TaskItem } from './TaskItem';
import { CopyButton } from './CopyButton';
import { WakeUpInput } from './WakeUpInput';
import { DayRating } from './DayRating';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { DayPlan, PlannerTask } from './DailyPlanner';
import { APP_CONFIG } from '@/config/settings';
import { Plus, Trash2, Edit3, Check, X } from 'lucide-react';

interface PlannerDayProps {
  day: DayPlan;
  onUpdate: (dayId: string, updates: Partial<DayPlan>) => void;
  onDelete: (dayId: string) => void;
  onTaskProgress?: (taskName: string, status: 'progress' | 'done', taskIndex: number, totalTasks: number) => void;
}

export function PlannerDay({ day, onUpdate, onDelete, onTaskProgress }: PlannerDayProps) {
  const [editingDayNumber, setEditingDayNumber] = useState(false);
  const [editingStreak, setEditingStreak] = useState(false);
  const [editingDate, setEditingDate] = useState(false);
  const [tempDayNumber, setTempDayNumber] = useState(day.dayNumber.toString());
  const [tempStreak, setTempStreak] = useState(day.streak.toString());
  const [tempDate, setTempDate] = useState(day.date);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const addTask = (category = 'aaj ka kaam') => {
    const newTask: PlannerTask = {
      id: Date.now().toString(),
      text: 'New task',
      status: 'pending',
      category
    };
    onUpdate(day.id, { tasks: [...day.tasks, newTask] });
  };

  const updateTask = (taskId: string, updates: Partial<PlannerTask>) => {
    const updatedTasks = day.tasks.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    );
    onUpdate(day.id, { tasks: updatedTasks });
  };

  const deleteTask = (taskId: string) => {
    const updatedTasks = day.tasks.filter(task => task.id !== taskId);
    onUpdate(day.id, { tasks: updatedTasks });
  };

  const saveDayNumber = () => {
    const dayNum = parseInt(tempDayNumber) || 1;
    onUpdate(day.id, { dayNumber: dayNum });
    setEditingDayNumber(false);
  };

  const saveStreak = () => {
    const input = tempStreak.trim();
    let streakValue: string | number;
    
    // Allow 'x', 'X', or any string input including '0'
    if (input.toLowerCase() === 'x') {
      streakValue = 'x';
    } else if (input === '0') {
      streakValue = '0';
    } else if (!isNaN(Number(input)) && input !== '') {
      streakValue = parseInt(input);
    } else {
      streakValue = input || '0'; // Default to '0' if empty
    }
    
    onUpdate(day.id, { streak: streakValue });
    setEditingStreak(false);
  };

  const saveDate = () => {
    onUpdate(day.id, { date: tempDate });
    setEditingDate(false);
  };

  const handleWakeUpUpdate = (time: string) => {
    onUpdate(day.id, { wokeUp: time });
  };

  const handleRatingUpdate = (rating: number, reflection: string) => {
    onUpdate(day.id, { dayRating: rating, dayReflection: reflection });
  };

  const handleStartTimer = (taskName: string) => {
    window.dispatchEvent(new CustomEvent('startTaskTimer', { 
      detail: { taskName } 
    }));
  };

  const handleTaskProgress = (taskName: string, status: 'progress' | 'done', taskIndex: number, totalTasks: number) => {
    if (onTaskProgress) {
      onTaskProgress(taskName, status, taskIndex, totalTasks);
    }
  };

  const formatTimeSpent = (timeSpent?: number) => {
    if (!timeSpent) return '';
    
    const totalSeconds = Math.floor(timeSpent / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return ` (took ${hours}h ${minutes}m ${seconds}s)`;
    } else if (minutes > 0) {
      return ` (took ${minutes}m ${seconds}s)`;
    } else if (seconds > 0) {
      return ` (took ${seconds}s)`;
    }
    return '';
  };

  const generateCopyText = () => {
    // Extract date parts
    const [dayPart, monthPart, yearPart] = day.date.split('/');
    const formattedDate = `${dayPart}/${monthPart}/${yearPart}`;
    
    // Extract time parts
    const [hour, minute] = day.wokeUp.split(':');
    
    // Format streak properly
    let streakDisplay;
    if (typeof day.streak === 'string') {
      streakDisplay = day.streak === 'x' ? 'x' : day.streak;
    } else {
      streakDisplay = day.streak.toString();
    }
    
    // Header with exact format
    const header = `#Day_${day.dayNumber.toString().padStart(2, '0')}   |  ${formattedDate}   | streak ${streakDisplay}`;
    
    // Wake up line with exact format
    const wakeUpLine = `------------- {woke_up:"${hour}:${minute}"} ---------------`;
    
    // Group tasks by category
    const tasksByCategory = day.tasks.reduce((acc, task) => {
      if (!acc[task.category]) {
        acc[task.category] = [];
      }
      acc[task.category].push(task);
      return acc;
    }, {} as Record<string, PlannerTask[]>);
    
    const taskLines: string[] = [];
    
    // Add aaj ka kaam tasks first
    if (tasksByCategory['aaj ka kaam']) {
      tasksByCategory['aaj ka kaam'].forEach(task => {
        const statusText = task.status === 'done' ? 'done' : task.status === 'progress' ? '~' : '';
        const timeSpent = formatTimeSpent(task.timeSpent);
        const scheduledTime = task.scheduledTime ? `<${task.scheduledTime}>` : '<input:input>';
        taskLines.push(`${scheduledTime}[${statusText}] ${task.text}${timeSpent}`);
      });
    }
    
    // Add separator
    taskLines.push('---------------------------------------------------------');
    
    // Add other category tasks
    Object.entries(tasksByCategory).forEach(([category, tasks]) => {
      if (category !== 'aaj ka kaam') {
        tasks.forEach(task => {
          const statusText = task.status === 'done' ? 'done' : task.status === 'progress' ? '~' : '';
          const timeSpent = formatTimeSpent(task.timeSpent);
          const scheduledTime = task.scheduledTime ? `<${task.scheduledTime}>` : '<input:input>';
          taskLines.push(`${scheduledTime}[${statusText}] ${task.text}${timeSpent}`);
        });
      }
    });

    // Add day rating if exists
    if (day.dayRating > 0) {
      taskLines.push('---------------------------------------------------------');
      taskLines.push(`Day Rating: ${'★'.repeat(day.dayRating)}${'☆'.repeat(5 - day.dayRating)}`);
      if (day.dayReflection) {
        taskLines.push(`Reflection: ${day.dayReflection}`);
      }
    }
    
    // Join with proper line breaks
    return [header, wakeUpLine, ...taskLines].join('\n');
  };

  // Group tasks by category
  const tasksByCategory = day.tasks.reduce((acc, task) => {
    const category = task.category || 'others';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(task);
    return acc;
  }, {} as Record<string, PlannerTask[]>);

  const categories = APP_CONFIG.DAILY_PLANNER.CATEGORIES;

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                {editingDayNumber ? (
                  <div className="flex items-center gap-1">
                    <span className="font-mono font-bold">#Day_</span>
                    <Input
                      value={tempDayNumber}
                      onChange={(e) => setTempDayNumber(e.target.value)}
                      className="w-16 h-8"
                      type="number"
                    />
                    <Button onClick={saveDayNumber} size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button onClick={() => setEditingDayNumber(false)} size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 cursor-pointer" onClick={() => setEditingDayNumber(true)}>
                    <span className="font-mono font-bold text-lg">
                      #Day_{day.dayNumber.toString().padStart(2, '0')}
                    </span>
                    <Edit3 className="h-3 w-3 opacity-60" />
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {editingDate ? (
                  <div className="flex items-center gap-1">
                    <Input
                      value={tempDate}
                      onChange={(e) => setTempDate(e.target.value)}
                      className="w-32 h-8"
                      placeholder="DD/MM/YYYY"
                    />
                    <Button onClick={saveDate} size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button onClick={() => setEditingDate(false)} size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 cursor-pointer" onClick={() => setEditingDate(true)}>
                    <span className="font-medium">{day.date}</span>
                    <Edit3 className="h-3 w-3 opacity-60" />
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <span>streak</span>
                {editingStreak ? (
                  <div className="flex items-center gap-1">
                    <Input
                      value={tempStreak}
                      onChange={(e) => setTempStreak(e.target.value)}
                      className="w-16 h-8"
                      placeholder="x or #"
                    />
                    <Button onClick={saveStreak} size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button onClick={() => setEditingStreak(false)} size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 cursor-pointer" onClick={() => setEditingStreak(true)}>
                    <span className="font-medium">
                      {typeof day.streak === 'string' ? day.streak : day.streak.toString()}
                    </span>
                    <Edit3 className="h-3 w-3 opacity-60" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <CopyButton text={generateCopyText()} />
              <Button
                onClick={() => setShowDeleteDialog(true)}
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center border-t border-b py-3">
            <WakeUpInput
              value={day.wokeUp}
              onUpdate={handleWakeUpUpdate}
            />
          </div>
          
          <div className="space-y-6">
            {categories.map(category => (
              <div key={category}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                    {category}
                  </h4>
                  <Button 
                    onClick={() => addTask(category)} 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 text-xs"
                  >
                    <Plus className="h-3 w-3" />
                    Add
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {tasksByCategory[category]?.map((task, index) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onUpdate={updateTask}
                      onDelete={deleteTask}
                      onStartTimer={handleStartTimer}
                      onTaskProgress={handleTaskProgress}
                      onCategoryChange={(newCategory) => updateTask(task.id, { category: newCategory })}
                      availableCategories={categories}
                      taskIndex={index}
                      totalTasks={tasksByCategory[category]?.length || 0}
                    />
                  )) || (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      No tasks in this category
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <DayRating
            rating={day.dayRating || 0}
            reflection={day.dayReflection || ''}
            onUpdate={handleRatingUpdate}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Day"
        description="Are you sure you want to delete this day? This action cannot be undone."
        onConfirm={() => onDelete(day.id)}
      />
    </>
  );
}
