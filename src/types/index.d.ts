/**
 * Type Definitions for Ray Ryan Management System
 * Version: 3.2.0
 */

// ============================================
// CORE DATA STRUCTURES
// ============================================

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  creation_date?: string;
  driving_school_details?: {
    license_number: string;
    progress_notes: ProgressNote[];
    lesson_credits: number;
  };
}

export interface ProgressNote {
  date: string;
  skillsCompleted: string[];
  instructorNotes: string;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  staff_type: 'INSTRUCTOR' | 'GUIDE' | 'ADMIN';
  guide_qualifications?: GuideQualifications;
}

export interface GuideQualifications {
  languages: string[];
  specializations: string[];
  certifications: string;
  certificationExpiry: string | null;
  rating: number;
}

export interface Resource {
  id: string;
  resource_name: string;
  resource_type: string;
  capacity: number;
  make?: string;
  model?: string;
  reg?: string;
  maintenance_schedule?: {
    mot?: string;
    tax?: string;
    service?: string;
  };
}

export interface Service {
  id: string;
  service_name: string;
  service_type: 'DRIVING_LESSON' | 'TOUR';
  duration_minutes: number;
  base_price: number;
  capacity: number;
  pricing_rules?: {
    type: 'fixed' | 'tiered';
    tiers?: PricingTier[];
  };
  description?: string;
  photos?: string[];
  lessonType?: 'STANDARD' | 'INTENSIVE' | 'CRASH';
}

export interface PricingTier {
  minSize: number;
  maxSize: number;
  price: number;
}

export interface Booking {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string;
  customerId: string;
  staffId: string;
  resourceIds: string[];
  serviceId: string;
  fee: number;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Pending';
  paymentStatus: 'Paid' | 'Unpaid' | 'Paid (Credit)';
  transactionId?: string;
  pickup?: string;

  // Tour-specific fields
  groupSize?: number;
  participants?: string[];
  specialRequirements?: string;
  waiverSigned?: boolean;
  waiverSignedDate?: string;

  // Multi-day tour fields
  isMultidayTour?: boolean;
  endDate?: string;
  accommodation?: string;
  multidayGroupId?: string;

  // Calendar sync
  googleEventId?: string;
  reminderSent?: boolean;
}

export interface Transaction {
  id: string;
  customerId: string;
  bookingId: string;
  date: string;
  amount: number;
  payment_method: string;
  notes?: string;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
}

export interface BlockedPeriod {
  id: string;
  staffId: string | 'all';
  start: string;
  end: string;
  reason: string;
}

export interface WaitingListEntry {
  id: string;
  customerId: string;
  serviceId: string;
  preferredDate?: string;
  notes?: string;
  addedDate: string;
}

export interface Settings {
  mockTestRate: number;
  mockTestDuration: number;
  packages: LessonPackage[];
  instructorName: string;
  instructorAddress: string;
  paymentDetails: string;
  smsTemplate: string;
  autoBackupEnabled: boolean;
  autoRemindersEnabled: boolean;
  autoEmailRemindersEnabled: boolean;
  googleCalendarEnabled: boolean;
  googleCalendarClientId: string;
  googleCalendarApiKey: string;
  googleCalendarAutoSync: boolean;
  autoPaymentRemindersEnabled: boolean;
  paymentReminderDays: number[];
  invoiceLogo: string;
  vatNumber: string;
  invoiceEmail: string;
  invoicePhone: string;
  invoiceTerms: string;
  invoiceThankYou: string;
  invoiceFooterNote: string;
  firstDayOfWeek: 'monday' | 'sunday';
  aiProvider: 'gemini' | 'openai' | 'perplexity' | 'openrouter';
  apiKeys: {
    gemini: string;
    openai: string;
    perplexity: string;
    openrouter: string;
  };
  apiModels: {
    gemini: string;
    openai: string;
    perplexity: string;
    openrouter: string;
  };
}

export interface LessonPackage {
  id: string;
  name: string;
  lessons: number;
  price: number;
}

// ============================================
// APPLICATION STATE
// ============================================

export interface AppState {
  customers: Customer[];
  staff: Staff[];
  resources: Resource[];
  services: Service[];
  bookings: Booking[];
  blockedPeriods: BlockedPeriod[];
  expenses: Expense[];
  transactions: Transaction[];
  waitingList: WaitingListEntry[];
  settings: Settings;
}

// ============================================
// UI TYPES
// ============================================

export interface PaginationInfo {
  items: any[];
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  total: number;
  hasMore: boolean;
  hasPrevious: boolean;
}

export interface DialogOptions {
  title: string;
  message: string;
  buttons: DialogButton[];
}

export interface DialogButton {
  text: string;
  class: string;
  onClick?: () => void;
}

// ============================================
// UTILITY TYPES
// ============================================

export type ViewName =
  | 'calendar'
  | 'day'
  | 'week'
  | 'month'
  | 'summary'
  | 'billing'
  | 'services'
  | 'customers'
  | 'staff'
  | 'resources'
  | 'expenses'
  | 'waiting-list'
  | 'settings'
  | 'reports';

export type ServiceType = 'DRIVING_LESSON' | 'TOUR';

export type BookingStatus = 'Scheduled' | 'Completed' | 'Cancelled' | 'Pending';

export type PaymentStatus = 'Paid' | 'Unpaid' | 'Paid (Credit)';

export type StaffType = 'INSTRUCTOR' | 'GUIDE' | 'ADMIN';

// ============================================
// FUNCTION SIGNATURES
// ============================================

export type MemoizedFunction<T extends (...args: any[]) => any> = T & {
  cache: Map<string, ReturnType<T>>;
  clearCache: () => void;
};

export type DebouncedFunction<T extends (...args: any[]) => any> = {
  (...args: Parameters<T>): void;
  cancel: () => void;
};
