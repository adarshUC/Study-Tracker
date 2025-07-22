import * as React from 'react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Edit3, Check, X } from 'lucide-react';

interface EditableNameProps {
  initialName: string;
  onUpdate: (name: string) => void;
}

export function EditableName({ initialName, onUpdate }: EditableNameProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(initialName);

  const handleSave = () => {
    if (name.trim()) {
      onUpdate(name.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setName(initialName);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleNameClick = () => {
    // Clear default names when starting to edit
    if (initialName.startsWith('Stopwatch ')) {
      setName('');
    } else {
      setName(initialName);
    }
    setIsEditing(true);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyPress}
          className="text-lg font-semibold bg-transparent border-dashed"
          autoFocus
          placeholder="Enter name..."
        />
        <Button
          onClick={handleSave}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          onClick={handleCancel}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 cursor-pointer" onClick={handleNameClick}>
      <h3 className="text-lg font-semibold flex-1 hover:text-primary transition-colors">{initialName}</h3>
      <Edit3 className="h-4 w-4 opacity-60 hover:opacity-100" />
    </div>
  );
}