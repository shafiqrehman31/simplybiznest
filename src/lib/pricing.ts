import { Jurisdiction, SiteConfig } from '../types';

export interface ActivityOption {
  label: string;
  surchargeAed: number;
  codeHint: string;
}

export const BUSINESS_ACTIVITIES: ActivityOption[] = [
  { label: 'Management & Strategy Consultancy', surchargeAed: 0, codeHint: '7020 · Professional Services' },
  { label: 'E-Commerce & Digital Retail', surchargeAed: 0, codeHint: '4791 · Online Merchandising' },
  { label: 'Software Engineering & SaaS', surchargeAed: 0, codeHint: '6201 · Information Technology' },
  { label: 'Marketing, Media & Design Studio', surchargeAed: 0, codeHint: '7311 · Creative Advisory' },
  { label: 'General Trading & Import/Export', surchargeAed: 2500, codeHint: '4690 · Multi-Commodity Trade' },
  { label: 'Holding & Investment SPV', surchargeAed: 2500, codeHint: '6420 · Asset Stewardship' },
  { label: 'Fintech & Web3 Advisory', surchargeAed: 1500, codeHint: '6209 · Digital Infrastructure' },
];

export interface CostBreakdown {
  licenseFeeAed: number;
  establishmentCardAed: number;
  visaAllocationAed: number;
  emiratesIdMedicalAed: number;
  bankingDeskAed: number;
  totalAed: number;
  totalUsd: number;
}

export const AED_TO_USD_RATE = 3.6725;

export function calculateSetupCost(
  jurisdiction: Jurisdiction,
  activityLabel: string,
  visaCount: number,
  config: Pick<SiteConfig, 'zeroVisaPriceAed' | 'oneVisaPriceAed' | 'mainlandPriceAed'>
): CostBreakdown {
  const safeVisas = Math.max(0, Math.min(10, Math.round(visaCount)));
  const activity = BUSINESS_ACTIVITIES.find((a) => a.label === activityLabel);
  const surcharge = activity ? activity.surchargeAed : 0;

  if (jurisdiction === 'Free Zone') {
    const baseLicense = config.zeroVisaPriceAed + surcharge;
    const establishmentCardAed = safeVisas > 0 ? 1850 : 0;

    // Align 1-visa total directly with config.oneVisaPriceAed when using standard activity
    const oneVisaDelta = Math.max(2400, config.oneVisaPriceAed - config.zeroVisaPriceAed - 1850);
    const perVisaAllocation = Math.max(2400, oneVisaDelta - 1150);
    const visaAllocationAed = safeVisas > 0 ? safeVisas * perVisaAllocation : 0;
    const emiratesIdMedicalAed = safeVisas > 0 ? safeVisas * 1150 : 0;
    const bankingDeskAed = 0; // Included in all simplybiznest.com packages

    const totalAed =
      baseLicense + establishmentCardAed + visaAllocationAed + emiratesIdMedicalAed + bankingDeskAed;
    const totalUsd = Math.round(totalAed / AED_TO_USD_RATE);

    return {
      licenseFeeAed: baseLicense,
      establishmentCardAed,
      visaAllocationAed,
      emiratesIdMedicalAed,
      bankingDeskAed,
      totalAed,
      totalUsd,
    };
  }

  // Dubai Mainland DET LLC
  const licenseFeeAed = config.mainlandPriceAed + surcharge;
  const establishmentCardAed = safeVisas > 0 ? 1850 : 0;
  const visaAllocationAed = safeVisas > 0 ? safeVisas * 3400 : 0;
  const emiratesIdMedicalAed = safeVisas > 0 ? safeVisas * 1150 : 0;
  const bankingDeskAed = 0;

  const totalAed =
    licenseFeeAed + establishmentCardAed + visaAllocationAed + emiratesIdMedicalAed + bankingDeskAed;
  const totalUsd = Math.round(totalAed / AED_TO_USD_RATE);

  return {
    licenseFeeAed,
    establishmentCardAed,
    visaAllocationAed,
    emiratesIdMedicalAed,
    bankingDeskAed,
    totalAed,
    totalUsd,
  };
}

export const COUNTRY_CODES = [
  { code: '+971', label: 'UAE (+971)' },
  { code: '+44', label: 'UK (+44)' },
  { code: '+1', label: 'US / Canada (+1)' },
  { code: '+966', label: 'Saudi Arabia (+966)' },
  { code: '+65', label: 'Singapore (+65)' },
  { code: '+91', label: 'India (+91)' },
  { code: '+92', label: 'Pakistan (+92)' },
  { code: '+49', label: 'Germany (+49)' },
  { code: '+33', label: 'France (+33)' },
  { code: '+61', label: 'Australia (+61)' },
  { code: '+974', label: 'Qatar (+974)' },
  { code: '+973', label: 'Bahrain (+973)' },
  { code: '+20', label: 'Egypt (+20)' },
  { code: '+27', label: 'South Africa (+27)' },
];

export function detectCountryCodeByTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.includes('Dubai') || tz.includes('Muscat')) return '+971';
    if (tz.includes('Riyadh')) return '+966';
    if (tz.includes('Qatar')) return '+974';
    if (tz.includes('Bahrain')) return '+973';
    if (tz.includes('London')) return '+44';
    if (tz.includes('Berlin') || tz.includes('Munich')) return '+49';
    if (tz.includes('Paris')) return '+33';
    if (tz.includes('Singapore')) return '+65';
    if (tz.includes('Kolkata') || tz.includes('Calcutta')) return '+91';
    if (tz.includes('Karachi')) return '+92';
    if (tz.includes('Cairo')) return '+20';
    if (tz.includes('Johannesburg')) return '+27';
    if (tz.includes('Sydney') || tz.includes('Melbourne')) return '+61';
    if (tz.startsWith('America/')) return '+1';
  } catch {
    // Fallback below
  }
  return '+971';
}

export function generateTrackingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `SBN-${suffix}`;
}
