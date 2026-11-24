import { useEffect, useState } from 'react';
import { AdminDashboard } from './components/AdminDashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FloatingAdvisor } from './components/FloatingAdvisor';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { SubPageViews } from './components/SubPageViews';
import { DEFAULT_BLOG_POSTS, DEFAULT_NAV_ITEMS, DEFAULT_SITE_CONFIG } from './data/defaults';
import {
  subscribeBlogPosts,
  subscribeNavItems,
  subscribeSiteConfig,
} from './lib/firestoreService';
import { BlogPost, NavMenuItem, SiteConfig } from './types';

function checkIsAdminRoute(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hash === '#admin' || window.location.pathname === '/admin';
}

export default function App() {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
  const [navItems, setNavItems] = useState<NavMenuItem[]>(DEFAULT_NAV_ITEMS);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(DEFAULT_BLOG_POSTS);

  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(checkIsAdminRoute);
  const [activeSlug, setActiveSlug] = useState<string>('home');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [externalTrackerCode, setExternalTrackerCode] = useState<string | null>(null);

  useEffect(() => {
    const syncRoute = () => setIsAdminRoute(checkIsAdminRoute());
    window.addEventListener('hashchange', syncRoute);
    window.addEventListener('popstate', syncRoute);
    return () => {
      window.removeEventListener('hashchange', syncRoute);
      window.removeEventListener('popstate', syncRoute);
    };
  }, []);

  useEffect(() => {
    const u1 = subscribeSiteConfig(setConfig);
    const u2 = subscribeNavItems(false, setNavItems);
    const u3 = subscribeBlogPosts(false, setBlogPosts);
    return () => {
      u1();
      u2();
      u3();
    };
  }, []);

  // Dynamically sync browser favicon with CMS faviconUrl
  useEffect(() => {
    if (!config.faviconUrl) return;
    const link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (link) {
      link.href = config.faviconUrl;
    }
  }, [config.faviconUrl]);

  const handleNavigate = (slug: string) => {
    setSelectedPost(null);
    setActiveSlug(slug);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleJumpToSection = (sectionId: string) => {
    if (activeSlug !== 'home') {
      setSelectedPost(null);
      setActiveSlug('home');
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectPost = (post: BlogPost) => {
    setActiveSlug('guides');
    setSelectedPost(post);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExitAdmin = () => {
    window.history.pushState({}, '', '/');
    window.location.hash = '';
    setIsAdminRoute(false);
    setActiveSlug('home');
  };

  return (
    <ErrorBoundary>
      {isAdminRoute ? (
        <AdminDashboard config={config} onExitAdmin={handleExitAdmin} />
      ) : (
        <div className="min-h-screen flex flex-col bg-white text-[#1E293B]">
          <Header
            config={config}
            navItems={navItems}
            activeSlug={activeSlug}
            onNavigate={handleNavigate}
          />

          <main className="flex-1">
            {activeSlug === 'home' ? (
              <HomeView
                config={config}
                blogPosts={blogPosts}
                externalTrackerCode={externalTrackerCode}
                onNavigate={handleNavigate}
                onSelectPost={handleSelectPost}
              />
            ) : (
              <SubPageViews
                slug={activeSlug}
                config={config}
                navItems={navItems}
                blogPosts={blogPosts}
                selectedPost={selectedPost}
                onSelectPost={setSelectedPost}
                onNavigate={handleNavigate}
              />
            )}
          </main>

          <Footer
            config={config}
            navItems={navItems}
            onNavigate={handleNavigate}
            onJumpToSection={handleJumpToSection}
          />

          <FloatingAdvisor
            config={config}
            onTrackCode={(code) => {
              setExternalTrackerCode(code);
              handleJumpToSection('tracker');
            }}
          />
        </div>
      )}
    </ErrorBoundary>
  );
}
