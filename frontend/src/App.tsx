import React, { useState, useEffect } from 'react';
import { GeminiConfig, ToastMessage } from './types';
import { storageService } from './services/storageService';
import { Navbar, ActiveTab } from './components/Navbar';
import { DisclaimerBanner } from './components/common/DisclaimerBanner';
import { ToastContainer } from './components/common/ToastContainer';
import { ApiKeyModal } from './components/Settings/ApiKeyModal';
import { UsbConnectModal } from './components/Companion/UsbConnectModal';
import { QuestionWorkspace } from './components/Workspace/QuestionWorkspace';
import { CodingWorkspace } from './components/Coding/CodingWorkspace';
import { ScreenCompanion } from './components/Companion/ScreenCompanion';
import { HistoryView } from './components/History/HistoryView';
import {
  BrainCircuit,
  ExternalLink,
  Usb,
} from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('workspace');
  const [geminiConfig, setGeminiConfig] = useState<GeminiConfig>(() => storageService.getGeminiConfig());
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isUsbModalOpen, setIsUsbModalOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => storageService.getTheme());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [capturedFrameForSolver, setCapturedFrameForSolver] = useState<string | null>(null);

  // Apply theme class to <html>
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    storageService.saveTheme(theme);
  }, [theme]);

  // Toast notification helper
  const addToast = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Callback when a frame is snapped in ScreenCompanion
  const handleFrameCapturedForSolving = (base64Image: string) => {
    setCapturedFrameForSolver(base64Image);
    setActiveTab('workspace');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Educational & Privacy Disclaimer Banner */}
      <DisclaimerBanner />

      {/* Global Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        geminiConfig={geminiConfig}
        onOpenSettings={() => setIsApiKeyModalOpen(true)}
        onOpenUsbConnect={() => setIsUsbModalOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        isScreenSharingActive={isScreenSharing}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'workspace' && (
          <QuestionWorkspace
            geminiConfig={geminiConfig}
            onOpenSettings={() => setIsApiKeyModalOpen(true)}
            onOpenUsbConnect={() => setIsUsbModalOpen(true)}
            onToast={addToast}
            initialImageBase64={capturedFrameForSolver}
            onClearInitialImage={() => setCapturedFrameForSolver(null)}
          />
        )}

        {activeTab === 'coding' && (
          <CodingWorkspace
            geminiConfig={geminiConfig}
            onOpenSettings={() => setIsApiKeyModalOpen(true)}
            onToast={addToast}
          />
        )}

        {activeTab === 'companion' && (
          <ScreenCompanion
            onFrameCapturedForSolving={handleFrameCapturedForSolving}
            onToast={addToast}
            isSharing={isScreenSharing}
            setIsSharing={setIsScreenSharing}
            onOpenUsbConnect={() => setIsUsbModalOpen(true)}
            geminiConfig={geminiConfig}
          />
        )}

        {activeTab === 'history' && <HistoryView onToast={addToast} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-xs text-slate-500 dark:text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-indigo-500" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Aptitude Friend
            </span>
            <span>• {geminiConfig.provider.toUpperCase()} AI</span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={() => setIsUsbModalOpen(true)}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 inline-flex items-center gap-1"
            >
              <Usb className="w-3.5 h-3.5" />
              <span>USB Connect</span>
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <button
              onClick={() => setIsApiKeyModalOpen(true)}
              className="hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              AI &amp; Model Settings
            </button>
          </div>
        </div>
      </footer>

      {/* Floating Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* API Key BYOK Settings Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onConfigSaved={(newConfig) => setGeminiConfig(newConfig)}
        onToast={addToast}
      />

      {/* USB Connect Guide Modal */}
      <UsbConnectModal
        isOpen={isUsbModalOpen}
        onClose={() => setIsUsbModalOpen(false)}
        onToast={addToast}
      />
    </div>
  );
};

export default App;
