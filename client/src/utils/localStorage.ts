interface StopwatchData {
  id: string;
  name: string;
  time: number;
  isRunning: boolean;
  totalTime: number;
}

const STORAGE_KEY = 'timeTracker_stopwatches';

export function saveStopwatchData(stopwatches: StopwatchData[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stopwatches));
  } catch (error) {
    console.error('Failed to save stopwatch data:', error);
  }
}

export function loadStopwatchData(): StopwatchData[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load stopwatch data:', error);
    return [];
  }
}

export function clearAllData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear data:', error);
  }
}