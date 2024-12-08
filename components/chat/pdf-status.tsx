"use client";

import { FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatFileSize } from "@/lib/utils";
import type { UploadedFile } from "@/lib/types";

interface PDFStatusProps {
  file: UploadedFile;
  onRemove: () => void;
}

export function PDFStatus({ file, onRemove }: PDFStatusProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <p className="font-medium">{file.name}</p>
            <p className="text-sm text-muted-foreground">
              {formatFileSize(file.size)}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    </Card>
  );
}