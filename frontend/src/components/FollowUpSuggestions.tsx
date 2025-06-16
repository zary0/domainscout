import React from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, ArrowRight } from "lucide-react";

interface FollowUpSuggestionsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
  isLoading: boolean;
}

export const FollowUpSuggestions: React.FC<FollowUpSuggestionsProps> = ({
  suggestions,
  onSuggestionClick,
  isLoading,
}) => {
  if (!suggestions || suggestions.length === 0 || isLoading) {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-neutral-800/50 rounded-lg border border-neutral-700/50">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="h-4 w-4 text-blue-400" />
        <span className="text-sm font-medium text-neutral-300">
          続けて深ぼる
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => onSuggestionClick(suggestion)}
            className="text-xs bg-neutral-700 border-neutral-600 text-neutral-300 hover:bg-neutral-600 hover:text-white hover:border-neutral-500 transition-all duration-200 group"
          >
            <span className="max-w-[200px] truncate">{suggestion}</span>
            <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-0.5 transition-transform duration-200" />
          </Button>
        ))}
      </div>
    </div>
  );
};