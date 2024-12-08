"use client";

import { FileText, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePDFStore } from '@/lib/stores/pdf-store';
import { cn } from '@/lib/utils';

export function PDFList() {
  const { uploadedFiles, selectedFileId, removePDF, selectFile } = usePDFStore();

  if (!uploadedFiles?.length) return null;

  return (
    <ScrollArea className="h-[calc(100vh-12rem)]">
      <div className="space-y-2">
        {uploadedFiles.map((file) => (
          <Card 
            key={file.id} 
            className={cn(
              "p-4 cursor-pointer transition-colors hover:bg-secondary/20",
              selectedFileId === file.id && "border-primary bg-primary/5"
            )}
            onClick={() => selectFile(file.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {Math.round(file.size / 1024)} KB
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedFileId === file.id && (
                  <Check className="h-5 w-5 text-primary" />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    removePDF(file.id);
                  }}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}