import { Menu, MessageCircle, X } from 'lucide-react';
import { useState } from 'react';
import { DEFAULT_HEADER_LOGO } from '../data/defaults';
import { NavMenuItem, SiteConfig } from '../types';

interface HeaderProps {
  config: SiteConfig;
  navItems: NavMenuItem[];
  activeSlug: string;
  onNavigate: (slug: string) => void;
}

export function Header({ config, navItems, activeSlug, onNavigate }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleNav = navItems
    .filter((item) => item.visible)
    .sort((a, b) => a.order - b.order)
    .slice(0, 6);

  const waUrl = `https://wa.me/${config.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    'Hi SimplyBizNest team, I would like to speak with a UAE setup expert.'
  )}`;

  const handleNavClick = (slug: string) => {
    setMobileOpen(false);
    onNavigate(slug);
  };

  return (
    <header className="sticky top-0 z-40 h-20 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Logo */}
        <button
          type="button"
          onClick={() => handleNavClick('home')}
          className="flex items-center shrink-0 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F65ED] rounded py-1"
          aria-label={`${config.siteName} Home`}
        >
          <img
            src={config.headerLogoUrl || DEFAULT_HEADER_LOGO}
            alt={config.siteName}
            referrerPolicy="no-referrer"
            className="h-16 sm:h-[76px] w-auto max-w-[260px] object-contain"
          />
        </button>

        {/* Zone 2: Single-line CMS Navigation */}
        <nav className="hidden md:flex items-center gap-6 overflow-x-auto" aria-label="Primary Navigation">
          {visibleNav.map((item) => {
            const isActive = activeSlug === item.slug;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.slug)}
                className={`text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                  isActive
                    ? 'text-[#0C1A38] border-[#1F65ED] font-bold'
                    : 'text-[#475569] border-transparent hover:text-[#0C1A38] hover:border-[#1F65ED]/40'
                }`}
              >
                {item.title}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action + Mobile Drawer Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1F65ED] hover:bg-[#1750c4] text-white text-sm font-bold whitespace-nowrap shrink-0 transition-colors"
          >
            <MessageCircle className="w-4 h-4 shrink-0" />
            <span>Talk to an Expert</span>
          </a>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[#E2E8F0] text-[#0C1A38] hover:bg-[#F8FAFC]"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-[#E2E8F0] px-4 py-4 shadow-lg">
          <nav className="flex flex-col gap-1" aria-label="Mobile Navigation">
            {visibleNav.map((item) => {
              const isActive = activeSlug === item.slug;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.slug)}
                  className={`text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#F8FAFC] text-[#0C1A38] font-bold'
                      : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0C1A38]'
                  }`}
                >
                  {item.title}
                </button>
              );
            })}
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#1F65ED] text-white text-sm font-bold"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Talk to an Expert</span>
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
