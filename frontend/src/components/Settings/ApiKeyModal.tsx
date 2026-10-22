import React, { useState, useEffect } from 'react';
import { GeminiConfig, AiProvider } from '../../types';
import { storageService } from '../../services/storageService';
import { aiClient } from '../../services/aiClient';
import {
  Key,
  Eye,
  EyeOff,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Cpu,
  Loader2,
  X,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: (config: GeminiConfig) => void;
  onToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
  onToast,
}) => {
  const [config, setConfig] = useState<GeminiConfig>(storageService.getGeminiConfig());
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [customModelInput, setCustomModelInput] = useState('');
  const [customBaseUrlInput, setCustomBaseUrlInput] = useState('');
  const [availableGeminiModels, setAvailableGeminiModels] = useState<string[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const current = storageService.getGeminiConfig();
      setConfig(current);
      setApiKeyInput(current.apiKey);
      setCustomModelInput(current.model);
      setCustomBaseUrlInput(current.customBaseUrl || '');
      setTestResult(null);

      if (current.provider === 'gemini' && current.apiKey) {
        fetchModels(current.apiKey);
      }
    }
  }, [isOpen]);

  const fetchModels = async (key: string) => {
    if (!key.trim()) return;
    setIsFetchingModels(true);
    try {
      const models = await aiClient.listAvailableGeminiModels(key);
      if (models.length > 0) {
        setAvailableGeminiModels(models);
        // If current model is invalid or not in list, pick the first working flash model
        if (!customModelInput || !models.includes(customModelInput)) {
          const best = models.find(m => m.includes('flash')) || models[0];
          setCustomModelInput(best);
        }
      }
    } finally {
      setIsFetchingModels(false);
    }
  };

  if (!isOpen) return null;

  const handleProviderChange = (provider: AiProvider) => {
    let defaultModel = 'gemini-3.8-flash';
    if (provider === 'openai') defaultModel = 'gpt-4o-mini';
    if (provider === 'groq') defaultModel = 'llama-3.2-11b-vision-preview';
    if (provider === 'custom') defaultModel = 'deepseek-chat';

    setConfig({ ...config, provider, model: defaultModel });
    setCustomModelInput(defaultModel);
    setTestResult(null);
  };

  const handleTestKey = async () => {
    if (!apiKeyInput.trim()) {
      setTestResult({ success: false, message: 'Please enter an API key to test.' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const testConfig: GeminiConfig = {
      provider: config.provider,
      apiKey: apiKeyInput.trim(),
      model: customModelInput.trim() || config.model,
      customBaseUrl: customBaseUrlInput.trim() || undefined,
      storageType: config.storageType,
    };

    try {
      const res = await aiClient.testApiKey(testConfig);
      if (res.availableModels && res.availableModels.length > 0) {
        setAvailableGeminiModels(res.availableModels);
      }

      setTestResult({
        success: true,
        message: `Verified! Active on ${config.provider.toUpperCase()} (${res.model}) in ${res.latencyMs}ms`,
        latencyMs: res.latencyMs,
      });
      onToast('success', `Connection active (${res.latencyMs}ms)!`);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Key test failed.',
      });
      onToast('error', err.message || 'Key test failed');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    const updatedConfig: GeminiConfig = {
      provider: config.provider,
      apiKey: apiKeyInput.trim(),
      model: customModelInput.trim() || config.model,
      customBaseUrl: customBaseUrlInput.trim() || undefined,
      storageType: config.storageType,
    };
    storageService.saveGeminiConfig(updatedConfig);
    setConfig(updatedConfig);
    onConfigSaved(updatedConfig);
    onToast('success', `${config.provider.toUpperCase()} settings saved!`);
    onClose();
  };

  const handleClear = () => {
    storageService.clearGeminiKey();
    setApiKeyInput('');
    const clearedConfig: GeminiConfig = {
      ...config,
      apiKey: '',
    };
    setConfig(clearedConfig);
    onConfigSaved(clearedConfig);
    setTestResult(null);
    onToast('info', 'API key cleared.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                AI Provider &amp; Model Setup
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose any AI (Gemini, Groq, OpenAI, or Custom)
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

        {/* AI Provider Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Select AI Provider
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'gemini', label: 'Google Gemini', badge: 'Default' },
              { id: 'groq', label: 'Groq Cloud', badge: 'Ultra Fast' },
              { id: 'openai', label: 'OpenAI', badge: 'GPT-4o' },
              { id: 'custom', label: 'Custom / OpenRouter', badge: 'Custom' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleProviderChange(p.id as AiProvider)}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  config.provider === p.id
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 ring-1 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40'
                }`}
              >
                <span className="text-xs font-bold text-slate-900 dark:text-white">{p.label}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{p.badge}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Provider Quick Links */}
        {config.provider === 'gemini' && (
          <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/50 flex items-center justify-between gap-3 text-xs">
            <span className="text-slate-600 dark:text-slate-300">Google AI Studio API Key (Free tier):</span>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl font-semibold flex items-center gap-1 shrink-0"
            >
              <span>Get Gemini Key</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {config.provider === 'groq' && (
          <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/50 flex items-center justify-between gap-3 text-xs">
            <span className="text-slate-600 dark:text-slate-300">Free Groq Key (Fastest AI, zero 503 errors):</span>
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-amber-600 text-white rounded-xl font-semibold flex items-center gap-1 shrink-0"
            >
              <span>Get Groq Key</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* API Key Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center justify-between">
            <span>{config.provider.toUpperCase()} API Key</span>
            {config.apiKey && (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium normal-case flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3 h-3" /> Key Active
              </span>
            )}
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKeyInput}
              onChange={(e) => {
                setApiKeyInput(e.target.value);
                setTestResult(null);
                if (config.provider === 'gemini' && e.target.value.length > 20) {
                  fetchModels(e.target.value);
                }
              }}
              placeholder={config.provider === 'gemini' ? 'AIzaSy...' : 'sk-...'}
              className="w-full pl-3 pr-20 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Model Name Input (User's choice of model) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Model Name (Your Choice)
            </label>
            {config.provider === 'gemini' && (
              <button
                type="button"
                onClick={() => fetchModels(apiKeyInput)}
                disabled={isFetchingModels || !apiKeyInput}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold inline-flex items-center gap-1 disabled:opacity-40"
              >
                <RefreshCw className={`w-3 h-3 ${isFetchingModels ? 'animate-spin' : ''}`} />
                <span>Auto-Detect My Models</span>
              </button>
            )}
          </div>
          <input
            type="text"
            value={customModelInput}
            onChange={(e) => setCustomModelInput(e.target.value)}
            placeholder="e.g. gemini-3.8-flash, gemini-2.0-flash, gpt-4o-mini..."
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {/* Dynamic Available Models for Gemini */}
          {config.provider === 'gemini' && (
            <div className="space-y-1 pt-1">
              <span className="text-[10px] text-slate-400">Available models for your key:</span>
              <div className="flex flex-wrap gap-1.5">
                {(availableGeminiModels.length > 0 ? availableGeminiModels : ['gemini-3.8-flash', 'gemini-2.0-flash', 'gemini-2.5-flash']).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setCustomModelInput(m)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all ${
                      customModelInput === m
                        ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}

          {config.provider === 'groq' && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['llama-3.2-11b-vision-preview', 'llama-3.3-70b-versatile'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setCustomModelInput(m)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all ${
                    customModelInput === m
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          )}

          {config.provider === 'openai' && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['gpt-4o-mini', 'gpt-4o'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setCustomModelInput(m)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all ${
                    customModelInput === m
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Custom Base URL */}
        {config.provider === 'custom' && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Custom Base URL (OpenAI-compatible)
            </label>
            <input
              type="text"
              value={customBaseUrlInput}
              onChange={(e) => setCustomBaseUrlInput(e.target.value)}
              placeholder="https://openrouter.ai/api/v1/chat/completions"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}

        {/* Test Result Indicator */}
        {testResult && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              testResult.success
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/30 border-rose-500/30 text-rose-800 dark:text-rose-300'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <p className="font-medium">{testResult.message}</p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleClear}
            disabled={!apiKeyInput && !config.apiKey}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Key</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestKey}
              disabled={isTesting || !apiKeyInput.trim()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40"
            >
              {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>{isTesting ? 'Testing...' : 'Test Key'}</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
