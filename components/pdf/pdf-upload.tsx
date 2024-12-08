"use client";

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/ui/card';
import { FileText, Upload, AlertCircle } from 'lucide-react';
import { usePDFStore } from '@/lib/stores/pdf-store';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { PDFList } from './pdf-list';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

export function PDFUpload() {
  const { uploadPDF, isUploading, error } = usePDFStore();
  const { openAIKey } = useSettingsStore();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!openAIKey) {
      toast.error('Please add your OpenAI API key in settings');
      return;
    }

    for (const file of acceptedFiles) {
      if (file.type === "application/pdf") {
        try {
          await uploadPDF(file);
          toast.success(`Successfully uploaded ${file.name}`);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Failed to upload PDF');
        }
      }
    }
  }, [uploadPDF, openAIKey]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: true,
    disabled: !openAIKey || isUploading
  });

  if (!openAIKey) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please add your OpenAI API key in settings before uploading PDFs.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Card
        {...getRootProps()}
        className={`h-40 border-2 border-dashed cursor-pointer transition-colors ${
          isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        } ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center h-full gap-4">
          {isUploading ? (
            <>
              <div className="animate-pulse">Processing PDFs...</div>
              <Upload className="h-12 w-12 text-primary animate-bounce" />
            </>
          ) : isDragActive ? (
            <>
              <Upload className="h-12 w-12 text-primary animate-bounce" />
              <p className="text-center text-muted-foreground">
                Drop the PDFs here...
              </p>
            </>
          ) : (
            <>
              <FileText className="h-12 w-12 text-muted-foreground" />
              <p className="text-center text-muted-foreground">
                Drag and drop PDFs here, or click to select
              </p>
            </>
          )}
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
        </div>
      </Card>
      
      <PDFList />
    </div>
  );
}