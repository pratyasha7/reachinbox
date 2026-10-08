'use client';

import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { UploadCloud, CheckCircle2, FileText, X, AlertCircle, Sparkles } from 'lucide-react';

interface FileUploadProps {
  onEmailsExtracted: (emails: string[]) => void;
  extractedEmails: string[];
}

const SAMPLE_LEADS = [
  'alex@company.com',
  'sarah@startup.io',
  'michael.scott@dundermifflin.com',
  'elena.rostova@cloudscale.net',
  'david.miller@fintechflow.com'
];

export const FileUpload: React.FC<FileUploadProps> = ({
  onEmailsExtracted,
  extractedEmails,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractEmailsFromText = (text: string, sourceName: string, size?: number) => {
    setErrorMsg(null);
    // Regex for valid email addresses
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = text.match(emailRegex) || [];

    // Deduplicate & normalize
    const uniqueEmails = Array.from(
      new Set(matches.map((e) => e.trim().toLowerCase()))
    );

    if (uniqueEmails.length === 0) {
      setErrorMsg('No valid email addresses were found in this file.');
      return;
    }

    setFileName(sourceName);
    if (size) {
      setFileSize((size / 1024).toFixed(1) + ' KB');
    } else {
      setFileSize(null);
    }

    onEmailsExtracted(uniqueEmails);
  };

  const processFile = (file: File) => {
    if (!file) return;

    const validExtensions = ['.csv', '.txt', '.tsv'];
    const hasValidExt = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidExt && !file.type.includes('text') && !file.type.includes('csv')) {
      setErrorMsg('Please upload a .csv, .txt, or .tsv file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      extractEmailsFromText(content, file.name, file.size);
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read file. Please try again.');
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    const updated = extractedEmails.filter((e) => e !== emailToRemove);
    onEmailsExtracted(updated);
    if (updated.length === 0) {
      setFileName(null);
    }
  };

  const handleLoadSample = (e: React.MouseEvent) => {
    e.preventDefault();
    setFileName('sample_sales_leads.csv');
    setFileSize('1.2 KB');
    onEmailsExtracted(SAMPLE_LEADS);
    setErrorMsg(null);
  };

  const handleClear = () => {
    setFileName(null);
    setFileSize(null);
    setErrorMsg(null);
    onEmailsExtracted([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
          Upload Leads (CSV or TXT)
        </label>
        <button
          type="button"
          onClick={handleLoadSample}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Load Sample Leads</span>
        </button>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
            : extractedEmails.length > 0
            ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/20 dark:bg-emerald-950/10'
            : 'border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/40 hover:bg-zinc-100/60 dark:hover:bg-zinc-900/70'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt,.tsv"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-2">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 ${
              extractedEmails.length > 0
                ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 group-hover:scale-105'
            }`}
          >
            {extractedEmails.length > 0 ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <UploadCloud className="w-5 h-5" />
            )}
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {fileName ? (
                <span className="flex items-center gap-1.5 justify-center">
                  <FileText className="w-4 h-4 text-zinc-500" />
                  <span className="font-semibold">{fileName}</span>
                  {fileSize && (
                    <span className="text-xs text-zinc-400 font-normal">({fileSize})</span>
                  )}
                </span>
              ) : (
                <span>
                  <span className="text-blue-600 dark:text-blue-400 font-semibold underline decoration-blue-500/30 underline-offset-2">
                    Click to upload
                  </span>{' '}
                  or drag and drop CSV
                </span>
              )}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Supports .csv, .txt with email addresses separated by commas or newlines
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-2.5 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Badge: "Found X email addresses" */}
      {extractedEmails.length > 0 && (
        <div className="flex flex-col gap-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 p-3">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Found {extractedEmails.length} email {extractedEmails.length === 1 ? 'address' : 'addresses'}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 underline underline-offset-2"
              >
                {showPreview ? 'Hide preview' : 'View recipients'}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-zinc-400 hover:text-rose-500 transition-colors p-1"
                title="Remove file"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {showPreview && (
            <div className="mt-1 flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
              {extractedEmails.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 text-xs text-zinc-700 dark:text-zinc-300"
                >
                  <span className="truncate max-w-[180px]">{email}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveEmail(email)}
                    className="text-zinc-400 hover:text-rose-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
