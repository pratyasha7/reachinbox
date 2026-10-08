export type EmailStatus = 'PENDING' | 'PROCESSING' | 'SENT' | 'RESCHEDULED' | 'FAILED';

export interface EmailItem {
  id: string;
  recipient: string;
  recipientName?: string;
  subject: string;
  body: string;
  scheduledTime: string; // ISO string or human-readable format
  sentTime?: string;
  status: EmailStatus;
  delaySeconds?: number;
  hourlyLimit?: number;
  createdAt: string;
}

export interface ComposeFormValues {
  subject: string;
  body: string;
  recipients: string[];
  startTime: string;
  delaySeconds: number;
  hourlyLimit: number;
}

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  avatarUrl: string;
  avatar?: string;
  googleId?: string;
}

export interface SlackIntegrationState {
  isConnected: boolean;
  channelName?: string;
  webhookUrl?: string;
  connectedAt?: string;
}