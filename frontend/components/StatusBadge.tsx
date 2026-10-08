import React from 'react';
import { EmailStatus } from '@/types/email';

interface StatusBadgeProps {
  status: EmailStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const styles: Record<
    EmailStatus,
    { bg: string; text: string; border: string; dot: string; label: string }
  > = {
    SENT: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800/60',
      dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
      label: 'SENT',
    },
    PENDING: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800/60',
      dot: 'bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]',
      label: 'PENDING',
    },
    PROCESSING: {
      bg: 'bg-sky-50 dark:bg-sky-950/40',
      text: 'text-sky-700 dark:text-sky-300',
      border: 'border-sky-200 dark:border-sky-800/60',
      dot: 'bg-sky-500 animate-pulse shadow-[0_0_8px_rgba(14,165,233,0.5)]',
      label: 'PROCESSING',
    },
    RESCHEDULED: {
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      text: 'text-indigo-700 dark:text-indigo-300',
      border: 'border-indigo-200 dark:border-indigo-800/60',
      dot: 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]',
      label: 'RESCHEDULED',
    },
    FAILED: {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800/60',
      dot: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]',
      label: 'FAILED',
    },
  };

  const current = styles[status] || styles.PENDING;
  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px] gap-1.5'
      : 'px-2.5 py-1 text-xs gap-1.5 font-medium tracking-wide';

  return (
    <span
      className={`inline-flex items-center rounded-full border transition-all duration-150 select-none ${current.bg} ${current.text} ${current.border} ${sizeClasses}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${current.dot}`} />
      <span>{current.label}</span>
    </span>
  );
};
