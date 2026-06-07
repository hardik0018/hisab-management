export type TransactionType = 'credit' | 'debit';

export interface User {
  _id?: string;
  user_id: string;
  space_id: string;
  name: string;
  email: string;
  image?: string;
}

export interface HisabRecord {
  hisab_id: string;
  user_id: string;
  space_id: string;
  name: string;
  mobile: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: Date | string;
  created_at: Date | string;
  balance?: number; // Calculated field
  log_as_expense?: boolean;
  ignored?: boolean;
}

export interface MarriageRecord {
  marriage_id: string;
  user_id: string;
  space_id: string;
  name: string;
  city: string;
  amount: number;
  date: Date | string;
  created_at: Date | string;
  log_as_expense?: boolean;
}

export interface CollaborationRequest {
  _id: string;
  from_user_id: string;
  from_name: string;
  from_email: string;
  to_user_id: string;
  to_email: string;
  space_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: Date | string;
}

export interface CollaborationData {
  collaborators: User[];
  sentRequests: CollaborationRequest[];
  receivedRequests: CollaborationRequest[];
  currentUserId: string;
  currentSpaceId: string;
}

export interface DashboardStats {
  totalExpense?: number;
  totalDebit: number;
  totalCredit: number;
  totalMarriage: number;
  balance: number;
  recentExpenses?: any[];
  recentHisab: HisabRecord[];
}

export * from './expense';

// ─── Live Tracker Types ───────────────────────────────────────────────────────

export type TrackerStatus = 'live' | 'stopped' | 'offline';

export type SSEEventType =
  | 'tracker:latest'
  | 'tracker:point'
  | 'tracker:session-started'
  | 'tracker:session-stopped'
  | 'tracker:heartbeat';

export interface TrackerSession {
  _id?: string;
  sessionId: string;
  status: 'active' | 'stopped';
  startedAt: Date | string;
  stoppedAt?: Date | string | null;
  totalDistanceM: number;
  avgSpeedKmh: number;
  movingTimeSec: number;
  pointCount: number;
  lastSequence: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface TrackerPoint {
  _id?: string;
  sessionId: string;
  sequence: number;
  lat: number;
  lng: number;
  speedMps: number;
  serverSpeedKmh: number;
  accuracyM: number;
  battery: number;
  distanceFromLastM: number;
  deviceTimestamp: Date | string;
  serverReceivedAt: Date | string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
}

export interface TrackerLatest {
  _id?: string;
  trackerId: 'main';
  sessionId: string | null;
  status: TrackerStatus;
  lat: number | null;
  lng: number | null;
  speedKmh: number | null;
  serverSpeedKmh: number | null;
  avgSpeedKmh: number | null;
  totalDistanceM: number | null;
  accuracyM: number | null;
  battery: number | null;
  lastSequence: number | null;
  lastUpdatedAt: Date | string | null;
}
