'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { UserProfile } from '@/types/email';
import { DEFAULT_USER } from '@/lib/api';
import { ShieldCheck, Zap, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import Script from 'next/script';

interface LoginCardProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginCard: React.FC<LoginCardProps> = ({ onLoginSuccess }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
  const initializeGoogleAuth = () => {
    if (typeof window === 'undefined' || !(window as any).google) return;

    (window as any).google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
      auto_select: false,
      callback: async (response: any) => {
        setIsVerifying(true);
        setStatusMessage('Verifying credentials...');
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://reachinbox-fi3j.onrender.com/api';
        
        const maxRetries = 3;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            if (attempt > 1) {
              setStatusMessage(`Waking up server (attempt ${attempt} of ${maxRetries})...`);
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 25000);

            const res = await fetch(`${API_BASE}/auth/google`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ credential: response.credential }),
              signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (!res.ok) {
              throw new Error(`Server returned status ${res.status}`);
            }

            const data = await res.json();
            onLoginSuccess(data.user);
            return;
          } catch (err: any) {
            console.warn(`[Google Auth] Attempt ${attempt} failed:`, err.message || err);
            if (attempt === maxRetries) {
              setIsVerifying(false);
              alert('Could not connect to backend to verify Google token. Please try again.');
            } else {
              await new Promise((r) => setTimeout(r, 2500));
            }
          }
        }
      },
    });

   
    (window as any).google.accounts.id.renderButton(
      document.getElementById('googleSignInDiv'),
      {
        theme: 'outline',
        size: 'medium',
        text: 'signin_with',
        shape: 'pill',
        width: 300,
      }
    );
  };

  useEffect(() => {
    initializeGoogleAuth();
  }, []);

  return (
    <>
      {/* Load Google's Official Script */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initializeGoogleAuth}
      />

      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-pink-50 via-rose-50 to-pink-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 shadow-2xl backdrop-blur-xl p-8 sm:p-10 relative overflow-hidden">
            
            {/* Logo and App Title */}
            <div className="flex flex-col items-center text-center space-y-4 mb-8">
              <div className="relative h-14 w-14 flex items-center justify-center flex-shrink-0">
                <Image
                  src="/mailbox.png"
                  alt="ReachInbox Mailbox"
                  width={56}
                  height={56}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  ReachInbox
                </h1>
                <p className="text-xs font-medium uppercase tracking-widest text-blue-600 dark:text-blue-400 mt-0.5">
                  Outreach & Cold Sequence Platform
                </p>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-xs leading-relaxed">
                Schedule intelligent email sequences, manage leads with CSV drag-and-drop, and monitor real-time delivery.
              </p>
            </div>

            {/* Official Google Sign-In Button Container */}
            <div className="space-y-4 flex flex-col items-center">
              {isVerifying && (
                <div className="flex flex-col items-center justify-center py-2 space-y-2 text-center">
                  <div className="h-6 w-6 rounded-full border-2 border-blue-600/30 border-t-blue-600 animate-spin" />
                  <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    {statusMessage || 'Verifying credentials...'}
                  </p>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 max-w-xs">
                    Please wait while the cloud server wakes up and logs you in.
                  </p>
                </div>
              )}

              <div id="googleSignInDiv" className={isVerifying ? 'hidden' : 'min-h-[44px] flex justify-center'} />

              {/* Demo fallback link */}
              {!isVerifying && (
                <button
                  type="button"
                  onClick={() => onLoginSuccess(DEFAULT_USER)}
                  className="text-xs text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex items-center gap-1"
                >
                  <span>Quick start as John Doe (Demo)</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Feature Pills */}
            <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800/80 grid grid-cols-2 gap-3 text-[11px] text-zinc-600 dark:text-zinc-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Google OAuth 2.0</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Staggered Dispatch</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
                <span>Elasticsearch Sync</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Slack Webhooks</span>
              </div>
            </div>

          </div>

          <p className="text-center text-xs text-zinc-400 dark:text-zinc-600 mt-6">
            ReachInbox Outbound Dispatcher • Production Build
          </p>
        </div>
      </div>
    </>
  );
};