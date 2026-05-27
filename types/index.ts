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

