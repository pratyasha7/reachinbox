import { EmailItem, ComposeFormValues, SlackIntegrationState, UserProfile } from '@/types/email';

const STORAGE_KEY_SCHEDULED = 'reachinbox_scheduled_emails';
const STORAGE_KEY_SENT = 'reachinbox_sent_emails';
const STORAGE_KEY_SLACK = 'reachinbox_slack_state';
const STORAGE_KEY_USER = 'reachinbox_user_profile';

const INITIAL_SCHEDULED: EmailItem[] = [
  {
    id: 'sch-101',
    recipient: 'alex@company.com',
    recipientName: 'Alex Mercer',
    subject: 'Quick question regarding your Q4 outbound roadmap',
    body: 'Hi Alex,\n\nCame across your product engineering updates on LinkedIn. Would love to share how our automated cold sequence infrastructure can scale your SDR pipeline.\n\nBest,\nJohn',
    scheduledTime: new Date(Date.now() + 1000 * 60 * 60 * 14).toISOString(), // Tomorrow morning
    status: 'PENDING',
    delaySeconds: 2,
    hourlyLimit: 20,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sch-102',
    recipient: 'sarah@startup.io',
    recipientName: 'Sarah Jenkins',
    subject: 'Partnership idea — ReachInbox x Startup.io',
    body: 'Hey Sarah,\n\nLoved your recent launch on Product Hunt! We have a complementary audience of 50k sales operators. Let us explore a joint webinar or integration.\n\nCheers,\nJohn',
    scheduledTime: new Date(Date.now() + 1000 * 60 * 60 * 14 + 1000 * 120).toISOString(), // 2 mins later
    status: 'PENDING',
    delaySeconds: 2,
    hourlyLimit: 20,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sch-103',
    recipient: 'david.miller@fintechflow.com',
    recipientName: 'David Miller',
    subject: 'Reducing bounce rates on cold sequences',
    body: 'Hi David,\n\nNoticed FintechFlow is scaling the sales team. Are you facing deliverability bottlenecks with standard SMTP providers?\n\nLet me know if you are open to a 5-min chat.',
    scheduledTime: new Date(Date.now() + 1000 * 60 * 60 * 18).toISOString(),
    status: 'RESCHEDULED',
    delaySeconds: 3,
    hourlyLimit: 15,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sch-104',
    recipient: 'elena.rostova@cloudscale.net',
    recipientName: 'Elena Rostova',
    subject: 'High-throughput email dispatcher benchmarks',
    body: 'Hey Elena,\n\nWanted to send over the technical whitepaper comparing Redis queues + distributed workers for outbound delivery.\n\nBest regards,\nJohn',
    scheduledTime: new Date(Date.now() + 1000 * 60 * 60 * 22).toISOString(),
    status: 'PENDING',
    delaySeconds: 2,
    hourlyLimit: 20,
    createdAt: new Date().toISOString(),
  }
];

const INITIAL_SENT: EmailItem[] = [
  {
    id: 'sent-201',
    recipient: 'marcus.vance@apexcapital.org',
    recipientName: 'Marcus Vance',
    subject: 'Follow up: Outreach performance review',
    body: 'Marcus, great catching up last Thursday. Attached is the summary deck on campaign deliverability rates.',
    scheduledTime: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    sentTime: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    status: 'SENT',
    delaySeconds: 2,
    hourlyLimit: 25,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'sent-202',
    recipient: 'priya.sharma@growthaccelerate.in',
    recipientName: 'Priya Sharma',
    subject: 'Exclusive early access invitation',
    body: 'Hi Priya, we just opened 25 beta slots for high-volume senders. Would love your feedback!',
    scheduledTime: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    sentTime: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    status: 'SENT',
    delaySeconds: 2,
    hourlyLimit: 20,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'sent-203',
    recipient: 'claire.dubois@luxanalytics.fr',
    recipientName: 'Claire Dubois',
    subject: 'ReachInbox Q3 benchmarking report',
    body: 'Bonjour Claire,\n\nHere is your custom export for the European outbound metrics.',
    scheduledTime: new Date(Date.now() - 1000 * 60 * 60 * 9).toISOString(),
    sentTime: new Date(Date.now() - 1000 * 60 * 60 * 9).toISOString(),
    status: 'SENT',
    delaySeconds: 2,
    hourlyLimit: 30,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
  },
  {
    id: 'sent-204',
    recipient: 'bruce.wayne@wayneenterprises.com',
    recipientName: 'Bruce Wayne',
    subject: 'Automating enterprise security notifications',
    body: 'Mr. Wayne, our distributed queuing architecture ensures zero latency spikes during mission-critical alerts.',
    scheduledTime: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    sentTime: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    status: 'SENT',
    delaySeconds: 1,
    hourlyLimit: 50,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  }
];

export const DEFAULT_USER: UserProfile = {
  name: 'John Doe',
  email: 'john@reachinbox.ai',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  googleId: 'google-oauth-1092837482',
};

// Safe LocalStorage helpers
function getStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, val: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.error(`Failed to store key "${key}":`, err);
  }
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// API methods configured to call backend or fallback to state
export const api = {
  /**
   * Fetch emails for either scheduled or sent tab
   */
  async getEmails(tab: 'scheduled' | 'sent', search?: string, userId?: string): Promise<EmailItem[]> {
    const key = tab === 'scheduled' ? STORAGE_KEY_SCHEDULED : STORAGE_KEY_SENT;
    const initial = tab === 'scheduled' ? INITIAL_SCHEDULED : INITIAL_SENT;

    // Try fetching from real Express backend
    try {
      const q = search ? `&search=${encodeURIComponent(search)}` : '';
      const u = userId ? `userId=${encodeURIComponent(userId)}` : 'userId=default';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(`${API_BASE}/emails/${tab}?${u}${q}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const raw = await res.json();
        if (Array.isArray(raw)) {
          const mapped: EmailItem[] = raw.map((item: any) => ({
            id: item.id || `job-${Math.random()}`,
            recipient: item.recipientEmail || item.recipient,
            recipientName: item.recipientEmail?.split('@')[0],
            subject: item.subject,
            body: item.body,
            scheduledTime: item.scheduledAt || item.scheduledTime || new Date().toISOString(),
            sentTime: item.sentAt || item.sentTime,
            status: item.status || (tab === 'scheduled' ? 'PENDING' : 'SENT'),
            createdAt: item.createdAt || new Date().toISOString(),
          }));
          return mapped;
        }
      }
    } catch {
      // Backend offline or timeout -> fallback to localStorage seamlessly
    }

    // Artificial slight delay for smooth UI feel
    await new Promise((resolve) => setTimeout(resolve, 200));

    let items = getStored<EmailItem[]>(key, initial);
    if (!localStorage.getItem(key)) {
      setStored(key, initial);
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.recipient.toLowerCase().includes(q) ||
          item.subject.toLowerCase().includes(q) ||
          (item.recipientName && item.recipientName.toLowerCase().includes(q)) ||
          item.body.toLowerCase().includes(q) ||
          item.status.toLowerCase().includes(q)
      );
    }

    return items;
  },

  /**
   * Schedule new batch of emails
   */
  async scheduleEmails(data: ComposeFormValues, userId?: string): Promise<EmailItem[]> {
    const existing = getStored<EmailItem[]>(STORAGE_KEY_SCHEDULED, INITIAL_SCHEDULED);
    const startBase = new Date(data.startTime).getTime() || Date.now() + 60000;

    const newItems: EmailItem[] = data.recipients.map((recipientEmail, idx) => {
      const itemTime = new Date(startBase + idx * data.delaySeconds * 1000).toISOString();
      const namePart = recipientEmail.split('@')[0].replace(/[._-]/g, ' ');
      const capitalized = namePart.charAt(0).toUpperCase() + namePart.slice(1);

      return {
        id: `sch-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        recipient: recipientEmail,
        recipientName: capitalized,
        subject: data.subject,
        body: data.body,
        scheduledTime: itemTime,
        status: 'PENDING',
        delaySeconds: data.delaySeconds,
        hourlyLimit: data.hourlyLimit,
        createdAt: new Date().toISOString(),
      };
    });

    // Try posting to real backend
    try {
      await fetch(`${API_BASE}/emails/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId || '5989efc6-8c47-4fbb-a30b-12c903f284cf',
          subject: data.subject,
          body: data.body,
          recipients: data.recipients,
          scheduledStartTime: data.startTime,
          delayBetweenEmailsSec: data.delaySeconds,
          hourlyLimit: data.hourlyLimit,
        }),
      });
    } catch {
      // Backend offline -> store in localStorage
    }

    const updated = [...newItems, ...existing];
    setStored(STORAGE_KEY_SCHEDULED, updated);
    return newItems;
  },

  /**
   * Cancel or delete a scheduled email
   */
  async cancelEmail(id: string): Promise<boolean> {
    const res = await fetch(`http://localhost:5000/api/emails/${id}`, {
      method: 'DELETE',
    });
    return res.ok;
  },

  /**
   * Move email from scheduled to sent (for interactive simulation or test)
   */
  async markAsSent(id: string): Promise<EmailItem | null> {
    const scheduled = getStored<EmailItem[]>(STORAGE_KEY_SCHEDULED, INITIAL_SCHEDULED);
    const target = scheduled.find((i) => i.id === id);
    if (!target) return null;

    const updatedScheduled = scheduled.filter((i) => i.id !== id);
    setStored(STORAGE_KEY_SCHEDULED, updatedScheduled);

    const sent = getStored<EmailItem[]>(STORAGE_KEY_SENT, INITIAL_SENT);
    const sentItem: EmailItem = {
      ...target,
      status: 'SENT',
      sentTime: new Date().toISOString(),
    };
    setStored(STORAGE_KEY_SENT, [sentItem, ...sent]);
    return sentItem;
  },

  /**
   * Slack Integration
   */
  async getSlackStatus(userId?: string): Promise<SlackIntegrationState> {
    try {
      const q = userId ? `?userId=${encodeURIComponent(userId)}` : '';
      const res = await fetch(`${API_BASE}/slack/status${q}`);
      if (res.ok) {
        const data = await res.json();
        if (data.isConnected !== undefined) {
          const state: SlackIntegrationState = {
            isConnected: Boolean(data.isConnected),
            channelName: data.channelName,
          };
          setStored(STORAGE_KEY_SLACK, state);
          return state;
        }
      }
    } catch {
      // Fallback to local storage
    }
    return getStored<SlackIntegrationState>(STORAGE_KEY_SLACK, {
      isConnected: false,
    });
  },

  async updateSlackStatus(connected: boolean, channelName = '#outreach-alerts'): Promise<SlackIntegrationState> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const state: SlackIntegrationState = {
      isConnected: connected,
      channelName: connected ? channelName : undefined,
      connectedAt: connected ? new Date().toISOString() : undefined,
    };
    setStored(STORAGE_KEY_SLACK, state);
    return state;
  },

  /**
   * User Profile / Google OAuth state
   */
  getUserProfile(): UserProfile | null {
    return getStored<UserProfile | null>(STORAGE_KEY_USER, null);
  },

  saveUserProfile(profile: UserProfile): void {
    setStored(STORAGE_KEY_USER, profile);
  },

  clearUserProfile(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  },
};
