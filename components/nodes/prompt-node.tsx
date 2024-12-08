"use client";

import { memo } from 'react';
import { Handle, Position } from 'react-flow-renderer';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface PromptNodeProps {
  id: string;
  data: {
    prompt: string;
    result?: string;
    isProcessing?: boolean;
    error?: string;
    updateNodePrompt: (id: string, prompt: string) => void;
  };
  isConnectable: boolean;
}

export const PromptNode = memo(({ id, data, isConnectable }: PromptNodeProps) => {
  const { prompt, result, isProcessing, error, updateNodePrompt } = data;
  
  return (
    <Card className="w-64 p-4 bg-white shadow-lg">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3"
      />
      
      <div className="space-y-4">
        <Textarea
          placeholder="Enter your prompt..."
          value={prompt}
          onChange={(e) => updateNodePrompt(id, e.target.value)}
          className="min-h-[100px] resize-none"
        />
        
        {isProcessing && (
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
        
        {result && (
          <div className="p-2 bg-secondary/20 rounded-md">
            <p className="text-sm">{result}</p>
          </div>
        )}
        
        {error && (
          <div className="p-2 bg-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3"
      />
    </Card>
  );
});

PromptNode.displayName = 'PromptNode';