"use client";

import { useRef, useState } from "react";
import type { RunImportError } from "@/lib/useRuns";

type UploadZoneProps = {
  onFilesSelected: (files: File[]) => void | Promise<void>;
  isProcessing?: boolean;
  errors?: RunImportError[];
};

export function UploadZone({
  onFilesSelected,
  isProcessing,
  errors,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const files = Array.from(fileList);
    if (files.length === 0) return;
    void onFilesSelected(files);
  };

  const onDrop: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  const onDragOver: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const onDragLeave: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-10 text-center transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-zinc-300 bg-white"
        }`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <p className="mb-2 text-sm font-medium text-zinc-900">
          Drag & drop Slay the Spire <span className="font-mono">.run</span> or{" "}
          <span className="font-mono">.json</span> files here
        </p>
        <p className="mb-4 text-xs text-zinc-500">
          Files are parsed locally in your browser. Nothing is uploaded.
        </p>
        <button
          type="button"
          onClick={onButtonClick}
          className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
          disabled={isProcessing}
        >
          {isProcessing ? "Processing..." : "Choose files"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".run,application/json"
          multiple
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />
      </div>

      {errors && errors.length > 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
          <p className="mb-1 font-semibold">Some files could not be imported:</p>
          <ul className="space-y-0.5">
            {errors.map((error) => (
              <li key={`${error.fileName}-${error.message}`}>
                <span className="font-mono">{error.fileName}</span>:{" "}
                {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

