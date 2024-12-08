"use client";

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { formatText } from '@/lib/utils/text-formatter';
import { usePDFStore } from '@/lib/stores/pdf-store';

interface PromptNodeProps {
  id: string;
  data: {
    prompt: string;
    results?: Array<{ fileId: string; result: string }>;
    isProcessing?: boolean;
    error?: string;
    updateNodePrompt?: (id: string, prompt: string) => void;
  };
  isConnectable: boolean;
  selected?: boolean;
}

export const PromptNode = memo(({ id, data, isConnectable, selected }: PromptNodeProps) => {
  const { prompt, results, isProcessing, error, updateNodePrompt } = data;
  const { uploadedFiles } = usePDFStore();
  
  return (
    <div className="relative">
      {/* Main Node */}
      <Card className={`w-[400px] p-4 bg-background border shadow-lg transition-shadow ${
        selected ? 'ring-2 ring-primary' : ''
      }`}>
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
          className="w-3 h-3 !bg-primary"
        />
        
        <div className="space-y-4">
          <Textarea
            placeholder="Enter your prompt..."
            value={prompt}
            onChange={(e) => updateNodePrompt?.(id, e.target.value)}
            className="min-h-[100px] resize-none focus:ring-primary"
            onKeyDown={(e) => e.stopPropagation()}
          />
          
          {isProcessing && (
            <div className="flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
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
          className="w-3 h-3 !bg-primary"
        />
      </Card>

      {/* Results Container - Positioned to the right */}
      {results && results.length > 0 && (
        <div className="absolute left-[420px] top-0 flex gap-4">
          {results.map((result, index) => {
            const file = uploadedFiles.find(f => f.id === result.fileId);
            return (
              <div key={result.fileId} className="relative">
                <Badge 
                  variant="secondary" 
                  className="absolute -top-8 left-0 z-10 max-w-[400px] truncate"
                >
                  {index + 1}. {file?.title || 'Unknown Document'}
                </Badge>
                <Card className="p-4 bg-background/95 backdrop-blur shadow-lg w-[400px]">
                  <div 
                    className="prose prose-sm dark:prose-invert"
                    dangerouslySetInnerHTML={{ 
                      __html: formatText(result.result)
                    }}
                  />
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

PromptNode.displayName = 'PromptNode';