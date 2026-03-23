'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Trash2,
  Tag,
  CreditCard,
  Smartphone,
  Receipt,
  LucideIcon,
  CheckSquare,
  Square,
  PackageOpen,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import PageWrapper from '@/components/PageWrapper';
import { secureFetch } from '@/lib/api-utils';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ExpenseRecord } from '@/types';
import { parseNaturalLanguageExpense } from '@/lib/nlp-utils';
import { Sparkles, Camera, Loader2, Wand2, Mail, Image as ImageIcon } from 'lucide-react';
import Tesseract from 'tesseract.js';

const CATEGORIES = [
  'Food', 'Transport', 'Shopping', 'Bills',
  'Groceries', 'Health', 'Entertainment', 'Other',
];

interface PaymentModeConfig {
  value: 'cash' | 'online' | 'card';
  label: string;
  icon: LucideIcon;
  color: string;
}

const PAYMENT_MODES: PaymentModeConfig[] = [
  { value: 'cash',   label: 'Cash',        icon: CreditCard,  color: 'text-green-600'  },
  { value: 'online', label: 'Online/UPI',  icon: Smartphone,  color: 'text-primary'    },
  { value: 'card',   label: 'Credit Card', icon: CreditCard,  color: 'text-purple-600' },
];

interface ExpensesClientProps {
  initialData: {
    expenses: ExpenseRecord[];
    topCategories: string[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  };
  initialCategory: string;
}

interface FormData {
  title: string;
  amount: string;
  category: string;
  paymentMode: 'cash' | 'online' | 'card';
  date: string;
  notes: string;
}

// ─── Scanned line-item (used in multi-item review) ───────────────────────────
interface ScannedItem {
  id: string;           // temp key
  title: string;
  amount: number;
  category: string;
  selected: boolean;
}

// ═════════════════════════════════════════════════════════════════════════════
// OCR HELPERS
// ═════════════════════════════════════════════════════════════════════════════

// ── 1. Canvas pre-processor ───────────────────────────────────────────────────
// Upscale + grayscale + contrast stretch → Tesseract reads text far better
const preprocessImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      // Upscale more aggressively for small text
      const scale = Math.max(2, 2500 / Math.max(img.width, img.height, 1));
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imageData.data;
      
      // Calculate min/max brightness for contrast stretching
      let min = 255, max = 0;
      for (let i = 0; i < d.length; i += 4) {
        const v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        if (v < min) min = v;
        if (v > max) max = v;
      }

      // Apply adaptive-like contrast stretch
      const range = max - min || 1;
      for (let i = 0; i < d.length; i += 4) {
        let v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        // Stretch to 0-255
        v = ((v - min) / range) * 255;
        // Sharpen contrast
        v = v < 128 ? v * 0.8 : 128 + (v - 128) * 1.2;
        v = Math.max(0, Math.min(255, v));
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = 255;
      }
      
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png', 1.0));
    };

    img.onerror = () => reject(new Error('Image load failed'));
    img.src = url;
  });
};

// ── 2. Amount parser ──────────────────────────────────────────────────────────
// Returns null for HSN codes (long integers w/o decimals), years, etc.
// Returns null for HSN codes (long integers w/o decimals), years, phone numbers, etc.
const parseAmount = (raw: string): number | null => {
  const cleaned = raw.replace(/[^\d.]/g, ''); // keep only digits and dots
  const n = parseFloat(cleaned);
  if (isNaN(n) || n <= 0) return null;

  // Skip HSN/SAC codes: 4-8 digit integers (most likely IDs)
  // If it's a large integer > 100,000 without decimal digits, it's likely an HSN/ID
  if (n > 10000 && !raw.includes('.')) return null;
  // Skip phone numbers (10 digits)
  if (/^\d{10}$/.test(cleaned)) return null;
  // Skip years
  if (/^20[12]\d$/.test(cleaned)) return null;
  
  return n;
};

// ── 3. Category inferrer ──────────────────────────────────────────────────────
type CategoryRule = [string[], string];
const CATEGORY_RULES: CategoryRule[] = [
  [['restaurant','cafe','coffee','pizza','burger','dhaba','biryani',
    'swiggy','zomato','bakery','juice','canteen','hotel','fast food',
    'tiffin','mess','snack'], 'Food'],
  [['pharmacy','medical','chemist','hospital','clinic','medicine',
    'drug store','ayurvedic','surgical','health','diagnostic','nursing'], 'Health'],
  [['dmart','d-mart','big bazaar','reliance fresh','grocery','kirana',
    'vegetable','fruit','ration','bajra','wheat','rice','dal','flour',
    'maida','sugar','oil','ghee','seed','proago','nath','agro',
    'provision','pulses','spice','grain','supermarket','store'], 'Groceries'],
  [['uber','ola','rapido','petrol','diesel','fuel','metro','irctc',
    'bus ticket','toll','parking','autorickshaw','cab','railway',
    'flight','boarding'], 'Transport'],
  [['electricity','bijli','water bill','gas bill','broadband',
    'airtel','jio','vodafone','bsnl','recharge','dish tv','tata sky',
    'maintenance','society'], 'Bills'],
  [['amazon','flipkart','meesho','myntra','nykaa','mall','boutique',
    'garment','apparel','shoe','footwear','jewellery','electronics',
    'mobile','laptop','fashion'], 'Shopping'],
  [['cinema','movie','pvr','inox','netflix','game','amusement',
    'water park','theme park','bowling','arcade','event','ticket'], 'Entertainment'],
];

const inferCategory = (text: string): string => {
  const lower = text.toLowerCase();
  for (const [keywords, cat] of CATEGORY_RULES) {
    if (keywords.some(k => lower.includes(k))) return cat;
  }
  return 'Other';
};

// ── 4. Table header / noise detectors ────────────────────────────────────────
const TABLE_HEADER_WORDS = [
  'hsn','sac','qty','quantity','rate','per unit',
  'description of goods','particulars','item name',
  'sl.no','sr.no','s.no','unit price','mrp',
  'igst','sgst','cgst','gst rates',
];
const NOISE_WORDS = [
  'gstin','fssai','cin:','pan no','mob:','phone','tel:',
  'address','email','www.','thank you','visit again',
];

const isTableHeader = (line: string): boolean => {
  const lower = line.toLowerCase();
  const hits = TABLE_HEADER_WORDS.filter(k => lower.includes(k)).length;
  return hits >= 2 || (line.includes('|') && hits >= 1);
};

const isNoiseLine = (line: string): boolean => {
  const lower = line.toLowerCase();
  if (NOISE_WORDS.some(w => lower.includes(w))) return true;
  const letters = (line.match(/[a-zA-Z]/g) || []).length;
  const digits = (line.match(/\d/g) || []).length;
  // If it has a lot of letters, it's probably not noise, even if there are many numbers
  if (letters > 15) return false;
  return letters < (line.length - digits) * 0.2;
};

// ── 5. Multi-item table parser ────────────────────────────────────────────────
// Detects numbered rows like:  "1  Bajra 9444 (Proago) 1.5 KG  1008212  0%  20 Pcs  625.00  Pcs  12,500.00"
// and returns each as a ScannedItem.
const parseTableItems = (lines: string[]): ScannedItem[] => {
  const items: ScannedItem[] = [];

  for (const line of lines) {
    // A line item typically has some text and at least one decimal number (the price)
    // We look for patterns like: [RowNumber]? [Description] ... [Price]
    const decimals = (line.match(/[\d,]+\.\d{2}/g) || [])
      .map(s => s.replace(/,/g, ''))
      .map(n => parseFloat(n))
      .filter(n => !isNaN(n) && n > 0);

    if (decimals.length === 0) continue;

    // To be a valid item, it should have some descriptive text
    // We strip out the decimals and common noise to see what's left
    let desc = line
      .replace(/[\d,]+\.\d{2}/g, '')          // strip prices
      .replace(/^\s*\d{1,2}\s+/, '')          // strip leading row number
      .replace(/\b\d{4,9}\b/g, '')            // strip HSN/SAC/IDs
      .replace(/\d+\s*%/g, '')               // strip percentages
      .replace(/\b\d+\s*[Pp]cs\b/g, '')      // strip "20 Pcs"
      .replace(/\b[Pp]cs\b/g, '')            // strip stray "Pcs"
      .replace(/[^a-zA-Z0-9\s&()\-]/g, '')   // strip special chars
      .replace(/\s+/g, ' ')
      .trim();

    if (desc.length < 3) continue;
    if (desc.length > 80) desc = desc.substring(0, 77) + '...';

    // The LAST decimal is usually the line total
    const amount = decimals[decimals.length - 1];

    items.push({
      id: `scan-${Math.random().toString(36).slice(2)}`,
      title: desc,
      amount,
      category: inferCategory(desc),
      selected: true,
    });
  }

  return items;
};

// ── 6. Single-item extractor (fallback for non-table bills) ───────────────────
interface ExtractedBill { title: string; amount: number | null; category: string }

const TOTAL_PATTERNS = [
  /grand\s*total/i,
  /net\s*(payable|amount|total)/i,
  /total\s*(amount|payable|bill|value|due)/i,
  /amount\s*(payable|due)/i,
  /bill\s*amount/i,
  /payable\s*amount/i,
  /total\s*[:\s₹Rs.]*$/i,
  /^total$/i,
];

const extractSingleItem = (rawText: string, lines: string[]): ExtractedBill => {
  // Amount: bottom-up for explicit total keyword
  let amount: number | null = null;

  for (const pattern of TOTAL_PATTERNS) {
    for (let i = lines.length - 1; i >= 0; i--) {
      if (pattern.test(lines[i])) {
        const nums = (lines[i].match(/[\d,]+(?:\.\d{1,2})?/g) || [])
          .map(parseAmount).filter((n): n is number => n !== null);
        if (nums.length > 0) { amount = Math.max(...nums); break; }
      }
    }
    if (amount) break;
  }

  // Fallback: largest decimal in last 15 lines (usually where totals are)
  if (!amount) {
    const tail = lines.slice(-15).join(' ');
    const nums = (tail.match(/[\d,]+\.\d{2}/g) || [])
      .map(parseAmount).filter((n): n is number => n !== null && n > 1 && n < 10_000_000);
    if (nums.length) amount = Math.max(...nums);
  }

  // Fallback: largest overall that isn't an ID
  if (!amount) {
    const allNums = (rawText.match(/[\d,]+(?:\.\d{2})?/g) || [])
      .map(parseAmount).filter((n): n is number => n !== null && n > 1 && n < 10_000_000);
    if (allNums.length) {
      // Sort descending and pick the largest one that's not too suspiciously round/large if there are others
      allNums.sort((a, b) => b - a);
      amount = allNums[0];
    }
  }

  // Title: first clean non-header/non-noise line in first 12
  let title = 'Receipt Purchase';
  const candidates = lines.slice(0, 12)
    .filter(l => !isTableHeader(l) && !isNoiseLine(l))
    .filter(l => {
      const letters = (l.match(/[a-zA-Z]/g) || []).length;
      return letters >= 3 && letters / Math.max(l.length, 1) > 0.38;
    });

  if (candidates.length > 0) {
    let raw = candidates[0]
      .replace(/[^a-zA-Z0-9\s&'.,()\-]/g, '')
      .replace(/\s+/g, ' ').trim();
    if (raw.length > 40) raw = raw.substring(0, 37) + '...';
    if (raw.length >= 3) title = raw;
  }

  return { title, amount, category: inferCategory(rawText) };
};


// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function ExpensesClient({ initialData, initialCategory }: ExpensesClientProps) {
  const [expenses, setExpenses]         = useState<ExpenseRecord[]>(initialData.expenses || []);
  const [loading, setLoading]           = useState(false);
  const [search, setSearch]             = useState('');
  const [filterCategory, setFilterCategory] = useState(initialCategory || 'all');
  const [showAddDialog, setShowAddDialog]   = useState(false);
  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [deleteConfirm, setDeleteConfirm]   = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    amount: '',
    category: initialData.expenses?.[0]?.category || 'Other',
    paymentMode: 'cash',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [magicInput, setMagicInput]     = useState('');
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  const [isScanning, setIsScanning]     = useState(false);
  const [isSyncing, setIsSyncing]       = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // ── Multi-item scan review state ──────────────────────────────────────────
  const [scannedItems, setScannedItems]         = useState<ScannedItem[]>([]);
  const [showScanReview, setShowScanReview]     = useState(false);
  const [isAddingAll, setIsAddingAll]           = useState(false);
  const [scanPaymentMode, setScanPaymentMode]   = useState<'cash' | 'online' | 'card'>('cash');
  const [scanDate, setScanDate]                 = useState(new Date().toISOString().split('T')[0]);

  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const h = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(h);
  }, [search]);

  useEffect(() => {
    if (filterCategory !== initialCategory) fetchExpenses();
  }, [filterCategory]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const data = await secureFetch<{ expenses: ExpenseRecord[] }>(
        `/api/expenses?category=${filterCategory}`
      );
      setExpenses(data.expenses || []);
    } catch { /* handled */ } finally { setLoading(false); }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await secureFetch<{ expense: ExpenseRecord }>('/api/expenses', {
        method: 'POST',
        body: JSON.stringify({ ...formData, amount: parseFloat(formData.amount) }),
      });
      toast.success('Expense added successfully');
      setShowAddDialog(false);
      setExpenses([response.expense, ...expenses]);
      setFormData({
        title: '', amount: '',
        category: response.expense.category,
        paymentMode: 'cash',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
    } catch { /* handled */ } finally { setIsSubmitting(false); }
  };

  // ── Add ALL selected scanned items ────────────────────────────────────────
  const handleAddAllScanned = async () => {
    const selected = scannedItems.filter(i => i.selected);
    if (selected.length === 0) return;

    setIsAddingAll(true);
    let added = 0;
    const newExpenses: ExpenseRecord[] = [];

    for (const item of selected) {
      try {
        const response = await secureFetch<{ expense: ExpenseRecord }>('/api/expenses', {
          method: 'POST',
          body: JSON.stringify({
            title: item.title,
            amount: item.amount,
            category: item.category,
            paymentMode: scanPaymentMode,
            date: scanDate,
            notes: 'Added via Receipt Scan',
          }),
        });
        newExpenses.push(response.expense);
        added++;
      } catch { /* continue with others */ }
    }

    if (added > 0) {
      toast.success(`Added ${added} expense${added > 1 ? 's' : ''} from receipt! 🎉`, {
        description: selected.map(i => `₹${i.amount.toLocaleString()} – ${i.title}`).join('\n'),
      });
      setExpenses(prev => [...newExpenses, ...prev]);
    }
    setShowScanReview(false);
    setScannedItems([]);
    setIsAddingAll(false);
  };

  const handleMagicAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!magicInput.trim()) return;
    setIsMagicLoading(true);
    try {
      const parsed = parseNaturalLanguageExpense(magicInput);
      if (!parsed.amount) {
        setFormData({ ...formData, title: parsed.title, category: parsed.category, date: parsed.date });
        setShowAddDialog(true);
        setMagicInput('');
        return;
      }
      const response = await secureFetch<{ expense: ExpenseRecord }>('/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          title: parsed.title, amount: parsed.amount,
          category: parsed.category, date: parsed.date,
          paymentMode: 'online', notes: 'Auto-added via Magic Input',
        }),
      });
      toast.success(`Recorded ₹${parsed.amount} for "${parsed.title}"`, {
        description: `Category: ${parsed.category}`,
        icon: <Sparkles className="h-4 w-4 text-primary" />,
      });
      setExpenses([response.expense, ...expenses]);
      setMagicInput('');
    } catch { /* handled */ } finally { setIsMagicLoading(false); }
  };

  // ── Receipt scanner ───────────────────────────────────────────────────────
  const handleTakePhoto = () => fileInputRef.current?.click();
  const handleUploadBill = () => galleryInputRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const toastId = toast.loading('Scanning receipt…', {
      description: 'Enhancing image & reading text…',
    });

    try {
      // Step 1 — enhance image for better OCR
      const processedDataUrl = await preprocessImage(file);

      // Step 2 — OCR
      const { data: { text } } = await Tesseract.recognize(processedDataUrl, 'eng', {
        logger: () => {},
      });
      console.log('[OCR Raw]\n', text);

      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 1);

      // Step 3 — try multi-item table detection FIRST
      const tableItems = parseTableItems(lines);

      if (tableItems.length >= 2) {
        // ── MULTI-ITEM INVOICE ──────────────────────────────────────────────
        toast.success(`Found ${tableItems.length} items in receipt!`, {
          id: toastId,
          description: 'Review and confirm below.',
        });
        setScanDate(new Date().toISOString().split('T')[0]);
        setScanPaymentMode('cash');
        setScannedItems(tableItems);
        setShowScanReview(true);

      } else if (tableItems.length === 1) {
        // ── SINGLE TABLE ROW — pre-fill add dialog ──────────────────────────
        toast.success('Receipt scanned!', { id: toastId });
        setFormData(prev => ({
          ...prev,
          title: tableItems[0].title,
          amount: tableItems[0].amount.toString(),
          category: tableItems[0].category,
          date: new Date().toISOString().split('T')[0],
        }));
        setShowAddDialog(true);

      } else {
        // ── NON-TABLE BILL (restaurant, DMart, pharmacy, etc.) ──────────────
        const { title, amount, category } = extractSingleItem(text, lines);
        toast.success('Receipt scanned!', { id: toastId });
        setFormData(prev => ({
          ...prev,
          title,
          amount: amount != null ? amount.toString() : '',
          category,
          date: new Date().toISOString().split('T')[0],
        }));
        setShowAddDialog(true);
      }

    } catch (err) {
      console.error('Scan error:', err);
      toast.error('Failed to scan receipt', {
        id: toastId,
        description: 'Try a clearer photo or add manually.',
      });
    } finally {
      setIsScanning(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleGmailSync = async () => {
    setIsSyncing(true);
    const toastId = toast.loading('Syncing Gmail…', { description: 'Scanning for transaction alerts' });
    try {
      const data = await secureFetch<{ success: boolean; count: number; synced: ExpenseRecord[] }>(
        '/api/expenses/sync-gmail', { method: 'POST' }
      );
      if (data.count > 0) {
        toast.success(`Synced ${data.count} new expenses!`, { id: toastId });
        setExpenses(prev => [...data.synced, ...prev]);
      } else {
        toast.success('Everything is up to date', { id: toastId });
      }
    } catch (err: any) {
      if (err.message?.includes('Google Account')) {
        toast.error('Gmail sync requires re-login', {
          id: toastId, description: 'Please log out and log in again.',
        });
      } else {
        toast.error('Sync failed', { id: toastId });
      }
    } finally { setIsSyncing(false); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await secureFetch(`/api/expenses/${deleteConfirm}`, { method: 'DELETE' });
      toast.success('Deleted successfully');
      fetchExpenses();
    } catch { /* handled */ } finally { setDeleteConfirm(null); }
  };

  const filteredExpenses = expenses.filter(exp =>
    exp.title.toLowerCase().includes(debouncedSearch.toLowerCase())
  );
  const totalSpent = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <PageWrapper>
      <div className="p-4 space-y-8 max-w-7xl mx-auto pb-32">

        {/* Header */}
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Expenses</h1>
              <p className="text-slate-500 font-medium">Keep your daily spendings in check.</p>
            </div>
            <div className="flex gap-2">
              <input
                type="file" ref={fileInputRef} onChange={onFileChange}
                accept="image/*" capture="environment" className="hidden"
              />
              <input
                type="file" ref={galleryInputRef} onChange={onFileChange}
                accept="image/*" className="hidden"
              />
              <Button
                onClick={handleGmailSync} disabled={isSyncing} variant="outline"
                className="hidden lg:flex rounded-2xl h-12 px-4 shadow-lg border-slate-200 hover:bg-slate-50 font-bold text-slate-600"
              >
                {isSyncing
                  ? <Loader2 className="h-5 w-5 animate-spin" />
                  : <Mail className="mr-2 h-5 w-5 text-red-500" />}
                Sync <span className="hidden md:inline ml-1 text-red-500">Gmail</span>
              </Button>
              <Button
                onClick={handleUploadBill} disabled={isScanning} variant="outline"
                className="rounded-2xl h-12 px-4 shadow-lg border-slate-200 hover:bg-slate-50 font-bold text-slate-600"
              >
                {isScanning
                  ? <Loader2 className="h-5 w-5 animate-spin" />
                  : <ImageIcon className="mr-2 h-5 w-5 text-indigo-500" />}
                Upload
              </Button>
              <Button
                onClick={handleTakePhoto} disabled={isScanning} variant="outline"
                className="rounded-2xl h-12 px-4 shadow-lg border-slate-200 hover:bg-slate-50 font-bold text-slate-600"
              >
                {isScanning
                  ? <Loader2 className="h-5 w-5 animate-spin" />
                  : <Camera className="mr-2 h-5 w-5 text-rose-500" />}
                Photo
              </Button>
              <Button
                onClick={() => setShowAddDialog(true)}
                className="rounded-2xl h-12 px-6 shadow-xl shadow-primary/20 bg-slate-900 hover:bg-black font-bold text-white transition-all active:scale-95"
              >
                <Plus className="mr-2 h-5 w-5" /> Log
              </Button>
            </div>
          </div>

          {/* Summary Card */}
          <Card className="border-none shadow-xl bg-slate-950 text-white rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden relative">
            <CardContent className="p-5 sm:p-10 relative z-10">
              <div className="flex items-center gap-4 sm:gap-8">
                <div className="w-16 h-16 sm:w-28 sm:h-28 rounded-2xl sm:rounded-[2rem] bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/5 shadow-inner">
                  <Receipt className="h-8 w-8 sm:h-14 sm:w-14 text-slate-400 opacity-80" />
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-slate-400 font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] text-[8px] sm:text-xs">Filter Aggregate</p>
                  <div className="flex items-baseline gap-1.5 sm:gap-3">
                    <h2 className="text-2xl sm:text-6xl font-black text-white">₹{totalSpent.toLocaleString()}</h2>
                    <span className="text-slate-400 font-bold text-[8px] sm:text-base">Total Spent</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Magic Input */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-purple-500/20 to-primary/20 rounded-[2rem] blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
          <Card className="relative border-none shadow-2xl bg-white/80 backdrop-blur-xl rounded-[2rem] overflow-hidden border border-white/20">
            <CardContent className="p-2 sm:p-4">
              <form onSubmit={handleMagicAdd} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Wand2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary animate-pulse" />
                  <Input
                    placeholder='Try: "500 for Starbucks yesterday"'
                    value={magicInput} onChange={(e) => setMagicInput(e.target.value)}
                    disabled={isMagicLoading}
                    className="pl-12 h-14 sm:h-16 rounded-[1.5rem] border-none bg-slate-50/50 text-base sm:text-lg font-bold placeholder:text-slate-400 focus-visible:ring-primary shadow-inner"
                  />
                </div>
                <Button
                  type="submit" disabled={isMagicLoading || !magicInput}
                  className="h-14 sm:h-16 w-14 sm:w-16 rounded-[1.5rem] bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 transition-all active:scale-95 p-0"
                >
                  {isMagicLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Sparkles className="h-6 w-6" />}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search by title…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-14 rounded-2xl border-none bg-white shadow-lg focus-visible:ring-primary transition-all"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="h-14 w-full md:w-[200px] rounded-2xl border-none bg-white shadow-lg font-bold">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl">
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Expense List */}
        <div className="space-y-4">
          {loading
            ? [1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-3xl" />)
            : filteredExpenses.map((exp) => {
                const modeInfo = PAYMENT_MODES.find(p => p.value === exp.paymentMode);
                const ModeIcon = modeInfo ? modeInfo.icon : CreditCard;
                return (
                  <div key={exp.expense_id} className="group relative">
                    <Card className="border-none shadow-lg hover:shadow-xl transition-all rounded-2xl bg-white overflow-hidden p-3 sm:p-5 hover:-translate-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-primary/5 transition-colors flex-shrink-0">
                            <ModeIcon className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight truncate">{exp.title}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="flex items-center gap-1 text-[9px] sm:text-[10px] bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter">
                                <Tag className="h-2 w-2 sm:h-2.5 sm:w-2.5" /> {exp.category}
                              </span>
                              <span className="hidden xs:flex items-center gap-1 text-[9px] sm:text-[10px] text-slate-400 font-bold">
                                <Calendar className="h-2 w-2 sm:h-2.5 sm:w-2.5" /> {new Date(exp.date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-6">
                          <div className="text-right flex-shrink-0">
                            <p className="text-lg sm:text-xl font-black text-red-500">-₹{exp.amount.toLocaleString()}</p>
                            <p className="text-[8px] sm:text-[10px] text-slate-400 font-black uppercase tracking-widest">{exp.paymentMode}</p>
                          </div>
                          <button
                            onClick={() => setDeleteConfirm(exp.expense_id)}
                            className="xs:opacity-0 group-hover:opacity-100 p-2 sm:p-3 rounded-lg sm:rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                          >
                            <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                        </div>
                      </div>
                    </Card>
                  </div>
                );
              })}

          {!loading && filteredExpenses.length === 0 && (
            <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-4 text-slate-300">
                <Receipt className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">No expenses found</h3>
              <p className="text-slate-500">Your wallet seems happy today!</p>
            </div>
          )}
        </div>

        {/* ── Manual Add Dialog ──────────────────────────────────────────────── */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
            <div className="bg-slate-950 px-6 py-5 text-white relative">
              <div className="absolute top-4 right-4 opacity-10"><Receipt className="h-20 w-20" /></div>
              <DialogTitle className="text-3xl font-black mb-1 text-white">New Expense</DialogTitle>
              <p className="text-slate-400 text-sm font-medium">Record where your money is going.</p>
            </div>
            <form onSubmit={handleAddExpense} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Expense Title</Label>
                  <Input
                    placeholder="e.g. Starbucks Coffee"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="h-12 rounded-xl bg-slate-50 border-none px-4 focus-visible:ring-primary"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Amount (₹)</Label>
                    <Input
                      autoFocus type="number" inputMode="decimal" placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="h-12 rounded-xl bg-slate-50 border-none px-4 font-black text-lg focus-visible:ring-primary"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Date</Label>
                    <Input
                      type="date" value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="h-12 rounded-xl bg-slate-50 border-none px-4 font-bold focus-visible:ring-primary"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  {initialData.topCategories?.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Frequent Categories</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {initialData.topCategories.slice(0, 3).map(c => (
                          <button key={`top-${c}`} type="button"
                            onClick={() => setFormData({ ...formData, category: c })}
                            className={`p-3 rounded-2xl text-[12px] font-black uppercase tracking-tighter transition-all flex items-center justify-center border-2 ${
                              formData.category === c
                                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30'
                                : 'bg-slate-50 text-slate-500 border-transparent hover:border-slate-200'
                            }`}
                          >{c}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">All Categories</Label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(c => (
                      <button key={c} type="button"
                        onClick={() => setFormData({ ...formData, category: c })}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all ${
                          formData.category === c
                            ? 'bg-primary text-white shadow-lg shadow-primary/30'
                            : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                        }`}
                      >{c}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Payment Method</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {PAYMENT_MODES.map(m => (
                      <button key={m.value} type="button"
                        onClick={() => setFormData({ ...formData, paymentMode: m.value })}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                          formData.paymentMode === m.value
                            ? 'bg-primary/5 border-primary'
                            : 'bg-slate-50 border-transparent hover:border-slate-100'
                        }`}
                      >
                        <m.icon className={`h-5 w-5 mb-1 ${formData.paymentMode === m.value ? 'text-primary' : 'text-slate-400'}`} />
                        <span className={`text-[9px] font-black uppercase ${formData.paymentMode === m.value ? 'text-primary' : 'text-slate-400'}`}>{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <Button disabled={isSubmitting} className="w-full h-14 rounded-2xl bg-slate-950 font-black text-lg shadow-2xl transition-all active:scale-95 text-white">
                {isSubmitting ? 'Recording…' : 'Finalize Record'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── Multi-Item Scan Review Dialog ──────────────────────────────────── */}
        <Dialog open={showScanReview} onOpenChange={setShowScanReview}>
          <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
            {/* Header */}
            <div className="bg-slate-950 px-6 py-5 text-white relative">
              <div className="absolute top-4 right-4 opacity-10"><PackageOpen className="h-20 w-20" /></div>
              <DialogTitle className="text-2xl font-black mb-1 text-white">
                {scannedItems.length} Items Found
              </DialogTitle>
              <p className="text-slate-400 text-sm font-medium">Select which expenses to add.</p>
            </div>

            <div className="p-6 space-y-5">
              {/* Item list */}
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {scannedItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setScannedItems(prev =>
                        prev.map(i => i.id === item.id ? { ...i, selected: !i.selected } : i)
                      )
                    }
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left ${
                      item.selected
                        ? 'border-primary bg-primary/5'
                        : 'border-slate-100 bg-slate-50 opacity-50'
                    }`}
                  >
                    {item.selected
                      ? <CheckSquare className="h-5 w-5 text-primary flex-shrink-0" />
                      : <Square className="h-5 w-5 text-slate-300 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">{item.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          {item.category}
                        </span>
                      </div>
                    </div>
                    <p className="text-base font-black text-red-500 flex-shrink-0">
                      ₹{item.amount.toLocaleString()}
                    </p>
                  </button>
                ))}
              </div>

              {/* Total */}
              <div className="flex justify-between items-center px-1 py-2 border-t border-slate-100">
                <span className="text-sm font-black text-slate-500 uppercase tracking-widest">
                  {scannedItems.filter(i => i.selected).length} selected
                </span>
                <span className="text-xl font-black text-slate-900">
                  ₹{scannedItems
                    .filter(i => i.selected)
                    .reduce((s, i) => s + i.amount, 0)
                    .toLocaleString()}
                </span>
              </div>

              {/* Date + Payment shared for all items */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Date</Label>
                  <Input
                    type="date" value={scanDate}
                    onChange={(e) => setScanDate(e.target.value)}
                    className="h-11 rounded-xl bg-slate-50 border-none px-3 font-bold focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Payment</Label>
                  <div className="flex gap-1.5 h-11">
                    {PAYMENT_MODES.map(m => (
                      <button
                        key={m.value} type="button"
                        onClick={() => setScanPaymentMode(m.value)}
                        title={m.label}
                        className={`flex-1 flex items-center justify-center rounded-xl border-2 transition-all ${
                          scanPaymentMode === m.value
                            ? 'bg-primary/5 border-primary'
                            : 'bg-slate-50 border-transparent'
                        }`}
                      >
                        <m.icon className={`h-4 w-4 ${scanPaymentMode === m.value ? 'text-primary' : 'text-slate-400'}`} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <Button
                  variant="outline"
                  onClick={() => setShowScanReview(false)}
                  className="flex-1 h-12 rounded-2xl border-slate-200 font-bold text-slate-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddAllScanned}
                  disabled={isAddingAll || scannedItems.filter(i => i.selected).length === 0}
                  className="flex-2 h-12 px-6 rounded-2xl bg-slate-950 hover:bg-black font-black text-white shadow-xl transition-all active:scale-95"
                >
                  {isAddingAll
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Adding…</>
                    : `Add ${scannedItems.filter(i => i.selected).length} Expense${scannedItems.filter(i => i.selected).length > 1 ? 's' : ''}`}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}
          onConfirm={handleDelete} title="Delete Entry?"
          description="This will permanently remove this expense record. This action cannot be undone."
          confirmText="Yes, Delete" variant="destructive"
        />
      </div>
    </PageWrapper>
  );
}