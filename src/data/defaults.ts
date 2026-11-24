import { BlogPost, InventorySlot, NavMenuItem, SiteConfig } from '../types';

export const DEFAULT_HEADER_LOGO = '/assets/aistudio/Simply-Biz-Nest-Logo_466db8b5.png';
export const DEFAULT_FOOTER_LOGO = '/assets/aistudio/Simply-Biz-Nest-Logo-white_388cc198.png';
export const DEFAULT_FAVICON = '/assets/aistudio/Logo-Icon__1__9b30d666.png';

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  siteName: 'simplybiznest.com',
  headerLogoUrl: DEFAULT_HEADER_LOGO,
  footerLogoUrl: DEFAULT_FOOTER_LOGO,
  faviconUrl: DEFAULT_FAVICON,
  heroHeadline: 'Structured UAE Company Formation Without Hidden Renewal Fees',
  heroSubheadline:
    'Launch your Dubai Free Zone or Mainland DET company with itemized AED/USD pricing, direct KYC banking preparation, and live milestone tracking—managed digitally from trade name to active IBAN.',
  whatsappNumber: '971500000000',
  contactEmail: 'info@simplybiznest.com',
  promoNotice: '2026 Q4 Allocation: Priority E-License Issuance & Wio Business KYC Desk Included',
  zeroVisaPriceAed: 11500,
  oneVisaPriceAed: 17900,
  mainlandPriceAed: 23500,
  socialLinkedin: 'https://www.linkedin.com/company/simplybiznest',
  socialInstagram: 'https://www.instagram.com/simplybiznest',
  socialFacebook: 'https://www.facebook.com/simplybiznest',
  socialX: 'https://x.com/simplybiznest',
  socialYoutube: 'https://www.youtube.com/@simplybiznest',
};

export const DEFAULT_NAV_ITEMS: NavMenuItem[] = [
  {
    id: 'home',
    title: 'Home',
    slug: 'home',
    order: 0,
    pageSubtitle: 'UAE Company Formation & Corporate Advisory',
    pageContent: '',
    visible: true,
  },
  {
    id: 'free-zones',
    title: 'Free Zones',
    slug: 'free-zones',
    order: 1,
    pageSubtitle: '100% Foreign Ownership Across IFZA, Meydan, DMCC & RAKEZ',
    pageContent:
      'UAE Free Zones remain the preferred structure for international founders, SaaS operators, holding SPVs, and cross-border consultancies. Every simplybiznest.com Free Zone mandate includes activity-code matching, Memorandum & Articles execution, digital license issuance, and pre-vetted corporate banking documentation.',
    visible: true,
  },
  {
    id: 'mainland',
    title: 'Mainland',
    slug: 'mainland',
    order: 2,
    pageSubtitle: 'Dubai Department of Economy & Tourism (DET) Onshore Entities',
    pageContent:
      'A Dubai Mainland DET LLC gives your enterprise unrestricted access to trade directly within the UAE domestic market, bid on government tenders, lease commercial retail or warehouse space anywhere in Dubai, and scale employee visa quotas dynamically.',
    visible: true,
  },
  {
    id: 'banking',
    title: 'Banking',
    slug: 'banking',
    order: 3,
    pageSubtitle: 'KYC Readiness for Wio Business, Mashreq NeoBiz & RAKBANK',
    pageContent:
      'Corporate account opening in the UAE succeeds on documentation precision. Before submitting your file, our compliance desk prepares your Ultimate Beneficial Owner (UBO) chart, source-of-funds dossier, and supplier/client invoice projections.',
    visible: true,
  },
  {
    id: 'guides',
    title: 'Guides',
    slug: 'guides',
    order: 4,
    pageSubtitle: 'Regulatory Briefings, Corporate Tax & Licensing Intelligence',
    pageContent:
      'Practical UAE corporate law, 9% Federal Corporate Tax thresholds, Free Zone Qualifying Income rules, and residency visa compliance guides authored by simplybiznest.com.',
    visible: true,
  },
];

export const DEFAULT_BLOG_POSTS: BlogPost[] = [
  {
    id: 'uae-free-zone-vs-mainland-2026',
    title: 'Dubai Free Zone vs. Mainland DET LLC: Choosing the Right 2026 Structure',
    slug: 'uae-free-zone-vs-mainland-2026',
    category: 'Jurisdiction Strategy',
    readTime: '6 min read',
    author: 'simplybiznest.com Advisory Desk',
    publishedAt: 'November 2026',
    excerpt:
      'Compare ownership rules, Ejari lease requirements, UAE domestic B2B invoicing, and annual renewal economics between Free Zone authorities and Dubai DET Mainland LLCs.',
    content: `Selecting between a Dubai Free Zone entity and a Dubai Department of Economy & Tourism (DET) Mainland LLC depends primarily on where your customers sit and whether you require physical retail or onshore government contracting.\n\n1. Market Access & Invoicing\nFree Zone entities excel for international consulting, software engineering, e-commerce, and cross-border trading. If your revenue comes from outside the UAE or from other Free Zone corporations, a Free Zone license avoids mandatory commercial office leases. By contrast, a Mainland DET LLC can invoice UAE onshore consumers, bid on federal tenders, and operate retail storefronts across Dubai.\n\n2. Office & Ejari Economics\nFree Zone packages start from AED 11,500 with a compliant Flexi Desk or shared workspace certificate, whereas Mainland LLCs typically require a registered Ejari tenancy or approved business center desk.\n\n3. Visa Scalability\nEntry-level Free Zone licenses comfortably accommodate 0 to 6 residency visas, while Mainland DET entities scale into double-digit headcount allocations tied to office square footage (approx. 9 sqm per visa).`,
    visible: true,
  },
  {
    id: 'corporate-banking-kyc-wio-mashreq-rakbank',
    title: 'Passing UAE Corporate Banking KYC: Wio Business, Mashreq NeoBiz & RAKBANK',
    slug: 'corporate-banking-kyc-wio-mashreq-rakbank',
    category: 'Corporate Banking',
    readTime: '5 min read',
    author: 'simplybiznest.com Compliance Team',
    publishedAt: 'November 2026',
    excerpt:
      'A practical checklist covering UBO verification, 6-month personal bank statements, business activity alignment, and digital onboarding timelines.',
    content: `Opening a UAE business bank account is rarely delayed by the license itself—it is delayed by mismatched activity narratives and incomplete Ultimate Beneficial Owner (UBO) files.\n\nWio Business\nIdeal for digital-first founders, solo consultants, and SaaS companies with an Emirates ID in hand. Application is 100% digital with multi-currency AED/USD/EUR/GBP accounts and rapid virtual card issuance once trade license and Emirates ID verify cleanly.\n\nMashreq NeoBiz\nTailored to startups and SMEs seeking traditional tier-1 clearing credentials, trade finance options, and dedicated relationship tiers. Requires clean 6-month personal statements and clear counterparty descriptions.\n\nRAKBANK Business\nStrong option for commercial trading companies, physical inventory importers, and Mainland LLCs requiring higher transaction volumes and multi-signatory controls.\n\nThe simplybiznest.com Pre-KYC File\nEvery formation package includes our pre-submission compliance audit: verifying that your website, domain email (no free consumer mail where possible), client contracts, and passport residency trail align before a single bank form is submitted.`,
    visible: true,
  },
  {
    id: 'uae-corporate-tax-small-business-relief',
    title: 'UAE 9% Corporate Tax, Small Business Relief & Free Zone Qualifying Income',
    slug: 'uae-corporate-tax-small-business-relief',
    category: 'Tax & Compliance',
    readTime: '7 min read',
    author: 'simplybiznest.com Tax Desk',
    publishedAt: 'November 2026',
    excerpt:
      'Understand the AED 375,000 taxable profit threshold, FTA registration deadlines, VAT registration rules, and how Qualifying Free Zone Persons maintain 0% tax status.',
    content: `Under UAE Federal Decree-Law No. 47, every UAE juridical person—both Mainland and Free Zone—must register with the Federal Tax Authority (FTA) for Corporate Tax, even when qualifying for 0% tax.\n\nKey Thresholds:\n- 0% Corporate Tax on net taxable profits up to AED 375,000.\n- 9% Corporate Tax on net taxable profits exceeding AED 375,000.\n- Small Business Relief: Resident businesses with annual revenue of AED 3,000,000 or less in the current and prior tax periods may elect for Small Business Relief (subject to statutory sunset rules).\n- Qualifying Free Zone Person (QFZP): Free Zone companies maintaining adequate substance in the UAE, audited financial statements, and earning Qualifying Income can benefit from 0% on qualifying activities.\n\nVAT Registration:\nMandatory VAT (5%) registration applies once taxable supplies and imports exceed AED 375,000 over a rolling 12-month period, with voluntary registration available from AED 187,500.`,
    visible: true,
  },
];

export const FREE_ZONE_COMPARISON_LIST = [
  {
    zone: 'IFZA Dubai',
    badge: 'Multi-Activity Flexibility',
    zeroVisaAed: 12900,
    oneVisaAed: 19200,
    highlights: [
      'Combine up to 3 professional or commercial activities under one license',
      'No physical office required for up to 3 visas (Flexi Desk included)',
      'Digital e-license issuance within 3 to 5 working days',
    ],
  },
  {
    zone: 'Meydan Free Zone',
    badge: 'Prestigious Dubai Address',
    zeroVisaAed: 12500,
    oneVisaAed: 18500,
    highlights: [
      'Prime Dubai Nad Al Sheba address recognized by Tier-1 UAE banks',
      'Instant digital MOAs and seamless NOC support for banking',
      '2,500+ business activities with guaranteed renewal predictability',
    ],
  },
  {
    zone: 'DMCC (JLT)',
    badge: 'Global Commodities & Fintech',
    zeroVisaAed: 20500,
    oneVisaAed: 27900,
    highlights: [
      'World-ranked Free Zone authority in Jumeirah Lakes Towers',
      'Preferred hub for commodities trading, treasury, and Web3 licenses',
      'Access to physical Flexi Desks and executive serviced suites',
    ],
  },
  {
    zone: 'RAKEZ / Northern Emirates',
    badge: 'Cost-Efficient Entry',
    zeroVisaAed: 11500,
    oneVisaAed: 17900,
    highlights: [
      'Lowest barrier to entry for remote founders and solo consultants',
      'Fast-track UAE residency visa eligibility with minimal overhead',
      'Full 100% foreign ownership and capital repatriation',
    ],
  },
];

export const WORKSPACE_RATE_SCHEDULE = [
  { tier: 'Flexi Desk / Virtual Sustainability', zone: 'Free Zone Shared', rateAed: 'AED 15,000 / yr' },
  { tier: 'Dedicated Co-Working Workstation', zone: 'Dubai Business Hub', rateAed: 'AED 24,500 / yr' },
  { tier: 'Private Serviced Executive Suite', zone: '15–25 sqm Enclosed', rateAed: 'AED 42,000 / yr' },
  { tier: 'Mainland DET Commercial Ejari', zone: 'Onshore Dubai Lease', rateAed: 'AED 28,000 / yr' },
];

export const VISA_PERMIT_RATE_SCHEDULE = [
  { item: '1-Year Investor / Partner Visa Allocation', detail: 'Entry permit + status change', rateAed: 'From AED 1,237' },
  { item: '2-Year Free Zone Residence Visa', detail: 'Full 24-month residency stamp', rateAed: 'From AED 1,973' },
  { item: 'Establishment Card & Immigration File', detail: 'Mandatory for 1+ visa quota', rateAed: 'AED 1,850' },
  { item: 'VIP Medical Fitness & Emirates ID', detail: '48-hour biometric fast-track', rateAed: 'AED 1,150' },
  { item: 'Compliant UAE Health Insurance Tier', detail: 'DHA / DOH basic statutory plan', rateAed: 'From AED 950 / yr' },
];

export const BANKING_PARTNERS = [
  {
    name: 'Wio Business',
    category: 'Digital Multi-Currency Bank',
    timeline: '2–5 Business Days post-EID',
    minBalance: 'AED 0–3,000 tier dependent',
    criteria: [
      'Valid UAE Trade License, MOA & Share Certificate',
      'Active UAE Emirates ID & UAE mobile number for biometric KYC',
      'Clear digital business profile, domain email & website',
    ],
  },
  {
    name: 'Mashreq NeoBiz',
    category: 'Tier-1 SME Digital Banking',
    timeline: '5–10 Business Days',
    minBalance: 'AED 25,000 average monthly balance',
    criteria: [
      '6-month personal bank statements for all 25%+ UBOs',
      'Projected annual turnover, supplier & client country matrix',
      'Proof of existing contracts or domain-verified pipeline',
    ],
  },
  {
    name: 'RAKBANK Business',
    category: 'Commercial & Trading Desk',
    timeline: '7–14 Business Days',
    minBalance: 'AED 25,000–50,000 tier dependent',
    criteria: [
      'Comprehensive UBO source-of-wealth & source-of-funds dossier',
      'Commercial invoices, bills of lading, or Ejari tenancy (for Mainland)',
      'In-person or video relationship manager compliance review',
    ],
  },
];

export const DEFAULT_FAQS = [
  {
    q: 'Do I need to travel to Dubai to incorporate my company with simplybiznest.com?',
    a: 'No travel is required for company incorporation, trade name reservation, MOA signing, or e-license issuance—we execute 100% digitally. You only need to visit the UAE for 3 to 5 working days if you apply for a UAE Residency Visa (for medical fitness screening and Emirates ID biometrics).',
  },
  {
    q: 'Are there any hidden annual renewal charges or mandatory local sponsor fees?',
    a: 'Never. Both Free Zone and Mainland LLC commercial/professional activities allow 100% foreign ownership with zero local Emirati sponsor required. Your itemized quote shows government license fees, establishment card, and visa charges upfront.',
  },
  {
    q: 'How long does it take to open a UAE corporate bank account after licensing?',
    a: 'Once your E-License is issued and your Emirates ID is active, digital-first banks like Wio Business typically approve compliant files within 2 to 5 business days. Traditional SME desks such as Mashreq NeoBiz or RAKBANK typically finalize KYC review in 5 to 14 business days.',
  },
  {
    q: 'Can I upgrade from a Zero-Visa Free Zone package to resident visas later?',
    a: 'Yes. You can start on the AED 11,500 Zero-Visa package to lock your corporate entity and trade name, then activate your Establishment Card and apply for 1 to 6 residency visas whenever you are ready to relocate or sponsor staff.',
  },
  {
    q: 'How does the live application progress tracker work?',
    a: 'Every submitted quote immediately generates a unique non-PII reference code (e.g., SBN-XXXXXX). Entering that code in the Live Application Progress Tracker displays your real-time status across all 6 milestones without exposing your personal contact details.',
  },
];

export const DEFAULT_INVENTORY_SEED: Omit<InventorySlot, 'id'>[] = [
  {
    name: 'IFZA Zero-Visa Digital Allocation',
    category: 'License Pool',
    jurisdiction: 'IFZA Dubai',
    availableSlots: 28,
    totalSlots: 40,
    lowThreshold: 8,
  },
  {
    name: 'Meydan 1-Visa Fast-Track Quota',
    category: 'License Pool',
    jurisdiction: 'Meydan Free Zone',
    availableSlots: 6,
    totalSlots: 25,
    lowThreshold: 8,
  },
  {
    name: 'Dubai DET Mainland LLC Batch',
    category: 'License Pool',
    jurisdiction: 'Dubai Mainland',
    availableSlots: 14,
    totalSlots: 20,
    lowThreshold: 5,
  },
  {
    name: '2-Year Investor Visa VIP Medical Slots',
    category: 'Visa Quota',
    jurisdiction: 'UAE Immigration',
    availableSlots: 19,
    totalSlots: 30,
    lowThreshold: 6,
  },
  {
    name: 'Wio & Mashreq Pre-KYC Banking Desk',
    category: 'Banking Desk',
    jurisdiction: 'UAE Banking',
    availableSlots: 4,
    totalSlots: 15,
    lowThreshold: 5,
  },
];

export const LEGAL_DOCUMENTS: Record<
  'privacy' | 'terms' | 'refund' | 'disclaimer',
  { title: string; subtitle: string; sections: { heading: string; body: string }[] }
> = {
  privacy: {
    title: 'Privacy Policy',
    subtitle: 'Data Stewardship & Client Confidentiality — simplybiznest.com',
    sections: [
      {
        heading: '1. Scope & Data Controller',
        body: 'simplybiznest.com operates as a digital UAE company formation and corporate advisory platform. Personal contact data submitted through our Instant Setup Cost Calculator or WhatsApp Formation Chatbot is encrypted in transit and isolated in restricted administrative records.',
      },
      {
        heading: '2. Zero-PII Public Tracking Architecture',
        body: 'Our Live Application Progress Tracker operates on an isolated non-PII status projection keyed strictly by your unique SBN reference ID. Your full name, WhatsApp number, and email address are never exposed on public tracking endpoints.',
      },
      {
        heading: '3. Regulatory KYC Retention & Contact',
        body: 'Documents shared for UAE Free Zone, DET Mainland, or corporate banking KYC compliance are retained strictly for statutory filing and anti-money-laundering verification. For privacy inquiries or deletion requests, email info@simplybiznest.com.',
      },
    ],
  },
  terms: {
    title: 'Terms of Service',
    subtitle: 'Engagement Scope & Formation Mandate — simplybiznest.com',
    sections: [
      {
        heading: '1. Advisory & Filing Mandate',
        body: 'simplybiznest.com provides corporate structuring, activity selection, government portal submission, residency visa coordination, and banking KYC preparation across UAE Free Zones and Dubai Mainland.',
      },
      {
        heading: '2. Fee Estimates & Government Tariffs',
        body: 'Quotes calculated online reflect current 2026 UAE authority fee schedules. Final statutory invoices are locked upon passport KYC verification and exact business activity code approval by the relevant registrar.',
      },
      {
        heading: '3. Client Responsibilities',
        body: 'Applicants warrant that all passport copies, source-of-funds statements, and UBO disclosures submitted are authentic and accurate. Inquiries regarding engagement terms may be directed to info@simplybiznest.com.',
      },
    ],
  },
  refund: {
    title: 'Refund Policy',
    subtitle: 'Transparent Government Disbursement & Service Fee Rules',
    sections: [
      {
        heading: '1. Before Government Submission',
        body: 'If you cancel your formation mandate prior to trade name reservation or government portal fee disbursement, 100% of unspent authority fees and advisory retainers—less a standard AED 500 KYC compliance review fee—are refundable within 10 business days.',
      },
      {
        heading: '2. Statutory Authority Disbursements',
        body: 'Once UAE Free Zone, Dubai DET, or ICP/GDRFA immigration fees have been remitted to a government registrar on your behalf, those third-party government tariffs are non-refundable under UAE authority rules.',
      },
      {
        heading: '3. Banking Approval Disclaimer',
        body: 'Corporate bank account approval rests solely with regulated UAE financial institutions. Refund claims are reviewed via info@simplybiznest.com.',
      },
    ],
  },
  disclaimer: {
    title: 'Legal Disclaimer',
    subtitle: 'Regulatory Notice — simplybiznest.com',
    sections: [
      {
        heading: '1. Informational & Structuring Guidance',
        body: 'Content published across simplybiznest.com—including our 10-page Proposal Booklet PDF, Regulatory Guides, and WhatsApp Formation Chatbot—is provided for corporate structuring and planning purposes and does not constitute formal legal or tax representation.',
      },
      {
        heading: '2. Independent Regulatory Authorities',
        body: 'All trade licenses, establishment cards, and residency visas are issued exclusively by the respective UAE Free Zone Authorities, Dubai Department of Economy & Tourism (DET), and Federal Authority for Identity, Citizenship, Customs & Port Security (ICP).',
      },
      {
        heading: '3. Official Digital Correspondence',
        body: 'Official correspondence and documentation requests are conducted exclusively through https://simplybiznest.com and info@simplybiznest.com.',
      },
    ],
  },
};
