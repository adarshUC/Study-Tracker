import * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Edit3, Check, X } from 'lucide-react';

interface DayRatingProps {
  rating: number;
  reflection: string;
  onUpdate: (rating: number, reflection: string) => void;
}

export function DayRating({ rating, reflection, onUpdate }: DayRatingProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempRating, setTempRating] = useState(rating);
  const [tempReflection, setTempReflection] = useState(reflection);

  const handleSave = () => {
    onUpdate(tempRating, tempReflection);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempRating(rating);
    setTempReflection(reflection);
    setIsEditing(false);
  };

  const handleStarClick = (starRating: number) => {
    setTempRating(starRating);
  };

  if (isEditing) {
    return (
      <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
        <div className="text-sm font-medium">How was your day?</div>
        
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Button
              key={star}
              onClick={() => handleStarClick(star)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Star 
                className={`h-5 w-5 ${
                  star <= tempRating 
                    ? 'fill-yellow-400 text-yellow-400' 
                    : 'text-gray-300'
                }`} 
              />
            </Button>
          ))}
          <span className="ml-2 text-sm text-muted-foreground">
            {tempRating === 0 ? 'No rating' : `${tempRating} star${tempRating > 1 ? 's' : ''}`}
          </span>
        </div>

        <Textarea
          value={tempReflection}
          onChange={(e) => setTempReflection(e.target.value)}
          placeholder="Reflect on your day... What went well? What could be improved?"
          className="min-h-[80px]"
        />

        <div className="flex gap-2">
          <Button onClick={handleSave} size="sm" className="gap-2">
            <Check className="h-4 w-4" />
            Save
          </Button>
          <Button onClick={handleCancel} size="sm" variant="outline" className="gap-2">
            <X className="h-4 w-4" />
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-muted/20 cursor-pointer" onClick={() => setIsEditing(true)}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">Day Rating</div>
        <Edit3 className="h-4 w-4 opacity-60" />
      </div>
      
      <div className="flex items-center gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star}
            className={`h-4 w-4 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`} 
          />
        ))}
        {rating > 0 && (
          <span className="ml-2 text-sm text-muted-foreground">
            {rating} star{rating > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {reflection ? (
        <p className="text-sm text-muted-foreground italic">"{reflection}"</p>
      ) : (
        <p className="text-sm text-muted-foreground">Click to add reflection...</p>
      )}
    </div>
  );
}