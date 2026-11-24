import { ArrowRight, Check, ChevronDown, FileDown } from 'lucide-react';
import { useState } from 'react';
import {
  BANKING_PARTNERS,
  DEFAULT_FAQS,
  FREE_ZONE_COMPARISON_LIST,
  VISA_PERMIT_RATE_SCHEDULE,
  WORKSPACE_RATE_SCHEDULE,
} from '../data/defaults';
import { downloadBookletPdf } from '../lib/downloadPdf';
import { BlogPost, Jurisdiction, SiteConfig } from '../types';
import { CostCalculatorCard } from './CostCalculatorCard';
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
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<Jurisdiction>('Free Zone');
  const [selectedVisas, setSelectedVisas] = useState<number>(1);
  const [trackerCode, setTrackerCode] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const activeTrackerCode = trackerCode || externalTrackerCode || null;

  const pdfHref = `/api/booklet.pdf?zeroVisa=${config.zeroVisaPriceAed}&oneVisa=${config.oneVisaPriceAed}&mainland=${config.mainlandPriceAed}`;

  const handleDownloadPdf = async () => {
    if (pdfDownloading) return;
    setPdfError(null);
    setPdfDownloading(true);
    try {
      await downloadBookletPdf(pdfHref);
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : 'Unable to download PDF booklet.');
    } finally {
      setPdfDownloading(false);
    }
  };

  const handleSelectPackage = (jurisdiction: Jurisdiction, visas: number) => {
    setSelectedJurisdiction(jurisdiction);
    setSelectedVisas(visas);
    document.getElementById('cost-calculator')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTrackFromCalc = (code: string) => {
    setTrackerCode(code);
    document.getElementById('tracker')?.scrollIntoView({ behavior: 'smooth' });
  };

  const corePackages = [
    {
      name: 'Zero-Visa Free Zone',
      audience: 'For international founders & remote consultancies',
      priceAed: config.zeroVisaPriceAed,
      jurisdiction: 'Free Zone' as Jurisdiction,
      visas: 0,
      features: [
        '100% foreign ownership UAE Trade License',
        'Certificate of Incorporation & Memorandum (MOA)',
        'Compliant Flexi Desk sustainability certificate',
        'Pre-KYC corporate banking dossier (Wio / Mashreq)',
      ],
    },
    {
      name: '1-Visa All-Inclusive',
      audience: 'For founders relocating or securing UAE residency',
      priceAed: config.oneVisaPriceAed,
      jurisdiction: 'Free Zone' as Jurisdiction,
      visas: 1,
      featured: true,
      features: [
        'Everything in Zero-Visa Free Zone Package',
        'Corporate Establishment Card & immigration file',
        '1 UAE Investor Residency Visa & entry permit',
        'VIP Medical Fitness & Emirates ID biometric slot',
      ],
    },
    {
      name: 'Dubai Mainland DET LLC',
      audience: 'For onshore UAE trade, retail & federal tenders',
      priceAed: config.mainlandPriceAed,
      jurisdiction: 'Mainland' as Jurisdiction,
      visas: 0,
      features: [
        'Dubai Department of Economy & Tourism (DET) License',
        'Trade Name reservation & notarized digital MOA',
        'Unrestricted UAE onshore B2B/B2C invoicing rights',
        'RAKBANK / Mashreq Mainland banking KYC desk',
      ],
    },
  ];

  const onboardingSteps = [
    {
      step: '01',
      title: 'Lock Scope & Passport KYC',
      detail:
        'Configure jurisdiction, activity code, and visa quota in the calculator to receive your SBN tracking ID and submit passport/UBO verification.',
    },
    {
      step: '02',
      title: 'Trade Name & Digital E-License',
      detail:
        'Our registrar desk reserves your trade name, executes your MOA electronically, and delivers your official UAE Trade License in 3 to 5 working days.',
    },
    {
      step: '03',
      title: 'Residency Visa, Emirates ID & IBAN',
      detail:
        'Complete 48-hour medical & Emirates ID biometrics in Dubai, then submit your audited KYC bundle to Wio Business, Mashreq NeoBiz, or RAKBANK.',
    },
  ];

  const visiblePosts = blogPosts.filter((p) => p.visible).slice(0, 3);

  return (
    <div>
      {/* HERO SPLIT-PANEL */}
      <section className="relative overflow-hidden bg-[#0b1f4b] text-white">
        {/* Transparent Dubai Skyline Background Layer */}
        <img
          src="/src/assets/images/hero_dubai_skyline_1795435479209.jpg"
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          className="pointer-events-none select-none absolute inset-0 w-full h-full object-cover object-center opacity-25"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0b1f4b]/85 via-[#0b1f4b]/70 to-[#0b1f4b]/90"
        />
        {/* Subtle Cobalt Architectural Radial Accents & Grid */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 18% 20%, rgba(40, 99, 232, 0.34), transparent 46%), radial-gradient(circle at 86% 80%, rgba(40, 99, 232, 0.22), transparent 42%)',
          }}
        />
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 w-full h-full opacity-[0.07]"
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
            {/* Left Positioning Column */}
            <div className="lg:col-span-6 flex flex-col justify-between">
              <div>
                {config.promoNotice && (
                  <p className="text-xs sm:text-sm font-medium text-[#93C5FD] tracking-wide">
                    {config.promoNotice}
                  </p>
                )}

                <h1
                  className="mt-4 font-black tracking-tight text-white leading-[1.08]"
                  style={{ fontSize: 'clamp(2.25rem, 4vw, 3.35rem)' }}
                >
                  {config.heroHeadline}
                </h1>

                <p className="mt-5 text-base sm:text-lg text-[#CBD5E1] leading-relaxed max-w-xl">
                  {config.heroSubheadline}
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3.5">
                  <a
                    href={pdfHref}
                    download="simplybiznest-booklet.pdf"
                    onClick={(e) => {
                      e.preventDefault();
                      void handleDownloadPdf();
                    }}
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-lg bg-[#2863e8] hover:bg-[#1e50c4] text-white font-bold text-sm whitespace-nowrap transition-colors"
                  >
                    <FileDown className="w-4 h-4 shrink-0" />
                    <span>{pdfDownloading ? 'Preparing 10-Page PDF...' : 'Download 10-Page Proposal PDF'}</span>
                  </a>
                  <button
                    type="button"
                    onClick={() =>
                      document.getElementById('tracker')?.scrollIntoView({ behavior: 'smooth' })
                    }
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-lg border border-white/25 bg-white/5 hover:bg-white/10 text-white font-medium text-sm whitespace-nowrap transition-colors"
                  >
                    <span>Track Live Application</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>
                </div>
                {pdfError && (
                  <p className="mt-2.5 text-xs text-[#93C5FD]" role="alert">
                    {pdfError}
                  </p>
                )}
              </div>

              {/* Structured Horizontal Metric Strip (<ul>) */}
              <ul className="mt-10 pt-7 border-t border-white/15 grid grid-cols-3 gap-4 sm:gap-6">
                <li>
                  <span className="block font-mono text-lg sm:text-2xl font-bold text-white tabular-nums">
                    AED {config.zeroVisaPriceAed.toLocaleString()}
                  </span>
                  <span className="block text-xs text-[#CBD5E1] mt-1">
                    Zero-Visa Free Zone Entry
                  </span>
                </li>
                <li>
                  <span className="block font-mono text-lg sm:text-2xl font-bold text-white tabular-nums">
                    3–5 Days
                  </span>
                  <span className="block text-xs text-[#CBD5E1] mt-1">
                    Digital E-License Turnaround
                  </span>
                </li>
                <li>
                  <span className="block font-mono text-lg sm:text-2xl font-bold text-white tabular-nums">
                    100%
                  </span>
                  <span className="block text-xs text-[#CBD5E1] mt-1">
                    Foreign Shareholding Retained
                  </span>
                </li>
              </ul>
            </div>

            {/* Right Interactive Calculator Card */}
            <div className="lg:col-span-6 flex">
              <div className="w-full">
                <CostCalculatorCard
                  config={config}
                  initialJurisdiction={selectedJurisdiction}
                  initialVisaCount={selectedVisas}
                  onTrackCode={handleTrackFromCalc}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: CORE PACKAGES & WORKSPACE/VISA SCHEDULES */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-[#E2E8F0]">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#2863e8]">
                Transparent AED Schedules
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0b1f4b] mt-1.5">
                Core UAE Formation Packages
              </h2>
            </div>
            <p className="text-sm text-[#475569] max-w-md">
              Every package includes full documentation, registrar filing, and banking KYC readiness
              with zero undisclosed renewal markups.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {corePackages.map((pkg) => (
              <div
                key={pkg.name}
                className={`rounded-xl p-6 sm:p-7 flex flex-col justify-between border ${
                  pkg.featured
                    ? 'bg-[#F4F7FC] border-[#2863e8] shadow-sm'
                    : 'bg-white border-[#E2E8F0]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#2863e8]">
                      {pkg.jurisdiction}
                    </span>
                    {pkg.featured && (
                      <span className="text-xs font-bold text-[#0b1f4b]">Most Selected</span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-[#0b1f4b] mt-2">{pkg.name}</h3>
                  <p className="text-xs text-[#475569] mt-1">{pkg.audience}</p>

                  <div className="mt-5 pb-5 border-b border-[#E2E8F0]">
                    <span className="font-mono text-3xl font-bold text-[#0b1f4b] tabular-nums">
                      AED {pkg.priceAed.toLocaleString()}
                    </span>
                    <span className="block font-mono text-xs text-[#475569] mt-1 tabular-nums">
                      Approx. ${Math.round(pkg.priceAed / 3.6725).toLocaleString()} USD
                    </span>
                  </div>

                  {/* Custom <ul> Feature List with #2863e8 square-rounded check badges & bottom dividers */}
                  <ul className="mt-4 divide-y divide-[#E2E8F0]">
                    {pkg.features.map((feat) => (
                      <li key={feat} className="py-3 flex items-start gap-3 text-sm text-[#1E293B]">
                        <span className="mt-0.5 w-5 h-5 rounded-md bg-[#2863e8] text-white flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectPackage(pkg.jurisdiction, pkg.visas)}
                  className={`mt-6 w-full py-3 px-4 rounded-lg text-sm font-bold transition-colors ${
                    pkg.featured
                      ? 'bg-[#2863e8] hover:bg-[#1e50c4] text-white'
                      : 'bg-[#0b1f4b] hover:bg-[#2863e8] text-white'
                  }`}
                >
                  Configure in Calculator
                </button>
              </div>
            ))}
          </div>

          {/* Architectural Bento Rate Schedules */}
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#F4F7FC] border border-[#E2E8F0] rounded-xl p-6 sm:p-7">
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#2863e8]">
                    Workspace & Office Rates
                  </p>
                  <h3 className="text-lg font-bold text-[#0b1f4b] mt-0.5">
                    Free Zone & Ejari Office Schedule
                  </h3>
                </div>
              </div>
              <ul className="mt-2 divide-y divide-[#E2E8F0]">
                {WORKSPACE_RATE_SCHEDULE.map((row) => (
                  <li
                    key={row.tier}
                    className="py-3.5 flex items-center justify-between gap-4 text-sm"
                  >
                    <div>
                      <span className="font-medium text-[#0b1f4b] block">{row.tier}</span>
                      <span className="text-xs text-[#475569]">{row.zone}</span>
                    </div>
                    <span className="font-mono font-bold text-[#2863e8] whitespace-nowrap tabular-nums">
                      {row.rateAed}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#F4F7FC] border border-[#E2E8F0] rounded-xl p-6 sm:p-7">
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#2863e8]">
                    Immigration & Health Tiers
                  </p>
                  <h3 className="text-lg font-bold text-[#0b1f4b] mt-0.5">
                    Visa, Permit & Insurance Schedule
                  </h3>
                </div>
              </div>
              <ul className="mt-2 divide-y divide-[#E2E8F0]">
                {VISA_PERMIT_RATE_SCHEDULE.map((row) => (
                  <li
                    key={row.item}
                    className="py-3.5 flex items-center justify-between gap-4 text-sm"
                  >
                    <div>
                      <span className="font-medium text-[#0b1f4b] block">{row.item}</span>
                      <span className="text-xs text-[#475569]">{row.detail}</span>
                    </div>
                    <span className="font-mono font-bold text-[#2863e8] whitespace-nowrap tabular-nums">
                      {row.rateAed}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: FREE ZONE COMPARISON & VERTICAL ONBOARDING STEPPER */}
      <section className="py-16 sm:py-20 bg-[#F4F7FC] border-t border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Free Zone Comparison List */}
            <div className="lg:col-span-7">
              <p className="text-xs font-bold uppercase tracking-wider text-[#2863e8]">
                Multi-Authority Matrix
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0b1f4b] mt-1.5">
                UAE Free Zone Jurisdiction Benchmarks
              </h2>
              <p className="mt-2.5 text-sm text-[#475569]">
                Compare statutory registration tiers across Dubai and Northern Emirates authorities.
              </p>

              <ul className="mt-6 bg-white border border-[#E2E8F0] rounded-xl divide-y divide-[#E2E8F0]">
                {FREE_ZONE_COMPARISON_LIST.map((fz) => (
                  <li key={fz.zone} className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-[#0b1f4b]">{fz.zone}</h3>
                        <p className="text-xs text-[#475569] mt-0.5">{fz.badge}</p>
                      </div>
                      <div className="text-right font-mono text-xs tabular-nums">
                        <span className="block font-bold text-[#0b1f4b]">
                          0-Visa: AED {fz.zeroVisaAed.toLocaleString()}
                        </span>
                        <span className="block text-[#2863e8] mt-0.5">
                          1-Visa: AED {fz.oneVisaAed.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {fz.highlights.map((h) => (
                        <li key={h} className="flex items-start gap-2.5 text-xs text-[#475569]">
                          <span className="mt-0.5 w-4 h-4 rounded bg-[#2863e8]/15 text-[#2863e8] flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" />
                          </span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('free-zones')}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-[#2863e8] hover:text-[#0b1f4b]"
                >
                  <span>Explore Full Free Zone Guide</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <span className="text-[#CBD5E1]">·</span>
                <button
                  type="button"
                  onClick={() => onNavigate('mainland')}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-[#2863e8] hover:text-[#0b1f4b]"
                >
                  <span>Compare Dubai Mainland DET</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Vertical Stepper Onboarding Timeline (<ul> with 2px #2863e8/25 rail & #0b1f4b nodes) */}
            <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-wider text-[#2863e8]">
                Digital Onboarding Sequence
              </p>
              <h3 className="text-xl font-bold text-[#0b1f4b] mt-1.5">
                3-Step Formation Workflow
              </h3>

              <ul className="mt-7 relative space-y-7">
                <span
                  aria-hidden="true"
                  className="absolute left-[15px] top-3 bottom-4 w-[2px] bg-[#2863e8]/25"
                />
                {onboardingSteps.map((s) => (
                  <li key={s.step} className="relative pl-12">
                    <span className="absolute left-0 top-0.5 w-8 h-8 rounded-lg bg-[#0b1f4b] text-white font-mono text-xs font-bold flex items-center justify-center">
                      {s.step}
                    </span>
                    <h4 className="text-base font-bold text-[#0b1f4b]">{s.title}</h4>
                    <p className="mt-1.5 text-sm text-[#475569] leading-relaxed">{s.detail}</p>
                  </li>
                ))}
              </ul>

              <div className="mt-8 pt-6 border-t border-[#E2E8F0]">
                <a
                  href={pdfHref}
                  download="simplybiznest-booklet.pdf"
                  onClick={(e) => {
                    e.preventDefault();
                    void handleDownloadPdf();
                  }}
                  className="w-full py-3 px-4 rounded-lg border border-[#0b1f4b] text-[#0b1f4b] hover:bg-[#0b1f4b] hover:text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <FileDown className="w-4 h-4" />
                  <span>{pdfDownloading ? 'Preparing Booklet PDF...' : 'Download Full 10-Page Proposal Booklet'}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: LIVE APPLICATION PROGRESS TRACKER */}
      <LiveTrackerSection externalCode={activeTrackerCode} />

      {/* SECTION 4: CORPORATE BANKING KYC, REGULATORY GUIDES & FAQS */}
      <section className="py-16 sm:py-20 bg-[#F4F7FC] border-t border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Banking KYC Readiness */}
          <div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#2863e8]">
                  UAE Banking Desk
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#0b1f4b] mt-1.5">
                  Corporate Banking & KYC Preparation
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('banking')}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-[#2863e8] hover:text-[#0b1f4b]"
              >
                <span>View Full Banking KYC Requirements</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {BANKING_PARTNERS.map((bank) => (
                <div
                  key={bank.name}
                  className="bg-white border border-[#E2E8F0] rounded-xl p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="text-xs text-[#475569] flex items-center gap-2">
                      <span className="font-bold text-[#2863e8]">{bank.category}</span>
                    </div>
                    <h3 className="text-lg font-bold text-[#0b1f4b] mt-1.5">{bank.name}</h3>
                    <p className="font-mono text-xs text-[#475569] mt-1 tabular-nums">
                      {bank.timeline} · {bank.minBalance}
                    </p>

                    <ul className="mt-4 divide-y divide-[#E2E8F0]">
                      {bank.criteria.map((c) => (
                        <li key={c} className="py-2.5 flex items-start gap-2.5 text-xs text-[#1E293B]">
                          <span className="mt-0.5 w-4 h-4 rounded bg-[#2863e8] text-white flex items-center justify-center shrink-0">
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

          {/* Regulatory Guides Preview */}
          <div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#2863e8]">
                  Editorial Briefings
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#0b1f4b] mt-1.5">
                  Regulatory Guides & Tax Insights
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('guides')}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-[#2863e8] hover:text-[#0b1f4b]"
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
                      <span className="font-bold text-[#2863e8]">{post.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{post.readTime}</span>
                    </div>
                    <h3 className="text-lg font-bold text-[#0b1f4b] mt-2 leading-snug">
                      {post.title}
                    </h3>
                    <p className="mt-2.5 text-sm text-[#475569] leading-relaxed">{post.excerpt}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectPost(post)}
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[#2863e8] hover:text-[#0b1f4b]"
                  >
                    <span>Read Regulatory Guide</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </article>
              ))}
            </div>
          </div>

          {/* Original FAQs */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-10">
            <p className="text-xs font-bold uppercase tracking-wider text-[#2863e8]">
              Formation Questions Answered
            </p>
            <h2 className="text-2xl font-bold text-[#0b1f4b] mt-1.5">
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
                      <span className="text-sm sm:text-base font-bold text-[#0b1f4b]">
                        {faq.q}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-[#2863e8] shrink-0 transition-transform ${
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
    </div>
  );
}
