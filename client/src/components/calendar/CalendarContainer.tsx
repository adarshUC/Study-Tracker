import * as React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CalendarComponent } from './CalendarComponent';
import { QuoteSection } from '../shared/QuoteSection';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ChevronLeft, ChevronRight, RotateCcw, Info, Edit3, Check, X, Trash2, Calendar, CheckCircle, Plus } from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface BacklogBlock {
  id: string;
  reason: string;
  selectedDates: string[];
  completedDates: string[];
  createdAt: string;
  color: string;
}

const BACKLOG_COLORS = [
  'orange', 'blue', 'purple', 'green', 'red', 'pink', 'indigo', 'yellow'
];

export function CalendarContainer() {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return now.getMonth();
  });
  
  const [currentYear, setCurrentYear] = useState(() => {
    const now = new Date();
    return now.getFullYear();
  });
  
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [showBacklogInput, setShowBacklogInput] = useState(false);
  const [backlogReason, setBacklogReason] = useState('');
  const [backlogBlocks, setBacklogBlocks] = useState<BacklogBlock[]>([]);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editBacklogReason, setEditBacklogReason] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [blockToDelete, setBlockToDelete] = useState<string | null>(null);

  // Load existing backlog blocks on component mount
  useEffect(() => {
    console.log('Loading backlog blocks...');
    const savedBlocks = localStorage.getItem('calendarBacklogBlocks');
    if (savedBlocks) {
      try {
        const blocksData = JSON.parse(savedBlocks);
        console.log('Loaded blocks:', blocksData);
        setBacklogBlocks(blocksData);
      } catch (error) {
        console.error('Failed to parse backlog blocks data:', error);
      }
    }
  }, []);

  // Save backlog blocks whenever they change
  useEffect(() => {
    if (backlogBlocks.length > 0) {
      console.log('Saving blocks:', backlogBlocks);
      localStorage.setItem('calendarBacklogBlocks', JSON.stringify(backlogBlocks));
    } else if (backlogBlocks.length === 0) {
      localStorage.removeItem('calendarBacklogBlocks');
    }
  }, [backlogBlocks]);

  const handleDateClick = (dateStr: string) => {
    console.log('Date clicked:', dateStr);
    
    // Check if date belongs to any existing backlog block
    const belongsToBlock = backlogBlocks.find(block => 
      block.selectedDates.includes(dateStr)
    );
    
    if (belongsToBlock) {
      // Toggle completion for this date in the block
      const updatedBlocks = backlogBlocks.map(block => {
        if (block.id === belongsToBlock.id) {
          if (block.completedDates.includes(dateStr)) {
            // Remove from completed
            return {
              ...block,
              completedDates: block.completedDates.filter(d => d !== dateStr)
            };
          } else {
            // Add to completed
            return {
              ...block,
              completedDates: [...block.completedDates, dateStr]
            };
          }
        }
        return block;
      });
      setBacklogBlocks(updatedBlocks);
      return;
    }

    // Original date selection logic for new backlog
    setSelectedDates(prev => {
      if (prev.length === 0) {
        // First date selected
        return [dateStr];
      } else if (prev.length === 1) {
        // Second date selected - create range
        const startDate = new Date(prev[0]);
        const endDate = new Date(dateStr);
        
        if (startDate.getTime() === endDate.getTime()) {
          // Same date clicked - remove it
          setShowBacklogInput(false);
          return [];
        }
        
        // Create range between dates
        const range: string[] = [];
        const current = new Date(Math.min(startDate.getTime(), endDate.getTime()));
        const end = new Date(Math.max(startDate.getTime(), endDate.getTime()));
        
        while (current <= end) {
          range.push(current.toISOString().split('T')[0]);
          current.setDate(current.getDate() + 1);
        }
        
        // Show backlog input if more than 1 day
        if (range.length > 1) {
          setShowBacklogInput(true);
        }
        
        return range;
      } else {
        // Multiple dates selected - check if clicking on selected date
        if (prev.includes(dateStr)) {
          // Remove the clicked date
          const newDates = prev.filter(d => d !== dateStr);
          if (newDates.length <= 1) {
            setShowBacklogInput(false);
          }
          return newDates;
        } else {
          // Add new date to selection
          return [...prev, dateStr];
        }
      }
    });
  };

  const clearSelection = () => {
    setSelectedDates([]);
    setShowBacklogInput(false);
    setBacklogReason('');
  };

  const saveBacklogReason = () => {
    if (backlogReason.trim()) {
      const newBlock: BacklogBlock = {
        id: Date.now().toString(),
        reason: backlogReason.trim(),
        selectedDates: selectedDates,
        completedDates: [],
        createdAt: new Date().toISOString(),
        color: BACKLOG_COLORS[backlogBlocks.length % BACKLOG_COLORS.length]
      };
      
      setBacklogBlocks(prev => [...prev, newBlock]);
      setSelectedDates([]);
      setBacklogReason('');
    }
    setShowBacklogInput(false);
  };

  const handleEditBlock = (blockId: string) => {
    const block = backlogBlocks.find(b => b.id === blockId);
    if (block) {
      setEditBacklogReason(block.reason);
      setEditingBlockId(blockId);
    }
  };

  const saveEditedBlock = () => {
    if (editingBlockId && editBacklogReason.trim()) {
      const updatedBlocks = backlogBlocks.map(block => 
        block.id === editingBlockId 
          ? { ...block, reason: editBacklogReason.trim() }
          : block
      );
      
      setBacklogBlocks(updatedBlocks);
      setEditingBlockId(null);
      setEditBacklogReason('');
    }
  };

  const cancelEditBlock = () => {
    setEditingBlockId(null);
    setEditBacklogReason('');
  };

  const deleteBlock = () => {
    if (blockToDelete) {
      setBacklogBlocks(prev => prev.filter(block => block.id !== blockToDelete));
      setBlockToDelete(null);
    }
    setShowDeleteDialog(false);
  };

  const calculateDaysBetween = () => {
    if (selectedDates.length === 0) return 0;
    return selectedDates.length;
  };

  const formatDateRange = (dates: string[]) => {
    if (dates.length === 0) return '';
    if (dates.length === 1) return new Date(dates[0]).toLocaleDateString('en-GB');
    
    const sortedDates = [...dates].sort();
    const startDate = new Date(sortedDates[0]).toLocaleDateString('en-GB');
    const endDate = new Date(sortedDates[sortedDates.length - 1]).toLocaleDateString('en-GB');
    
    return `${startDate} to ${endDate}`;
  };

  const getAllSelectedDates = () => {
    const allDates = new Set<string>();
    backlogBlocks.forEach(block => {
      block.selectedDates.forEach(date => allDates.add(date));
    });
    selectedDates.forEach(date => allDates.add(date));
    return Array.from(allDates);
  };

  const getAllCompletedDates = () => {
    const allCompleted = new Set<string>();
    backlogBlocks.forEach(block => {
      block.completedDates.forEach(date => allCompleted.add(date));
    });
    return Array.from(allCompleted);
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const daysBetween = calculateDaysBetween();

  return (
    <div className="space-y-6 p-4">
      <QuoteSection 
        quotes={[
          "Count your backlog here",
          "The two most important days in your life are the day you are born and the day you find out why.",
          "Yesterday is history, tomorrow is a mystery, today is a gift.",
          "Time flies over us, but leaves its shadow behind."
        ]}
      />
      
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Calendar</h2>
      </div>

      {/* Existing Backlog Blocks */}
      {backlogBlocks.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Backlog Blocks</h3>
          {backlogBlocks.map((block, blockIndex) => {
            const completionRate = Math.round((block.completedDates.length / block.selectedDates.length) * 100);
            
            return (
              <Card key={block.id} className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-orange-800 dark:text-orange-200 flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Backlog Block #{blockIndex + 1}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEditBlock(block.id)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-orange-700 hover:text-orange-900"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => {
                          setBlockToDelete(block.id);
                          setShowDeleteDialog(true);
                        }}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingBlockId === block.id ? (
                    <div className="space-y-3">
                      <Textarea
                        value={editBacklogReason}
                        onChange={(e) => setEditBacklogReason(e.target.value)}
                        placeholder="Edit backlog reason..."
                        className="min-h-[80px]"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button onClick={saveEditedBlock} size="sm" className="gap-2">
                          <Check className="h-4 w-4" />
                          Save
                        </Button>
                        <Button onClick={cancelEditBlock} variant="outline" size="sm" className="gap-2">
                          <X className="h-4 w-4" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 bg-white dark:bg-gray-800 rounded-md border">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 italic">
                          "{block.reason}"
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md">
                          <div className="font-semibold text-blue-800 dark:text-blue-200">Total Days</div>
                          <div className="text-2xl font-bold text-blue-600">{block.selectedDates.length}</div>
                        </div>
                        
                        <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-md">
                          <div className="font-semibold text-green-800 dark:text-green-200">Completed</div>
                          <div className="text-2xl font-bold text-green-600">{block.completedDates.length}</div>
                        </div>
                        
                        <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-md">
                          <div className="font-semibold text-purple-800 dark:text-purple-200">Progress</div>
                          <div className="text-2xl font-bold text-purple-600">{completionRate}%</div>
                        </div>
                      </div>
                      
                      <div className="text-center text-xs text-orange-700 dark:text-orange-300">
                        <p>Date Range: {formatDateRange(block.selectedDates)}</p>
                        <p>Created: {new Date(block.createdAt).toLocaleDateString('en-GB')}</p>
                        {completionRate === 100 && (
                          <div className="flex items-center justify-center gap-2 mt-2 text-green-600 font-medium">
                            <CheckCircle className="h-4 w-4" />
                            Backlog Block Completed!
                          </div>
                        )}
                      </div>

                      <div className="text-center">
                        <p className="text-xs text-orange-600 dark:text-orange-400">
                          Click on backlog dates in the calendar to mark them as completed
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Calendar Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevMonth}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-lg">
                  {MONTHS[currentMonth]} {currentYear}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNextMonth}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <CalendarComponent
                month={currentMonth}
                year={currentYear}
                selectedDates={getAllSelectedDates()}
                completedDates={getAllCompletedDates()}
                onDateClick={handleDateClick}
                days={DAYS}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {/* Selection info */}
          {selectedDates.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Selected {selectedDates.length} date{selectedDates.length > 1 ? 's' : ''}
                  </p>
                  
                  <p className="text-lg font-semibold">
                    Days: {daysBetween}
                  </p>
                  
                  <div className="flex gap-2 justify-center">
                    <Button onClick={clearSelection} variant="outline" size="sm" className="gap-2">
                      <RotateCcw className="h-4 w-4" />
                      Clear
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Backlog input */}
          {showBacklogInput && (
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-orange-800 dark:text-orange-200 text-center">
                    Create Backlog Block
                  </h4>
                  <p className="text-sm text-orange-700 dark:text-orange-300 text-center">
                    You've selected {daysBetween} days. Why was this backlog created?
                  </p>
                  
                  <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      This will create a new backlog block to track progress
                    </p>
                  </div>
                  
                  <Textarea
                    value={backlogReason}
                    onChange={(e) => setBacklogReason(e.target.value)}
                    placeholder="Say how backlog was created?"
                    className="min-h-[80px]"
                    autoFocus
                  />
                  <div className="flex gap-2 justify-center">
                    <Button 
                      onClick={saveBacklogReason} 
                      size="sm" 
                      className="bg-orange-600 hover:bg-orange-700 text-white gap-2"
                      disabled={!backlogReason.trim()}
                    >
                      <Plus className="h-4 w-4" />
                      Create Block
                    </Button>
                    <Button 
                      onClick={() => setShowBacklogInput(false)} 
                      variant="outline" 
                      size="sm"
                    >
                      Skip
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info card */}
          {backlogBlocks.length === 0 && selectedDates.length === 0 && (
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
              <CardContent className="p-4 text-center">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                  No backlog blocks
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Select dates to create a backlog block
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Backlog Block"
        description="Are you sure you want to delete this backlog block? This cannot be undone."
        onConfirm={deleteBlock}
      />
    </div>
  );
}
