import { z } from 'zod';

export const tripMemberSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Member name is required'),
  mobile: z.string().optional(),
  isCurrentUser: z.boolean().optional(),
  userId: z.string().optional(),
});

export const tripSplitShareSchema = z.object({
  memberId: z.string(),
  amount: z.coerce.number().min(0),
  isSettled: z.boolean().default(false),
});

export const tripExpenseMetadataSchema = z.object({
  paidByMemberId: z.string().optional(),
  splitType: z.enum(['equal', 'exact', 'personal']).optional(),
  splits: z.array(tripSplitShareSchema).optional(),
  tripCategory: z.string().optional(),
  dayNumber: z.number().int().positive().optional(),
});

export const tripSchema = z.object({
  title: z.string().min(1, 'Trip title is required'),
  destination: z.string().optional().default(''),
  category: z.enum([
    'village_visit',
    'vacation',
    'weekend',
    'road_trip',
    'event',
    'family_function',
    'other',
  ]).default('village_visit'),
  startDate: z.string().optional().default(() => new Date().toISOString().split('T')[0]),
  endDate: z.string().optional().default(''),
  budget: z.coerce.number().min(0).default(0),
  coverEmoji: z.string().default('🌴'),
  status: z.enum(['active', 'planned', 'completed', 'archived']).default('active'),
  isCurrentActive: z.boolean().default(true),
  members: z.array(tripMemberSchema).default([]),
  notes: z.string().optional(),
});
