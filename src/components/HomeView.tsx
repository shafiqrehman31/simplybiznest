import {
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  FileCheck2,
  FileDown,
  IdCard,
  Landmark,
  MessageCircle,
  ShieldAlert,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import {
  BANKING_PARTNERS,
  DEFAULT_FAQS,
  FREE_ZONE_COMPARISON_LIST,
} from '../data/defaults';
import { downloadBookletPdf } from '../lib/downloadPdf';
import { BlogPost, Jurisdiction, SiteConfig } from '../types';
import { CostCalculatorCard } from './CostCalculatorCard';
import { ExpressSetupType, HeroExpressForm } from './HeroExpressForm';
import { LiveTrackerSection } from './LiveTrackerSection';

interface HomeViewProps {
  config: SiteConfig;
  blogPosts: BlogPost[];
  externalTrackerCode?: string | null;
  onNavigate: (slug: string) => void;
  onSelectPost: (post: BlogPost) => void;
}

export function HomeView({
  config,
  blogPosts,
  externalTrackerCode,
  onNavigate,
  onSelectPost,
}: HomeViewProps) {
  const [selectedSetupType, setSelectedSetupType] = useState<ExpressSetupType>('one-visa');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<Jurisdiction>('Free Zone');
  const [selectedVisas, setSelectedVisas] = useState<number>(1);
  const [showCustomCalc, setShowCustomCalc] = useState(false);
  const [trackerCode, setTrackerCode] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Pre-footer 1-field PDF capture state
  const [pdfContact, setPdfContact] = useState('');
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfSuccess, setPdfSuccess] = useState(false);

  const activeTrackerCode = trackerCode || externalTrackerCode || null;

  const pdfHref = `/api/booklet.pdf?zeroVisa=${config.zeroVisaPriceAed}&oneVisa=${config.oneVisaPriceAed}&mainland=${config.mainlandPriceAed}`;

  const handleSelectPackage = (
    setupType: ExpressSetupType,
    jurisdiction: Jurisdiction,
    visas: number
  ) => {
    setSelectedSetupType(setupType);
    setSelectedJurisdiction(jurisdiction);
    setSelectedVisas(visas);
    document.getElementById('hero-express-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTrackFromLead = (code: string) => {
    setTrackerCode(code);
    document.getElementById('tracker')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePreFooterPdfSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (pdfDownloading) return;

    const clean = pdfContact.trim();
    const looksValid =
      clean.length >= 6 &&
      (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean) || /^[+0-9\-\s()]{6,25}$/.test(clean));

    if (!looksValid) {
      setPdfError('Enter a valid email address or WhatsApp number to unlock the 2026 PDF guide.');
      return;
    }

    setPdfError(null);
    setPdfSuccess(false);
    setPdfDownloading(true);
    try {
      await downloadBookletPdf(pdfHref);
      setPdfSuccess(true);
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : 'Unable to download PDF guide.');
    } finally {
      setPdfDownloading(false);
    }
  };

  const zeroServiceFee = 1500;
  const zeroGovtFee = Math.max(0, config.zeroVisaPriceAed - zeroServiceFee);

  const oneServiceFee = 2000;
  const oneGovtFee = Math.max(0, config.oneVisaPriceAed - oneServiceFee);

  const mainlandServiceFee = 2300;
  const mainlandGovtFee = Math.max(0, config.mainlandPriceAed - mainlandServiceFee);

  const pricingPackages = [
    {
      setupType: 'zero-visa' as ExpressSetupType,
      jurisdiction: 'Free Zone' as Jurisdiction,
      visas: 0,
      name: '0-Visa Free Zone',
      audience: 'Remote founders, digital consultancies & SaaS operators',
      totalAed: config.zeroVisaPriceAed,
      govtFeeAed: zeroGovtFee,
      serviceFeeAed: zeroServiceFee,
      year2RenewalAed: 5750,
      features: [
        '100% foreign-owned UAE Trade License & MOA',
        'Compliant Flexi Desk lease & Certificate of Incumbency',
        '100% remote incorporation—zero Dubai travel required',
        'Pre-vetted corporate banking KYC dossier preparation',
      ],
    },
    {
      setupType: 'one-visa' as ExpressSetupType,
      jurisdiction: 'Free Zone' as Jurisdiction,
      visas: 1,
      featured: true,
      name: '1-Visa Resident Free Zone',
      audience: 'Founders relocating or securing 2-year UAE residency',
      totalAed: config.oneVisaPriceAed,
      govtFeeAed: oneGovtFee,
      serviceFeeAed: oneServiceFee,
      year2RenewalAed: 9900,
      features: [
        'Everything in 0-Visa Free Zone Express package',
        'Corporate Establishment Card & immigration file',
        '1 UAE Investor Residency Visa & entry permit',
        'Scheduled Dubai Medical & Emirates ID biometric slot',
      ],
    },
    {
      setupType: 'mainland' as ExpressSetupType,
      jurisdiction: 'Mainland' as Jurisdiction,
      visas: 0,
      name: 'Dubai Mainland DET LLC',
      audience: 'Onshore UAE trade, retail, B2B & government tenders',
      totalAed: config.mainlandPriceAed,
      govtFeeAed: mainlandGovtFee,
      serviceFeeAed: mainlandServiceFee,
      year2RenewalAed: 10400,
      features: [
        'Dubai Department of Economy & Tourism (DET) E-License',
        'Trade Name reservation & notarized digital MOA',
        'Unrestricted onshore UAE & GCC commercial invoicing',
        'RAKBANK / Mashreq Mainland banking KYC coordination',
      ],
    },
  ];

  const expressJourneySteps = [
    {
      step: '01',
      title: 'Instant WhatsApp Scope',
      description: 'Lock your jurisdiction and itemized AED fee sheet in under 2 minutes.',
      icon: MessageCircle,
    },
    {
      step: '02',
      title: 'Digital KYC & Filing',
      description: 'Submit passport copies online for trade name reservation and authority clearance.',
      icon: FileCheck2,
    },
    {
      step: '03',
      title: '48-Hour E-License Issuance',
      description: 'Receive official Trade License, MOA, and corporate documents digitally.',
      icon: Building2,
    },
    {
      step: '04',
      title: 'Emirates ID & Bank Desk',
      description: 'Complete biometrics in Dubai and lodge your audited bank KYC application.',
      icon: IdCard,
    },
  ];

  const visiblePosts = blogPosts.filter((p) => p.visible).slice(0, 3);

  return (
    <div>
      {/* 1ST BLOCK: HERO SECTION (Midnight Navy #0C1A38 + Royal Blue #1F65ED + 3-Field Frictionless Form, NO PDF button) */}
      <section className="relative overflow-hidden bg-[#0C1A38] text-white">
        {/* Transparent Dubai Skyline Background Layer */}
        <img
          src="/src/assets/images/hero_dubai_skyline_1795435479209.jpg"
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          className="pointer-events-none select-none absolute inset-0 w-full h-full object-cover object-center opacity-20"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0C1A38]/90 via-[#0C1A38]/75 to-[#0C1A38]/95"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 22%, rgba(31, 101, 237, 0.36), transparent 46%), radial-gradient(circle at 86% 80%, rgba(31, 101, 237, 0.24), transparent 42%)',
          }}
        />
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 w-full h-full opacity-[0.06]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="arch-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#FFFFFF" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#arch-grid)" />
        </svg>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            {/* Left High-Intent Value Column */}
            <div className="lg:col-span-6 flex flex-col justify-between">
              <div>
                <p className="text-xs sm:text-sm font-bold text-[#93C5FD] tracking-wide uppercase">
                  {config.promoNotice || 'VIP Express Desk · Transparent Authority vs. Service Fee Split'}
                </p>

                <h1
                  className="mt-4 font-black tracking-tight text-white leading-[1.08]"
                  style={{ fontSize: 'clamp(2.2rem, 4vw, 3.3rem)' }}
                >
                  {config.heroHeadline}
                </h1>

                <p className="mt-5 text-base sm:text-lg text-[#CBD5E1] leading-relaxed max-w-xl">
                  {config.heroSubheadline}
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-3.5">
                  <button
                    type="button"
                    onClick={() =>
                      document
                        .getElementById('pricing-breakdown')
                        ?.scrollIntoView({ behavior: 'smooth' })
                    }
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-lg border border-white/25 bg-white/10 hover:bg-white/15 text-white font-bold text-sm whitespace-nowrap transition-colors"
                  >
                    <span>Inspect Govt vs. Service Fee Table</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      document.getElementById('tracker')?.scrollIntoView({ behavior: 'smooth' })
                    }
                    className="inline-flex items-center gap-2 px-4 py-3.5 rounded-lg text-[#CBD5E1] hover:text-white font-medium text-sm whitespace-nowrap transition-colors"
                  >
                    <span>Track Live Application</span>
                  </button>
                </div>
              </div>

              {/* Structured Horizontal Metric Strip */}
              <ul className="mt-10 pt-7 border-t border-white/15 grid grid-cols-3 gap-4 sm:gap-6">
                <li>
                  <span className="block font-mono text-lg sm:text-2xl font-bold text-white tabular-nums">
                    AED {config.zeroVisaPriceAed.toLocaleString()}
                  </span>
                  <span className="block text-xs text-[#CBD5E1] mt-1">
                    0-Visa Free Zone Entry
                  </span>
                </li>
                <li>
                  <span className="block font-mono text-lg sm:text-2xl font-bold text-white tabular-nums">
                    48 Hours
                  </span>
                  <span className="block text-xs text-[#CBD5E1] mt-1">
                    Express E-License Target
                  </span>
                </li>
                <li>
                  <span className="block font-mono text-lg sm:text-2xl font-bold text-white tabular-nums">
                    0% Hidden
                  </span>
                  <span className="block text-xs text-[#CBD5E1] mt-1">
                    Year 2 Renewal Clarity
                  </span>
                </li>
              </ul>
            </div>

            {/* Right Frictionless 3-Field Lead Capture Form */}
            <div className="lg:col-span-6 flex">
              <div className="w-full">
                <HeroExpressForm
                  config={config}
                  selectedSetupType={selectedSetupType}
                  onTrackCode={handleTrackFromLead}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2ND BLOCK: PROCESS SECTION — "The 4-Step Express Setup Journey" (NO PDF button) */}
      <section id="express-journey" className="py-16 sm:py-20 bg-[#F8FAFC] border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-[#E2E8F0]">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#1F65ED]">
                VIP Express Desk Execution
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0C1A38] mt-1.5">
                The 4-Step Express Setup Journey
              </h2>
            </div>
            <p className="text-sm text-[#475569] max-w-md">
              Built for speed without cutting regulatory corners—track every stage from initial
              WhatsApp quote to Emirates ID and corporate banking.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {expressJourneySteps.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="bg-white border border-[#E2E8F0] rounded-xl p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="w-10 h-10 rounded-lg bg-[#0C1A38] text-white flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-[#93C5FD]" />
                      </span>
                      <span className="font-mono text-sm font-bold text-[#1F65ED] tabular-nums">
                        STEP {item.step}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-[#0C1A38] mt-5">{item.title}</h3>
                    <p className="mt-2 text-sm text-[#475569] leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3RD BLOCK: ITEMIZED PRICING TABLE & FEE BREAKDOWN (NO PDF button) */}
      <section id="pricing-breakdown" className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-[#E2E8F0]">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#1F65ED]">
                Zero-Hidden-Markup Pricing
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0C1A38] mt-1.5">
                Authority Fees vs. SimplyBizNest Service Charge
              </h2>
            </div>
            <p className="text-sm text-[#475569] max-w-md">
              We itemize every dirham paid directly to UAE authorities alongside our flat Express
              Desk fee—plus exact Year 2 renewal costs.
            </p>
          </div>

          {/* Itemized Fee Comparison Table */}
          <div className="mt-8 bg-white border border-[#E2E8F0] rounded-xl overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#0C1A38] text-white text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-5">Formation Tier</th>
                  <th className="py-4 px-5 text-right">UAE Govt / Authority Fee</th>
                  <th className="py-4 px-5 text-right">SimplyBizNest Service Fee</th>
                  <th className="py-4 px-5 text-right">All-In Year 1 Total</th>
                  <th className="py-4 px-5 text-right">Year 2 Renewal Cap</th>
                  <th className="py-4 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {pricingPackages.map((pkg) => (
                  <tr
                    key={pkg.name}
                    className={pkg.featured ? 'bg-[#F8FAFC]' : 'bg-white hover:bg-[#F8FAFC]/70'}
                  >
                    <td className="py-4 px-5">
                      <span className="font-bold text-[#0C1A38] block">{pkg.name}</span>
                      <span className="text-xs text-[#475569]">{pkg.audience}</span>
                    </td>
                    <td className="py-4 px-5 text-right font-mono font-medium text-[#1E293B] tabular-nums whitespace-nowrap">
                      AED {pkg.govtFeeAed.toLocaleString()}
                    </td>
                    <td className="py-4 px-5 text-right font-mono font-medium text-[#1E293B] tabular-nums whitespace-nowrap">
                      AED {pkg.serviceFeeAed.toLocaleString()}
                    </td>
                    <td className="py-4 px-5 text-right font-mono font-bold text-[#1F65ED] text-base tabular-nums whitespace-nowrap">
                      AED {pkg.totalAed.toLocaleString()}
                    </td>
                    <td className="py-4 px-5 text-right font-mono text-xs font-bold text-[#0C1A38] tabular-nums whitespace-nowrap">
                      AED {pkg.year2RenewalAed.toLocaleString()} / yr
                    </td>
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() =>
                          handleSelectPackage(pkg.setupType, pkg.jurisdiction, pkg.visas)
                        }
                        className="px-3.5 py-2 rounded-lg bg-[#1F65ED] hover:bg-[#1750c4] text-white text-xs font-bold transition-colors"
                      >
                        Select &amp; Quote
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detailed 3-Column Package Cards */}
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {pricingPackages.map((pkg) => (
              <div
                key={pkg.name}
                className={`rounded-xl p-6 sm:p-7 flex flex-col justify-between border ${
                  pkg.featured
                    ? 'bg-[#F8FAFC] border-[#1F65ED] shadow-sm'
                    : 'bg-white border-[#E2E8F0]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1F65ED]">
                      {pkg.jurisdiction}
                    </span>
                    {pkg.featured && (
                      <span className="text-xs font-bold text-[#0C1A38]">Most Selected</span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-[#0C1A38] mt-2">{pkg.name}</h3>
                  <p className="text-xs text-[#475569] mt-1">{pkg.audience}</p>

                  <div className="mt-5 pb-4 border-b border-[#E2E8F0]">
                    <span className="font-mono text-3xl font-bold text-[#0C1A38] tabular-nums">
                      AED {pkg.totalAed.toLocaleString()}
                    </span>
                    <div className="mt-2 flex items-center justify-between text-xs font-mono text-[#475569] tabular-nums">
                      <span>Govt: AED {pkg.govtFeeAed.toLocaleString()}</span>
                      <span>·</span>
                      <span>Service: AED {pkg.serviceFeeAed.toLocaleString()}</span>
                    </div>
                  </div>

                  <ul className="mt-4 divide-y divide-[#E2E8F0]">
                    {pkg.features.map((feat) => (
                      <li key={feat} className="py-3 flex items-start gap-3 text-sm text-[#1E293B]">
                        <span className="mt-0.5 w-5 h-5 rounded-md bg-[#1F65ED] text-white flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleSelectPackage(pkg.setupType, pkg.jurisdiction, pkg.visas)
                  }
                  className={`mt-6 w-full py-3 px-4 rounded-lg text-sm font-bold transition-colors ${
                    pkg.featured
                      ? 'bg-[#1F65ED] hover:bg-[#1750c4] text-white'
                      : 'bg-[#0C1A38] hover:bg-[#1F65ED] text-white'
                  }`}
                >
                  Lock This Rate on WhatsApp
                </button>
              </div>
            ))}
          </div>

          {/* Optional Custom Multi-Visa Calculator Toggle */}
          <div className="mt-8 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[#0C1A38]">
                  Need 2 to 10 Visas or Specialized Activity Licensing?
                </h3>
                <p className="text-xs sm:text-sm text-[#475569] mt-0.5">
                  Configure exact activity codes, visa counts, and USD conversions interactively.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomCalc((prev) => !prev)}
                className="px-4 py-2.5 rounded-lg border border-[#0C1A38] text-[#0C1A38] hover:bg-[#0C1A38] hover:text-white text-xs sm:text-sm font-bold whitespace-nowrap transition-colors"
              >
                {showCustomCalc ? 'Hide Multi-Visa Calculator' : 'Open Multi-Visa Cost Calculator'}
              </button>
            </div>
            {showCustomCalc && (
              <div className="mt-6">
                <CostCalculatorCard
                  config={config}
                  initialJurisdiction={selectedJurisdiction}
                  initialVisaCount={selectedVisas}
                  onTrackCode={handleTrackFromLead}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4TH BLOCK: TRUST, BANKING COORDINATION, LIVE TRACKER & CONVERSION FAQS */}
      <section id="banking-trust" className="py-16 sm:py-20 bg-[#F8FAFC] border-t border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Banking Coordination + Honest Compliance Disclaimer */}
          <div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#1F65ED]">
                  Corporate Banking Coordination
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#0C1A38] mt-1.5">
                  Realistic UAE Banking Readiness &amp; KYC Coordination
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('banking')}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1F65ED] hover:text-[#0C1A38]"
              >
                <span>View Full KYC Checklist</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-6 bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#0C1A38] text-white flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 text-[#93C5FD]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0C1A38]">
                  Independent Bank Compliance Notice (No False Guarantees)
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-[#475569] leading-relaxed">
                  Unlike agencies claiming &ldquo;100% guaranteed bank accounts,&rdquo; SimplyBizNest
                  provides full pre-KYC compliance file preparation and direct banker introductions.
                  Final corporate IBAN approval always rests exclusively with the regulated UAE
                  bank under Central Bank of the UAE (CBUAE) AML/KYC rules.
                </p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {BANKING_PARTNERS.map((bank) => (
                <div
                  key={bank.name}
                  className="bg-white border border-[#E2E8F0] rounded-xl p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="text-xs text-[#475569] flex items-center gap-2">
                      <span className="font-bold text-[#1F65ED]">{bank.category}</span>
                    </div>
                    <h3 className="text-lg font-bold text-[#0C1A38] mt-1.5">{bank.name}</h3>
                    <p className="font-mono text-xs text-[#475569] mt-1 tabular-nums">
                      {bank.timeline} · {bank.minBalance}
                    </p>

                    <ul className="mt-4 divide-y divide-[#E2E8F0]">
                      {bank.criteria.map((c) => (
                        <li key={c} className="py-2.5 flex items-start gap-2.5 text-xs text-[#1E293B]">
                          <span className="mt-0.5 w-4 h-4 rounded bg-[#1F65ED] text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" />
                          </span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Free Zone Benchmarks Matrix */}
          <div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#1F65ED]">
                  Multi-Authority Benchmarks
                </p>
                <h2 className="text-2xl font-bold text-[#0C1A38] mt-1.5">
                  Compare UAE Free Zone Jurisdictions
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('free-zones')}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1F65ED] hover:text-[#0C1A38]"
              >
                <span>Compare All Free Zones</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {FREE_ZONE_COMPARISON_LIST.map((fz) => (
                <div key={fz.zone} className="bg-white border border-[#E2E8F0] rounded-xl p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0]">
                    <div>
                      <h3 className="text-base font-bold text-[#0C1A38]">{fz.zone}</h3>
                      <p className="text-xs text-[#475569] mt-0.5">{fz.badge}</p>
                    </div>
                    <div className="text-right font-mono text-xs tabular-nums">
                      <span className="block font-bold text-[#0C1A38]">
                        0-Visa: AED {fz.zeroVisaAed.toLocaleString()}
                      </span>
                      <span className="block text-[#1F65ED] mt-0.5">
                        1-Visa: AED {fz.oneVisaAed.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {fz.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2.5 text-xs text-[#475569]">
                        <span className="mt-0.5 w-4 h-4 rounded bg-[#1F65ED]/15 text-[#1F65ED] flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3" />
                        </span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* LIVE APPLICATION TRACKER */}
      <LiveTrackerSection externalCode={activeTrackerCode} />

      {/* REGULATORY BRIEFINGS & 5 CONVERSION FAQS */}
      <section className="py-16 sm:py-20 bg-[#F8FAFC] border-t border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Regulatory Guides Preview */}
          <div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#1F65ED]">
                  Editorial Briefings
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#0C1A38] mt-1.5">
                  Regulatory Guides &amp; Tax Insights
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('guides')}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1F65ED] hover:text-[#0C1A38]"
              >
                <span>Browse All Briefings</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {visiblePosts.map((post) => (
                <article
                  key={post.id}
                  className="bg-white border border-[#E2E8F0] rounded-xl p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="text-xs text-[#475569] flex items-center gap-2">
                      <span className="font-bold text-[#1F65ED]">{post.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{post.readTime}</span>
                    </div>
                    <h3 className="text-lg font-bold text-[#0C1A38] mt-2 leading-snug">
                      {post.title}
                    </h3>
                    <p className="mt-2.5 text-sm text-[#475569] leading-relaxed">{post.excerpt}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectPost(post)}
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[#1F65ED] hover:text-[#0C1A38]"
                  >
                    <span>Read Regulatory Guide</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </article>
              ))}
            </div>
          </div>

          {/* 5 Conversion FAQs */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-10">
            <p className="text-xs font-bold uppercase tracking-wider text-[#1F65ED]">
              VIP Express Desk Questions
            </p>
            <h2 className="text-2xl font-bold text-[#0C1A38] mt-1.5">
              Frequently Asked Questions
            </h2>

            <ul className="mt-6 divide-y divide-[#E2E8F0]">
              {DEFAULT_FAQS.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <li key={faq.q} className="py-4">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between gap-4 text-left"
                      aria-expanded={isOpen}
                    >
                      <span className="text-sm sm:text-base font-bold text-[#0C1A38]">
                        {faq.q}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-[#1F65ED] shrink-0 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <p className="mt-3 text-sm text-[#475569] leading-relaxed pr-8">{faq.a}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* 5TH BLOCK (STRICT PRE-FOOTER PLACEMENT): DOWNLOAD COMPLETE 2026 UAE BUSINESS SETUP GUIDE (PDF) */}
      <section
        id="pre-footer-pdf"
        className="py-14 sm:py-16 bg-white border-t border-[#E2E8F0]"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#F8FAFC] border border-[#1F65ED]/30 rounded-2xl p-7 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="lg:max-w-lg">
              <p className="text-xs font-bold uppercase tracking-wider text-[#1F65ED] inline-flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5" />
                <span>Free 10-Page Resource</span>
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0C1A38] mt-1.5">
                Download Complete 2026 UAE Business Setup Guide (PDF)
              </h2>
              <p className="mt-2.5 text-sm text-[#475569] leading-relaxed">
                Still comparing Free Zone vs. Dubai Mainland costs? Enter your Email or WhatsApp
                below to download our itemized 2026 fee schedules, corporate tax briefing, and
                banking KYC checklist.
              </p>
            </div>

            <div className="w-full lg:max-w-md">
              <form onSubmit={handlePreFooterPdfSubmit} className="space-y-3">
                <label htmlFor="pre-footer-pdf-contact" className="sr-only">
                  Email or WhatsApp Number
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    id="pre-footer-pdf-contact"
                    type="text"
                    required
                    value={pdfContact}
                    onChange={(e) => setPdfContact(e.target.value)}
                    placeholder="Enter Email or WhatsApp (+971...)"
                    className="flex-1 h-12 px-4 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0C1A38] focus:outline-none focus:ring-2 focus:ring-[#1F65ED]"
                  />
                  <button
                    type="submit"
                    disabled={pdfDownloading}
                    className="h-12 px-5 rounded-lg bg-[#1F65ED] hover:bg-[#1750c4] disabled:opacity-60 text-white font-bold text-sm inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 transition-colors"
                  >
                    <FileDown className="w-4 h-4 shrink-0" />
                    <span>{pdfDownloading ? 'Downloading...' : 'Download Free PDF'}</span>
                  </button>
                </div>
                {pdfError && (
                  <p className="text-xs font-medium text-[#0C1A38]" role="alert">
                    {pdfError}
                  </p>
                )}
                {pdfSuccess && (
                  <p className="text-xs font-bold text-[#1F65ED]">
                    Your 2026 UAE Business Setup Guide (PDF) download has started.
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
