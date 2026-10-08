'use client';

import React, { useState } from 'react';
import { EmailItem } from '@/types/email';
import { StatusBadge } from './StatusBadge';
import {
  Clock,
  CheckCircle2,
  Calendar,
  Mail,
  Plus,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Inbox,
  AlertCircle,
  Eye,
  X
} from 'lucide-react';

interface EmailTableProps {
  emails: EmailItem[];
  isLoading: boolean;
  activeTab: 'scheduled' | 'sent';
  searchQuery: string;
  onComposeClick: () => void;
  onCancelEmail?: (id: string) => void;
}

export const EmailTable: React.FC<EmailTableProps> = ({
  emails,
  isLoading,
  activeTab,
  searchQuery,
  onComposeClick,
  onCancelEmail,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [inspectEmail, setInspectEmail] = useState<EmailItem | null>(null);

  const handleCopy = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Human-friendly date/time formatter
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;

      const now = new Date();
      const isToday =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();

      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isTomorrow =
        d.getDate() === tomorrow.getDate() &&
        d.getMonth() === tomorrow.getMonth() &&
        d.getFullYear() === tomorrow.getFullYear();

      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (isToday) {
        return `Today, ${timeStr}`;
      } else if (isTomorrow) {
        return `Tomorrow, ${timeStr}`;
      } else {
        return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
      }
    } catch {
      return dateStr;
    }
  };

  // State 1: Loading State
  if (isLoading) {
    return (
      <div className="bg-white/85 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/50 dark:border-zinc-800/40 shadow-xl rounded-2xl w-full overflow-hidden">
        <div className="p-8 flex flex-col items-center justify-center gap-4 text-center min-h-[340px]">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-3 border-blue-500/20 border-t-blue-600 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Fetching your emails...
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Syncing scheduled dispatch queues and delivery logs
            </p>
          </div>

          {/* Skeleton Rows preview */}
          <div className="w-full max-w-xl space-y-2 mt-4 opacity-40 animate-pulse">
            <div className="h-8 bg-zinc-200/60 dark:bg-white/10 rounded-lg w-full" />
            <div className="h-8 bg-zinc-200/60 dark:bg-white/10 rounded-lg w-full" />
            <div className="h-8 bg-zinc-200/60 dark:bg-white/10 rounded-lg w-full" />
          </div>
        </div>
      </div>
    );
  }

  // State 2: Empty State
  if (emails.length === 0) {
    return (
      <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/50 dark:border-zinc-800/40 shadow-xl rounded-2xl w-full overflow-hidden p-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 text-zinc-500 dark:text-zinc-400 mb-4 shadow-xs">
          <Inbox className="w-7 h-7" />
        </div>
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
          {searchQuery
            ? `No emails matching "${searchQuery}"`
            : activeTab === 'scheduled'
            ? 'No scheduled emails yet'
            : 'No sent emails yet'}
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-6">
          {searchQuery
            ? 'Try adjusting your search keywords or clear the filter to view all outbound entries.'
            : activeTab === 'scheduled'
            ? "No scheduled emails yet. Click 'Compose' to schedule your first batch!"
            : 'Emails will appear here automatically once your scheduled sequence starts dispatching.'}
        </p>
        <button
          onClick={onComposeClick}
          className="inline-flex items-center gap-2 rounded-xl bg-white/60 hover:bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border-2 border-pink-400/80 hover:border-pink-500 px-4.5 py-2.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100 shadow-md shadow-pink-500/10 hover:shadow-lg hover:shadow-pink-500/20 transition-all cursor-pointer group"
        >
          <Plus className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400 transition-transform group-hover:rotate-90 duration-200" />
          <span>Compose New Email</span>
        </button>
      </div>
    );
  }

  // State 3: Data State
  return (
    <>
      <div className="bg-white/90 dark:bg-zinc-900/60 backdrop-blur-sm border border-white/40 dark:border-zinc-800/40 shadow-xl rounded-2xl w-full overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50/60 dark:bg-white/[0.02] text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <th className="py-3.5 pl-6 pr-4">Recipient</th>
                <th className="py-3.5 px-4">Subject</th>
                <th className="py-3.5 px-4">
                  {activeTab === 'scheduled' ? 'Scheduled For' : 'Sent At'}
                </th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 pl-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-white/[0.06] text-sm">
              {emails.map((email) => {
                const displayTime =
                  activeTab === 'scheduled'
                    ? formatDateTime(email.scheduledTime)
                    : formatDateTime(email.sentTime || email.scheduledTime);

                return (
                  <tr
                    key={email.id}
                    onClick={() => setInspectEmail(email)}
                    className="group hover:bg-black/[0.02] dark:hover:bg-white/[0.04] cursor-pointer transition-colors duration-150"
                  >
                    {/* Recipient */}
                    <td className="py-4 pl-6 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold text-xs uppercase">
                          {email.recipient.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          {email.recipientName && (
                            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                              {email.recipientName}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono truncate max-w-[200px]">
                              {email.recipient}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleCopy(email.recipient, email.id, e)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                              title="Copy email"
                            >
                              {copiedId === email.id ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Subject */}
                    <td className="py-4 px-4 max-w-xs">
                      <p className="text-xs font-medium text-zinc-900 dark:text-zinc-200 truncate">
                        {email.subject}
                      </p>
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                        {email.body.replace(/\n/g, ' ')}
                      </p>
                    </td>

                    {/* Time */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                        {activeTab === 'scheduled' ? (
                          <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        )}
                        <span>{displayTime}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <StatusBadge status={email.status} />
                    </td>

                    {/* Actions */}
                    <td className="py-4 pl-4 pr-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectEmail(email);
                          }}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          title="Preview details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {activeTab === 'scheduled' && onCancelEmail && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Cancel scheduled email to ${email.recipient}?`)) {
                                onCancelEmail(email.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Cancel scheduled dispatch"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Modal Drawer */}
      {inspectEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <StatusBadge status={inspectEmail.status} />
                <span className="text-xs text-zinc-400 font-mono">ID: {inspectEmail.id}</span>
              </div>
              <button
                type="button"
                onClick={() => setInspectEmail(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Recipient
                </label>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {inspectEmail.recipientName ? `${inspectEmail.recipientName} ` : ''}
                  <span className="font-mono text-zinc-500 font-normal">
                    &lt;{inspectEmail.recipient}&gt;
                  </span>
                </p>
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Subject
                </label>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {inspectEmail.subject}
                </p>
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Timing
                </label>
                <p className="text-xs text-zinc-600 dark:text-zinc-300">
                  Scheduled for: {formatDateTime(inspectEmail.scheduledTime)}
                  {inspectEmail.sentTime && (
                    <> • Sent at: {formatDateTime(inspectEmail.sentTime)}</>
                  )}
                </p>
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Body Content
                </label>
                <div className="mt-1 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap font-sans leading-relaxed">
                  {inspectEmail.body}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectEmail(null)}
                className="rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
