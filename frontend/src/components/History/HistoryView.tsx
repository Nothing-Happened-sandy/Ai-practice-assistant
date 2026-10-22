import React, { useState, useEffect } from 'react';
import { HistoryItem, QuestionType } from '../../types';
import { storageService } from '../../services/storageService';
import { SolutionCard } from '../Workspace/SolutionCard';
import {
  BookOpen,
  Search,
  Bookmark,
  Trash2,
  Download,
  FileText,
  Calendar,
  Sparkles,
  ExternalLink,
  X,
  Filter,
  Eye,
  Check,
} from 'lucide-react';

interface HistoryViewProps {
  onToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onToast }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  const [viewingItem, setViewingItem] = useState<HistoryItem | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    setHistory(storageService.getHistory());
  };

  const handleDeleteItem = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = storageService.deleteHistoryItem(id);
    setHistory(updated);
    if (viewingItem?.id === id) setViewingItem(null);
    onToast('info', 'Question removed from notebook.');
  };

  const handleToggleBookmark = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = storageService.toggleBookmark(id);
    setHistory(updated);
    if (viewingItem && viewingItem.id === id) {
      setViewingItem({ ...viewingItem, bookmarked: !viewingItem.bookmarked });
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to erase all practice history from this browser?')) {
      storageService.clearAllHistory();
      setHistory([]);
      setViewingItem(null);
      onToast('info', 'All history cleared.');
    }
  };

  const handleExportJSON = () => {
    const jsonStr = storageService.exportHistoryJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aptitude_friend_history_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onToast('success', 'History exported as JSON.');
  };

  const handleExportMarkdown = () => {
    const mdStr = storageService.exportHistoryMarkdown();
    const blob = new Blob([mdStr], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `practice_study_notes_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    onToast('success', 'Study notes exported as Markdown (.md).');
  };

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.solution.likelyAnswer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || item.questionType.toLowerCase() === selectedCategory.toLowerCase();

    const matchesBookmark = !onlyBookmarked || item.bookmarked;

    return matchesSearch && matchesCategory && matchesBookmark;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-2.5">
          <BookOpen className="w-7 h-7 text-indigo-500" />
          <span>Practice Notebook & Solved Questions</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          Review your solved aptitude questions, formulas, and coding solutions. Export your study
          notes as Markdown or JSON anytime.
        </p>
      </div>

      {/* Top Filter and Actions Bar */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-5 sm:p-6 space-y-4">
        {/* Search & Export Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by formula, answer, keyword..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleExportMarkdown}
              disabled={history.length === 0}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40"
              title="Download formatted markdown notes"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              <span>Export Notes (.md)</span>
            </button>
            <button
              type="button"
              onClick={handleExportJSON}
              disabled={history.length === 0}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40"
              title="Download raw JSON data"
            >
              <Download className="w-3.5 h-3.5 text-indigo-500" />
              <span>JSON</span>
            </button>
            {history.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold flex items-center gap-1 transition-colors"
                title="Erase all records"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Categories & Bookmark Filter */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5">
            {['all', 'aptitude', 'logical', 'verbal', 'coding', 'sql'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setOnlyBookmarked(!onlyBookmarked)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              onlyBookmarked
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/40'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${onlyBookmarked ? 'fill-current' : ''}`} />
            <span>Starred Only</span>
          </button>
        </div>
      </div>

      {/* History List Cards */}
      {filteredHistory.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-500 mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {history.length === 0 ? 'No solved questions yet' : 'No matching questions found'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {history.length === 0
              ? 'When you solve aptitude or coding questions in the workspace, they will automatically appear here for later review.'
              : 'Try clearing your search query or changing category filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              onClick={() => setViewingItem(item)}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-600 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                      {item.questionType}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => handleToggleBookmark(item.id, e)}
                      className="p-1 text-slate-400 hover:text-amber-500 transition-colors"
                      title="Star question"
                    >
                      <Bookmark className={`w-4 h-4 ${item.bookmarked ? 'fill-current text-amber-500' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteItem(item.id, e)}
                      className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                      title="Delete question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h4 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {item.title}
                </h4>

                {item.imageBase64 && (
                  <div className="h-16 rounded-lg bg-slate-950/20 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-800">
                    <img
                      src={item.imageBase64}
                      alt="Thumbnail"
                      className="h-full w-full object-cover opacity-80"
                    />
                  </div>
                )}
              </div>

              {/* Bottom Answer Highlight */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="truncate max-w-[240px]">
                  <span className="text-slate-400">Answer: </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {item.solution.likelyAnswer}
                  </span>
                </div>
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1 text-[11px]">
                  View <Eye className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Viewing Full Solution */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-3xl">
            <button
              onClick={() => setViewingItem(null)}
              className="absolute right-4 top-4 z-10 p-2 rounded-xl bg-slate-900/80 text-white hover:bg-slate-900 shadow-lg backdrop-blur-md"
            >
              <X className="w-5 h-5" />
            </button>
            <SolutionCard
              solution={viewingItem.solution}
              isBookmarked={viewingItem.bookmarked}
              onToggleBookmark={() => handleToggleBookmark(viewingItem.id)}
              onToast={onToast}
            />
          </div>
        </div>
      )}
    </div>
  );
};
