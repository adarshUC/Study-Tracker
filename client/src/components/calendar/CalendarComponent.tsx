import * as React from 'react';

interface CalendarComponentProps {
  month: number;
  year: number;
  selectedDates: string[];
  completedDates?: string[];
  onDateClick: (dateStr: string) => void;
  days: string[];
}

export function CalendarComponent({ 
  month, 
  year, 
  selectedDates, 
  completedDates = [],
  onDateClick, 
  days 
}: CalendarComponentProps) {
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const formatDateString = (day: number) => {
    return `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(month, year);
    const firstDay = getFirstDayOfMonth(month, year);
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    const todayDate = today.getDate();

    const calendarDays = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(
        <div key={`empty-${i}`} className="h-10 w-10 flex items-center justify-center"></div>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = isCurrentMonth && day === todayDate;
      const dateStr = formatDateString(day);
      const isSelected = selectedDates.includes(dateStr);
      const isCompleted = completedDates.includes(dateStr);
      
      let className = 'h-10 w-10 flex items-center justify-center text-sm rounded-md cursor-pointer transition-all hover:bg-muted relative border ';
      
      if (isCompleted) {
        // Completed dates (green with checkmark)
        className += 'bg-green-500 text-white font-semibold border-green-600 hover:bg-green-600';
      } else if (isSelected) {
        // Selected but not completed (orange/blue)
        className += 'bg-orange-500 text-white font-semibold border-orange-600 hover:bg-orange-600';
      } else if (isToday) {
        // Today
        className += 'bg-primary text-primary-foreground font-semibold border-primary';
      } else {
        // Regular dates
        className += 'hover:bg-muted text-foreground border-transparent hover:border-border';
      }
      
      calendarDays.push(
        <div
          key={day}
          onClick={() => onDateClick(dateStr)}
          className={className}
          title={`${day}/${month + 1}/${year}${isCompleted ? ' (Completed)' : isSelected ? ' (Selected)' : ''}`}
        >
          <span className="relative z-10">{day}</span>
          {isCompleted && (
            <div className="absolute top-1 right-1 w-2 h-2 bg-green-200 rounded-full">
              <div className="w-full h-full bg-green-600 rounded-full"></div>
            </div>
          )}
        </div>
      );
    }

    return calendarDays;
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {days.map(day => (
          <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {renderCalendar()}
      </div>
      
      {/* Legend */}
      <div className="flex justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-orange-500 rounded border"></div>
          <span className="text-muted-foreground">Backlog</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded border"></div>
          <span className="text-muted-foreground">Completed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-primary rounded border"></div>
          <span className="text-muted-foreground">Today</span>
        </div>
      </div>
    </div>
  );
}
