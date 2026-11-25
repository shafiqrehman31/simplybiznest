import { ArrowLeft, ArrowRight, Check, FileDown } from 'lucide-react';
import { useState } from 'react';
import {
  BANKING_PARTNERS,
  FREE_ZONE_COMPARISON_LIST,
  LEGAL_DOCUMENTS,
  VISA_PERMIT_RATE_SCHEDULE,
  WORKSPACE_RATE_SCHEDULE,
} from '../data/defaults';
import { downloadBookletPdf } from '../lib/downloadPdf';
import { BlogPost, NavMenuItem, SiteConfig } from '../types';
import { CostCalculatorCard } from './CostCalculatorCard';

interface SubPageViewsProps {
  slug: string;
  config: SiteConfig;
  navItems: NavMenuItem[];
  blogPosts: BlogPost[];
  selectedPost: BlogPost | null;
  onSelectPost: (post: BlogPost | null) => void;
  onNavigate: (slug: string) => void;
}

export function SubPageViews({
  slug,
  config,
  navItems,
  blogPosts,
  selectedPost,
  onSelectPost,
  onNavigate,
}: SubPageViewsProps) {
  const [guideCategory, setGuideCategory] = useState<string>('All');
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const pdfHref = `/api/booklet.pdf?zeroVisa=${config.zeroVisaPriceAed}&oneVisa=${config.oneVisaPriceAed}&mainland=${config.mainlandPriceAed}`;

  const handleDownloadPdf = async () => {
    if (pdfDownloading) return;
    setPdfDownloading(true);
    try {
      await downloadBookletPdf(pdfHref);
    } finally {
      setPdfDownloading(false);
    }
  };

  // Legal Pages
  if (slug.startsWith('legal-')) {
    const key = slug.replace('legal-', '') as keyof typeof LEGAL_DOCUMENTS;
    const legal = LEGAL_DOCUMENTS[key] || LEGAL_DOCUMENTS.disclaimer;
    return (
      <section className="py-14 bg-[#F8FAFC] min-h-[70vh]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1F65ED] hover:text-[#0C1A38] mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 sm:p-10">
            <p className="text-xs font-bold uppercase tracking-wider text-[#1F65ED]">
              {config.siteName} Legal Governance
            </p>
            <h1 className="text-3xl font-bold text-[#0C1A38] mt-2">{legal.title}</h1>
            <p className="text-sm text-[#475569] mt-2 pb-6 border-b border-[#E2E8F0]">
              {legal.subtitle}
            </p>

            <div className="mt-6 space-y-6">
              {legal.sections.map((sec) => (
                <div key={sec.heading}>
                  <h2 className="text-lg font-bold text-[#0C1A38]">{sec.heading}</h2>
                  <p className="mt-2 text-sm text-[#475569] leading-relaxed">{sec.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Individual Blog / Guide Reader
  if (slug === 'guides' && selectedPost) {
    return (
      <section className="py-14 bg-[#F8FAFC] min-h-[70vh]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <button
            type="button"
            onClick={() => onSelectPost(null)}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1F65ED] hover:text-[#0C1A38] mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Regulatory Guides</span>
          </button>

          <article className="bg-white border border-[#E2E8F0] rounded-xl p-8 sm:p-10">
            <div className="text-xs text-[#475569] flex items-center gap-2">
              <span className="font-bold text-[#1F65ED]">{selectedPost.category}</span>
              <span aria-hidden="true">·</span>
              <span>{selectedPost.publishedAt}</span>
              <span aria-hidden="true">·</span>
              <span>{selectedPost.readTime}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0C1A38] mt-3">
              {selectedPost.title}
            </h1>
            <p className="text-xs text-[#475569] mt-2 pb-6 border-b border-[#E2E8F0]">
              Authored by {selectedPost.author}
            </p>

            <div className="mt-6 space-y-4 text-sm sm:text-base text-[#1E293B] leading-relaxed whitespace-pre-line">
              {selectedPost.content}
            </div>
          </article>
        </div>
      </section>
    );
  }

  // Guides Directory Page
  if (slug === 'guides') {
    const visiblePosts = blogPosts.filter((p) => p.visible);
    const categories = ['All', ...Array.from(new Set(visiblePosts.map((p) => p.category)))];
    const filtered =
      guideCategory === 'All'
        ? visiblePosts
        : visiblePosts.filter((p) => p.category === guideCategory);

    return (
      <section className="py-14 bg-[#F8FAFC] min-h-[75vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#0C1A38] text-white rounded-xl p-8 sm:p-10 mb-10">
            <p className="text-xs font-bold uppercase tracking-wider text-[#93C5FD]">
              Regulatory Intelligence
            </p>
            <h1 className="text-3xl font-bold mt-2">UAE Corporate & Tax Guides</h1>
            <p className="text-sm sm:text-base text-[#CBD5E1] mt-2 max-w-2xl">
              Practical briefings on UAE Free Zone licensing, Dubai DET Mainland structuring, 9%
              Corporate Tax compliance, and KYC banking readiness.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-8">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setGuideCategory(cat)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors ${
                  guideCategory === cat
                    ? 'bg-[#0C1A38] text-white'
                    : 'bg-white border border-[#E2E8F0] text-[#475569] hover:text-[#0C1A38]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filtered.map((post) => (
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
                  <h2 className="text-lg font-bold text-[#0C1A38] mt-2">{post.title}</h2>
                  <p className="mt-2.5 text-sm text-[#475569] leading-relaxed">{post.excerpt}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectPost(post)}
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[#1F65ED] hover:text-[#0C1A38]"
                >
                  <span>Read Full Guide</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Free Zones Page
  if (slug === 'free-zones') {
    return (
      <section className="py-14 bg-[#F8FAFC] min-h-[75vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="bg-[#0C1A38] text-white rounded-xl p-8 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <p className="text-xs font-bold uppercase tracking-wider text-[#93C5FD]">
                100% Foreign Ownership
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold mt-2">
                UAE Free Zone Company Formation
              </h1>
              <p className="mt-3 text-sm sm:text-base text-[#CBD5E1] leading-relaxed">
                Launch across IFZA Dubai, Meydan Free Zone, DMCC, or RAKEZ starting from AED{' '}
                {config.zeroVisaPriceAed.toLocaleString()} with Flexi Desk sustainability and rapid
                digital e-license issuance.
              </p>
              <div className="mt-6">
                <a
                  href={pdfHref}
                  download="simplybiznest-booklet.pdf"
                  onClick={(e) => {
                    e.preventDefault();
                    void handleDownloadPdf();
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1F65ED] hover:bg-[#1e50c4] text-white text-sm font-bold"
                >
                  <FileDown className="w-4 h-4" />
                  <span>{pdfDownloading ? 'Preparing Schedule PDF...' : 'Download Free Zone Schedule PDF'}</span>
                </a>
              </div>
            </div>
            <div className="lg:col-span-5">
              <CostCalculatorCard config={config} initialJurisdiction="Free Zone" initialVisaCount={0} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FREE_ZONE_COMPARISON_LIST.map((fz) => (
              <div key={fz.zone} className="bg-white border border-[#E2E8F0] rounded-xl p-6">
                <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
                  <div>
                    <h2 className="text-xl font-bold text-[#0C1A38]">{fz.zone}</h2>
                    <p className="text-xs text-[#475569] mt-0.5">{fz.badge}</p>
                  </div>
                  <div className="text-right font-mono text-xs tabular-nums">
                    <span className="block font-bold text-[#0C1A38]">
                      0-Visa: AED {fz.zeroVisaAed.toLocaleString()}
                    </span>
                    <span className="block text-[#1F65ED]">
                      1-Visa: AED {fz.oneVisaAed.toLocaleString()}
                    </span>
                  </div>
                </div>
                <ul className="mt-4 divide-y divide-[#E2E8F0]">
                  {fz.highlights.map((h) => (
                    <li key={h} className="py-2.5 flex items-start gap-2.5 text-sm text-[#1E293B]">
                      <span className="mt-0.5 w-4 h-4 rounded bg-[#1F65ED] text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-6">
              <h3 className="text-lg font-bold text-[#0C1A38] pb-3 border-b border-[#E2E8F0]">
                Workspace & Office Rates
              </h3>
              <ul className="divide-y divide-[#E2E8F0]">
                {WORKSPACE_RATE_SCHEDULE.map((w) => (
                  <li key={w.tier} className="py-3 flex justify-between text-sm">
                    <span className="text-[#0C1A38] font-medium">{w.tier}</span>
                    <span className="font-mono font-bold text-[#1F65ED] tabular-nums">{w.rateAed}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-6">
              <h3 className="text-lg font-bold text-[#0C1A38] pb-3 border-b border-[#E2E8F0]">
                Visa & Permit Rates
              </h3>
              <ul className="divide-y divide-[#E2E8F0]">
                {VISA_PERMIT_RATE_SCHEDULE.map((v) => (
                  <li key={v.item} className="py-3 flex justify-between text-sm">
                    <span className="text-[#0C1A38] font-medium">{v.item}</span>
                    <span className="font-mono font-bold text-[#1F65ED] tabular-nums">{v.rateAed}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Mainland Page
  if (slug === 'mainland') {
    const mainlandAdvantages = [
      'Unrestricted direct trade across the UAE domestic B2B and consumer markets',
      '100% foreign shareholding across nearly all DET commercial and professional codes',
      'Eligibility to bid on Dubai and Federal UAE government procurement tenders',
      'Flexible commercial retail, office, or warehouse Ejari leasing anywhere in Dubai',
      'Scalable visa quotas aligned with physical office square footage',
    ];

    return (
      <section className="py-14 bg-[#F8FAFC] min-h-[75vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="bg-[#0C1A38] text-white rounded-xl p-8 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <p className="text-xs font-bold uppercase tracking-wider text-[#93C5FD]">
                Dubai Department of Economy & Tourism (DET)
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold mt-2">
                Dubai Mainland DET LLC Formation
              </h1>
              <p className="mt-3 text-sm sm:text-base text-[#CBD5E1] leading-relaxed">
                Establish a full onshore Dubai Mainland LLC from AED{' '}
                {config.mainlandPriceAed.toLocaleString()} with complete domestic market access and
                direct Tier-1 corporate banking compatibility.
              </p>

              <ul className="mt-6 space-y-2.5">
                {mainlandAdvantages.map((adv) => (
                  <li key={adv} className="flex items-start gap-2.5 text-sm text-[#CBD5E1]">
                    <span className="mt-0.5 w-5 h-5 rounded bg-[#1F65ED] text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                    <span>{adv}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:col-span-5">
              <CostCalculatorCard config={config} initialJurisdiction="Mainland" initialVisaCount={1} />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Banking Page
  if (slug === 'banking') {
    const kycChecklist = [
      'Certified UAE Trade License, MOA, and Share Certificate',
      '6 months of personal bank statements for every 25%+ Ultimate Beneficial Owner (UBO)',
      'Active UAE Emirates ID & UAE mobile number (required for Wio Business digital onboarding)',
      'Corporate website and domain-matched email address describing active services',
      'Draft client / supplier profiles and expected monthly AED/USD transaction volumes',
    ];

    return (
      <section className="py-14 bg-[#F8FAFC] min-h-[75vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="bg-[#0C1A38] text-white rounded-xl p-8 sm:p-10">
            <p className="text-xs font-bold uppercase tracking-wider text-[#93C5FD]">
              UAE Corporate Banking Desk
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold mt-2">
              KYC Readiness: Wio Business, Mashreq NeoBiz & RAKBANK
            </h1>
            <p className="mt-3 text-sm sm:text-base text-[#CBD5E1] max-w-3xl leading-relaxed">
              Every simplybiznest.com incorporation includes structured KYC dossier preparation to
              maximize first-time corporate account approval.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BANKING_PARTNERS.map((bank) => (
              <div key={bank.name} className="bg-white border border-[#E2E8F0] rounded-xl p-6">
                <p className="text-xs font-bold text-[#1F65ED]">{bank.category}</p>
                <h2 className="text-xl font-bold text-[#0C1A38] mt-1">{bank.name}</h2>
                <p className="font-mono text-xs text-[#475569] mt-1 tabular-nums">
                  {bank.timeline} · {bank.minBalance}
                </p>
                <ul className="mt-4 divide-y divide-[#E2E8F0]">
                  {bank.criteria.map((c) => (
                    <li key={c} className="py-2.5 flex items-start gap-2.5 text-sm text-[#1E293B]">
                      <span className="mt-0.5 w-4 h-4 rounded bg-[#1F65ED] text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-8">
            <h3 className="text-xl font-bold text-[#0C1A38]">
              Mandatory Pre-Submission KYC Document Pack
            </h3>
            <ul className="mt-4 divide-y divide-[#E2E8F0]">
              {kycChecklist.map((item) => (
                <li key={item} className="py-3 flex items-start gap-3 text-sm text-[#1E293B]">
                  <span className="mt-0.5 w-5 h-5 rounded-md bg-[#1F65ED] text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    );
  }

  // Dynamic CMS Menu Page Fallback
  const cmsPage = navItems.find((n) => n.slug === slug);
  return (
    <section className="py-14 bg-[#F8FAFC] min-h-[70vh]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1F65ED] hover:text-[#0C1A38] mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 sm:p-10">
          <p className="text-xs font-bold uppercase tracking-wider text-[#1F65ED]">
            {config.siteName}
          </p>
          <h1 className="text-3xl font-bold text-[#0C1A38] mt-2">
            {cmsPage?.title || 'Corporate Advisory'}
          </h1>
          <p className="text-sm text-[#475569] mt-2 pb-6 border-b border-[#E2E8F0]">
            {cmsPage?.pageSubtitle || 'UAE Company Formation & Regulatory Support'}
          </p>
          <div className="mt-6 text-sm sm:text-base text-[#1E293B] leading-relaxed whitespace-pre-line">
            {cmsPage?.pageContent ||
              'Contact our advisory desk via WhatsApp or info@simplybiznest.com for tailored UAE corporate structuring.'}
          </div>
        </div>
      </div>
    </section>
  );
}
