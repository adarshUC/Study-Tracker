import * as React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TaskDumpItem } from './TaskDumpItem';
import { QuoteSection } from '../shared/QuoteSection';
import { ShareButton } from '../shared/ShareButton';
import { Plus, Archive, Filter, X } from 'lucide-react';

export interface DumpTask {
  id: string;
  text: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

export function TaskDump() {
  const [tasks, setTasks] = useState<DumpTask[]>(() => {
    const saved = localStorage.getItem('taskDump');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');

  useEffect(() => {
    localStorage.setItem('taskDump', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (!newTaskText.trim()) return;
    
    const newTask: DumpTask = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      category: newTaskCategory.trim() || 'General',
      priority: 'medium',
      createdAt: new Date().toLocaleDateString('en-GB'),
    };
    
    setTasks(prev => [...prev, newTask]);
    setNewTaskText('');
    setNewTaskCategory('');
  };

  const updateTask = (taskId: string, updates: Partial<DumpTask>) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const moveToPlanner = (task: DumpTask) => {
    // This would integrate with the daily planner
    // For now, we'll just remove it from dump
    deleteTask(task.id);
    alert(`Task "${task.text}" moved to Daily Planner! (Feature integration coming soon)`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTask();
    }
  };

  // Get unique categories
  const categories = Array.from(new Set(tasks.map(task => task.category))).sort();

  // Priority order for sorting
  const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };

  // Filter and sort tasks
  const filteredTasks = tasks
    .filter(task => {
      const categoryMatch = selectedCategory === 'all' || task.category === selectedCategory;
      const priorityMatch = selectedPriority === 'all' || task.priority === selectedPriority;
      return categoryMatch && priorityMatch;
    })
    .sort((a, b) => {
      // Sort by priority (high to low), then by creation date (newest first)
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedPriority('all');
  };

  const hasActiveFilters = selectedCategory !== 'all' || selectedPriority !== 'all';

  return (
    <div className="space-y-6">
      <QuoteSection 
        quotes={[
          "Be focused. Put other thoughts todo later",
          "The way to get started is to quit talking and begin doing.",
          "If you want to achieve greatness stop asking for permission.",
          "Innovation distinguishes between a leader and a follower.",
          "A year from now you may wish you had started today."
        ]}
      />
      
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Task Dump - Watch Later</h2>
        <ShareButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Add New Task
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-col sm:flex-row">
            <Input
              placeholder="Add a task to do later..."
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1"
            />
            <Input
              placeholder="Category (optional)"
              value={newTaskCategory}
              onChange={(e) => setNewTaskCategory(e.target.value)}
              onKeyDown={handleKeyPress}
              className="w-full sm:w-40"
            />
            <Button onClick={addTask} className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      {tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
              {hasActiveFilters && (
                <Button
                  onClick={clearFilters}
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1 text-xs"
                >
                  <X className="h-3 w-3" />
                  Clear
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Category:</span>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All ({tasks.length})</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category} ({tasks.filter(t => t.category === category).length})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Priority:</span>
                <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All ({tasks.length})</SelectItem>
                    <SelectItem value="high">High ({tasks.filter(t => t.priority === 'high').length})</SelectItem>
                    <SelectItem value="medium">Medium ({tasks.filter(t => t.priority === 'medium').length})</SelectItem>
                    <SelectItem value="low">Low ({tasks.filter(t => t.priority === 'low').length})</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
            {tasks.length === 0 ? (
              <p>No tasks in your dump yet. Add tasks to work on later!</p>
            ) : (
              <p>No tasks match your current filters. Try adjusting the filters above.</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Tasks ({filteredTasks.length})
              {hasActiveFilters && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  • Filtered from {tasks.length} total
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredTasks.map(task => (
              <TaskDumpItem
                key={task.id}
                task={task}
                onUpdate={updateTask}
                onDelete={deleteTask}
                onMoveToPlanner={moveToPlanner}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
