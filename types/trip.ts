import { ObjectId } from "mongodb";
import { Expense } from "./expense";

export type TripStatus = "active" | "planned" | "completed" | "archived";

export type TripCategory =
  | "village_visit"
  | "vacation"
  | "weekend"
  | "road_trip"
  | "event"
  | "family_function"
  | "other";

export interface TripMember {
  id: string; // Unique ID (e.g. member_abc123)
  name: string;
  mobile?: string;
  isCurrentUser?: boolean;
  userId?: string; // If mapped to an existing collaborator
}

export interface TripSplitShare {
  memberId: string;
  amount: number;
  isSettled: boolean;
}

export interface TripExpenseMetadata {
  paidByMemberId?: string; // who paid
  splitType?: "equal" | "exact" | "personal";
  splits?: TripSplitShare[];
  tripCategory?: string; // e.g. Fuel, Food, Stay, Toll, Daan, Shopping, Misc
  dayNumber?: number; // e.g. Day 1, Day 2
}

export interface Trip {
  _id?: string | ObjectId;
  trip_id: string;
  space_id: string;
  user_id: string;
  title: string; // e.g. "Weekend at Village"
  destination: string; // e.g. "Bagad Village", "Goa"
  category: TripCategory;
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  budget: number; // Target budget in INR (e.g. 10000)
  coverEmoji: string; // e.g. "🌴", "🛕", "🏖️", "🚗"
  status: TripStatus;
  isCurrentActive: boolean;
  members: TripMember[];
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface TripDaySummary {
  date: string;
  dayNumber: number;
  total: number;
  count: number;
}

export interface TripCategorySummary {
  category: string;
  total: number;
  percentage: number;
  count: number;
}

export interface TripMemberBalance {
  memberId: string;
  memberName: string;
  isCurrentUser: boolean;
  totalPaid: number;
  totalShare: number;
  netBalance: number; // Positive = gets back, Negative = owes
}

export interface TripSettlementDebt {
  fromMemberId: string;
  fromMemberName: string;
  toMemberId: string;
  toMemberName: string;
  amount: number;
  isSettled: boolean;
}

export interface TripDetailData {
  trip: Trip;
  expenses: Expense[];
  totalSpent: number;
  budgetRemaining: number;
  budgetUsedPercentage: number;
  dailyAverage: number;
  daysCount: number;
  daySummaries: TripDaySummary[];
  categorySummaries: TripCategorySummary[];
  memberBalances: TripMemberBalance[];
  settlements: TripSettlementDebt[];
}

export interface TripCardItem {
  _id?: string | ObjectId;
  trip_id: string;
  title: string;
  destination: string;
  category: TripCategory;
  startDate: string;
  endDate: string;
  budget: number;
  coverEmoji: string;
  status: TripStatus;
  isCurrentActive: boolean;
  membersCount: number;
  totalSpent: number;
  expenseCount: number;
  budgetPercentage: number;
}
