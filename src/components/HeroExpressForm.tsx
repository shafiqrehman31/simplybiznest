import {
  CheckCircle2,
  Copy,
  Check,
  Eye,
  Mail,
  SearchCheck,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { submitFormationLead } from '../lib/firestoreService';
import {
  AED_TO_USD_RATE,
  COUNTRY_CODES,
  detectCountryCodeByTimezone,
} from '../lib/pricing';
import { Jurisdiction, SiteConfig } from '../types';

export type ExpressSetupType =
  | 'zero-visa'
  | 'one-visa'
  | 'mainland'
  | 'multi-visa';

interface HeroExpressFormProps {
  config: SiteConfig;
  selectedSetupType?: ExpressSetupType;
  onTrackCode?: (code: string) => void;
}

interface QuoteConfirmationState {
  trackingCode: string;
  fullName: string;
  email: string;
  phone: string;
  label: string;
  jurisdiction: Jurisdiction;
  activity: string;
  visaCount: number;
  aed: number;
  usd: number;
  year2RenewalAed?: number;
  emailDelivered: boolean;
  emailNotice: string;
}

export function HeroExpressForm({
  config,
  selectedSetupType,
  onTrackCode,
}: HeroExpressFormProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+971');
  const [whatsapp, setWhatsapp] = useState('');
  const [setupType, setSetupType] = useState<ExpressSetupType>(
    selectedSetupType || 'one-visa'
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmation, setConfirmation] = useState<QuoteConfirmationState | null>(null);
  const [copied, setCopied] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  useEffect(() => {
    setCountryCode(detectCountryCodeByTimezone());
  }, []);

  useEffect(() => {
    if (selectedSetupType) {
      setSetupType(selectedSetupType);
    }
  }, [selectedSetupType]);

  const setupOptions: Record<
    ExpressSetupType,
    {
      label: string;
      shortName: string;
      jurisdiction: Jurisdiction;
      activity: string;
      visaCount: number;
      estimatedAed: number;
      year2RenewalAed?: number;
    }
  > = {
    'zero-visa': {
      label: `Zero-Visa Free Zone — AED ${config.zeroVisaPriceAed.toLocaleString()}`,
      shortName: 'Freezone (0-Visa)',
      jurisdiction: 'Free Zone',
      activity: 'Management & Strategy Consultancy',
      visaCount: 0,
      estimatedAed: config.zeroVisaPriceAed,
      year2RenewalAed: 5750,
    },
    'one-visa': {
      label: `1-Visa Resident Free Zone — AED ${config.oneVisaPriceAed.toLocaleString()}`,
      shortName: 'Freezone (1-Visa Resident)',
      jurisdiction: 'Free Zone',
      activity: 'Management & Strategy Consultancy',
      visaCount: 1,
      estimatedAed: config.oneVisaPriceAed,
      year2RenewalAed: 9900,
    },
    mainland: {
      label: `Dubai Mainland DET LLC — AED ${config.mainlandPriceAed.toLocaleString()}`,
      shortName: 'Mainland DET LLC',
      jurisdiction: 'Mainland',
      activity: 'Management & Strategy Consultancy',
      visaCount: 0,
      estimatedAed: config.mainlandPriceAed,
      year2RenewalAed: 10400,
    },
    'multi-visa': {
      label: 'Multi-Visa Corporate Package (2–10 Visas)',
      shortName: 'Multi-Visa Freezone/Mainland',
      jurisdiction: 'Free Zone',
      activity: 'General Trading & Import/Export',
      visaCount: 3,
      estimatedAed: Math.round(config.oneVisaPriceAed + 7200),
    },
  };

  const activeOpt = setupOptions[setupType];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanName = fullName.trim();
    const cleanEmail = email.trim();
    const cleanPhone = whatsapp.trim().replace(/[^0-9+\-\s]/g, '');

    if (cleanName.length < 2) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
      setErrorMsg('Please enter a valid email address to receive your tracking ID and quote.');
      return;
    }
    if (cleanPhone.length < 6) {
      setErrorMsg('Please enter a valid WhatsApp or phone number.');
      return;
    }

    const estimatedUsd = Math.round(activeOpt.estimatedAed / AED_TO_USD_RATE);

    setSubmitting(true);
    try {
      const code = await submitFormationLead({
        fullName: cleanName,
        countryCode,
        whatsapp: cleanPhone,
        email: cleanEmail,
        jurisdiction: activeOpt.jurisdiction,
        activity: activeOpt.activity,
        visaCount: activeOpt.visaCount,
        estimatedAed: activeOpt.estimatedAed,
        estimatedUsd,
        source: 'google-ads-hero',
      });

      let emailDelivered = false;
      let emailNotice = `Confirmation details & Tracking ID ${code} generated for ${cleanEmail}.`;

      try {
        const res = await fetch('/api/send-quote-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trackingCode: code,
            fullName: cleanName,
            email: cleanEmail,
            phone: `${countryCode} ${cleanPhone}`,
            setupLabel: activeOpt.shortName,
            jurisdiction: activeOpt.jurisdiction,
            activity: activeOpt.activity,
            visaCount: activeOpt.visaCount,
            estimatedAed: activeOpt.estimatedAed,
            estimatedUsd,
            year2RenewalAed: activeOpt.year2RenewalAed,
            appUrl: window.location.origin,
          }),
        });
        const rawText = await res.text();
        let data: { delivered?: boolean; message?: string; error?: string } = {};
        try {
          data = JSON.parse(rawText) as {
            delivered?: boolean;
            message?: string;
            error?: string;
          };
        } catch {
          emailNotice = `Email endpoint returned HTTP ${res.status} without JSON. Make sure the Node server (npm run dev / npm start) is running, not static hosting alone.`;
        }
        emailDelivered = Boolean(data.delivered);
        if (data.message) {
          emailNotice = data.message;
        } else if (data.error) {
          emailNotice = `Email delivery failed: ${data.error}`;
        } else if (!res.ok && !emailNotice.includes('HTTP')) {
          emailNotice = `Email delivery failed with HTTP ${res.status}.`;
        }
      } catch (fetchErr) {
        emailNotice = `Could not reach /api/send-quote-email (${fetchErr instanceof Error ? fetchErr.message : 'network error'}).`;
      }

      setConfirmation({
        trackingCode: code,
        fullName: cleanName,
        email: cleanEmail,
        phone: `${countryCode} ${cleanPhone}`,
        label: activeOpt.shortName,
        jurisdiction: activeOpt.jurisdiction,
        activity: activeOpt.activity,
        visaCount: activeOpt.visaCount,
        aed: activeOpt.estimatedAed,
        usd: estimatedUsd,
        year2RenewalAed: activeOpt.year2RenewalAed,
        emailDelivered,
        emailNotice,
      });

      setFullName('');
      setEmail('');
      setWhatsapp('');
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Unable to submit your request right now. Please retry.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (!confirmation) return;
    navigator.clipboard?.writeText(confirmation.trackingCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="hero-express-form"
      className="bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-8 text-[#1E293B] shadow-2xl shadow-[#0C1A38]/40 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#1F65ED]">
              VIP Express Desk · Fast Quote
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0C1A38] mt-1">
              Get Your Exact UAE Cost Breakdown
            </h2>
          </div>
          <div className="text-right shrink-0">
            <span className="block text-[11px] text-[#475569]">Selected Estimate</span>
            <span className="font-mono text-base font-bold text-[#1F65ED] tabular-nums">
              AED {activeOpt.estimatedAed.toLocaleString()}
            </span>
          </div>
        </div>

        {confirmation ? (
          <div className="mt-6 space-y-4">
            <div className="bg-[#F8FAFC] border border-[#1F65ED]/30 rounded-xl p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[#0C1A38] font-bold text-base">
                  <CheckCircle2 className="w-5 h-5 text-[#1F65ED] shrink-0" />
                  <span>Form Submitted — Tracking Ready</span>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F65ED]">
                  Step 01
                </span>
              </div>

              <p className="text-xs text-[#475569] mt-1.5">
                {confirmation.label} ·{' '}
                <strong className="font-mono text-[#0C1A38]">
                  AED {confirmation.aed.toLocaleString()}
                </strong>
              </p>

              <div className="mt-3 pt-3 border-t border-[#E2E8F0] flex items-center justify-between gap-2">
                <div>
                  <span className="block text-[11px] text-[#475569]">Live Tracking ID</span>
                  <span className="font-mono text-lg font-bold text-[#0C1A38] tabular-nums">
                    {confirmation.trackingCode}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-[#E2E8F0] bg-white text-xs font-bold text-[#1F65ED] hover:bg-[#F8FAFC]"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy ID'}</span>
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-[#E2E8F0] flex items-start gap-2 text-xs text-[#475569]">
                <Mail className="w-4 h-4 text-[#1F65ED] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#0C1A38]">
                    {confirmation.emailDelivered
                      ? `Confirmation email sent to ${confirmation.email}`
                      : `Email confirmation prepared for ${confirmation.email}`}
                  </p>
                  <p className="mt-0.5">{confirmation.emailNotice}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {onTrackCode && (
                <button
                  type="button"
                  onClick={() => onTrackCode(confirmation.trackingCode)}
                  className="w-full py-3 px-4 rounded-lg bg-[#1F65ED] hover:bg-[#1750c4] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <SearchCheck className="w-4 h-4 shrink-0" />
                  <span>View in Live Tracker</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowEmailPreview(true)}
                className="w-full py-3 px-4 rounded-lg border border-[#0C1A38] text-[#0C1A38] hover:bg-[#0C1A38] hover:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Eye className="w-4 h-4 shrink-0" />
                <span>View Email Receipt</span>
              </button>
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => setConfirmation(null)}
                className="text-xs font-medium text-[#475569] hover:text-[#0C1A38]"
              >
                Submit Another Request
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
            {/* Field 1: Full Name */}
            <div>
              <label
                htmlFor="hero-full-name"
                className="block text-xs font-bold uppercase tracking-wider text-[#0C1A38] mb-1.5"
              >
                1. Full Name *
              </label>
              <input
                id="hero-full-name"
                type="text"
                required
                maxLength={120}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Tariq Al Mansoor"
                className="w-full h-11 px-3.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white text-sm text-[#0C1A38] focus:outline-none focus:ring-2 focus:ring-[#1F65ED]"
              />
            </div>

            {/* Field 2: Email Address */}
            <div>
              <label
                htmlFor="hero-email"
                className="block text-xs font-bold uppercase tracking-wider text-[#0C1A38] mb-1.5"
              >
                2. Email Address (For Tracking ID &amp; Quote) *
              </label>
              <input
                id="hero-email"
                type="email"
                required
                maxLength={160}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="founder@company.com"
                className="w-full h-11 px-3.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white text-sm text-[#0C1A38] focus:outline-none focus:ring-2 focus:ring-[#1F65ED]"
              />
            </div>

            {/* Field 3: WhatsApp / Contact Number with Country Code */}
            <div>
              <label
                htmlFor="hero-whatsapp"
                className="block text-xs font-bold uppercase tracking-wider text-[#0C1A38] mb-1.5"
              >
                3. Contact / WhatsApp Number *
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  aria-label="Country dialing code"
                  className="w-32 sm:w-36 h-11 px-2.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs font-medium text-[#0C1A38] focus:outline-none focus:ring-2 focus:ring-[#1F65ED]"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <input
                  id="hero-whatsapp"
                  type="tel"
                  required
                  maxLength={32}
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="50 123 4567"
                  className="flex-1 min-w-0 h-11 px-3.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white text-sm text-[#0C1A38] focus:outline-none focus:ring-2 focus:ring-[#1F65ED]"
                />
              </div>
            </div>

            {/* Field 4: Business Setup Type Dropdown */}
            <div>
              <label
                htmlFor="hero-setup-type"
                className="block text-xs font-bold uppercase tracking-wider text-[#0C1A38] mb-1.5"
              >
                4. Business Setup Type *
              </label>
              <select
                id="hero-setup-type"
                value={setupType}
                onChange={(e) => setSetupType(e.target.value as ExpressSetupType)}
                className="w-full h-11 px-3.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white text-sm font-medium text-[#0C1A38] focus:outline-none focus:ring-2 focus:ring-[#1F65ED]"
              >
                {(Object.keys(setupOptions) as ExpressSetupType[]).map((key) => (
                  <option key={key} value={key}>
                    {setupOptions[key].label}
                  </option>
                ))}
              </select>
            </div>

            {errorMsg && (
              <p
                role="alert"
                className="text-xs font-medium text-[#0C1A38] bg-[#F8FAFC] border border-[#1F65ED] rounded-lg px-3 py-2"
              >
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 px-5 rounded-lg bg-[#1F65ED] hover:bg-[#1750c4] disabled:opacity-60 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Mail className="w-4 h-4 shrink-0" />
              <span>
                {submitting
                  ? 'Submitting & Generating Tracking ID...'
                  : 'Submit & Receive Quote by Email'}
              </span>
            </button>

            <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-[#475569] text-center pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#1F65ED] shrink-0" />
              <span>Instant Email Confirmation · Live Tracking ID · No Spam</span>
            </p>
          </form>
        )}
      </div>

      {/* Safe Branded Email Confirmation Receipt Modal */}
      {showEmailPreview && confirmation && (
        <div
          className="fixed inset-0 z-50 bg-[#0C1A38]/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="email-receipt-title"
        >
          <div className="bg-white border border-[#E2E8F0] rounded-xl max-w-xl w-full overflow-hidden shadow-2xl my-6">
            {/* Modal Bar */}
            <div className="px-5 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between gap-4">
              <span id="email-receipt-title" className="text-xs font-bold text-[#0C1A38]">
                Email Confirmation Preview — To: {confirmation.email}
              </span>
              <button
                type="button"
                onClick={() => setShowEmailPreview(false)}
                className="p-1 text-[#475569] hover:text-[#0C1A38]"
                aria-label="Close email preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Email Header with Website Logo */}
            <div className="px-6 py-4 bg-white border-b-2 border-[#1F65ED] flex items-center justify-between gap-4">
              <img
                src={config.headerLogoUrl}
                alt={config.siteName}
                className="h-12 w-auto object-contain"
              />
              <div className="text-right">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#1F65ED]">
                  VIP Express Desk
                </span>
                <span className="font-mono text-xs font-bold text-[#0C1A38]">
                  {confirmation.trackingCode}
                </span>
              </div>
            </div>

            {/* Email Hero Banner */}
            <div className="px-6 py-5 bg-[#0C1A38] text-white">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#93C5FD]">
                Form Submitted · Application Registered
              </p>
              <h3 className="text-lg font-bold mt-1">
                Your UAE Company Setup Cost Breakdown
              </h3>
              <div className="mt-3 p-3.5 rounded-lg bg-[#13264F] border border-[#1F65ED] flex items-center justify-between gap-3">
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-[#93C5FD]">
                    Live Tracking Reference ID
                  </span>
                  <span className="font-mono text-lg font-bold text-white">
                    {confirmation.trackingCode}
                  </span>
                </div>
                <span className="text-xs font-bold text-[#93C5FD]">01 · Form Submitted</span>
              </div>
            </div>

            {/* Details Table */}
            <div className="p-6 text-xs text-[#1E293B] space-y-3">
              <div className="border border-[#E2E8F0] rounded-lg divide-y divide-[#E2E8F0]">
                <div className="px-4 py-2.5 flex justify-between gap-4 bg-[#F8FAFC]">
                  <span className="text-[#475569]">Applicant</span>
                  <span className="font-bold text-[#0C1A38]">{confirmation.fullName}</span>
                </div>
                <div className="px-4 py-2.5 flex justify-between gap-4">
                  <span className="text-[#475569]">Setup Package</span>
                  <span className="font-bold text-[#1F65ED]">{confirmation.label}</span>
                </div>
                <div className="px-4 py-2.5 flex justify-between gap-4 bg-[#F8FAFC]">
                  <span className="text-[#475569]">Jurisdiction &amp; Visas</span>
                  <span className="font-medium text-[#0C1A38]">
                    {confirmation.jurisdiction} · {confirmation.visaCount}{' '}
                    {confirmation.visaCount === 1 ? 'Visa' : 'Visas'}
                  </span>
                </div>
                <div className="px-4 py-2.5 flex justify-between gap-4">
                  <span className="text-[#475569]">Contact</span>
                  <span className="font-mono text-[#0C1A38]">{confirmation.phone}</span>
                </div>
                <div className="px-4 py-2.5 flex justify-between gap-4 bg-[#F8FAFC]">
                  <span className="text-[#475569]">Estimated Year 1 Total</span>
                  <span className="font-mono font-bold text-[#0C1A38]">
                    AED {confirmation.aed.toLocaleString()} (${confirmation.usd.toLocaleString()} USD)
                  </span>
                </div>
              </div>
            </div>

            {/* Branded Email Footer */}
            <div className="px-6 py-5 bg-[#0C1A38] text-[#CBD5E1] text-xs">
              <img
                src={config.footerLogoUrl}
                alt={config.siteName}
                className="h-12 w-auto object-contain mb-3"
              />
              <p className="font-bold text-white">
                simplybiznest.com — UAE Company Formation &amp; Corporate Banking Desk
              </p>
              <p className="mt-1">
                {config.contactEmail} · https://simplybiznest.com
              </p>
              <p className="mt-2 text-[11px] text-[#94A3B8]">
                Trade licenses and visas are issued by competent UAE authorities. Corporate banking
                approval remains subject to independent bank KYC/AML review.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
