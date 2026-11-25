import { ArrowRight, CheckCircle2, MessageCircle, SearchCheck, Zap } from 'lucide-react';
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

export function HeroExpressForm({
  config,
  selectedSetupType,
  onTrackCode,
}: HeroExpressFormProps) {
  const [fullName, setFullName] = useState('');
  const [countryCode, setCountryCode] = useState('+971');
  const [whatsapp, setWhatsapp] = useState('');
  const [setupType, setSetupType] = useState<ExpressSetupType>(
    selectedSetupType || 'one-visa'
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmation, setConfirmation] = useState<{
    trackingCode: string;
    waUrl: string;
    label: string;
    aed: number;
  } | null>(null);

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
    }
  > = {
    'zero-visa': {
      label: `Zero-Visa Free Zone — AED ${config.zeroVisaPriceAed.toLocaleString()}`,
      shortName: 'Freezone (0-Visa)',
      jurisdiction: 'Free Zone',
      activity: 'Management & Strategy Consultancy',
      visaCount: 0,
      estimatedAed: config.zeroVisaPriceAed,
    },
    'one-visa': {
      label: `1-Visa Resident Free Zone — AED ${config.oneVisaPriceAed.toLocaleString()}`,
      shortName: 'Freezone (1-Visa Resident)',
      jurisdiction: 'Free Zone',
      activity: 'Management & Strategy Consultancy',
      visaCount: 1,
      estimatedAed: config.oneVisaPriceAed,
    },
    mainland: {
      label: `Dubai Mainland DET LLC — AED ${config.mainlandPriceAed.toLocaleString()}`,
      shortName: 'Mainland DET LLC',
      jurisdiction: 'Mainland',
      activity: 'Management & Strategy Consultancy',
      visaCount: 0,
      estimatedAed: config.mainlandPriceAed,
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
    const cleanPhone = whatsapp.trim().replace(/[^0-9+\-\s]/g, '');

    if (cleanName.length < 2) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (cleanPhone.length < 6) {
      setErrorMsg('Please enter a valid WhatsApp number.');
      return;
    }

    setSubmitting(true);
    try {
      const code = await submitFormationLead({
        fullName: cleanName,
        countryCode,
        whatsapp: cleanPhone,
        email: '',
        jurisdiction: activeOpt.jurisdiction,
        activity: activeOpt.activity,
        visaCount: activeOpt.visaCount,
        estimatedAed: activeOpt.estimatedAed,
        estimatedUsd: Math.round(activeOpt.estimatedAed / AED_TO_USD_RATE),
        source: 'google-ads-hero',
      });

      const waDigits = config.whatsappNumber.replace(/[^0-9]/g, '') || '971500000000';
      const prefillText = `Hi SimplyBizNest team, I just requested a quote for ${activeOpt.shortName} setup (AED ${activeOpt.estimatedAed.toLocaleString()} · Ref: ${code}). Name: ${cleanName}`;
      const waUrl = `https://wa.me/${waDigits}?text=${encodeURIComponent(prefillText)}`;

      setConfirmation({
        trackingCode: code,
        waUrl,
        label: activeOpt.shortName,
        aed: activeOpt.estimatedAed,
      });

      // Trigger immediate WhatsApp handoff via safe programmatic anchor click
      try {
        const anchor = document.createElement('a');
        anchor.href = waUrl;
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
      } catch {
        // Fallback link remains rendered inside the confirmation box
      }

      setFullName('');
      setWhatsapp('');
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Unable to lock your quote right now. Please retry.'
      );
    } finally {
      setSubmitting(false);
    }
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
              <div className="flex items-center gap-2 text-[#0C1A38] font-bold text-base">
                <CheckCircle2 className="w-5 h-5 text-[#1F65ED] shrink-0" />
                <span>Express Quote Locked &amp; Ready</span>
              </div>
              <p className="text-xs text-[#475569] mt-1.5">
                {confirmation.label} ·{' '}
                <strong className="font-mono text-[#0C1A38]">
                  AED {confirmation.aed.toLocaleString()}
                </strong>
              </p>
              <div className="mt-3 pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
                <span className="text-xs text-[#475569]">Live Tracking ID</span>
                <span className="font-mono text-base font-bold text-[#0C1A38] tabular-nums">
                  {confirmation.trackingCode}
                </span>
              </div>
            </div>

            <a
              href={confirmation.waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-5 rounded-lg bg-[#1F65ED] hover:bg-[#1750c4] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>Open Quote in WhatsApp Now</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </a>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              {onTrackCode && (
                <button
                  type="button"
                  onClick={() => onTrackCode(confirmation.trackingCode)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0C1A38] hover:text-[#1F65ED]"
                >
                  <SearchCheck className="w-3.5 h-3.5 text-[#1F65ED]" />
                  <span>View in Live Tracker</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setConfirmation(null)}
                className="text-xs font-medium text-[#475569] hover:text-[#0C1A38]"
              >
                Request Another Quote
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
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

            {/* Field 2: WhatsApp Number with Country Code */}
            <div>
              <label
                htmlFor="hero-whatsapp"
                className="block text-xs font-bold uppercase tracking-wider text-[#0C1A38] mb-1.5"
              >
                2. WhatsApp Number *
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

            {/* Field 3: Business Setup Type Dropdown */}
            <div>
              <label
                htmlFor="hero-setup-type"
                className="block text-xs font-bold uppercase tracking-wider text-[#0C1A38] mb-1.5"
              >
                3. Business Setup Type *
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
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>
                {submitting
                  ? 'Sending & Locking Quote...'
                  : 'Get Instant Cost Quote on WhatsApp'}
              </span>
            </button>

            <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-[#475569] text-center pt-1">
              <Zap className="w-3.5 h-3.5 text-[#1F65ED] shrink-0" />
              <span>2-Minute Response · 100% Free Consultation · No Spam</span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
