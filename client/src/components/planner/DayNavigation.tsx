import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Calendar, Home } from 'lucide-react';
import { DayPlan } from './DailyPlanner';

interface DayNavigationProps {
  currentIndex: number;
  totalDays: number;
  onPrevious: () => void;
  onNext: () => void;
  onGoToToday: () => void;
  onJumpToDate: (index: number) => void;
  days: DayPlan[];
}

export function DayNavigation({
  currentIndex,
  totalDays,
  onPrevious,
  onNext,
  onGoToToday,
  onJumpToDate,
  days
}: DayNavigationProps) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <Button
          onClick={onPrevious}
          disabled={currentIndex === 0}
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="text-sm font-medium px-2">
          Day {currentIndex + 1} of {totalDays}
        </div>
        
        <Button
          onClick={onNext}
          disabled={currentIndex === totalDays - 1}
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex items-center gap-2">
        <Select
          value={currentIndex.toString()}
          onValueChange={(value) => onJumpToDate(parseInt(value))}
        >
          <SelectTrigger className="w-40 h-8">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            {days.map((day, index) => (
              <SelectItem key={day.id} value={index.toString()}>
                Day {day.dayNumber} - {day.date}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button
          onClick={onGoToToday}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Home className="h-4 w-4" />
          Today
        </Button>
      </div>
    </div>
  );
}