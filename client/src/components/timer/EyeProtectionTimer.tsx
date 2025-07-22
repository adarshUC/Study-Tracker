import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Eye, Play, Pause, RotateCcw, RotateCw, X } from 'lucide-react';

// Persistent timer state
let globalTimerState = {
  timeRemaining: 20 * 60,
  isRunning: false,
  isLooping: true,
  isBreakTime: false,
  breakTimeRemaining: 20,
  hasAutoStarted: false
};

export function EyeProtectionTimer() {
  const [timeRemaining, setTimeRemaining] = useState(globalTimerState.timeRemaining);
  const [isRunning, setIsRunning] = useState(globalTimerState.isRunning);
  const [isLooping, setIsLooping] = useState(globalTimerState.isLooping);
  const [isBreakTime, setIsBreakTime] = useState(globalTimerState.isBreakTime);
  const [breakTimeRemaining, setBreakTimeRemaining] = useState(globalTimerState.breakTimeRemaining);
  const [showStartupPopup, setShowStartupPopup] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const breakIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const popupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load audio file
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.src = 'https://drive.google.com/uc?export=download&id=1yoXwGAf0yqcrfFr5FFNu2iPIxwTrd2Hj';
    audioRef.current.load();
    
    // Fallback audio creation if file doesn't load
    audioRef.current.addEventListener('error', () => {
      console.log('Custom audio file not available, using fallback sound');
      audioRef.current = null;
    });
  }, []);

  // Auto-start timer once when website loads
  useEffect(() => {
    const hasStarted = localStorage.getItem('eyeProtectionAutoStarted');
    
    if (!hasStarted && !globalTimerState.hasAutoStarted) {
      globalTimerState.hasAutoStarted = true;
      globalTimerState.isRunning = true;
      setIsRunning(true);
      setShowStartupPopup(true);
      localStorage.setItem('eyeProtectionAutoStarted', 'true');
      
      popupTimeoutRef.current = setTimeout(() => {
        setShowStartupPopup(false);
      }, 5000);
    }
    
    return () => {
      if (popupTimeoutRef.current) {
        clearTimeout(popupTimeoutRef.current);
      }
    };
  }, []);

  // Sync with global state
  useEffect(() => {
    setTimeRemaining(globalTimerState.timeRemaining);
    setIsRunning(globalTimerState.isRunning);
    setIsLooping(globalTimerState.isLooping);
    setIsBreakTime(globalTimerState.isBreakTime);
    setBreakTimeRemaining(globalTimerState.breakTimeRemaining);
  }, []);

  useEffect(() => {
    if (isRunning && !isBreakTime) {
      intervalRef.current = setInterval(() => {
        globalTimerState.timeRemaining--;
        setTimeRemaining(globalTimerState.timeRemaining);
        
        if (globalTimerState.timeRemaining <= 0) {
          globalTimerState.isBreakTime = true;
          globalTimerState.breakTimeRemaining = 20;
          setIsBreakTime(true);
          setBreakTimeRemaining(20);
          startBreakAlarm();
          globalTimerState.timeRemaining = 20 * 60;
          setTimeRemaining(20 * 60);
        }
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
  }, [isRunning, isBreakTime]);

  useEffect(() => {
    if (isBreakTime && isRunning) {
      breakIntervalRef.current = setInterval(() => {
        globalTimerState.breakTimeRemaining--;
        setBreakTimeRemaining(globalTimerState.breakTimeRemaining);
        
        if (globalTimerState.breakTimeRemaining <= 0) {
          globalTimerState.isBreakTime = false;
          globalTimerState.timeRemaining = 20 * 60;
          globalTimerState.breakTimeRemaining = 20;
          setIsBreakTime(false);
          setTimeRemaining(20 * 60);
          setBreakTimeRemaining(20);
          
          if (!isLooping) {
            globalTimerState.isRunning = false;
            setIsRunning(false);
          }
        }
      }, 1000);
    } else {
      if (breakIntervalRef.current) {
        clearInterval(breakIntervalRef.current);
        breakIntervalRef.current = null;
      }
    }

    return () => {
      if (breakIntervalRef.current) {
        clearInterval(breakIntervalRef.current);
      }
    };
  }, [isBreakTime, isRunning, isLooping]);

  const startBreakAlarm = () => {
    // Try to play custom audio first
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        console.log('Custom audio playback failed, using fallback');
        playFallbackAlarm();
      });
    } else {
      playFallbackAlarm();
    }
  };

  const playFallbackAlarm = () => {
    // Fallback beep sound for 20 seconds
    let beepCount = 0;
    const playBeep = () => {
      try {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        
        oscillator.frequency.value = 1000;
        oscillator.type = 'square';
        
        gainNode.gain.setValueAtTime(0, context.currentTime);
        gainNode.gain.linearRampToValueAtTime(1.0, context.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.2);
        
        oscillator.start();
        oscillator.stop(context.currentTime + 0.2);
      } catch (error) {
        console.log('Audio not supported');
      }
    };

    const alarmInterval = setInterval(() => {
      if (beepCount < 20 && globalTimerState.isBreakTime) {
        playBeep();
        beepCount++;
      } else {
        clearInterval(alarmInterval);
      }
    }, 1000);

    playBeep();
  };

  const handleToggle = () => {
    globalTimerState.isRunning = !globalTimerState.isRunning;
    setIsRunning(globalTimerState.isRunning);
    setShowStartupPopup(false);
  };

  const handleReset = () => {
    globalTimerState.isRunning = false;
    globalTimerState.isBreakTime = false;
    globalTimerState.timeRemaining = 20 * 60;
    globalTimerState.breakTimeRemaining = 20;
    setIsRunning(false);
    setIsBreakTime(false);
    setTimeRemaining(20 * 60);
    setBreakTimeRemaining(20);
    setShowStartupPopup(false);
  };

  const handleLoopToggle = () => {
    globalTimerState.isLooping = !globalTimerState.isLooping;
    setIsLooping(globalTimerState.isLooping);
  };

  const handleClosePopup = () => {
    setShowStartupPopup(false);
    if (popupTimeoutRef.current) {
      clearTimeout(popupTimeoutRef.current);
    }
  };

  const handleStopFromPopup = () => {
    globalTimerState.isRunning = false;
    globalTimerState.isLooping = false;
    setIsRunning(false);
    setIsLooping(false);
    setShowStartupPopup(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = isBreakTime 
    ? ((20 - breakTimeRemaining) / 20) * 100
    : ((20 * 60 - timeRemaining) / (20 * 60)) * 100;

  return (
    <>
      {showStartupPopup && (
        <div className="fixed top-4 left-4 z-50 bg-background border rounded-lg shadow-lg p-4 max-w-sm">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-500" />
              <span className="font-medium text-sm">Eye Protection Timer Started</span>
            </div>
            <Button
              onClick={handleClosePopup}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            20-20-20 rule: Every 20 minutes, look at something 20 feet away for 20 seconds.
          </p>
          <div className="flex gap-2">
            <Button onClick={handleClosePopup} variant="outline" size="sm" className="text-xs">
              OK
            </Button>
            <Button onClick={handleStopFromPopup} variant="destructive" size="sm" className="text-xs">
              Stop Timer
            </Button>
          </div>
        </div>
      )}

      <Card className={`border-2 ${isBreakTime ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'}`}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Eye Protection Timer (20-20-20 Rule)
            <span className="text-sm font-normal text-muted-foreground ml-2">
              Pinned
            </span>
            <Button
              onClick={handleLoopToggle}
              variant="ghost"
              size="sm"
              className={`ml-auto h-6 w-6 p-0 ${isLooping ? 'text-blue-600' : 'text-muted-foreground'}`}
              title={isLooping ? 'Loop enabled' : 'Loop disabled'}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-mono font-bold mb-2">
              {isBreakTime ? formatTime(breakTimeRemaining) : formatTime(timeRemaining)}
            </div>
            <div className="text-sm text-muted-foreground">
              {isBreakTime 
                ? "Look at something 20 feet away!" 
                : `${Math.floor(timeRemaining / 60)} minutes until break`
              }
            </div>
          </div>
          
          <Progress 
            value={progress} 
            className={`h-3 ${isBreakTime ? '[&>div]:bg-green-500' : '[&>div]:bg-blue-500'}`} 
          />
          
          <div className="flex gap-2 justify-center">
            <Button
              onClick={handleToggle}
              variant={isRunning ? "secondary" : "default"}
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
              onClick={handleReset}
              variant="outline"
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
          
          <div className="text-xs text-center text-muted-foreground">
            Every 20 minutes, look at something 20 feet away for 20 seconds
            {isLooping && <div className="text-blue-600 font-medium">Loop mode active</div>}
          </div>
        </CardContent>
      </Card>
    </>
  );
}