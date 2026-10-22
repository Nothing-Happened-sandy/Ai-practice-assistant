import React, { useState } from 'react';
import {
  Usb,
  Smartphone,
  Laptop,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  X,
  Wifi,
  ShieldCheck,
  Terminal,
  Zap,
} from 'lucide-react';

interface UsbConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export const UsbConnectModal: React.FC<UsbConnectModalProps> = ({
  isOpen,
  onClose,
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState<'adb' | 'tether' | 'wifi'>('adb');
  const [copiedCmd, setCopiedCmd] = useState(false);

  if (!isOpen) return null;

  const adbCommand = 'adb reverse tcp:5173 tcp:5173';

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(adbCommand);
    setCopiedCmd(true);
    onToast('success', 'Command copied to clipboard!');
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const currentHost = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Usb className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Connect Phone via USB Cable
                <span className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                  Zero Latency
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Connect phone and PC directly without relying on Wi-Fi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Option Tabs */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setActiveTab('adb')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'adb'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Usb className="w-3.5 h-3.5" />
            <span>USB Port Forward (ADB)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tether')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'tether'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>USB Tethering</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('wifi')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'wifi'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Wi-Fi Network</span>
          </button>
        </div>

        {/* Tab 1: ADB Reverse */}
        {activeTab === 'adb' && (
          <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 flex items-start gap-3">
              <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 dark:text-white">Why USB ADB is recommended:</span>
                <p className="mt-0.5 text-slate-600 dark:text-slate-300">
                  It maps the PC port directly into the phone as <code className="bg-indigo-100 dark:bg-indigo-900 px-1 py-0.5 rounded text-[11px]">http://localhost:5173</code>. Android treats localhost as a <strong>Secure Context</strong>, unlocking camera, high resolution, and instant speed!
                </p>
              </div>
            </div>

            <ol className="space-y-3 list-decimal list-inside pl-1 text-slate-700 dark:text-slate-300">
              <li>
                Connect your Android phone to your PC with a <strong>USB data cable</strong>.
              </li>
              <li>
                Enable <strong>USB Debugging</strong> on your phone (under <em>Settings &gt; Developer Options</em>).
              </li>
              <li>
                Open PowerShell or Command Prompt on your PC and run:
                <div className="mt-2 flex items-center justify-between p-3 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs border border-slate-800">
                  <span>{adbCommand}</span>
                  <button
                    type="button"
                    onClick={handleCopyCmd}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors ml-2"
                    title="Copy command"
                  >
                    {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </li>
              <li>
                On your phone, open Chrome and visit:{' '}
                <a
                  href="http://localhost:5173"
                  className="font-mono text-indigo-600 dark:text-indigo-400 underline font-semibold"
                >
                  http://localhost:5173
                </a>
              </li>
            </ol>
          </div>
        )}

        {/* Tab 2: USB Tethering */}
        {activeTab === 'tether' && (
          <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <p>
              If you don&apos;t have ADB installed, you can use built-in <strong>Android USB Tethering</strong>:
            </p>
            <ol className="space-y-2.5 list-decimal list-inside pl-1">
              <li>Connect phone to PC with a USB cable.</li>
              <li>On your phone, go to <strong>Settings &gt; Network &amp; Internet &gt; Hotspot &amp; Tethering</strong>.</li>
              <li>Toggle on <strong>USB Tethering</strong>.</li>
              <li>Your PC and phone are now on a direct high-speed private network.</li>
              <li>
                Open the app on your phone browser using your PC&apos;s local network IP address:
                <div className="mt-1.5 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono text-indigo-600 dark:text-indigo-400">
                  {currentHost}
                </div>
              </li>
            </ol>
          </div>
        )}

        {/* Tab 3: Wi-Fi */}
        {activeTab === 'wifi' && (
          <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <p>
              Connect phone and PC to the same Wi-Fi router:
            </p>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-semibold text-slate-900 dark:text-white">Wi-Fi Access Address:</span>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">
                {currentHost}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Type this exact address into Google Chrome or Safari on your phone.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
