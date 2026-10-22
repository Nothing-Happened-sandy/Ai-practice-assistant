import React, { useState } from 'react';
import { GeminiConfig } from '../types';
import {
  BrainCircuit,
  Code2,
  Tv,
  BookOpen,
  Key,
  Sun,
  Moon,
  Menu,
  X,
  CheckCircle2,
  AlertCircle,
  Usb,
} from 'lucide-react';

export type ActiveTab = 'workspace' | 'coding' | 'companion' | 'history';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  geminiConfig: GeminiConfig;
  onOpenSettings: () => void;
  onOpenUsbConnect: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  isScreenSharingActive?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  geminiConfig,
  onOpenSettings,
  onOpenUsbConnect,
  theme,
  onToggleTheme,
  isScreenSharingActive = false,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const hasApiKey = Boolean(geminiConfig.apiKey && geminiConfig.apiKey.trim());

  const navItems = [
    {
      id: 'workspace' as ActiveTab,
      label: 'Question Solver',
      sublabel: 'Photo & Aptitude',
      icon: <BrainCircuit className="w-4 h-4" />,
    },
    {
      id: 'coding' as ActiveTab,
      label: 'Coding Lab',
      sublabel: 'Algorithms & Complexity',
      icon: <Code2 className="w-4 h-4" />,
    },
    {
      id: 'companion' as ActiveTab,
      label: 'Screen Companion',
      sublabel: 'PC to Phone',
      icon: <Tv className="w-4 h-4" />,
      badge: isScreenSharingActive ? 'LIVE' : undefined,
    },
    {
      id: 'history' as ActiveTab,
      label: 'Notebook',
      sublabel: 'Saved Solutions',
      icon: <BookOpen className="w-4 h-4" />,
    },
  ];

  const handleTabClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => handleTabClick('workspace')}>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                  Aptitude Friend
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Utility Buttons */}
          <div className="flex items-center gap-2">
            {/* USB Connect Option Button */}
            <button
              onClick={onOpenUsbConnect}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-all"
              title="Connect Phone via USB Cable"
            >
              <Usb className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">USB Connect</span>
            </button>

            {/* API Key Status Pill */}
            <button
              onClick={onOpenSettings}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                hasApiKey
                  ? 'border-emerald-200 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                  : 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 animate-pulse'
              }`}
              title="Configure your Google Gemini API Key"
            >
              {hasApiKey ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="hidden sm:inline">Gemini 3.8 Ready</span>
                  <span className="sm:hidden">Ready</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Set API Key</span>
                </>
              )}
            </button>

            {/* Dark / Light Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenUsbConnect();
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
            >
              <Usb className="w-4 h-4" />
              <span>USB Connect Guide</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
