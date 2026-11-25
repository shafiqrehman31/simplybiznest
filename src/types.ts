export type Jurisdiction = 'Free Zone' | 'Mainland';

export type OrderMilestoneStatus =
  | 'Form Submitted'
  | 'Quote Locked'
  | 'Passport KYC'
  | 'Trade Name'
  | 'E-License Issued'
  | 'Emirates ID & Bank'
  | 'Active Company';

export const ORDER_MILESTONES: OrderMilestoneStatus[] = [
  'Form Submitted',
  'Quote Locked',
  'Passport KYC',
  'Trade Name',
  'E-License Issued',
  'Emirates ID & Bank',
  'Active Company',
];

export interface SiteConfig {
  siteName: string;
  headerLogoUrl: string;
  footerLogoUrl: string;
  faviconUrl: string;
  heroHeadline: string;
  heroSubheadline: string;
  whatsappNumber: string;
  contactEmail: string;
  promoNotice: string;
  zeroVisaPriceAed: number;
  oneVisaPriceAed: number;
  mainlandPriceAed: number;
  socialLinkedin?: string;
  socialInstagram?: string;
  socialFacebook?: string;
  socialX?: string;
  socialYoutube?: string;
}

export interface NavMenuItem {
  id: string;
  title: string;
  slug: string;
  order: number;
  pageSubtitle: string;
  pageContent: string;
  visible: boolean;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  readTime: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: string;
  visible: boolean;
}

export interface OrderRecord {
  trackingCode: string;
  fullName: string;
  countryCode: string;
  whatsapp: string;
  email: string;
  jurisdiction: Jurisdiction;
  activity: string;
  visaCount: number;
  estimatedAed: number;
  estimatedUsd: number;
  status: OrderMilestoneStatus;
  pipedriveStatus: 'pending' | 'synced' | 'pending_config' | 'error';
  pipedriveDealId: string;
  source: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface OrderStatusRecord {
  trackingCode: string;
  jurisdiction: Jurisdiction;
  activity: string;
  visaCount: number;
  estimatedAed: number;
  status: OrderMilestoneStatus;
  milestoneIndex: number;
  note: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface InventorySlot {
  id: string;
  name: string;
  category: 'License Pool' | 'Visa Quota' | 'Banking Desk';
  jurisdiction: string;
  availableSlots: number;
  totalSlots: number;
  lowThreshold: number;
}

export interface InventoryAlert {
  id: string;
  inventoryId: string;
  slotName: string;
  currentSlots: number;
  threshold: number;
  severity: 'warning' | 'critical';
  resolved: boolean;
}

export interface ReportExportLog {
  id: string;
  exportedBy: string;
  reportType: string;
  rowCount: number;
  createdAt?: unknown;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  suggestedQuote?: {
    jurisdiction: Jurisdiction;
    activity: string;
    visaCount: number;
  };
}
