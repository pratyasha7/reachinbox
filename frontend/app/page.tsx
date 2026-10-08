'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { UserProfile, EmailItem, ComposeFormValues, SlackIntegrationState } from '@/types/email';
import { api, DEFAULT_USER } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { EmailTable } from '@/components/EmailTable';
import { ComposeModal } from '@/components/ComposeModal';
import { LoginCard } from '@/components/LoginCard';
import {
  Clock,
  CheckCircle2,
  Search,
  Plus,
  X,
  Sparkles
} from 'lucide-react';

export default function OutreachDashboardPage() {
  // Authentication State (Piece 1)
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Tabs & Filters (Piece 3)
  const [activeTab, setActiveTab] = useState<'scheduled' | 'sent'>('scheduled');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Data & Tables (Piece 4)
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [scheduledCount, setScheduledCount] = useState<number>(0);
  const [sentCount, setSentCount] = useState<number>(0);

  // Compose Modal (Piece 5)
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  // Slack Integration (Piece 2)
  const [slackState, setSlackState] = useState<SlackIntegrationState>({
    isConnected: false,
  });

  // Toast / notification feedback
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  // Check persisted user on mount
  useEffect(() => {
    const savedUser = api.getUserProfile();
    // For seamless testing, if no user is saved, user can use Google login or start as John Doe
    if (savedUser) {
      setUser(savedUser);
    }

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('slack') === 'connected') {
        showToast('Connected Slack workspace! Dispatch alerts routed to channel.');
        window.history.replaceState({}, '', window.location.pathname);
      } else if (params.get('slack') === 'failed') {
        showToast('Failed to connect Slack workspace.', 'error');
        window.history.replaceState({}, '', window.location.pathname);
      }
    }

    // Load Slack status from backend
    api.getSlackStatus().then((s) => setSlackState(s));
    setIsAuthChecking(false);
  }, []);

  // Search input debouncer (simulating real-time Elasticsearch search query)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load emails (silent by default so it NEVER flickers the screen during auto-refresh)
  const loadEmails = useCallback(async (
    tab: 'scheduled' | 'sent' = activeTab,
    search: string = debouncedSearch,
    showLoader = false
  ) => {
    if (showLoader) setIsLoadingEmails(true);
    try {
      const [data, scheduled, sent] = await Promise.all([
        api.getEmails(tab, search),
        api.getEmails('scheduled'),
        api.getEmails('sent'),
      ]);
      setEmails(data);
      setScheduledCount(scheduled.length);
      setSentCount(sent.length);
    } catch (err) {
      console.error('Failed to load emails:', err);
    } finally {
      if (showLoader) setIsLoadingEmails(false);
    }
  }, [activeTab, debouncedSearch]);

  // Initial load shows loader once; 3-second timer is 100% silent!
  useEffect(() => {
    if (!user) return;
    // 1. Initial load (shows loader once on entry)
    loadEmails(activeTab, debouncedSearch, true);

    // 2. Background polling every 3 seconds (completely silent, zero screen flash!)
    const syncTimer = setInterval(() => {
      loadEmails(activeTab, debouncedSearch, false);
    }, 3000);

    return () => clearInterval(syncTimer);
  }, [user, activeTab, debouncedSearch, loadEmails]);

  // Global Keyboard shortcut: 'C' to compose
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      // If typing in input or textarea, ignore
      if (
        ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName) ||
        isComposeOpen
      ) {
        return;
      }
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setIsComposeOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [isComposeOpen]);

  // Handlers
  const handleLoginSuccess = (newUser: UserProfile) => {
    setUser(newUser);
    api.saveUserProfile(newUser);
    showToast(`Welcome back, ${newUser.name}! Signed in via Google.`);
  };

  const handleLogout = () => {
    api.clearUserProfile();
    setUser(null);
    showToast('Signed out successfully.', 'info');
  };

 const handleToggleSlack = async (connect: boolean) => {
    if (connect) {
      const clientId = process.env.NEXT_PUBLIC_SLACK_CLIENT_ID || '10213813073526.12257059299298';
      const redirectUri = encodeURIComponent('http://localhost:5000/api/slack/oauth/callback');
      const uId = user?.id || user?.googleId || user?.email || 'default-user';

      // 🚀 Redirect to real Slack authorization server!
      window.location.href = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=incoming-webhook,chat:write&redirect_uri=${redirectUri}&state=${uId}`;
    } else {
      await api.updateSlackStatus(false);
      setSlackState({ isConnected: false });
      showToast('Slack disconnected.', 'info');
    }
  };

  const handleScheduleSubmit = async (values: ComposeFormValues) => {
    const uId = user?.id || user?.googleId || user?.email;
    const newItems = await api.scheduleEmails(values, uId);
    showToast(`Successfully scheduled ${newItems.length} outreach emails!`, 'success');
    // Reload scheduled list
    await loadEmails('scheduled', debouncedSearch);
    setActiveTab('scheduled');
  };

  const handleCancelEmail = async (id: string) => {
    const uId = user?.id || user?.googleId || user?.email;
    await api.cancelEmail(id);
    showToast('Scheduled email cancelled.', 'info');
    await loadEmails(activeTab, debouncedSearch);
  };

  // If still checking initial authentication
  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-blue-600/30 border-t-blue-600 animate-spin" />
          <p className="text-xs text-zinc-500 font-mono">Initializing ReachInbox...</p>
        </div>
      </div>
    );
  }

  // Piece 1: If not logged in, show Google OAuth Login Card
  if (!user) {
    return <LoginCard onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen flex flex-col relative text-zinc-900 dark:text-zinc-100">
      {/* 🚀 High-Performance Fixed Background Layer */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <Image
          src="/bg.webp"
          alt="Watercolor Background"
          fill
          priority
          quality={75}
          className="object-cover object-center"
        />
        {/* Optional subtle overlay to keep text contrast readable */}
        <div className="absolute inset-0 bg-white/20 dark:bg-black/30 backdrop-blur-[2px]" />
      </div>
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-4 fade-in duration-200">
          <div
            className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-xs font-medium shadow-xl backdrop-blur-md ${toastMessage.type === 'error'
              ? 'bg-rose-50/90 dark:bg-rose-950/90 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              : toastMessage.type === 'info'
                ? 'bg-zinc-900/90 dark:bg-zinc-800/90 border-zinc-700 text-white'
                : 'bg-emerald-50/90 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Piece 2: The Top Navbar */}
      <Navbar
        user={user}
        slack={slackState}
        onLogout={handleLogout}
        onToggleSlack={handleToggleSlack}
      />

      {/* Background ambient lighting for authentic glassmorphism blur */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/[0.08] rounded-full blur-[128px]" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/[0.08] rounded-full blur-[128px]" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-purple-500/10 dark:bg-purple-600/[0.06] rounded-full blur-[128px]" />
      </div>

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Piece 3 - Header & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Outreach Dashboard
              </h1>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Automate multi-recipient cold email dispatches with staggered delays and rate limits.
            </p>
          </div>

          {/* Primary Action Button: Compose Email */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsComposeOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-white/60 hover:bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border-2 border-pink-400/80 hover:border-pink-500 px-4.5 py-2.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100 shadow-md shadow-pink-500/10 hover:shadow-lg hover:shadow-pink-500/20 transition-all cursor-pointer group"
            >
              <Plus className="w-4 h-4 text-pink-600 dark:text-pink-400 transition-transform group-hover:rotate-90 duration-200" />
              <span>Compose Email</span>
            </button>
          </div>
        </div>

        {/* Outreach Metrics Bar - Individual Glassmorphic Boxes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-3xl border border-white/40 dark:border-zinc-800/40 shadow-xl rounded-2xl p-4.5 hover:bg-white/70 dark:hover:bg-zinc-900/70 transition-all">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
              <span>Scheduled Queue</span>
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
              {scheduledCount}
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">Awaiting dispatch</p>
          </div>

          <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/40 dark:border-zinc-800/40 shadow-xl rounded-2xl p-4.5 hover:bg-white/70 dark:hover:bg-zinc-900/70 transition-all">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
              <span>Delivered Emails</span>
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
              {sentCount}
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">Successfully sent</p>
          </div>

          <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/40 dark:border-zinc-800/40 shadow-xl rounded-2xl p-4.5 hover:bg-white/70 dark:hover:bg-zinc-900/70 transition-all">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
              <span>Hourly Throttle</span>
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
              20<span className="text-xs font-normal text-zinc-400">/hr</span>
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">Rate limit protection</p>
          </div>

          <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/40 dark:border-zinc-800/40 shadow-xl rounded-2xl p-4.5 hover:bg-white/70 dark:hover:bg-zinc-900/70 transition-all">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
              <span>Slack Webhook</span>
              <span className={`w-2 h-2 rounded-full ${slackState.isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-zinc-400'}`} />
            </div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-2.5 truncate">
              {slackState.isConnected ? 'Connected' : 'Not Connected'}
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
              {slackState.isConnected ? (slackState.channelName ? `Broadcasting to ${slackState.channelName}` : 'Broadcasting live alerts') : 'Optional integration'}
            </p>
          </div>
        </div>

        {/* Piece 3: Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
          {/* Two Tabs: [🕒 Scheduled (X)] and [✅ Sent (Y)] */}
          <div className="glass-box bg-zinc-200/40 dark:bg-zinc-900/60 inline-flex rounded-xl p-1 self-start border border-zinc-300/70 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setActiveTab('scheduled')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'scheduled'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 shadow-md shadow-zinc-950/10 border border-zinc-200/90 dark:border-zinc-700 ring-1 ring-black/5'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Scheduled</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono font-medium ${
                  activeTab === 'scheduled'
                    ? 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold'
                    : 'bg-zinc-200/60 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400'
                }`}
              >
                {scheduledCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sent')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'sent'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 shadow-md shadow-zinc-950/10 border border-zinc-200/90 dark:border-zinc-700 ring-1 ring-black/5'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Sent</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono font-medium ${
                  activeTab === 'sent'
                    ? 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold'
                    : 'bg-zinc-200/60 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400'
                }`}
              >
                {sentCount}
              </span>
            </button>
          </div>

          {/* Search Bar (Simulating Elasticsearch behind the scenes) */}
          <div className="relative w-full sm:w-80">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recipient, subject, body..."
              className="glass-box w-full rounded-xl pl-9 pr-8 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/60 transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Piece 4: Email Table (with Loading, Empty, Data states) */}
        <EmailTable
          emails={emails}
          isLoading={isLoadingEmails}
          activeTab={activeTab}
          searchQuery={debouncedSearch}
          onComposeClick={() => setIsComposeOpen(true)}
          onCancelEmail={handleCancelEmail}
        />
      </main>

      {/* Piece 5: The "Compose New Email" Popup (Modal) */}
      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSchedule={handleScheduleSubmit}
      />
    </div>
  );
}
