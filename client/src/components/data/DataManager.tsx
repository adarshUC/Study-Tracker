import * as React from 'react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { clearAllData } from '@/utils/localStorage';
import { Database, Trash2, X, Download, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';

export function DataManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleClearData = () => {
    clearAllData();
    localStorage.removeItem('dailyPlanner');
    localStorage.removeItem('taskDump');
    localStorage.removeItem('calendarBacklog');
    localStorage.removeItem('calendarBacklogBlocks');
    localStorage.removeItem('alarms');
    localStorage.removeItem('timers');
    localStorage.removeItem('timeTracker_stopwatches');
    localStorage.removeItem('floatingTimers');
    localStorage.removeItem('floatingStopwatches');
    localStorage.removeItem('persistentTimers');
    localStorage.removeItem('persistentStopwatches');
    localStorage.removeItem('eyeProtectionAutoStarted');
    localStorage.removeItem('theme');
    localStorage.removeItem('backgroundProcessEnabled');
    localStorage.removeItem('backgroundProcesses');
    localStorage.removeItem('floatingPositions');
    setShowClearDialog(false);
    window.location.reload();
  };

  const generateDailyPlannerData = () => {
    const savedData = localStorage.getItem('dailyPlanner');
    if (!savedData) return 'No daily planner data found.';

    const days = JSON.parse(savedData);
    let content = 'DAILY PLANNER DATA\n===================\n\n';

    days.forEach((day: any) => {
      content += `#Day_${day.dayNumber.toString().padStart(2, '0')}   |  ${day.date}   | streak ${day.streak.toString().padStart(2, '0')}\n`;
      content += `------------- {woke_up:"${day.wokeUp}"} ---------------\n`;
      
      // Group tasks by category
      const tasksByCategory = day.tasks.reduce((acc: any, task: any) => {
        if (!acc[task.category]) {
          acc[task.category] = [];
        }
        acc[task.category].push(task);
        return acc;
      }, {});
      
      // Add aaj ka kaam tasks first
      if (tasksByCategory['aaj ka kaam']) {
        tasksByCategory['aaj ka kaam'].forEach((task: any) => {
          const statusText = task.status === 'done' ? 'done' : task.status === 'progress' ? '~' : '';
          const timeSpent = task.timeSpent ? formatTimeSpent(task.timeSpent) : '';
          content += `[${statusText}] ${task.text}${timeSpent}\n`;
        });
      }
      
      content += '---------------------------------------------------------\n';
      
      // Add other category tasks
      Object.entries(tasksByCategory).forEach(([category, tasks]: [string, any]) => {
        if (category !== 'aaj ka kaam') {
          (tasks as any[]).forEach(task => {
            const statusText = task.status === 'done' ? 'done' : task.status === 'progress' ? '~' : '';
            const timeSpent = task.timeSpent ? formatTimeSpent(task.timeSpent) : '';
            content += `[${statusText}] ${task.text}${timeSpent}\n`;
          });
        }
      });

      // Add day rating if exists
      if (day.dayRating > 0) {
        content += '---------------------------------------------------------\n';
        content += `Day Rating: ${'★'.repeat(day.dayRating)}${'☆'.repeat(5 - day.dayRating)}\n`;
        if (day.dayReflection) {
          content += `Reflection: ${day.dayReflection}\n`;
        }
      }
      
      content += '\n\n';
    });

    return content;
  };

  const generateUsageData = () => {
    let content = 'USAGE STATISTICS\n==================\n\n';
    
    // Stopwatch data
    const stopwatchData = localStorage.getItem('timeTracker_stopwatches');
    if (stopwatchData) {
      const stopwatches = JSON.parse(stopwatchData);
      content += 'STOPWATCH USAGE:\n';
      stopwatches.forEach((sw: any) => {
        content += `- ${sw.name}: ${formatTimeSpent(sw.totalTime * 1000)} total time\n`;
      });
      content += '\n';
    }

    // Eye protection timer data
    const eyeProtectionStarted = localStorage.getItem('eyeProtectionAutoStarted');
    if (eyeProtectionStarted) {
      content += 'EYE PROTECTION TIMER:\n';
      content += '- Auto-started on website load: Yes\n';
      content += '- Timer has been used during this session\n\n';
    }

    // Task dump data
    const taskDumpData = localStorage.getItem('taskDump');
    if (taskDumpData) {
      const tasks = JSON.parse(taskDumpData);
      content += 'TASK DUMP:\n';
      content += `- Total tasks saved: ${tasks.length}\n`;
      const tasksByCategory = tasks.reduce((acc: any, task: any) => {
        acc[task.category] = (acc[task.category] || 0) + 1;
        return acc;
      }, {});
      Object.entries(tasksByCategory).forEach(([category, count]) => {
        content += `- ${category}: ${count} tasks\n`;
      });
      content += '\n';
    }

    // Backlog data
    const backlogData = localStorage.getItem('calendarBacklogBlocks');
    if (backlogData) {
      const backlogBlocks = JSON.parse(backlogData);
      content += 'BACKLOG TRACKING:\n';
      backlogBlocks.forEach((block: any, index: number) => {
        content += `Block ${index + 1}: "${block.reason}"\n`;
        content += `- Total days: ${block.selectedDates.length}\n`;
        content += `- Completed: ${block.completedDates.length}\n`;
        content += `- Progress: ${Math.round((block.completedDates.length / block.selectedDates.length) * 100)}%\n`;
        content += `- Created: ${new Date(block.createdAt).toLocaleDateString('en-GB')}\n\n`;
      });
    }

    // Alarms data
    const alarmsData = localStorage.getItem('alarms');
    if (alarmsData) {
      const alarms = JSON.parse(alarmsData);
      content += 'ALARMS:\n';
      content += `- Total alarms: ${alarms.length}\n`;
      content += `- Active alarms: ${alarms.filter((a: any) => a.isActive).length}\n`;
      content += `- Repeating alarms: ${alarms.filter((a: any) => a.isRepeating).length}\n\n`;
    }

    return content;
  };

  const formatTimeSpent = (timeSpent: number) => {
    const totalMinutes = Math.floor(timeSpent / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return `   (took ${hours}hr ${minutes}min.)`;
    } else if (minutes > 0) {
      return `   (took ${minutes}min.)`;
    }
    return '';
  };

  const downloadData = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadDailyPlanner = () => {
    const content = generateDailyPlannerData();
    const date = new Date().toISOString().split('T')[0];
    downloadData(content, `daily-planner-${date}.txt`);
  };

  const handleDownloadUsageStats = () => {
    const content = generateUsageData();
    const date = new Date().toISOString().split('T')[0];
    downloadData(content, `usage-statistics-${date}.txt`);
  };

  const handleExportData = () => {
    // Collect all localStorage data
    const allData: Record<string, any> = {};
    
    // List of keys to export
    const keysToExport = [
      'dailyPlanner',
      'taskDump',
      'calendarBacklog',
      'calendarBacklogBlocks',
      'alarms',
      'timers',
      'timeTracker_stopwatches',
      'floatingTimers',
      'floatingStopwatches',
      'persistentTimers',
      'persistentStopwatches',
      'eyeProtectionAutoStarted',
      'theme',
      'backgroundProcessEnabled',
      'backgroundProcesses',
      'floatingPositions'
    ];

    keysToExport.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          allData[key] = JSON.parse(value);
        } catch {
          allData[key] = value; // Keep as string if not JSON
        }
      }
    });

    // Add metadata
    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      appName: 'Study Tracker',
      data: allData
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const date = new Date().toISOString().split('T')[0];
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study-tracker-backup-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importData = JSON.parse(content);

        // Validate the import data structure
        if (!importData.data || !importData.exportDate) {
          setImportStatus('error');
          setImportMessage('Invalid backup file format. Please select a valid Study Tracker backup file.');
          setShowImportDialog(true);
          return;
        }

        // Show confirmation dialog
        setImportStatus('idle');
        setImportMessage(`This will restore your data from ${new Date(importData.exportDate).toLocaleDateString('en-GB')}. Your current data will be replaced.`);
        setShowImportDialog(true);

        // Store the import data temporarily
        (window as any).pendingImportData = importData;

      } catch (error) {
        setImportStatus('error');
        setImportMessage('Failed to read backup file. Please check the file format.');
        setShowImportDialog(true);
      }
    };

    reader.readAsText(file);
    // Reset file input
    event.target.value = '';
  };

  const confirmImport = () => {
    try {
      const importData = (window as any).pendingImportData;
      if (!importData) {
        throw new Error('No import data found');
      }

      // Clear existing data first
      handleClearData();

      // Import the data
      Object.entries(importData.data).forEach(([key, value]) => {
        if (typeof value === 'string') {
          localStorage.setItem(key, value);
        } else {
          localStorage.setItem(key, JSON.stringify(value));
        }
      });

      setImportStatus('success');
      setImportMessage('Data imported successfully! The page will reload to apply changes.');
      
      // Clean up
      delete (window as any).pendingImportData;
      
      // Reload after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      setImportStatus('error');
      setImportMessage('Failed to import data. Please try again.');
    }
  };

  const cancelImport = () => {
    setShowImportDialog(false);
    setImportStatus('idle');
    setImportMessage('');
    delete (window as any).pendingImportData;
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 left-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          variant="outline"
          size="sm"
          className="gap-2 shadow-lg"
        >
          <Database className="h-4 w-4" />
          Data
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="fixed bottom-6 left-6 z-50">
        <Card className="w-80 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Data Management</CardTitle>
              <Button
                onClick={() => setIsOpen(false)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Your data is safe and stored locally in your browser.
            </p>
            
            {/* Export/Import Section */}
            <div className="space-y-3">
              <div className="text-sm font-medium">Backup & Restore</div>
              <div className="space-y-2">
                <Button
                  onClick={handleExportData}
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 text-xs"
                >
                  <Download className="h-4 w-4" />
                  Export All Data
                </Button>
                
                <Button
                  onClick={handleImportData}
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 text-xs"
                >
                  <Upload className="h-4 w-4" />
                  Import Data
                </Button>
              </div>
            </div>

            {/* Reports Section */}
            <div className="space-y-3">
              <div className="text-sm font-medium">Reports</div>
              <div className="space-y-2">
                <Button
                  onClick={handleDownloadDailyPlanner}
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 text-xs"
                >
                  <FileText className="h-4 w-4" />
                  Download Daily Planner
                </Button>
                
                <Button
                  onClick={handleDownloadUsageStats}
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 text-xs"
                >
                  <FileText className="h-4 w-4" />
                  Download Usage Stats
                </Button>
              </div>
            </div>
            
            <div className="border-t pt-3">
              <Button
                onClick={() => setShowClearDialog(true)}
                variant="destructive"
                size="sm"
                className="w-full gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear All Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileImport}
        style={{ display: 'none' }}
      />

      {/* Clear data confirmation dialog */}
      <ConfirmDialog
        open={showClearDialog}
        onOpenChange={setShowClearDialog}
        title="Clear All Data"
        description="Are you sure you want to clear all saved data? This action cannot be undone and will remove your daily planner, tasks, stopwatch data, alarms, and backlog tracking."
        onConfirm={handleClearData}
      />

      {/* Import confirmation dialog */}
      <ConfirmDialog
        open={showImportDialog}
        onOpenChange={() => {
          if (importStatus !== 'success') {
            cancelImport();
          }
        }}
        title={importStatus === 'success' ? 'Import Successful' : importStatus === 'error' ? 'Import Failed' : 'Import Data'}
        description={importMessage}
        onConfirm={importStatus === 'idle' ? confirmImport : undefined}
        confirmText={importStatus === 'idle' ? 'Import' : 'OK'}
        showCancel={importStatus === 'idle'}
      />
    </>
  );
}
