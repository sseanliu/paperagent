"use client";

import { FlowCanvas } from '@/components/flow/flow-canvas';
import { PDFUpload } from '@/components/pdf/pdf-upload';

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="grid grid-cols-[1fr,400px] h-screen">
        <div className="border-r border-border overflow-hidden">
          <FlowCanvas />
        </div>
        <div className="p-4 border-l border-border">
          <h2 className="text-lg font-semibold mb-4">PDF Upload</h2>
          <PDFUpload />
        </div>
      </div>
    </main>
  );
}