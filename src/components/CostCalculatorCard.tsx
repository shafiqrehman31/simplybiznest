import { ArrowRight, Check, Copy, SearchCheck, ShieldCheck } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { submitFormationLead } from '../lib/firestoreService';
import {
  BUSINESS_ACTIVITIES,
  calculateSetupCost,
  COUNTRY_CODES,
  detectCountryCodeByTimezone,
} from '../lib/pricing';
import { Jurisdiction, SiteConfig } from '../types';

interface CostCalculatorCardProps {
  config: SiteConfig;
  initialJurisdiction?: Jurisdiction;
  initialVisaCount?: number;
  onTrackCode?: (code: string) => void;
}

export function CostCalculatorCard({
  config,
  initialJurisdiction,
  initialVisaCount,
  onTrackCode,
}: CostCalculatorCardProps) {
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction>(initialJurisdiction || 'Free Zone');
  const [activity, setActivity] = useState<string>(BUSINESS_ACTIVITIES[0].label);
  const [visaCount, setVisaCount] = useState<number>(initialVisaCount ?? 1);

  const [showLeadModal, setShowLeadModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [countryCode, setCountryCode] = useState('+971');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCountryCode(detectCountryCodeByTimezone());
  }, []);

  useEffect(() => {
    if (initialJurisdiction) setJurisdiction(initialJurisdiction);
  }, [initialJurisdiction]);

  useEffect(() => {
    if (typeof initialVisaCount === 'number') setVisaCount(initialVisaCount);
  }, [initialVisaCount]);

  const breakdown = calculateSetupCost(jurisdiction, activity, visaCount, config);

  const handleSubmitLead = async (e: FormEvent) => {
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
        email: email.trim(),
        jurisdiction,
        activity,
        visaCount,
        estimatedAed: breakdown.totalAed,
        estimatedUsd: breakdown.totalUsd,
        source: 'calculator',
      });
      setCreatedCode(code);
      setShowLeadModal(false);
      setFullName('');
      setWhatsapp('');
      setEmail('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not save your quote. Please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (!createdCode) return;
    navigator.clipboard?.writeText(createdCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="cost-calculator"
      className="bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-7 text-[#1E293B] shadow-xl shadow-[#0C1A38]/25 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#1F65ED]">
              Instant Setup Cost Calculator
            </p>
            <h2 className="text-xl font-bold text-[#0C1A38] mt-0.5">
              2026 UAE Formation Estimate
            </h2>
          </div>
          <div className="text-right">
            <span className="block text-xs text-[#475569]">Rate Reference</span>
            <span className="font-mono text-xs font-medium text-[#0C1A38] tabular-nums">
              1 USD = 3.6725 AED
            </span>
          </div>
        </div>

        {/* Jurisdiction Segmented Toggle */}
        <div className="mt-5">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-2">
            1. Select Jurisdiction
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
            {(['Free Zone', 'Mainland'] as Jurisdiction[]).map((j) => (
              <button
                key={j}
                type="button"
                onClick={() => setJurisdiction(j)}
                className={`py-2 px-3 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  jurisdiction === j
                    ? 'bg-[#0C1A38] text-white shadow-sm'
                    : 'text-[#475569] hover:text-[#0C1A38]'
                }`}
              >
                {j === 'Free Zone' ? 'UAE Free Zone' : 'Dubai Mainland DET'}
              </button>
            ))}
          </div>
        </div>

        {/* Business Activity Selector */}
        <div className="mt-4">
          <label
            htmlFor="calc-activity"
            className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-2"
          >
            2. Business Activity
          </label>
          <select
            id="calc-activity"
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            className="w-full h-11 px-3 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0C1A38] font-medium focus:outline-none focus:ring-2 focus:ring-[#1F65ED]"
          >
            {BUSINESS_ACTIVITIES.map((item) => (
              <option key={item.label} value={item.label}>
                {item.label} ({item.codeHint})
              </option>
            ))}
          </select>
        </div>

        {/* Visa Count Selector */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="calc-visas"
              className="text-xs font-bold uppercase tracking-wider text-[#475569]"
            >
              3. UAE Residence Visas
            </label>
            <span className="font-mono text-sm font-bold text-[#1F65ED] tabular-nums">
              {visaCount} {visaCount === 1 ? 'Visa' : 'Visas'}
            </span>
          </div>
          <input
            id="calc-visas"
            type="range"
            min={0}
            max={10}
            step={1}
            value={visaCount}
            onChange={(e) => setVisaCount(Number(e.target.value))}
            className="w-full accent-[#1F65ED] cursor-pointer"
          />
          <div className="flex justify-between text-[11px] font-mono text-[#475569] mt-1 tabular-nums">
            {[0, 2, 4, 6, 8, 10].map((mark) => (
              <button
                key={mark}
                type="button"
                onClick={() => setVisaCount(mark)}
                className={`px-1 rounded hover:text-[#1F65ED] ${
                  visaCount === mark ? 'font-bold text-[#0C1A38]' : ''
                }`}
              >
                {mark}
              </button>
            ))}
          </div>
        </div>

        {/* Itemized Breakdown List */}
        <div className="mt-5 pt-4 border-t border-[#E2E8F0]">
          <ul className="divide-y divide-[#E2E8F0] text-sm">
            <li className="py-2 flex items-center justify-between">
              <span className="text-[#475569]">Trade License & Registration</span>
              <span className="font-mono font-medium text-[#0C1A38] tabular-nums">
                AED {breakdown.licenseFeeAed.toLocaleString()}
              </span>
            </li>
            <li className="py-2 flex items-center justify-between">
              <span className="text-[#475569]">Establishment Card & File</span>
              <span className="font-mono font-medium text-[#0C1A38] tabular-nums">
                AED {breakdown.establishmentCardAed.toLocaleString()}
              </span>
            </li>
            <li className="py-2 flex items-center justify-between">
              <span className="text-[#475569]">Visa Allocation & Entry Permit</span>
              <span className="font-mono font-medium text-[#0C1A38] tabular-nums">
                AED {breakdown.visaAllocationAed.toLocaleString()}
              </span>
            </li>
            <li className="py-2 flex items-center justify-between">
              <span className="text-[#475569]">Emirates ID & Medical Screening</span>
              <span className="font-mono font-medium text-[#0C1A38] tabular-nums">
                AED {breakdown.emiratesIdMedicalAed.toLocaleString()}
              </span>
            </li>
            <li className="py-2 flex items-center justify-between">
              <span className="text-[#475569]">Corporate Banking KYC Desk</span>
              <span className="font-mono font-semibold text-[#1F65ED] tabular-nums">
                Included
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Total & Action */}
      <div className="mt-4 pt-4 border-t-2 border-[#0C1A38]/10">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-[#475569]">
              Estimated Turnkey Total
            </span>
            <span className="font-mono text-2xl sm:text-3xl font-bold text-[#0C1A38] tabular-nums">
              AED {breakdown.totalAed.toLocaleString()}
            </span>
          </div>
          <div className="text-right">
            <span className="block text-xs text-[#475569]">USD Equivalent</span>
            <span className="font-mono text-base font-bold text-[#1F65ED] tabular-nums">
              ${breakdown.totalUsd.toLocaleString()} USD
            </span>
          </div>
        </div>

        {createdCode ? (
          <div className="bg-[#F8FAFC] border border-[#1F65ED]/30 rounded-lg p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[#0C1A38] font-bold text-sm">
                <ShieldCheck className="w-4 h-4 text-[#1F65ED]" />
                <span>Quote Locked Successfully</span>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#1F65ED] hover:underline"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy ID'}</span>
              </button>
            </div>
            <p className="font-mono text-lg font-bold text-[#0C1A38] mt-1 tabular-nums">
              {createdCode}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {onTrackCode && (
                <button
                  type="button"
                  onClick={() => onTrackCode(createdCode)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0C1A38] text-white text-xs font-medium hover:bg-[#1F65ED] transition-colors"
                >
                  <SearchCheck className="w-3.5 h-3.5" />
                  <span>Open in Live Tracker</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setCreatedCode(null)}
                className="px-3 py-1.5 rounded-md border border-[#E2E8F0] bg-white text-xs font-medium text-[#475569] hover:text-[#0C1A38]"
              >
                New Estimate
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowLeadModal(true)}
            className="w-full py-3.5 px-5 rounded-lg bg-[#1F65ED] hover:bg-[#1d4ec4] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <span>Lock Quote & Get Tracking Code</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Lead Submission Modal */}
      {showLeadModal && (
        <div
          className="fixed inset-0 z-50 bg-[#0C1A38]/70 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lead-modal-title"
        >
          <div className="bg-white border border-[#E2E8F0] rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#1F65ED]">
                  Lock Your Formation Quote
                </p>
                <h3 id="lead-modal-title" className="text-lg font-bold text-[#0C1A38] mt-0.5">
                  Receive Your SBN Tracking Reference
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLeadModal(false)}
                className="text-sm font-medium text-[#475569] hover:text-[#0C1A38] px-2 py-1"
              >
                Close
              </button>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-xs">
              <span className="text-[#475569] font-medium">
                {jurisdiction} · {visaCount} {visaCount === 1 ? 'Visa' : 'Visas'}
              </span>
              <span className="font-mono font-bold text-[#0C1A38] tabular-nums">
                AED {breakdown.totalAed.toLocaleString()} (${breakdown.totalUsd.toLocaleString()})
              </span>
            </div>

            <form onSubmit={handleSubmitLead} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#0C1A38] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Tariq Al Mansoor"
                  className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-sm text-[#0C1A38] focus:outline-none focus:ring-2 focus:ring-[#1F65ED]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0C1A38] mb-1">
                  WhatsApp Number *
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    aria-label="Country dialing code"
                    className="w-36 h-10 px-2 rounded-lg border border-[#E2E8F0] bg-white text-xs font-medium text-[#0C1A38] focus:outline-none focus:ring-2 focus:ring-[#1F65ED]"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    required
                    maxLength={32}
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="50 123 4567"
                    className="flex-1 h-10 px-3 rounded-lg border border-[#E2E8F0] text-sm text-[#0C1A38] focus:outline-none focus:ring-2 focus:ring-[#1F65ED]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0C1A38] mb-1">
                  Work Email (Optional)
                </label>
                <input
                  type="email"
                  maxLength={160}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="founder@company.com"
                  className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-sm text-[#0C1A38] focus:outline-none focus:ring-2 focus:ring-[#1F65ED]"
                />
              </div>

              {errorMsg && (
                <p className="text-xs font-medium text-[#0C1A38] bg-[#F8FAFC] border border-[#1F65ED] rounded-md px-3 py-2">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-lg bg-[#1F65ED] hover:bg-[#1e50c4] disabled:opacity-60 text-white font-bold text-sm transition-colors"
              >
                {submitting ? 'Generating SBN Reference...' : 'Confirm & Generate Tracking Code'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
