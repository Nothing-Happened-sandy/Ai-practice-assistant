import React, { useState } from 'react';
import { ShieldAlert, X, ExternalLink, HelpCircle } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);
  const [showFullNotice, setShowFullNotice] = useState(false);

  if (dismissed) return null;

  return (
    <>
      <aside aria-label="Educational Practice and Privacy Notice" className="bg-indigo-950 text-indigo-100 border-b border-indigo-800/60 px-4 py-2.5 text-xs sm:text-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 shrink-0 animate-ping" />
            <ShieldAlert className="w-4 h-4 text-amber-300 shrink-0" />
            <p className="truncate">
              <strong className="font-semibold text-white">Educational Practice Only:</strong> Designed for mock exams, aptitude training, and authorized study sessions. Does not defeat test proctoring or bypass assessment rules.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowFullNotice(true)}
              className="text-xs text-indigo-200 hover:text-white underline font-medium inline-flex items-center gap-1"
            >
              Privacy & Usage Policy
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 rounded text-indigo-300 hover:text-white hover:bg-indigo-800/50 transition-colors"
              title="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Full Modal Policy */}
      {showFullNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Ethical Use & Privacy Statement
                </h3>
              </div>
              <button
                onClick={() => setShowFullNotice(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                <strong>1. Intended Educational Purpose:</strong> This application serves as a personal tutor to explain mathematical formulas, verbal reasoning logic, and algorithmic coding concepts during homework, self-study, and mock preparations.
              </p>
              <p>
                <strong>2. Proctored Testing & Academic Integrity:</strong> This application does not contain stealth modes, tab-switch evasion, or proctor-circumvention tools. Do not use this tool during live, unpermitted exams or corporate hiring assessments where external AI tools are prohibited.
              </p>
              <p>
                <strong>3. Bring-Your-Own-Key (BYOK) Data Flow:</strong> When using your Gemini API key, questions and images are sent directly from your browser to Google Generative AI servers over encrypted HTTPS. No API keys or queries are collected or stored on any intermediate third-party servers.
              </p>
              <p>
                <strong>4. Local Storage & Sensitive Info:</strong> Solution history is saved strictly in your browser&apos;s local storage. Never upload sensitive personal data, proprietary company code, or private credentials.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowFullNotice(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition-colors"
              >
                I Understand & Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
