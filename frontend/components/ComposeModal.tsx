'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Gauge, Send, AlertTriangle, Info, Sparkles } from 'lucide-react';
import { FileUpload } from './FileUpload';
import { ComposeFormValues } from '@/types/email';
import confetti from 'canvas-confetti';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (values: ComposeFormValues) => Promise<void>;
}

export const ComposeModal: React.FC<ComposeModalProps> = ({
  isOpen,
  onClose,
  onSchedule,
}) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);
  
  // Default to tomorrow 09:00 AM formatted for datetime-local
  const getDefaultStartTime = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    // Format YYYY-MM-DDTHH:mm
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${mins}`;
  };

  const [startTime, setStartTime] = useState(getDefaultStartTime());
  const [delaySeconds, setDelaySeconds] = useState(2);
  const [hourlyLimit, setHourlyLimit] = useState(20);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const insertVariable = (varName: string) => {
    setBody((prev) => `${prev} {{${varName}}}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!subject.trim()) {
      setValidationError('Please enter a subject line for your outreach.');
      return;
    }
    if (!body.trim()) {
      setValidationError('Please write the email body content.');
      return;
    }
    if (recipients.length === 0) {
      setValidationError('Please upload at least one recipient lead using the CSV upload box.');
      return;
    }
    if (!startTime) {
      setValidationError('Please specify the campaign start date and time.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSchedule({
        subject: subject.trim(),
        body: body.trim(),
        recipients,
        startTime,
        delaySeconds: Number(delaySeconds) || 2,
        hourlyLimit: Number(hourlyLimit) || 20,
      });

      // Confetti celebration
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {
        // ignore if canvas not supported
      }

      // Reset form
      setSubject('');
      setBody('');
      setRecipients([]);
      setStartTime(getDefaultStartTime());
      onClose();
    } catch (err: unknown) {
      setValidationError(err instanceof Error ? err.message : 'Failed to schedule emails');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Estimate total sequence duration
  const estimatedSeconds = recipients.length > 0 ? (recipients.length - 1) * delaySeconds : 0;
  const estimatedMinutes = Math.ceil(estimatedSeconds / 60);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden z-10 my-8 transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-4.5 bg-zinc-50/70 dark:bg-zinc-900/90">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Compose Outreach Sequence
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Configure sequence copy, leads, and staggered dispatch settings
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {validationError && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-3 text-xs text-rose-700 dark:text-rose-300">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Subject Line */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              Subject Line <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Quick question regarding your Q4 outbound roadmap"
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Email Body */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 block">
              Email Body <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Hi {{first_name}},&#10;&#10;Loved your recent work at {{company}}. Would love to show you how our team scales outbound pipeline with zero deliverability issues..."
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-sans"
            />
          </div>

          {/* CSV File Upload Section */}
          <FileUpload
            onEmailsExtracted={(emails) => setRecipients(emails)}
            extractedEmails={recipients}
          />

          {/* Three Timing Settings */}
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Dispatch Rate & Scheduling Configuration</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Start Time */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  <span>Start Time</span>
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Delay between emails */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Delay (seconds)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={3600}
                    value={delaySeconds}
                    onChange={(e) => setDelaySeconds(Math.max(1, Number(e.target.value)))}
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all pr-8"
                  />
                  <span className="absolute right-3 top-2 text-[10px] text-zinc-400 font-mono">
                    sec
                  </span>
                </div>
              </div>

              {/* Hourly Limit */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  <Gauge className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Hourly Limit</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={hourlyLimit}
                    onChange={(e) => setHourlyLimit(Math.max(1, Number(e.target.value)))}
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all pr-12"
                  />
                  <span className="absolute right-3 top-2 text-[10px] text-zinc-400 font-mono">
                    /hour
                  </span>
                </div>
              </div>
            </div>

            {/* Micro summary */}
            {recipients.length > 0 && (
              <div className="mt-3 flex items-center justify-between rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 px-3 py-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-zinc-400" />
                  <span>
                    Scheduling <strong>{recipients.length}</strong> emails spaced by{' '}
                    <strong>{delaySeconds}s</strong>
                  </span>
                </span>
                <span>
                  Est. duration: <strong>~{estimatedMinutes || 1} min</strong>
                </span>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Scheduling...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Schedule Sequence</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
