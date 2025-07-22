import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EditableName } from './EditableName';
import { TimeDisplay } from './TimeDisplay';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useStopwatch } from '@/hooks/useStopwatch';
import { Play, Pause, Trash2, RotateCcw } from 'lucide-react';

interface StopwatchCardProps {
  id: string;
  initialName: string;
  initialTime: number;
  initialTotalTime: number;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: any) => void;
}

export function StopwatchCard({ 
  id, 
  initialName, 
  initialTime, 
  initialTotalTime,
  onDelete, 
  onUpdate 
}: StopwatchCardProps) {
  const { time, isRunning, start, pause, reset } = useStopwatch(initialTime);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [showResetDialog, setShowResetDialog] = React.useState(false);

  React.useEffect(() => {
    onUpdate(id, { time, isRunning, totalTime: initialTotalTime + time });
  }, [time, isRunning, id, onUpdate, initialTotalTime]);

  const handleToggle = () => {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  };

  const handleReset = () => {
    reset();
    setShowResetDialog(false);
  };

  const handleDelete = () => {
    onDelete(id);
    setShowDeleteDialog(false);
  };

  const handleNameUpdate = (newName: string) => {
    onUpdate(id, { name: newName });
  };

  return (
    <>
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <EditableName 
                initialName={initialName}
                onUpdate={handleNameUpdate}
              />
            </div>
            
            <div className="flex-shrink-0">
              <TimeDisplay time={time} />
            </div>
            
            <div className="flex gap-2 flex-shrink-0">
              <Button
                onClick={handleToggle}
                variant={isRunning ? "secondary" : "default"}
                size="sm"
                className="gap-2"
              >
                {isRunning ? (
                  <>
                    <Pause className="h-4 w-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Start
                  </>
                )}
              </Button>
              
              <Button
                onClick={() => setShowResetDialog(true)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
              
              <Button
                onClick={() => setShowDeleteDialog(true)}
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Stopwatch"
        description="Are you sure you want to delete this stopwatch? This action cannot be undone."
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={showResetDialog}
        onOpenChange={setShowResetDialog}
        title="Reset Stopwatch"
        description="Are you sure you want to reset this stopwatch? All time will be lost."
        onConfirm={handleReset}
      />
    </>
  );
}