"use client";

import { FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePDFStore } from '@/lib/stores/pdf-store';

export function PDFStatus() {
  const { uploadedFile, resetPDF } = usePDFStore();

  if (!uploadedFile) return null;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <p className="font-medium">{uploadedFile.name}</p>
            <p className="text-sm text-muted-foreground">
              {Math.round(uploadedFile.size / 1024)} KB
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={resetPDF}
          className="text-muted-foreground hover:text-destructive"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    </Card>
  );
}