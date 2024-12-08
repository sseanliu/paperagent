"use client";

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFlowStore } from "@/lib/stores/flow-store";
import { usePDFStore } from "@/lib/stores/pdf-store";
import { formatText } from "@/lib/utils/text-formatter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ResultsPanel() {
  const { nodes } = useFlowStore();
  const { uploadedFiles } = usePDFStore();
  const [selectedNode, setSelectedNode] = useState(0);
  
  const nodesWithResults = nodes.filter(node => node.data.results?.length > 0);
  
  if (nodesWithResults.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <p>Execute the flow to see results here</p>
      </div>
    );
  }

  if (!uploadedFiles.length) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <p>No PDFs uploaded yet</p>
      </div>
    );
  }

  const currentNode = nodesWithResults[selectedNode];

  return (
    <div className="h-full p-4 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {nodesWithResults.map((node, index) => (
            <Button
              key={node.id}
              variant={selectedNode === index ? "default" : "outline"}
              onClick={() => setSelectedNode(index)}
            >
              Node {index + 1}
            </Button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4">
          {uploadedFiles.map((file) => {
            const result = currentNode.data.results?.find(r => r.fileId === file.id);
            if (!result) return null;

            return (
              <Card key={file.id} className="p-4">
                <h3 className="font-semibold mb-2 text-lg">{file.name}</h3>
                <div 
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: formatText(result.result)
                  }}
                />
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}