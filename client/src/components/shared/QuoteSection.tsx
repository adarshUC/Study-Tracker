import * as React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Quote, RefreshCw } from 'lucide-react';

interface QuoteSectionProps {
  quotes: string[];
  dynamicQuote?: string;
}

export function QuoteSection({ quotes, dynamicQuote }: QuoteSectionProps) {
  const [currentQuote, setCurrentQuote] = useState('');
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    if (dynamicQuote) {
      setCurrentQuote(dynamicQuote);
    } else {
      setCurrentQuote(quotes[quoteIndex] || quotes[0]);
    }
  }, [dynamicQuote, quotes, quoteIndex]);

  const nextQuote = () => {
    const nextIndex = (quoteIndex + 1) % quotes.length;
    setQuoteIndex(nextIndex);
    setCurrentQuote(quotes[nextIndex]);
  };

  if (!currentQuote) return null;

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Quote className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-blue-800 dark:text-blue-200 font-medium italic text-sm leading-relaxed">
              {currentQuote}
            </p>
          </div>
          {!dynamicQuote && (
            <Button
              onClick={nextQuote}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
              title="Next quote"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
