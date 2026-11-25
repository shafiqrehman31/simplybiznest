import { FileDown, Mail, MessageCircle } from 'lucide-react';
import { DEFAULT_FOOTER_LOGO, DEFAULT_SITE_CONFIG } from '../data/defaults';
import { NavMenuItem, SiteConfig } from '../types';

function sanitizeExternalUrl(raw?: string): string | null {
  const val = (raw || '').trim();
  if (!val) return null;
  if (/^(javascript|data|vbscript):/i.test(val)) return null;
  if (/^https?:\/\//i.test(val)) return val;
  return `https://${val.replace(/^\/+/, '')}`;
}

interface FooterProps {
  config: SiteConfig;
  navItems: NavMenuItem[];
  onNavigate: (slug: string) => void;
  onJumpToSection: (sectionId: string) => void;
}

export function Footer({ config, navItems, onNavigate, onJumpToSection }: FooterProps) {
  const visibleNav = navItems
    .filter((item) => item.visible)
    .sort((a, b) => a.order - b.order);

  const waUrl = `https://wa.me/${config.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    'Hi SimplyBizNest team, I would like a UAE company formation consultation.'
  )}`;

  const rawSocialChannels = [
    {
      key: 'linkedin',
      label: 'LinkedIn',
      url: sanitizeExternalUrl(config.socialLinkedin),
      fallbackUrl: DEFAULT_SITE_CONFIG.socialLinkedin || 'https://www.linkedin.com/company/simplybiznest',
    },
    {
      key: 'instagram',
      label: 'Instagram',
      url: sanitizeExternalUrl(config.socialInstagram),
      fallbackUrl: DEFAULT_SITE_CONFIG.socialInstagram || 'https://www.instagram.com/simplybiznest',
    },
    {
      key: 'facebook',
      label: 'Facebook',
      url: sanitizeExternalUrl(config.socialFacebook),
      fallbackUrl: DEFAULT_SITE_CONFIG.socialFacebook || 'https://www.facebook.com/simplybiznest',
    },
    {
      key: 'x',
      label: 'X',
      url: sanitizeExternalUrl(config.socialX),
      fallbackUrl: DEFAULT_SITE_CONFIG.socialX || 'https://x.com/simplybiznest',
    },
    {
      key: 'youtube',
      label: 'YouTube',
      url: sanitizeExternalUrl(config.socialYoutube),
      fallbackUrl: DEFAULT_SITE_CONFIG.socialYoutube || 'https://www.youtube.com/@simplybiznest',
    },
  ] as const;

  const hasConfiguredSocial = rawSocialChannels.some((ch) => Boolean(ch.url));
  const activeSocials = hasConfiguredSocial
    ? rawSocialChannels.filter((ch): ch is (typeof rawSocialChannels)[number] & { url: string } => Boolean(ch.url))
    : rawSocialChannels.map((ch) => ({ ...ch, url: ch.fallbackUrl }));

  return (
    <footer className="bg-[#0C1A38] text-white border-t border-[#1F65ED]/30 pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Column 1: Brand Lockup & Social Icons */}
          <div>
            <img
              src={config.footerLogoUrl || DEFAULT_FOOTER_LOGO}
              alt={config.siteName}
              referrerPolicy="no-referrer"
              className="h-24 sm:h-28 w-auto max-w-[260px] object-contain"
            />
            <p className="mt-4 text-sm text-[#CBD5E1] leading-relaxed">
              SimplyBizNest VIP Express Desk for UAE Free Zone and Dubai Mainland DET company
              formation, transparent government-vs-service fee splits, and KYC banking readiness.
            </p>
            <ul className="mt-5 flex flex-wrap items-center gap-2.5" aria-label="Social Media Channels">
              {activeSocials.map((ch) => (
                <li key={ch.key}>
                  <a
                    href={ch.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${config.siteName} on ${ch.label}`}
                    title={ch.label}
                    className="w-9 h-9 rounded-lg border border-white/15 bg-white/5 hover:bg-[#1F65ED] hover:border-[#1F65ED] text-[#CBD5E1] hover:text-white inline-flex items-center justify-center transition-colors"
                  >
                    {ch.key === 'linkedin' && (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                      </svg>
                    )}
                    {ch.key === 'instagram' && (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                      </svg>
                    )}
                    {ch.key === 'facebook' && (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z" />
                      </svg>
                    )}
                    {ch.key === 'x' && (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    )}
                    {ch.key === 'youtube' && (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Navigation */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#93C5FD] mb-4">
              Navigation
            </h3>
            <ul className="space-y-2.5 text-sm">
              {visibleNav.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onNavigate(item.slug)}
                    className="text-[#CBD5E1] hover:text-white transition-colors"
                  >
                    {item.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Express Tools */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#93C5FD] mb-4">
              VIP Express Tools
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => onJumpToSection('hero-express-form')}
                  className="text-[#CBD5E1] hover:text-white transition-colors"
                >
                  Instant Quote Form
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onJumpToSection('pricing-breakdown')}
                  className="text-[#CBD5E1] hover:text-white transition-colors"
                >
                  Govt vs. Service Fee Split
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onJumpToSection('tracker')}
                  className="text-[#CBD5E1] hover:text-white transition-colors"
                >
                  Live Application Tracker
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onJumpToSection('pre-footer-pdf')}
                  className="inline-flex items-center gap-1.5 text-white font-medium hover:text-[#93C5FD] transition-colors"
                >
                  <FileDown className="w-4 h-4 text-[#1F65ED]" />
                  <span>2026 UAE Setup Guide (PDF)</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Direct WhatsApp Desk & Legal */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#93C5FD] mb-4">
              Direct Advisory Desk
            </h3>
            <div className="space-y-3">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1F65ED] hover:bg-[#1750c4] text-white text-sm font-bold transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Talk to an Expert</span>
              </a>
              <div>
                <a
                  href={`mailto:${config.contactEmail}`}
                  className="inline-flex items-center gap-2 text-sm text-[#CBD5E1] hover:text-white transition-colors"
                >
                  <Mail className="w-4 h-4 text-[#93C5FD]" />
                  <span>{config.contactEmail}</span>
                </a>
              </div>
            </div>

            <h4 className="text-xs font-bold uppercase tracking-wider text-[#93C5FD] mt-6 mb-2.5">
              Legal &amp; Compliance
            </h4>
            <ul className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-[#CBD5E1]">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('legal-privacy')}
                  className="hover:text-white transition-colors"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('legal-terms')}
                  className="hover:text-white transition-colors"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('legal-refund')}
                  className="hover:text-white transition-colors"
                >
                  Refund Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('legal-disclaimer')}
                  className="hover:text-white transition-colors"
                >
                  Legal Disclaimer
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/15 space-y-2 text-xs text-[#94A3B8]">
          <p>
            Compliance Notice: Trade licenses and residency visas are issued solely by UAE Free
            Zone Authorities, Dubai DET, and ICP/GDRFA. Corporate bank accounts are subject to each
            regulated bank&apos;s independent KYC assessment.
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2">
            <p>© {new Date().getFullYear()} SimplyBizNest ({config.siteName}). All rights reserved.</p>
            <p>Digital UAE Corporate Advisory · {config.contactEmail}</p>
          </div>
        </div>
      </div>

      {/* Sticky Mobile WhatsApp Bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E2E8F0] px-4 py-2.5">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 rounded-lg bg-[#1F65ED] hover:bg-[#1750c4] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
        >
          <MessageCircle className="w-4 h-4 shrink-0" />
          <span>Get Instant Quote on WhatsApp</span>
        </a>
      </div>
    </footer>
  );
}
