import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock } from 'lucide-react';

const TIMER_TEMPLATES = [
  { label: '10 Minutes', minutes: 10 },
  { label: '20 Minutes', minutes: 20 },
  { label: '30 Minutes', minutes: 30 },
  { label: '45 Minutes', minutes: 45 },
  { label: '90 Minutes', minutes: 90 },
];

interface TimerTemplatesProps {
  onAddTimer: (name: string, minutes: number) => void;
}

export function TimerTemplates({ onAddTimer }: TimerTemplatesProps) {
  const handleStartTimer = (minutes: number, label: string) => {
    onAddTimer(label, minutes);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {TIMER_TEMPLATES.map((template) => (
        <Card key={template.minutes} className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
            <h3 className="font-semibold mb-2">{template.label}</h3>
            <Button
              onClick={() => handleStartTimer(template.minutes, template.label)}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Start Timer
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}