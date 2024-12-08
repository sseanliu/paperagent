"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Play, Save, FolderOpen, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFlowStore } from "@/lib/stores/flow-store";
import { APIKeyDialog } from "@/components/settings/api-key-dialog";

interface FlowToolbarProps {
  onAddNode: () => void;
  onExecuteFlow: () => void;
}

export function FlowToolbar({ onAddNode, onExecuteFlow }: FlowToolbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [flowName, setFlowName] = useState("");
  const { flows, saveFlow, loadFlow } = useFlowStore();

  const handleSave = () => {
    if (flowName) {
      saveFlow(flowName);
      setFlowName("");
      setIsOpen(false);
    }
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-4">
      <TooltipProvider>
        <APIKeyDialog />

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

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save Flow
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Flow</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Enter flow name..."
                value={flowName}
                onChange={(e) => setFlowName(e.target.value)}
              />
              <Button onClick={handleSave} disabled={!flowName}>
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Select onValueChange={loadFlow}>
          <SelectTrigger className="w-[180px]">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              <SelectValue placeholder="Load Flow" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {flows.map((flow) => (
              <SelectItem key={flow.id} value={flow.id}>
                {flow.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
                <li>Add your OpenAI API key in settings</li>
                <li>Click &quot;Add Node&quot; to create a new prompt</li>
                <li>Type your prompt in the text area</li>
                <li>Connect nodes by dragging between handles</li>
                <li>Save your flow to reuse it later</li>
                <li>Click &quot;Execute Flow&quot; to run the sequence</li>
              </ul>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}