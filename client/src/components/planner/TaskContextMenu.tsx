import * as React from 'react';
import { useState } from 'react';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface TaskContextMenuProps {
  position: { x: number; y: number };
  onClose: () => void;
  onStatusChange: (status: 'pending' | 'progress' | 'done') => void;
  onReset: () => void;
  currentStatus: 'pending' | 'progress' | 'done';
}

export function TaskContextMenu({ position, onClose, onStatusChange, onReset, currentStatus }: TaskContextMenuProps) {
  const [showResetDialog, setShowResetDialog] = useState(false);

  const handleStatusClick = (status: 'pending' | 'progress' | 'done') => {
    onStatusChange(status);
    onClose();
  };

  const handleResetClick = () => {
    setShowResetDialog(true);
  };

  const handleConfirmReset = () => {
    onReset();
    setShowResetDialog(false);
    onClose();
  };

  const handleClickOutside = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50"
        onClick={handleClickOutside}
      >
        <div
          className="absolute bg-background border rounded-md shadow-lg p-1 min-w-32"
          style={{ 
            left: Math.min(position.x + 20, window.innerWidth - 200), 
            top: position.y,
            transform: 'translate(0, -10px)'
          }}
          onClick={handleMenuClick}
        >
          <div className="text-xs font-medium text-muted-foreground px-2 py-1 border-b">
            Set Status
          </div>
          
          <button
            onClick={() => handleStatusClick('pending')}
            className={`w-full text-left px-2 py-1 text-sm hover:bg-muted rounded transition-colors ${
              currentStatus === 'pending' ? 'bg-muted font-medium' : ''
            }`}
          >
            ⚪ Pending
          </button>
          
          <button
            onClick={() => handleStatusClick('progress')}
            className={`w-full text-left px-2 py-1 text-sm hover:bg-muted rounded transition-colors ${
              currentStatus === 'progress' ? 'bg-muted font-medium' : ''
            }`}
          >
            ▶️ In Progress
          </button>
          
          <button
            onClick={() => handleStatusClick('done')}
            className={`w-full text-left px-2 py-1 text-sm hover:bg-muted rounded transition-colors ${
              currentStatus === 'done' ? 'bg-muted font-medium' : ''
            }`}
          >
            ✅ Done
          </button>

          <div className="border-t my-1"></div>
          
          <button
            onClick={handleResetClick}
            className="w-full text-left px-2 py-1 text-sm hover:bg-muted rounded transition-colors text-destructive hover:text-destructive"
          >
            🔄 Reset Task
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={showResetDialog}
        onOpenChange={setShowResetDialog}
        title="Reset Task"
        description="Are you sure you want to reset this task? This will clear all time tracking data and set the status back to pending."
        onConfirm={handleConfirmReset}
      />
    </>
  );
}
