import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlannerDay } from './PlannerDay';
import { DayNavigation } from './DayNavigation';
import { QuoteSection } from '../shared/QuoteSection';
import { APP_CONFIG } from '@/config/settings';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';

export interface PlannerTask {
  id: string;
  text: string;
  status: 'pending' | 'progress' | 'done';
  startTime?: number;
  timeSpent?: number;
  category: string;
  scheduledTime?: string; // HH:MM format
}

export interface DayPlan {
  id: string;
  dayNumber: number;
  date: string;
  streak: number | string;
  wokeUp: string;
  tasks: PlannerTask[];
  dayRating: number;
  dayReflection: string;
}

export function DailyPlanner() {
  const [days, setDays] = useState<DayPlan[]>(() => {
    const saved = localStorage.getItem('dailyPlanner');
    if (saved) {
      return JSON.parse(saved);
    }
    
    const today = new Date();
    const todayStr = today.toLocaleDateString('en-GB');
    
    return [{
      id: '1',
      dayNumber: 1,
      date: todayStr,
      streak: 1,
      wokeUp: APP_CONFIG.DAILY_PLANNER.DEFAULT_WAKE_UP_TIME,
      tasks: [
        { id: '1', text: 'Morning routine', status: 'done', category: 'aaj ka kaam' },
        { id: '2', text: 'Trigo. fn. LEC 04', status: 'pending', category: 'aaj ka kaam' },
        { id: '3', text: 'Notes revise', status: 'pending', category: 'others' },
      ],
      dayRating: 0,
      dayReflection: ''
    }];
  });

  const [currentDayIndex, setCurrentDayIndex] = useState(() => {
    // Find today's date and set it as current
    const todayStr = new Date().toLocaleDateString('en-GB');
    const saved = localStorage.getItem('dailyPlanner');
    if (saved) {
      const savedDays = JSON.parse(saved);
      const todayIndex = savedDays.findIndex((day: DayPlan) => day.date === todayStr);
      return todayIndex !== -1 ? todayIndex : savedDays.length - 1;
    }
    return 0;
  });

  const [dynamicQuote, setDynamicQuote] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    localStorage.setItem('dailyPlanner', JSON.stringify(days));
  }, [days]);

  // Independent current time system with HH:MM:SS format
  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}:${seconds}`;
      setCurrentTime(timeString);
    };

    // Set initial time immediately
    updateCurrentTime();
    
    // Clear any existing interval
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
    }
    
    // Create interval that updates every second
    timeIntervalRef.current = setInterval(updateCurrentTime, 1000);
    
    // Cleanup function
    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
    };
  }, []); // Empty dependency array - completely independent

  // Auto-navigate to today when component mounts or days change
  useEffect(() => {
    const todayStr = new Date().toLocaleDateString('en-GB');
    const todayIndex = days.findIndex(day => day.date === todayStr);
    if (todayIndex !== -1 && todayIndex !== currentDayIndex) {
      setCurrentDayIndex(todayIndex);
    }
  }, [days]);

  const generateDynamicQuote = (currentDay?: DayPlan, taskIndex?: number, taskStatus?: 'progress' | 'done') => {
    if (!currentDay) return '';

    const aajKaKaamTasks = currentDay.tasks.filter(t => t.category === 'aaj ka kaam');
    const otherTasks = currentDay.tasks.filter(t => t.category === 'others');
    
    const aajKaKaamCompleted = aajKaKaamTasks.filter(t => t.status === 'done').length;
    const aajKaKaamTotal = aajKaKaamTasks.length;
    const aajKaKaamInProgress = aajKaKaamTasks.some(t => t.status === 'progress');
    
    const otherCompleted = otherTasks.filter(t => t.status === 'done').length;
    const otherTotal = otherTasks.length;
    
    // Task-specific quotes based on position and status
    if (taskIndex !== undefined && taskStatus) {
      const remainingTasks = aajKaKaamTotal - aajKaKaamCompleted;
      
      if (taskStatus === 'progress') {
        if (aajKaKaamCompleted === 0) {
          return "Great start! You've begun your first task. Stay focused and maintain this momentum.";
        } else if (remainingTasks === 2) {
          return "You're doing well! Second last task in progress. Don't let distractions steal your focus now.";
        } else if (remainingTasks === 1) {
          return "Final task in progress! You're so close to completing everything. Push through with determination!";
        } else {
          return "Keep the momentum going! Every step forward builds your discipline.";
        }
      }
      
      if (taskStatus === 'done') {
        if (aajKaKaamCompleted === 1) {
          return "Excellent! First task completed. You're building momentum. Keep this energy flowing!";
        } else if (remainingTasks === 1) {
          return "Amazing progress! Just one more task to complete and you'll build another level of discipline. You've got this!";
        } else if (remainingTasks === 0) {
          if (otherTotal > 0 && otherCompleted < otherTotal) {
            return "Congratulations! All priority tasks completed! You've shown great discipline. Time to tackle your other tasks or take a well-deserved rest.";
          } else {
            return "Outstanding achievement! All tasks completed! You've demonstrated exceptional discipline today. Rest well, you've earned it!";
          }
        } else {
          return "Task completed! You're building unstoppable momentum. Stay consistent with this winning attitude!";
        }
      }
    }

    // Check yesterday's progress if exists
    const yesterdayIndex = currentDayIndex - 1;
    const yesterday = yesterdayIndex >= 0 ? days[yesterdayIndex] : null;
    
    if (yesterday) {
      const yesterdayAajKaKaam = yesterday.tasks.filter(t => t.category === 'aaj ka kaam');
      const yesterdayAajKaKaamCompleted = yesterdayAajKaKaam.filter(t => t.status === 'done').length;
      const yesterdayAajKaKaamTotal = yesterdayAajKaKaam.length;
      const yesterdayProgress = yesterdayAajKaKaamTotal > 0 ? (yesterdayAajKaKaamCompleted / yesterdayAajKaKaamTotal) : 0;
      const todayProgress = aajKaKaamTotal > 0 ? (aajKaKaamCompleted / aajKaKaamTotal) : 0;
      
      if (todayProgress > yesterdayProgress) {
        return "You're improving! Today's progress is better than yesterday. Keep pushing forward with determination.";
      }
    }

    // General status quotes
    if (aajKaKaamInProgress) {
      return "Stay focused! You're making progress. Every second counts toward your goal.";
    }

    if (aajKaKaamTotal > 0 && aajKaKaamCompleted === aajKaKaamTotal) {
      if (otherTotal > 0 && otherCompleted < otherTotal) {
        return "Great work completing today's priorities! Keep the momentum going with your other tasks. Don't let success make you complacent.";
      } else if (otherTotal > 0 && otherCompleted === otherTotal) {
        return "Outstanding! You've completed all tasks today. Remember, consistency is key - prepare for tomorrow and maintain this excellence.";
      } else {
        return "Excellent! You've finished today's main tasks. Don't let this success lead to distractions - stay disciplined and prepare for tomorrow.";
      }
    }

    // Return default from config
    return APP_CONFIG.QUOTES.DAILY_PLANNER[0];
  };

  const handleTaskProgress = (taskName: string, status: 'progress' | 'done', taskIndex: number, totalTasks: number) => {
    const currentDay = days[currentDayIndex];
    setTimeout(() => {
      const updatedQuote = generateDynamicQuote(currentDay, taskIndex, status);
      setDynamicQuote(updatedQuote);
    }, 100);
  };

  const addNewDay = () => {
    const lastDay = days[days.length - 1];
    
    // Check if day rating is required and not provided
    if (APP_CONFIG.DAILY_PLANNER.REQUIRE_DAY_RATING_FOR_NEW_DAY && 
        lastDay && lastDay.dayRating === 0) {
      alert('Please rate your current day before adding a new day!');
      return;
    }
    
    const today = new Date();
    
    let newDate;
    if (lastDay) {
      const [day, month, year] = lastDay.date.split('/').map(Number);
      const lastDate = new Date(year, month - 1, day);
      lastDate.setDate(lastDate.getDate() + 1);
      newDate = lastDate.toLocaleDateString('en-GB');
    } else {
      newDate = today.toLocaleDateString('en-GB');
    }
    
    const newDay: DayPlan = {
      id: Date.now().toString(),
      dayNumber: lastDay ? lastDay.dayNumber + 1 : 1,
      date: newDate,
      streak: lastDay && typeof lastDay.streak === 'string' ? lastDay.streak : (lastDay ? lastDay.streak + 1 : 1),
      wokeUp: lastDay ? lastDay.wokeUp : APP_CONFIG.DAILY_PLANNER.DEFAULT_WAKE_UP_TIME,
      tasks: lastDay ? lastDay.tasks.map(task => ({
        ...task,
        id: Date.now().toString() + Math.random(),
        status: 'pending' as const,
        startTime: undefined,
        timeSpent: undefined
      })) : [],
      dayRating: 0,
      dayReflection: ''
    };
    
    setDays(prev => [...prev, newDay]);
    setCurrentDayIndex(days.length);
  };

  const updateDay = (dayId: string, updates: Partial<DayPlan>) => {
    setDays(prev => prev.map(day => 
      day.id === dayId ? { ...day, ...updates } : day
    ));
    
    // Update dynamic quote after task changes
    if (updates.tasks) {
      setTimeout(() => {
        const currentDay = days.find(d => d.id === dayId);
        if (currentDay) {
          const updatedQuote = generateDynamicQuote({ ...currentDay, ...updates } as DayPlan);
          setDynamicQuote(updatedQuote);
        }
      }, 100);
    }
  };

  const deleteDay = (dayId: string) => {
    setDays(prev => {
      const newDays = prev.filter(day => day.id !== dayId);
      if (currentDayIndex >= newDays.length && newDays.length > 0) {
        setCurrentDayIndex(newDays.length - 1);
      }
      return newDays;
    });
  };

  const goToToday = () => {
    const todayStr = new Date().toLocaleDateString('en-GB');
    const todayIndex = days.findIndex(day => day.date === todayStr);
    if (todayIndex !== -1) {
      setCurrentDayIndex(todayIndex);
    }
  };

  const currentDay = days[currentDayIndex];

  // Update dynamic quote when current day changes
  useEffect(() => {
    if (currentDay) {
      const quote = generateDynamicQuote(currentDay);
      setDynamicQuote(quote);
    }
  }, [currentDayIndex, currentDay]);

  return (
    <div className="space-y-6">
      <QuoteSection 
        quotes={APP_CONFIG.QUOTES.DAILY_PLANNER}
        dynamicQuote={dynamicQuote}
      />
      
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Daily Planner</h2>
        <div className="text-sm text-muted-foreground font-mono">
          Current time: {currentTime}
        </div>
      </div>

      {currentDay && (
        <div className="space-y-6">
          <DayNavigation
            currentIndex={currentDayIndex}
            totalDays={days.length}
            onPrevious={() => setCurrentDayIndex(prev => Math.max(0, prev - 1))}
            onNext={() => setCurrentDayIndex(prev => Math.min(days.length - 1, prev + 1))}
            onGoToToday={goToToday}
            onJumpToDate={(index) => setCurrentDayIndex(index)}
            days={days}
          />
          
          <PlannerDay
            day={currentDay}
            onUpdate={updateDay}
            onDelete={deleteDay}
            onTaskProgress={handleTaskProgress}
          />
          
          <div className="text-center">
            <Button onClick={addNewDay} className="gap-2">
              <Plus className="h-4 w-4" />
              Add New Day
            </Button>
          </div>
        </div>
      )}

      {!currentDay && (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">No days added yet</p>
          <Button onClick={addNewDay} className="gap-2">
            <Plus className="h-4 w-4" />
            Add First Day
          </Button>
        </div>
      )}
    </div>
  );
}
