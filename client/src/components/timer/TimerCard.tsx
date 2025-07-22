import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Timer } from './TimerContainer';
import { Play, Pause, RotateCcw, Trash2, Edit3, Check, X, Upload, Volume2 } from 'lucide-react';

interface TimerCardProps {
  timer: Timer;
  onUpdate: (id: string, updates: Partial<Timer>) => void;
  onDelete: (id: string) => void;
}

export function TimerCard({ timer, onUpdate, onDelete }: TimerCardProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(timer.name);
  const [customAudioFile, setCustomAudioFile] = useState<string | null>(timer.customAudioFile || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (timer.isRunning && timer.remainingTime > 0) {
      intervalRef.current = setInterval(() => {
        onUpdate(timer.id, {
          remainingTime: Math.max(0, timer.remainingTime - 1)
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timer.isRunning, timer.remainingTime, timer.id, onUpdate]);

  useEffect(() => {
    if (timer.remainingTime === 0 && !timer.isFinished) {
      onUpdate(timer.id, { isRunning: false, isFinished: true });
      
      // Show notification
      if (Notification.permission === 'granted') {
        new Notification(`Timer "${timer.name}" finished!`);
      }
      
      // Play notification sound
      playNotificationSound();
    }
  }, [timer.remainingTime, timer.isFinished, timer.id, timer.name, onUpdate]);

  const playNotificationSound = () => {
    // Try custom audio first
    if (customAudioFile) {
      const audio = new Audio(customAudioFile);
      audio.volume = 0.8;
      audio.play().catch(() => {
        console.log('Custom audio failed, using fallback');
        playFallbackSound();
      });
    } else {
      playFallbackSound();
    }
  };

  const playFallbackSound = () => {
    try {
      // Create a loud, attention-grabbing sound
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          const context = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = context.createOscillator();
          const gainNode = context.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(context.destination);
          
          oscillator.frequency.value = 880; // A note, pleasant but attention-grabbing
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0, context.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.8, context.currentTime + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.8);
          
          oscillator.start();
          oscillator.stop(context.currentTime + 0.8);
        }, i * 900);
      }
    } catch (error) {
      console.log('Audio not supported');
    }
  };

  const handleToggle = () => {
    if (timer.isFinished) {
      // Reset timer
      onUpdate(timer.id, {
        remainingTime: timer.duration,
        isRunning: false,
        isFinished: false
      });
    } else {
      onUpdate(timer.id, { isRunning: !timer.isRunning });
    }
  };

  const handleReset = () => {
    onUpdate(timer.id, {
      remainingTime: timer.duration,
      isRunning: false,
      isFinished: false
    });
  };

  const handleNameSave = () => {
    if (tempName.trim()) {
      onUpdate(timer.id, { name: tempName.trim() });
    }
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setTempName(timer.name);
    setIsEditingName(false);
  };

  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomAudioFile(url);
      onUpdate(timer.id, { customAudioFile: url });
    }
  };

  const testCustomSound = () => {
    if (customAudioFile) {
      const audio = new Audio(customAudioFile);
      audio.volume = 0.8;
      audio.play().catch(err => {
        console.error('Failed to play custom audio:', err);
        alert('Failed to play custom audio. Please check the file format.');
      });
    }
  };

  const formatTimeInMinutes = (seconds: number) => {
    const totalMinutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    if (totalMinutes >= 60) {
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      return `${hours}h ${mins}m ${secs.toString().padStart(2, '0')}s`;
    }
    
    return `${totalMinutes}m ${secs.toString().padStart(2, '0')}s`;
  };

  const progress = ((timer.duration - timer.remainingTime) / timer.duration) * 100;

  return (
    <>
      <Card className={`w-full ${timer.isFinished ? 'ring-2 ring-green-500' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex-1">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="text-lg font-semibold"
                    autoFocus
                  />
                  <Button onClick={handleNameSave} size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button onClick={handleNameCancel} size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsEditingName(true)}>
                  <h3 className="text-lg font-semibold flex-1">{timer.name}</h3>
                  <Edit3 className="h-4 w-4 opacity-60 hover:opacity-100" />
                </div>
              )}
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-mono font-bold text-primary">
                {formatTimeInMinutes(timer.remainingTime)}
              </div>
              {timer.isFinished && (
                <div className="text-sm text-green-600 font-medium">
                  Time's up!
                </div>
              )}
            </div>
          </div>
          
          <Progress value={progress} className="mb-4" />
          
          <div className="flex gap-2 justify-center mb-4">
            <Button
              onClick={handleToggle}
              variant={timer.isRunning ? "secondary" : "default"}
              size="sm"
              className="gap-2"
            >
              {timer.isFinished ? (
                <>
                  <RotateCcw className="h-4 w-4" />
                  Restart
                </>
              ) : timer.isRunning ? (
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
              onClick={handleReset}
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

          {/* Audio upload section */}
          <div className="border-t pt-4 space-y-2">
            <div className="text-sm font-medium">Custom Alarm Sound</div>
            <div className="flex gap-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload Sound
              </Button>
              {customAudioFile && (
                <Button
                  onClick={testCustomSound}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Volume2 className="h-4 w-4" />
                  Test
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleAudioUpload}
                className="hidden"
              />
            </div>
            {customAudioFile && (
              <div className="text-xs text-green-600">Custom sound uploaded</div>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Timer"
        description="Are you sure you want to delete this timer?"
        onConfirm={() => onDelete(timer.id)}
      />
    </>
  );
}