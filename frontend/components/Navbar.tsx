'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { UserProfile, SlackIntegrationState } from '@/types/email';
import { LogOut, Check, Sliders, ExternalLink, X, Bell } from 'lucide-react';

interface NavbarProps {
  user: UserProfile;
  slack: SlackIntegrationState;
  onLogout: () => void;
  onToggleSlack: (connect: boolean, channelName?: string) => Promise<void>;
}

// Slack SVG Icon
function SlackIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.528 2.528 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z"
        fill="#E01E5A"
      />
      <path
        d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z"
        fill="#36C5F0"
      />
      <path
        d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z"
        fill="#2EB67D"
      />
      <path
        d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.528 2.528 0 0 1 2.52-2.521h6.313A2.528 2.528 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"
        fill="#ECB22E"
      />
    </svg>
  );
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  slack,
  onLogout,
  onToggleSlack,
}) => {
  const [showSlackModal, setShowSlackModal] = useState(false);
  const [slackChannel, setSlackChannel] = useState('#outreach-alerts');
  const [isUpdatingSlack, setIsUpdatingSlack] = useState(false);

  const handleSlackAction = async () => {
    try {
      setIsUpdatingSlack(true);
      await onToggleSlack(!slack.isConnected, slackChannel);
      setShowSlackModal(false);
    } finally {
      setIsUpdatingSlack(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-pink-200/60 dark:border-pink-900/40 bg-pink-50/80 dark:bg-pink-950/40 backdrop-blur-xl transition-colors shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Product Brand */}
          <div className="flex items-center gap-2.5">
            <div className="relative h-9 w-9 flex items-center justify-center flex-shrink-0">
              <Image
                src="/mailbox.png"
                alt="ReachInbox Mailbox"
                width={36}
                height={36}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                ReachInbox
              </span>
            </div>
          </div>

          {/* Right Header Navigation */}
          <div className="flex items-center gap-3 sm:gap-4">

            {/* User Profile info */}
            <div className="flex items-center gap-3">
              <div className="relative">
                {/* User Avatar */}
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-pink-200/70 dark:ring-pink-900/40"
                  onError={(e) => {
                    // Fallback to initials if image fails
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-950" />
              </div>

              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                  {user.name}
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono leading-tight">
                  {user.email}
                </span>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-800 p-1.5 text-xs text-zinc-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors ml-1"
                title="Sign out of account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden lg:inline text-[11px] font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Floating Slack Icon Button (Bottom Right) */}
      <button
        type="button"
        onClick={() => setShowSlackModal(true)}
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/60 dark:border-zinc-800 shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer group"
        title={slack.isConnected ? `Slack Connected: ${slack.channelName || '#outreach-alerts'} (Click to manage)` : "Connect Slack"}
        aria-label="Connect Slack"
      >
        <SlackIcon className="w-6 h-6 transition-transform group-hover:scale-110" />
        {slack.isConnected && (
          <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
        )}
      </button>

      {/* Slack Integration Dialog */}
      {showSlackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  <SlackIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Slack Outreach Alerts
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Broadcast delivery events & queue status into your Slack channel
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSlackModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {slack.isConnected ? (
                <div className="rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 p-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Connected to Slack Channel: {slack.channelName || '#outreach-alerts'}</span>
                  </div>
                  <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                    Every scheduled email dispatched or delayed will send an instant webhook notification.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Target Channel
                  </label>
                  <input
                    type="text"
                    value={slackChannel}
                    onChange={(e) => setSlackChannel(e.target.value)}
                    placeholder="#outreach-alerts"
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  />
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    In production, this connects via OAuth to your team workspace.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowSlackModal(false)}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-3.5 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSlackAction}
                disabled={isUpdatingSlack}
                className={`rounded-xl px-4 py-2 text-xs font-semibold text-white transition-all shadow-sm ${
                  slack.isConnected
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {isUpdatingSlack
                  ? 'Updating...'
                  : slack.isConnected
                  ? 'Disconnect Slack'
                  : 'Connect Slack Workspace'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
