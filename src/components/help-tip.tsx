"use client";

import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { helpContent, type HelpEntry } from "@/lib/help-content";

interface HelpTipProps {
  pageKey: string;
  content?: HelpEntry;
}

export function HelpTip({ pageKey, content }: HelpTipProps) {
  const entry = content ?? helpContent[pageKey];
  if (!entry) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          aria-label={`${entry.title} 使用说明`}
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 space-y-3" align="start">
        <h4 className="font-semibold text-sm">{entry.title}</h4>
        <p className="text-sm text-muted-foreground">{entry.description}</p>
        <div>
          <p className="text-xs font-medium mb-1">如何使用</p>
          <p className="text-xs text-muted-foreground">{entry.usage}</p>
        </div>
        {entry.example && (
          <div className="rounded-md bg-muted p-2">
            <p className="text-xs font-medium mb-1">示例</p>
            <p className="text-xs text-muted-foreground whitespace-pre-line">
              {entry.example}
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
