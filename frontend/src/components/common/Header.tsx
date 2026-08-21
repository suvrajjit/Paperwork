import React from 'react';
import { useApp } from '../../context/AppContext';
import { ScreenTab } from '../../types';
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  FolderLock,
  LayoutDashboard,
  Sparkles,
  User,
  LogOut,
  Terminal,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { language, setLanguage, activeTab, setActiveTab, user, signOut } = useApp();

  const navItems: Array<{ tab: ScreenTab; label_en: string; label_hi: string; icon: React.FC<any> }> = [
    { tab: 'dashboard', label_en: 'Dashboard', label_hi: 'डैशबोर्ड', icon: LayoutDashboard },
    { tab: 'form_workspace', label_en: 'Understand Form', label_hi: 'फॉर्म समझें', icon: FileText },
    { tab: 'eligibility', label_en: 'Eligibility', label_hi: 'पात्रता जांच', icon: ShieldCheck },
    { tab: 'document_review', label_en: 'Documents', label_hi: 'दस्तावेज़', icon: Sparkles },
    { tab: 'form_readiness', label_en: 'Prepare Plan', label_hi: 'तैयारी योजना', icon: CheckCircle2 },
    { tab: 'vault', label_en: 'Vault', label_hi: 'तिजोरी', icon: FolderLock },
    { tab: 'standalone_showcase', label_en: 'Module Demos', label_hi: 'मॉड्यूल डेमो', icon: Terminal },
  ];

  return (
    <header className="border-b border-paper-sand bg-paper-surface sticky top-0 z-40 shadow-xs">
      <div className="max-w-content mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          className="flex items-center gap-3 cursor-pointer select-none"
          onClick={() => setActiveTab(user ? 'dashboard' : 'welcome')}
        >
          <div className="w-9 h-9 rounded-lg bg-guidance text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-xs">
            EP
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg sm:text-xl tracking-tight text-ink">
                EasyPaper
              </span>
              <span className="hidden md:inline-flex text-[11px] px-2 py-0.5 rounded-full bg-guidance-light text-guidance font-semibold">
                {language === 'en' ? 'Bilingual Form Assistant' : 'द्विभाषी फॉर्म सहायक'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (when active) */}
        {user && (
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.tab;
              return (
                <button
                  key={item.tab}
                  onClick={() => setActiveTab(item.tab)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-guidance text-white shadow-xs'
                      : 'text-ink-muted hover:text-ink hover:bg-paper-canvas'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? item.label_en : item.label_hi}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Right Controls: Language Switch + User Status */}
        <div className="flex items-center gap-3">
          {/* Language Switch */}
          <div className="flex items-center rounded-lg border border-paper-sand p-0.5 bg-paper-canvas text-xs font-medium">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded transition-colors ${
                language === 'en'
                  ? 'bg-paper-surface text-ink font-semibold shadow-xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('hi')}
              className={`px-2.5 py-1 rounded transition-colors ${
                language === 'hi'
                  ? 'bg-paper-surface text-ink font-semibold shadow-xs font-devanagari'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              हिंदी
            </button>
          </div>

          {/* User Session status */}
          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-paper-canvas border border-paper-sand text-xs text-ink">
                <User className="w-3.5 h-3.5 text-guidance" />
                <span className="font-medium">{user.name}</span>
              </div>
              <button
                onClick={signOut}
                title={language === 'en' ? 'Exit session' : 'सत्र समाप्त करें'}
                className="p-1.5 text-ink-muted hover:text-error-brick rounded hover:bg-paper-canvas transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setActiveTab('dashboard')}
              className="text-xs font-semibold px-3.5 py-2 rounded-lg bg-guidance text-white hover:bg-guidance-hover transition-colors"
            >
              {language === 'en' ? 'Get Started' : 'प्रारंभ करें'}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      {user && (
        <div className="lg:hidden border-t border-paper-sand bg-paper-canvas overflow-x-auto py-1.5 px-3 flex gap-1 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.tab;
            return (
              <button
                key={item.tab}
                onClick={() => setActiveTab(item.tab)}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium whitespace-nowrap rounded ${
                  isActive
                    ? 'bg-guidance text-white font-semibold'
                    : 'text-ink-muted hover:text-ink bg-paper-surface'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{language === 'en' ? item.label_en : item.label_hi}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
