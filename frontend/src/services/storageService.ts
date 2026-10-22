import { GeminiConfig, HistoryItem, AiProvider } from '../types';

const SESSION_KEY = 'ai_practice_key_session';
const LOCAL_KEY = 'ai_practice_key_local';
const PROVIDER_KEY = 'ai_practice_provider';
const MODEL_KEY = 'ai_practice_model';
const CUSTOM_BASE_URL_KEY = 'ai_practice_custom_base_url';
const STORAGE_PREF_KEY = 'ai_practice_storage_pref';
const HISTORY_KEY = 'ai_practice_history_v1';
const THEME_KEY = 'ai_practice_theme';

export const storageService = {
  // --- AI Provider & Config ---
  getGeminiConfig(): GeminiConfig {
    const storagePref = (localStorage.getItem(STORAGE_PREF_KEY) as 'session' | 'local') || 'session';
    const provider = (localStorage.getItem(PROVIDER_KEY) as AiProvider) || 'gemini';
    const customBaseUrl = localStorage.getItem(CUSTOM_BASE_URL_KEY) || '';

    let model = localStorage.getItem(MODEL_KEY) || '';
    if (!model) {
      model = provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini';
    }

    let apiKey = '';
    if (storagePref === 'local') {
      apiKey = localStorage.getItem(LOCAL_KEY) || '';
    } else {
      apiKey = sessionStorage.getItem(SESSION_KEY) || '';
    }

    return {
      provider,
      apiKey,
      model,
      customBaseUrl,
      storageType: storagePref,
    };
  },

  saveGeminiConfig(config: GeminiConfig): void {
    localStorage.setItem(PROVIDER_KEY, config.provider);
    localStorage.setItem(MODEL_KEY, config.model);
    localStorage.setItem(STORAGE_PREF_KEY, config.storageType);
    if (config.customBaseUrl) {
      localStorage.setItem(CUSTOM_BASE_URL_KEY, config.customBaseUrl);
    } else {
      localStorage.removeItem(CUSTOM_BASE_URL_KEY);
    }

    if (config.storageType === 'local') {
      localStorage.setItem(LOCAL_KEY, config.apiKey);
      sessionStorage.removeItem(SESSION_KEY);
    } else {
      sessionStorage.setItem(SESSION_KEY, config.apiKey);
      localStorage.removeItem(LOCAL_KEY);
    }
  },

  clearGeminiKey(): void {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(LOCAL_KEY);
  },

  // --- History / Notebook Management ---
  getHistory(): HistoryItem[] {
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load history', e);
      return [];
    }
  },

  saveHistoryItem(item: HistoryItem): void {
    try {
      const history = this.getHistory();
      const updated = [item, ...history.filter(h => h.id !== item.id)].slice(0, 100);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save item to history', e);
    }
  },

  updateHistoryItem(id: string, updates: Partial<HistoryItem>): void {
    try {
      const history = this.getHistory();
      const updated = history.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            ...updates,
            solution: {
              ...item.solution,
              ...(updates.solution || {}),
            },
          };
        }
        return item;
      });
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to update item in history', e);
    }
  },

  deleteHistoryItem(id: string): HistoryItem[] {
    try {
      const history = this.getHistory();
      const updated = history.filter(item => item.id !== id);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Failed to delete history item', e);
      return [];
    }
  },

  toggleBookmark(id: string): HistoryItem[] {
    try {
      const history = this.getHistory();
      const updated = history.map(item =>
        item.id === id ? { ...item, bookmarked: !item.bookmarked } : item
      );
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Failed to toggle bookmark', e);
      return [];
    }
  },

  clearAllHistory(): void {
    localStorage.removeItem(HISTORY_KEY);
  },

  exportHistoryJSON(): string {
    const history = this.getHistory();
    return JSON.stringify(history, null, 2);
  },

  exportHistoryMarkdown(): string {
    const history = this.getHistory();
    if (history.length === 0) return '# Practice History\n\nNo records found.';

    return [
      '# AI Practice Assistant - Solved Question Notebook',
      `*Exported on ${new Date().toLocaleString()}*`,
      '',
      ...history.map((item, index) => {
        return [
          `## ${index + 1}. [${item.questionType.toUpperCase()}] ${item.title}`,
          `*Date: ${new Date(item.timestamp).toLocaleString()}*`,
          '',
          '### Question',
          item.questionText || '*(Image question)*',
          '',
          '### Answer',
          `**${item.solution.likelyAnswer}**`,
          '',
          item.solution.stepByStepExplanation?.length
            ? ['### Explanation', ...item.solution.stepByStepExplanation.map((step, sIdx) => `${sIdx + 1}. ${step}`)].join('\n')
            : '*(No explanation generated yet)*',
          '',
          item.solution.calculationReasoning ? `### Reasoning / Math\n${item.solution.calculationReasoning}\n` : '',
          '---',
        ].filter(Boolean).join('\n');
      }),
    ].join('\n');
  },

  // --- Theme preference ---
  getTheme(): 'dark' | 'light' {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  },

  saveTheme(theme: 'dark' | 'light'): void {
    localStorage.setItem(THEME_KEY, theme);
  },
};
