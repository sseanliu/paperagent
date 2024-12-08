"use client";

import { Button } from "@/components/ui/button";
import { Plus, Play, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FlowToolbarProps {
  onAddNode: () => void;
  onExecuteFlow: () => void;
}

export function FlowToolbar({ onAddNode, onExecuteFlow }: FlowToolbarProps) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-4">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={onAddNode} variant="secondary" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Node
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Add a new prompt node to the canvas</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={onExecuteFlow} className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Execute Flow
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Run all connected prompts in sequence</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon">
              <HelpCircle className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-2">
              <p>How to use:</p>
              <ul className="text-sm list-disc list-inside">
                <li>Click &quot;Add Node&quot; to create a new prompt</li>
                <li>Type your prompt in the text area</li>
                <li>Connect nodes by dragging between handles</li>
                <li>Click &quot;Execute Flow&quot; to run the sequence</li>
              </ul>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}