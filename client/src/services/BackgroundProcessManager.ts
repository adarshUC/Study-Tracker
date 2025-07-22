// Background Process Manager - Handles all persistent timers and stopwatches
export interface ProcessState {
  id: string;
  name: string;
  type: 'timer' | 'stopwatch' | 'eye-protection';
  startTime?: number; // When the process was started
  elapsedTime: number; // Total elapsed time in seconds
  duration?: number; // For timers - total duration
  isRunning: boolean;
  isFinished?: boolean; // For timers
  lastUpdate: number;
}

class BackgroundProcessManager {
  private processes: Map<string, ProcessState> = new Map();
  private syncInterval: NodeJS.Timeout | null = null;
  private callbacks: Set<(processes: ProcessState[]) => void> = new Set();
  private isEnabled: boolean = true;

  constructor() {
    this.loadStoredState();
    this.loadEnabledState();
    this.startSyncing();
    
    // Save state when page is about to unload
    window.addEventListener('beforeunload', () => {
      this.saveToStorage();
    });
  }

  private loadEnabledState() {
    const saved = localStorage.getItem('backgroundProcessEnabled');
    this.isEnabled = saved !== 'false'; // Default to true
  }

  private saveEnabledState() {
    localStorage.setItem('backgroundProcessEnabled', this.isEnabled.toString());
  }

  private loadStoredState() {
    try {
      const stored = localStorage.getItem('backgroundProcesses');
      if (stored) {
        const data = JSON.parse(stored);
        const now = Date.now();
        
        Object.values(data).forEach((processData: any) => {
          // Calculate real elapsed time based on stored state
          let realElapsedTime = processData.elapsedTime;
          
          if (processData.isRunning && processData.startTime) {
            const timeSinceStart = Math.floor((now - processData.startTime) / 1000);
            realElapsedTime = timeSinceStart;
          } else if (processData.isRunning && processData.lastUpdate) {
            const timeSinceUpdate = Math.floor((now - processData.lastUpdate) / 1000);
            realElapsedTime = processData.elapsedTime + timeSinceUpdate;
          }

          const state: ProcessState = {
            ...processData,
            elapsedTime: realElapsedTime,
            lastUpdate: now
          };

          // For timers, check if finished
          if (state.type === 'timer' || state.type === 'eye-protection') {
            if (state.duration && realElapsedTime >= state.duration) {
              state.isRunning = false;
              state.isFinished = true;
              state.elapsedTime = state.duration;
            }
          }

          this.processes.set(state.id, state);
        });
      }
    } catch (error) {
      console.error('Failed to load background processes:', error);
    }
  }

  private saveToStorage() {
    try {
      const data: Record<string, ProcessState> = {};
      this.processes.forEach((state, id) => {
        data[id] = { ...state };
      });
      localStorage.setItem('backgroundProcesses', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save background processes:', error);
    }
  }

  private startSyncing() {
    if (this.syncInterval) return;
    
    this.syncInterval = setInterval(() => {
      if (!this.isEnabled) return;
      
      const now = Date.now();
      let hasChanges = false;

      this.processes.forEach((state) => {
        if (state.isRunning) {
          // Update elapsed time
          if (state.startTime) {
            state.elapsedTime = Math.floor((now - state.startTime) / 1000);
          } else {
            state.elapsedTime += 1;
          }

          // Check timer completion
          if ((state.type === 'timer' || state.type === 'eye-protection') && state.duration) {
            if (state.elapsedTime >= state.duration) {
              state.isRunning = false;
              state.isFinished = true;
              state.elapsedTime = state.duration;
              this.playNotificationSound();
            }
          }

          state.lastUpdate = now;
          hasChanges = true;
        }
      });

      if (hasChanges) {
        this.saveToStorage();
        this.notifyCallbacks();
      }
    }, 1000);
  }

  private stopSyncing() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  private playNotificationSound() {
    try {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          const context = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = context.createOscillator();
          const gainNode = context.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(context.destination);
          
          oscillator.frequency.value = 880;
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0, context.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.8, context.currentTime + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.8);
          
          oscillator.start();
          oscillator.stop(context.currentTime + 0.8);
        }, i * 500);
      }
    } catch (error) {
      console.log('Audio not supported');
    }
  }

  private notifyCallbacks() {
    const processArray = Array.from(this.processes.values());
    this.callbacks.forEach(callback => callback(processArray));
  }

  // Public methods
  addProcess(state: ProcessState) {
    if (state.isRunning && !state.startTime) {
      state.startTime = Date.now();
    }
    state.lastUpdate = Date.now();
    
    this.processes.set(state.id, state);
    this.saveToStorage();
    this.notifyCallbacks();
  }

  updateProcess(id: string, updates: Partial<ProcessState>) {
    const state = this.processes.get(id);
    if (!state) return;

    // Handle start/stop transitions
    if (updates.isRunning !== undefined) {
      if (updates.isRunning && !state.isRunning) {
        // Starting process
        updates.startTime = Date.now() - (state.elapsedTime * 1000);
      } else if (!updates.isRunning && state.isRunning) {
        // Stopping process - no startTime change needed
      }
    }

    Object.assign(state, updates);
    state.lastUpdate = Date.now();
    
    this.saveToStorage();
    this.notifyCallbacks();
  }

  removeProcess(id: string) {
    this.processes.delete(id);
    this.saveToStorage();
    this.notifyCallbacks();
  }

  getProcess(id: string): ProcessState | undefined {
    return this.processes.get(id);
  }

  getAllProcesses(): ProcessState[] {
    return Array.from(this.processes.values());
  }

  getActiveProcesses(): ProcessState[] {
    return Array.from(this.processes.values()).filter(p => 
      p.isRunning || p.elapsedTime > 0 || p.isFinished === false
    );
  }

  isEnabled(): boolean {
    return this.isEnabled;
  }

  setEnabled(enabled: boolean) {
    const wasEnabled = this.isEnabled;
    this.isEnabled = enabled;
    this.saveEnabledState();

    if (enabled && !wasEnabled) {
      // Resume from storage
      this.loadStoredState();
      this.startSyncing();
    } else if (!enabled && wasEnabled) {
      // Pause all and clear syncing
      this.processes.forEach(state => {
        if (state.isRunning) {
          state.isRunning = false;
        }
      });
      this.stopSyncing();
      this.saveToStorage();
    }

    this.notifyCallbacks();
  }

  subscribe(callback: (processes: ProcessState[]) => void) {
    this.callbacks.add(callback);
    // Immediately call with current data
    callback(this.getAllProcesses());
    
    return () => {
      this.callbacks.delete(callback);
    };
  }

  destroy() {
    this.stopSyncing();
    this.saveToStorage();
    this.callbacks.clear();
  }
}

// Create singleton instance
export const backgroundProcessManager = new BackgroundProcessManager();
