import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, CheckSquare, Clock, Timer, Play, Bell, Globe } from 'lucide-react';

interface NavigationProps {
  activeSection: string;
  onSectionChange: (section: 'planner' | 'calendar' | 'tasks' | 'timer' | 'stopwatch' | 'alarms' | 'embed') => void;
}

export function Navigation({ activeSection, onSectionChange }: NavigationProps) {
  const sections = [
    { id: 'planner', label: 'Planner', icon: Calendar },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'timer', label: 'Timer', icon: Timer },
    { id: 'stopwatch', label: 'Stopwatch', icon: Play },
    { id: 'alarms', label: 'Alarms', icon: Bell },
    { id: 'embed', label: 'Embed', icon: Globe },
  ] as const;

  return (
    <nav className="flex flex-wrap justify-center gap-2 sm:gap-4">
      {sections.map((section) => {
        const Icon = section.icon;
        return (
          <Button
            key={section.id}
            variant={activeSection === section.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSectionChange(section.id)}
            className="flex items-center gap-2 text-xs sm:text-sm"
          >
            <Icon className="h-4 w-4" />
            {section.label}
          </Button>
        );
      })}
    </nav>
  );
}
