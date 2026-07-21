export type InsuranceCategory =
  | 'life' | 'health' | 'vehicle' | 'home' | 'travel' | 'term' | 'other';

export interface InsurancePolicy {
  _id?: string;
  space_id: string;
  user_id: string;
  policyName: string;          // "LIC Jeevan Anand"
  provider: string;            // "LIC of India"
  policyNumber: string;
  category: InsuranceCategory;
  holderName: string;          // insured person
  nominee?: string;
  premiumAmount: number;
  premiumFrequency: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly' | 'one_time';
  sumAssured?: number;
  startDate: string;           // YYYY-MM-DD
  nextDueDate: string;         // YYYY-MM-DD  (renewal / next premium)
  endDate?: string;
  attachmentUrl?: string;      // link to Drive / Dropbox
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type WarrantyCategory =
  | 'appliance' | 'electronics' | 'mobile' | 'furniture' | 'vehicle' | 'other';

export interface Warranty {
  _id?: string;
  space_id: string;
  user_id: string;
  itemName: string;            // "LG Refrigerator 260L"
  brand?: string;
  modelNumber?: string;
  serialNumber?: string;
  category: WarrantyCategory;
  vendor?: string;             // "Reliance Digital"
  purchaseDate: string;        // YYYY-MM-DD
  purchaseAmount?: number;
  warrantyMonths: number;      // 12, 24 ...
  expiryDate: string;          // YYYY-MM-DD  (computed on client, stored)
  invoiceUrl?: string;
  warrantyCardUrl?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface VaultReminder {
  kind: 'insurance' | 'warranty';
  id: string;
  title: string;
  subtitle: string;
  dueDate: string;
  daysLeft: number;
  amount?: number;
}
