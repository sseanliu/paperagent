"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card } from "@/components/ui/card";
import { FileText, Upload } from "lucide-react";
import type { UploadedFile } from "@/lib/types";

interface PDFUploadProps {
  onUpload: (file: File) => void;
  isUploaded: boolean;
}

export function PDFUpload({ onUpload, isUploaded }: PDFUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type === "application/pdf") {
      onUpload(file);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    disabled: isUploaded
  });

  if (isUploaded) {
    return null;
  }

  return (
    <Card
      {...getRootProps()}
      className={`p-8 border-2 border-dashed cursor-pointer transition-colors ${
        isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-4">
        {isDragActive ? (
          <Upload className="h-12 w-12 text-primary animate-bounce" />
        ) : (
          <FileText className="h-12 w-12 text-muted-foreground" />
        )}
        <p className="text-center text-muted-foreground">
          {isDragActive
            ? "Drop the PDF here..."
            : "Drag and drop a PDF here, or click to select"}
        </p>
      </div>
    </Card>
  );
}