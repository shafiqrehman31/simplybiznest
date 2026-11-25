import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

const NAVY = '#0C1A38';
const COBALT = '#1F65ED';
const ICE = '#F8FAFC';
const HAIRLINE = '#E2E8F0';
const INK = '#1E293B';
const MUTED = '#475569';
const WHITE = '#FFFFFF';

export interface BookletPricing {
  zeroVisaPriceAed?: number;
  oneVisaPriceAed?: number;
  mainlandPriceAed?: number;
}

function registerFonts(doc: PDFKit.PDFDocument): { regular: string; bold: string; mono: string } {
  const dejavuReg = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
  const dejavuBold = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
  const jbBold = '/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-Bold.ttf';

  let regular = 'Helvetica';
  let bold = 'Helvetica-Bold';
  let mono = 'Courier-Bold';

  if (fs.existsSync(dejavuReg)) {
    doc.registerFont('SBN-Regular', dejavuReg);
    regular = 'SBN-Regular';
  }
  if (fs.existsSync(dejavuBold)) {
    doc.registerFont('SBN-Bold', dejavuBold);
    bold = 'SBN-Bold';
  }
  if (fs.existsSync(jbBold)) {
    doc.registerFont('SBN-Mono', jbBold);
    mono = 'SBN-Mono';
  }

  return { regular, bold, mono };
}

function drawPageHeader(
  doc: PDFKit.PDFDocument,
  pageNum: number,
  sectionLabel: string,
  logoPath: string | null,
  fonts: { regular: string; bold: string; mono: string }
) {
  doc.save();
  doc.rect(0, 0, doc.page.width, 54).fill(NAVY);
  doc.rect(0, 54, doc.page.width, 3).fill(COBALT);

  if (logoPath) {
    try {
      doc.roundedRect(36, 9, 112, 36, 4).fill(WHITE);
      doc.image(logoPath, 42, 12, { fit: [100, 30], align: 'center', valign: 'center' });
    } catch {
      doc
        .fillColor(WHITE)
        .font(fonts.bold)
        .fontSize(12)
        .text('simplybiznest.com', 40, 21, { lineBreak: false });
    }
  } else {
    doc
      .fillColor(WHITE)
      .font(fonts.bold)
      .fontSize(12)
      .text('simplybiznest.com', 40, 21, { lineBreak: false });
  }

  doc
    .fillColor('#CBD5E1')
    .font(fonts.regular)
    .fontSize(9)
    .text(sectionLabel.toUpperCase(), 164, 22, { width: 290, lineBreak: false });

  doc
    .fillColor(WHITE)
    .font(fonts.bold)
    .fontSize(9)
    .text(`PAGE ${pageNum} OF 10`, doc.page.width - 125, 22, {
      width: 85,
      align: 'right',
      lineBreak: false,
    });

  doc.restore();
}

function drawPageFooter(
  doc: PDFKit.PDFDocument,
  fonts: { regular: string; bold: string; mono: string }
) {
  const y = doc.page.height - 34;
  doc.save();
  doc
    .moveTo(40, y - 8)
    .lineTo(doc.page.width - 40, y - 8)
    .lineWidth(0.75)
    .strokeColor(HAIRLINE)
    .stroke();
  doc
    .fillColor(MUTED)
    .font(fonts.regular)
    .fontSize(8.5)
    .text('simplybiznest.com  |  UAE Company Formation & Corporate Advisory', 40, y, {
      width: 300,
      lineBreak: false,
    });
  doc
    .fillColor(COBALT)
    .font(fonts.bold)
    .fontSize(8.5)
    .text('info@simplybiznest.com  |  https://simplybiznest.com', 280, y, {
      width: doc.page.width - 320,
      align: 'right',
      lineBreak: false,
    });
  doc.restore();
}

function drawSectionHeading(
  doc: PDFKit.PDFDocument,
  kicker: string,
  title: string,
  y: number,
  fonts: { regular: string; bold: string; mono: string }
): number {
  doc.fillColor(COBALT).font(fonts.bold).fontSize(9).text(kicker.toUpperCase(), 40, y);
  doc
    .fillColor(NAVY)
    .font(fonts.bold)
    .fontSize(19)
    .text(title, 40, y + 14, { width: doc.page.width - 80 });
  const nextY = doc.y + 8;
  doc.moveTo(40, nextY).lineTo(120, nextY).lineWidth(2.5).strokeColor(COBALT).stroke();
  return nextY + 14;
}

function drawTableRows(
  doc: PDFKit.PDFDocument,
  startY: number,
  headers: [string, string, string],
  rows: [string, string, string][],
  fonts: { regular: string; bold: string; mono: string }
): number {
  const colWidths = [205, 195, 115];
  const x0 = 40;
  let y = startY;

  doc.rect(x0, y, 515, 26).fill(NAVY);
  doc.fillColor(WHITE).font(fonts.bold).fontSize(8.75);
  doc.text(headers[0], x0 + 10, y + 8, { width: colWidths[0] - 12, lineBreak: false });
  doc.text(headers[1], x0 + colWidths[0] + 6, y + 8, {
    width: colWidths[1] - 12,
    lineBreak: false,
  });
  doc.text(headers[2], x0 + colWidths[0] + colWidths[1] + 6, y + 8, {
    width: colWidths[2] - 16,
    align: 'right',
    lineBreak: false,
  });
  y += 26;

  rows.forEach((row, idx) => {
    const bg = idx % 2 === 0 ? WHITE : ICE;
    doc.rect(x0, y, 515, 26).fill(bg);
    doc.rect(x0, y, 515, 26).lineWidth(0.5).strokeColor(HAIRLINE).stroke();
    doc
      .fillColor(INK)
      .font(fonts.bold)
      .fontSize(8.5)
      .text(row[0], x0 + 10, y + 8, { width: colWidths[0] - 12, lineBreak: false });
    doc
      .fillColor(MUTED)
      .font(fonts.regular)
      .fontSize(8.25)
      .text(row[1], x0 + colWidths[0] + 6, y + 8, {
        width: colWidths[1] - 12,
        lineBreak: false,
      });
    doc
      .fillColor(COBALT)
      .font(fonts.mono)
      .fontSize(8.5)
      .text(row[2], x0 + colWidths[0] + colWidths[1] + 6, y + 8, {
        width: colWidths[2] - 16,
        align: 'right',
        lineBreak: false,
      });
    y += 26;
  });

  return y + 14;
}

function drawBulletList(
  doc: PDFKit.PDFDocument,
  items: { title: string; body: string }[],
  startY: number,
  fonts: { regular: string; bold: string; mono: string }
): number {
  let y = startY;
  for (const item of items) {
    doc.save();
    doc.roundedRect(40, y + 2, 14, 14, 3).fill(COBALT);
    doc
      .fillColor(WHITE)
      .font(fonts.bold)
      .fontSize(8.5)
      .text('>', 44.5, y + 4.5, { lineBreak: false });
    doc.restore();

    doc.fillColor(NAVY).font(fonts.bold).fontSize(10.5).text(item.title, 64, y, {
      width: doc.page.width - 104,
    });
    doc.fillColor(MUTED).font(fonts.regular).fontSize(9.5).text(item.body, 64, doc.y + 2, {
      width: doc.page.width - 104,
      lineGap: 2,
    });
    y = doc.y + 10;
    doc
      .moveTo(64, y - 4)
      .lineTo(doc.page.width - 40, y - 4)
      .lineWidth(0.5)
      .strokeColor(HAIRLINE)
      .stroke();
  }
  return y + 6;
}

export function generateProposalBookletPdf(pricing: BookletPricing = {}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const zeroVisa = pricing.zeroVisaPriceAed ?? 6499;
    const oneVisa = pricing.oneVisaPriceAed ?? 11200;
    const mainland = pricing.mainlandPriceAed ?? 11800;

    const logoCandidate = path.resolve(
      process.cwd(),
      'public/assets/aistudio/Simply-Biz-Nest-Logo_466db8b5.png'
    );
    const iconCandidate = path.resolve(
      process.cwd(),
      'public/assets/aistudio/Logo-Icon__1__9b30d666.png'
    );
    const logoPath = fs.existsSync(logoCandidate) ? logoCandidate : null;
    const iconPath = fs.existsSync(iconCandidate) ? iconCandidate : null;

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 40, bottom: 20, left: 40, right: 40 },
      autoFirstPage: true,
      info: {
        Title: 'simplybiznest.com - UAE Company Formation Proposal Booklet',
        Author: 'simplybiznest.com',
        Subject: '2026 UAE Free Zone & Mainland Formation Guide',
      },
    });

    const fonts = registerFonts(doc);
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // =========================================================
    // PAGE 1: EXECUTIVE COVER
    // =========================================================
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(NAVY);
    doc.rect(0, 0, 14, doc.page.height).fill(COBALT);

    doc.roundedRect(48, 54, 220, 82, 8).fill(WHITE);
    if (logoPath) {
      try {
        doc.image(logoPath, 56, 60, { fit: [204, 70], align: 'center', valign: 'center' });
      } catch {
        doc
          .fillColor(NAVY)
          .font(fonts.bold)
          .fontSize(18)
          .text('simplybiznest.com', 64, 86, { lineBreak: false });
      }
    } else {
      doc
        .fillColor(NAVY)
        .font(fonts.bold)
        .fontSize(18)
        .text('simplybiznest.com', 64, 86, { lineBreak: false });
    }

    doc
      .fillColor('#93C5FD')
      .font(fonts.bold)
      .fontSize(11)
      .text('2026 UAE CORPORATE FORMATION DOSSIER', 48, 188, { lineBreak: false });

    doc
      .fillColor(WHITE)
      .font(fonts.bold)
      .fontSize(30)
      .text('UAE Business Setup,\nPricing & Banking Blueprint', 48, 214, {
        width: 480,
        lineGap: 4,
      });

    doc
      .fillColor('#CBD5E1')
      .font(fonts.regular)
      .fontSize(11.5)
      .text(
        'Transparent AED schedules for Dubai Free Zones, Department of Economy & Tourism (DET) Mainland LLCs, residency visas, workspaces, and UAE corporate banking KYC preparation.',
        48,
        320,
        { width: 470, lineGap: 4 }
      );

    const coverStats = [
      { label: 'ZERO-VISA FREE ZONE', value: `AED ${zeroVisa.toLocaleString()}` },
      { label: '1-VISA ALL-INCLUSIVE', value: `AED ${oneVisa.toLocaleString()}` },
      { label: 'DUBAI MAINLAND LLC', value: `AED ${mainland.toLocaleString()}` },
    ];
    coverStats.forEach((st, idx) => {
      const bx = 48 + idx * 168;
      doc.roundedRect(bx, 430, 156, 78, 6).fill('#132D6B');
      doc.roundedRect(bx, 430, 156, 78, 6).lineWidth(1).strokeColor(COBALT).stroke();
      doc
        .fillColor('#93C5FD')
        .font(fonts.bold)
        .fontSize(7.5)
        .text(st.label, bx + 14, 446, { lineBreak: false });
      doc
        .fillColor(WHITE)
        .font(fonts.mono)
        .fontSize(15.5)
        .text(st.value, bx + 14, 466, { lineBreak: false });
      doc
        .fillColor('#94A3B8')
        .font(fonts.regular)
        .fontSize(8)
        .text('100% Foreign Ownership', bx + 14, 490, { lineBreak: false });
    });

    // Cover bottom contact plaque (strictly email + URL only)
    doc.roundedRect(48, 686, 500, 94, 6).fill('#08173A');
    doc.roundedRect(48, 686, 500, 94, 6).lineWidth(0.75).strokeColor(COBALT).stroke();
    if (iconPath) {
      try {
        doc.image(iconPath, 66, 708, { fit: [44, 44] });
      } catch {
        // ignore
      }
    }
    doc
      .fillColor('#93C5FD')
      .font(fonts.bold)
      .fontSize(9)
      .text('DIGITAL ADVISORY DESK', 126, 706, { lineBreak: false });
    doc
      .fillColor(WHITE)
      .font(fonts.bold)
      .fontSize(13)
      .text('info@simplybiznest.com', 126, 725, { lineBreak: false });
    doc
      .fillColor('#CBD5E1')
      .font(fonts.regular)
      .fontSize(11)
      .text('https://simplybiznest.com', 126, 747, { lineBreak: false });

    // =========================================================
    // PAGE 2: UAE JURISDICTION ARCHITECTURE
    // =========================================================
    doc.addPage();
    drawPageHeader(doc, 2, 'UAE Jurisdiction Architecture', logoPath, fonts);
    let y = drawSectionHeading(doc, 'Section 01', 'Free Zone vs. Dubai Mainland DET LLC', 76, fonts);

    doc
      .fillColor(MUTED)
      .font(fonts.regular)
      .fontSize(10)
      .text(
        'Choosing the right UAE legal structure ensures clean corporate banking, optimal tax treatment, and zero unnecessary office overheads. Both structures permit 100% foreign shareholding across nearly all commercial and professional activities.',
        40,
        y,
        { width: 515, lineGap: 3 }
      );
    y = doc.y + 16;

    y = drawTableRows(
      doc,
      y,
      ['Structural Dimension', 'UAE Free Zone Entity', 'Dubai Mainland DET LLC'],
      [
        ['Foreign Ownership', '100% Expat / Corporate', '100% Expat / Corporate'],
        ['UAE Domestic Market', 'Via distributor or branch', 'Unrestricted direct B2B/B2C'],
        ['Physical Office Rule', 'Flexi Desk / Virtual included', 'Ejari lease or approved desk'],
        ['Government Tenders', 'Restricted to select zones', 'Fully eligible across UAE'],
        ['Visa Quota Scaling', '0 to 6+ visas on Flexi', 'Scales with office sqm'],
        ['Corporate Tax (9%)', '0% Qualifying Income option', '0% up to AED 375k profit'],
      ],
      fonts
    );

    drawBulletList(
      doc,
      [
        {
          title: 'When to Select a Free Zone',
          body: 'Optimal for international SaaS companies, management consultancies, e-commerce brands, holding SPVs, and cross-border service exporters seeking rapid digital incorporation.',
        },
        {
          title: 'When to Select Dubai Mainland (DET)',
          body: 'Essential if you invoice UAE onshore consumers, open physical retail or hospitality premises, contract directly with UAE federal agencies, or hire a large onshore workforce.',
        },
      ],
      y,
      fonts
    );
    drawPageFooter(doc, fonts);

    // =========================================================
    // PAGE 3: CORE FORMATION PACKAGES
    // =========================================================
    doc.addPage();
    drawPageHeader(doc, 3, 'Core Formation Packages', logoPath, fonts);
    y = drawSectionHeading(doc, 'Section 02', 'Transparent Turnkey Formation Schedules', 76, fonts);

    y = drawTableRows(
      doc,
      y,
      ['Package Tier', 'Included Scope & Deliverables', 'Package Total'],
      [
        [
          'Zero-Visa Free Zone',
          'Trade License + MOA + Flexi Desk + Bank Prep',
          `AED ${zeroVisa.toLocaleString()}`,
        ],
        [
          '1-Visa All-Inclusive',
          'License + Est. Card + 1 Visa + Medical + EID',
          `AED ${oneVisa.toLocaleString()}`,
        ],
        [
          'Dubai Mainland DET LLC',
          'DET Trade License + MOA + Name Approval + Bank',
          `AED ${mainland.toLocaleString()}`,
        ],
        [
          'Additional Investor Visa',
          'Entry Permit + Status Change + Medical + EID',
          'AED 4,550 / visa',
        ],
      ],
      fonts
    );

    drawBulletList(
      doc,
      [
        {
          title: 'Itemized Government Fee Clarity',
          body: 'Every simplybiznest.com proposal separates statutory authority fees, immigration establishment card disbursements, and medical/Emirates ID charges with zero undisclosed renewal surcharges.',
        },
        {
          title: 'Pre-Vetted Activity Code Matching',
          body: 'Selecting precise ISIC/DET activity codes prevents downstream banking delays. Our team aligns your trade license activities directly with bank risk-appetite guidelines.',
        },
        {
          title: 'Dedicated Digital Document Vault',
          body: 'Receive certified PDF copies of your Certificate of Incorporation, Share Register, MOA, Lease Agreement, and E-License in a structured compliance bundle.',
        },
      ],
      y,
      fonts
    );
    drawPageFooter(doc, fonts);

    // =========================================================
    // PAGE 4: WORKSPACE & OFFICE SCHEDULES
    // =========================================================
    doc.addPage();
    drawPageHeader(doc, 4, 'Workspace & Office Schedules', logoPath, fonts);
    y = drawSectionHeading(doc, 'Section 03', 'Free Zone Workspaces & Commercial Leases', 76, fonts);

    y = drawTableRows(
      doc,
      y,
      ['Workspace Category', 'Facility Specification', 'Annual Tariff'],
      [
        ['Flexi Desk / Sustainability', 'Compliant Free Zone shared address', 'From AED 15,000'],
        ['Dedicated Workstation', 'Reserved desk + mail + meeting room', 'From AED 24,500'],
        ['Private Serviced Suite', '15-25 sqm lockable office (4-6 visas)', 'From AED 42,000'],
        ['Mainland DET Ejari Desk', 'Onshore Dubai Business Center Ejari', 'From AED 28,000'],
        ['Warehouse / Industrial Bay', 'Light industrial or logistics bay', 'Custom Quoted'],
      ],
      fonts
    );

    drawBulletList(
      doc,
      [
        {
          title: 'Banking Compliance & Physical Proof',
          body: 'UAE corporate banks verify your registered lease or Flexi Desk sustainability certificate during onboarding. All simplybiznest.com workspace tiers satisfy UAE bank physical-presence KYC standards.',
        },
        {
          title: 'Upgrade Anytime Without Re-Incorporating',
          body: 'Begin with a cost-efficient Flexi Desk and transition smoothly to a private serviced suite or Ejari commercial floor when your UAE headcount expands.',
        },
      ],
      y,
      fonts
    );
    drawPageFooter(doc, fonts);

    // =========================================================
    // PAGE 5: RESIDENCY VISAS & INSURANCE TIERS
    // =========================================================
    doc.addPage();
    drawPageHeader(doc, 5, 'Visas, Permits & Insurance', logoPath, fonts);
    y = drawSectionHeading(doc, 'Section 04', 'UAE Residency Visas, Emirates ID & Insurance', 76, fonts);

    y = drawTableRows(
      doc,
      y,
      ['Immigration / Statutory Item', 'Processing Scope', 'Rate Schedule'],
      [
        ['1-Year Investor / Partner Visa', 'Entry permit + status change', 'From AED 1,237'],
        ['2-Year Free Zone Residence Visa', 'Full 24-month UAE residency', 'From AED 1,973'],
        ['Establishment Card & File', 'Immigration portal activation', 'AED 1,850'],
        ['VIP Medical & Emirates ID', 'Express 48-hour biometrics slot', 'AED 1,150'],
        ['Statutory Health Insurance', 'DHA / DOH basic annual policy', 'From AED 950 / yr'],
      ],
      fonts
    );

    drawBulletList(
      doc,
      [
        {
          title: '3 to 5 Working Days In-Country Biometrics',
          body: 'Once your E-License and Establishment Card are issued, our PRO team schedules your medical fitness screening and Emirates ID biometric appointment prior to arrival.',
        },
        {
          title: 'Dependent Family & Staff Sponsorship',
          body: 'Active UAE investor visa holders may sponsor spouses, children, and parents subject to standard Ejari accommodation and salary/shareholding criteria.',
        },
      ],
      y,
      fonts
    );
    drawPageFooter(doc, fonts);

    // =========================================================
    // PAGE 6: MAJOR FREE ZONE DIRECTORY
    // =========================================================
    doc.addPage();
    drawPageHeader(doc, 6, 'UAE Free Zone Directory', logoPath, fonts);
    y = drawSectionHeading(doc, 'Section 05', 'Compare Leading UAE Free Zone Authorities', 76, fonts);

    y = drawTableRows(
      doc,
      y,
      ['Authority', 'Core Strategic Advantage', 'Indicative Entry'],
      [
        ['IFZA Dubai', 'Combine up to 3 activities; rapid issue', 'From AED 12,900'],
        ['Meydan Free Zone', 'Prime Dubai address; 2,500+ codes', 'From AED 12,500'],
        ['DMCC (JLT Dubai)', 'Commodities, treasury & Web3 hub', 'From AED 20,500'],
        ['RAKEZ / Northern Express', 'Cost-efficient remote founder hub', 'From AED 6,499'],
        ['ADGM (Abu Dhabi)', 'Common-law holding & SPV hub', 'Custom Mandate'],
      ],
      fonts
    );

    drawBulletList(
      doc,
      [
        {
          title: 'Multi-Jurisdiction Neutrality',
          body: 'Unlike single-zone agents, simplybiznest.com benchmarks authority renewal costs, banking acceptance rates, and visa fees across Dubai and Northern Emirates zones objectively.',
        },
      ],
      y,
      fonts
    );
    drawPageFooter(doc, fonts);

    // =========================================================
    // PAGE 7: CORPORATE BANKING & KYC READINESS
    // =========================================================
    doc.addPage();
    drawPageHeader(doc, 7, 'Corporate Banking & KYC', logoPath, fonts);
    y = drawSectionHeading(doc, 'Section 06', 'Wio Business, Mashreq NeoBiz & RAKBANK KYC', 76, fonts);

    y = drawTableRows(
      doc,
      y,
      ['Banking Partner', 'Ideal Profile & Minimum Balance', 'Typical Timeline'],
      [
        ['Wio Business', 'Digital SMEs (AED 0-3,000 tier)', '2-5 Business Days'],
        ['Mashreq NeoBiz', 'Growth SMEs (AED 25,000 AMB)', '5-10 Business Days'],
        ['RAKBANK Business', 'Trading & Mainland (AED 25k-50k AMB)', '7-14 Business Days'],
      ],
      fonts
    );

    drawBulletList(
      doc,
      [
        {
          title: 'UBO & Source-of-Funds Dossier',
          body: 'Prepare 6 months of personal bank statements, shareholder CV/LinkedIn history, corporate website, and sample supplier/client invoices before opening your bank application.',
        },
        {
          title: 'Activity-to-Website Consistency',
          body: 'Compliance officers cross-check your Trade License activity wording against your public website and domain email (avoid consumer webmail domains).',
        },
      ],
      y,
      fonts
    );
    drawPageFooter(doc, fonts);

    // =========================================================
    // PAGE 8: 3-STEP WORKFLOW & LIVE TRACKING
    // =========================================================
    doc.addPage();
    drawPageHeader(doc, 8, 'Digital Onboarding Workflow', logoPath, fonts);
    y = drawSectionHeading(doc, 'Section 07', '3-Step Digital Incorporation & Live Tracking', 76, fonts);

    y = drawBulletList(
      doc,
      [
        {
          title: 'Step 01 - Scope Lock & Passport KYC (Day 1)',
          body: 'Select your jurisdiction, business activity, and visa quota via the simplybiznest.com calculator to receive your unique SBN-XXXXXX tracking reference and upload passport/UBO KYC.',
        },
        {
          title: 'Step 02 - Trade Name & E-License Issuance (Days 2-5)',
          body: 'We submit your trade name reservation, draft and execute digital MOA/Articles, remit statutory fees, and deliver your official UAE Trade License and Share Certificate.',
        },
        {
          title: 'Step 03 - Residency Visa, Emirates ID & Bank Activation (Days 6-14)',
          body: 'Complete Establishment Card filing, VIP medical & Emirates ID biometrics in Dubai, and submit your pre-audited KYC pack to Wio Business, Mashreq NeoBiz, or RAKBANK.',
        },
      ],
      y,
      fonts
    );

    drawTableRows(
      doc,
      y + 4,
      ['Tracker Milestone', 'Operational Event', 'Visibility'],
      [
        ['01. Quote Locked', 'Package parameters & AED fee frozen', 'Live via SBN ID'],
        ['02. Passport KYC', 'UBO & compliance check completed', 'Live via SBN ID'],
        ['03. Trade Name', 'Registrar name & initial approval', 'Live via SBN ID'],
        ['04. E-License Issued', 'Incorporation & License delivered', 'Live via SBN ID'],
        ['05. Emirates ID & Bank', 'Biometrics & banking KYC submitted', 'Live via SBN ID'],
        ['06. Active Company', 'IBAN active & statutory files ready', 'Live via SBN ID'],
      ],
      fonts
    );
    drawPageFooter(doc, fonts);

    // =========================================================
    // PAGE 9: CORPORATE TAX, VAT & COMPLIANCE
    // =========================================================
    doc.addPage();
    drawPageHeader(doc, 9, 'Tax & Regulatory Compliance', logoPath, fonts);
    y = drawSectionHeading(
      doc,
      'Section 08',
      'UAE 9% Corporate Tax, Small Business Relief & VAT',
      76,
      fonts
    );

    y = drawTableRows(
      doc,
      y,
      ['Statutory Obligation', 'Applicability Threshold', 'Rate / Action'],
      [
        ['FTA Corporate Tax Reg.', 'Mandatory for all UAE companies', 'Required within window'],
        ['Corporate Tax (Standard)', 'Net profits above AED 375,000', '9% (0% below threshold)'],
        ['Small Business Relief', 'Gross revenue <= AED 3,000,000', '0% election available'],
        ['VAT Registration', 'Taxable supplies > AED 375,000 / 12m', '5% standard VAT'],
        ['UBO & ESR Registers', 'All Free Zone & Mainland entities', 'Annual maintenance'],
      ],
      fonts
    );

    drawBulletList(
      doc,
      [
        {
          title: 'Qualifying Free Zone Person (QFZP) Advantage',
          body: 'Free Zone companies meeting economic substance requirements and deriving Qualifying Income from approved transactions can retain a 0% Corporate Tax rate subject to annual audited financials.',
        },
        {
          title: 'Mandatory FTA Registration',
          body: 'Even entities eligible for 0% Corporate Tax or Small Business Relief must obtain an FTA Corporate Tax TRN to remain compliant and avoid administrative penalties.',
        },
      ],
      y,
      fonts
    );
    drawPageFooter(doc, fonts);

    // =========================================================
    // PAGE 10: LEGAL DISCLAIMER & ENGAGEMENT DESK
    // =========================================================
    doc.addPage();
    drawPageHeader(doc, 10, 'Disclaimer & Engagement Desk', logoPath, fonts);
    y = drawSectionHeading(
      doc,
      'Section 09',
      'Regulatory Disclaimer, Refund Policy & Next Steps',
      76,
      fonts
    );

    y = drawBulletList(
      doc,
      [
        {
          title: 'Regulatory & Pricing Disclaimer',
          body: 'All AED figures in this proposal reflect prevailing 2026 UAE Free Zone, Dubai DET, and immigration fee schedules and are subject to final authority tariff confirmation upon exact activity code selection.',
        },
        {
          title: 'Refund Policy Summary',
          body: 'Unspent retainers are refundable prior to government filing less a standard AED 500 compliance review fee. Authority fees already remitted to UAE registrars are non-refundable.',
        },
        {
          title: 'Corporate Banking Independence',
          body: 'simplybiznest.com provides comprehensive pre-KYC preparation and bank introductions; final account approval rests exclusively with the regulated UAE financial institution.',
        },
      ],
      y,
      fonts
    );

    const boxY = Math.min(y + 14, 620);
    doc.roundedRect(40, boxY, 515, 126, 8).fill(NAVY);
    doc.rect(40, boxY, 515, 4).fill(COBALT);
    doc
      .fillColor('#93C5FD')
      .font(fonts.bold)
      .fontSize(10)
      .text('READY TO LOCK YOUR UAE FORMATION SCOPE?', 62, boxY + 24, { lineBreak: false });
    doc
      .fillColor(WHITE)
      .font(fonts.bold)
      .fontSize(17)
      .text('Connect with the simplybiznest.com Advisory Desk', 62, boxY + 44, {
        lineBreak: false,
      });
    doc
      .fillColor('#CBD5E1')
      .font(fonts.regular)
      .fontSize(11)
      .text('Email: info@simplybiznest.com', 62, boxY + 78, { lineBreak: false });
    doc
      .fillColor('#93C5FD')
      .font(fonts.bold)
      .fontSize(11)
      .text('Web: https://simplybiznest.com', 62, boxY + 98, { lineBreak: false });

    drawPageFooter(doc, fonts);
    doc.end();
  });
}
