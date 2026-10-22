import React, { useState, useRef, useEffect } from 'react';
import {
  QuestionType,
  InputMode,
  GeminiConfig,
  BatchQuestionItem,
  HistoryItem,
} from '../../types';
import { aiClient } from '../../services/aiClient';
import { storageService } from '../../services/storageService';
import {
  Camera,
  UploadCloud,
  Loader2,
  CheckCircle2,
  Copy,
  Check,
  Bookmark,
  Sparkles,
  Trash2,
  FileCheck2,
  Lightbulb,
  Zap,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuestionWorkspaceProps {
  geminiConfig: GeminiConfig;
  onOpenSettings: () => void;
  onOpenUsbConnect?: () => void;
  onToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  initialImageBase64?: string | null;
  onClearInitialImage?: () => void;
}

export const QuestionWorkspace: React.FC<QuestionWorkspaceProps> = ({
  geminiConfig,
  onOpenSettings,
  onToast,
  initialImageBase64,
  onClearInitialImage,
}) => {
  // Ordered queue of questions
  const [questions, setQuestions] = useState<BatchQuestionItem[]>([]);
  const [textQuestion, setTextQuestion] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);
  const multiGalleryInputRef = useRef<HTMLInputElement | null>(null);

  // If passed an initial image from screen companion frame grab
  useEffect(() => {
    if (initialImageBase64) {
      addImagesToQueue([initialImageBase64]);
      if (onClearInitialImage) onClearInitialImage();
      onToast('info', 'Screen snapshot imported! Solving answer...');
    }
  }, [initialImageBase64]);

  // Handle clipboard paste (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.items) {
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          const item = e.clipboardData.items[i];
          if (item.type.indexOf('image') !== -1) {
            const blob = item.getAsFile();
            if (blob) {
              const reader = new FileReader();
              reader.onload = (uploadEvent) => {
                const base64 = uploadEvent.target?.result as string;
                addImagesToQueue([base64]);
                onToast('success', 'Image pasted from clipboard!');
              };
              reader.readAsDataURL(blob);
              break;
            }
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [geminiConfig]);

  // Adds one or multiple images to the question list and immediately solves them in order
  const addImagesToQueue = (base64Array: string[]) => {
    if (!geminiConfig.apiKey) {
      onToast('warning', 'Please set your API key in Settings first.');
      onOpenSettings();
      return;
    }

    const newItems: BatchQuestionItem[] = base64Array.map((b64, idx) => ({
      id: 'q_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substr(2, 4),
      imagePreview: b64,
      status: 'pending',
      timestamp: Date.now(),
    }));

    setQuestions((prev) => [...newItems, ...prev]);

    // Solve each new item immediately
    newItems.forEach((item) => {
      solveItemFastAnswer(item);
    });
  };

  const solveItemFastAnswer = async (item: BatchQuestionItem) => {
    // Mark as solving
    setQuestions((prev) =>
      prev.map((q) => (q.id === item.id ? { ...q, status: 'solving', error: undefined } : q))
    );

    try {
      const res = await aiClient.getFastAnswer({
        questionText: item.questionText,
        imageBase64: item.imagePreview,
        config: geminiConfig,
      });

      if (!res.likelyAnswer || res.likelyAnswer === 'No answer generated') {
        throw new Error('No answer generated. Click Retry to re-solve.');
      }

      setQuestions((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? { ...q, status: 'done', answer: res.likelyAnswer }
            : q
        )
      );

      // Save initial answer to notebook/history
      const historyItem: HistoryItem = {
        id: item.id,
        title: item.questionText || `Question #${questions.length + 1}`,
        questionType: 'aptitude',
        questionText: item.questionText || '(Photo Question)',
        imageBase64: item.imagePreview,
        solution: {
          id: item.id,
          questionText: item.questionText || '',
          questionType: 'aptitude',
          likelyAnswer: res.likelyAnswer,
          stepByStepExplanation: [],
          confidenceNote: 'Answer Generated',
          rawText: res.likelyAnswer,
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
        bookmarked: false,
      };
      storageService.saveHistoryItem(historyItem);

      confetti({ particleCount: 25, spread: 45, origin: { y: 0.8 } });
      onToast('success', 'Answer generated!');
    } catch (err: any) {
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? { ...q, status: 'error', error: err.message || 'Failed to solve' }
            : q
        )
      );
      onToast('error', err.message || 'Failed to get answer');
    }
  };

  // Called ONLY when the user explicitly clicks "Get Explanation" on a specific question
  const handleFetchExplanation = async (item: BatchQuestionItem) => {
    if (!item.answer) return;

    setQuestions((prev) =>
      prev.map((q) => (q.id === item.id ? { ...q, isLoadingExplanation: true } : q))
    );
    onToast('info', 'Searching explanation for this question...');

    try {
      const res = await aiClient.getExplanationOnly({
        questionText: item.questionText,
        answer: item.answer,
        imageBase64: item.imagePreview,
        config: geminiConfig,
      });

      setQuestions((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? {
                ...q,
                explanation: res.stepByStepExplanation,
                calculation: res.calculationReasoning,
                isLoadingExplanation: false,
              }
            : q
        )
      );

      // Update notebook with explanation
      storageService.updateHistoryItem(item.id, {
        solution: {
          id: item.id,
          questionText: item.questionText || '',
          questionType: 'aptitude',
          likelyAnswer: item.answer,
          stepByStepExplanation: res.stepByStepExplanation,
          calculationReasoning: res.calculationReasoning,
          confidenceNote: 'Explanation saved in notebook',
          rawText: item.answer,
          timestamp: Date.now(),
        },
      });

      onToast('success', 'Explanation loaded & saved to notebook!');
    } catch (err: any) {
      setQuestions((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, isLoadingExplanation: false } : q))
      );
      onToast('error', err.message || 'Could not fetch explanation');
    }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      addImagesToQueue([base64]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleMultipleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const base64List: string[] = [];
    let loadedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        base64List.push(base64);
        loadedCount++;
        if (loadedCount === files.length) {
          addImagesToQueue(base64List);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleTextSubmit = () => {
    if (!textQuestion.trim()) return;

    const newItem: BatchQuestionItem = {
      id: 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      questionText: textQuestion.trim(),
      status: 'pending',
      timestamp: Date.now(),
    };

    setQuestions((prev) => [newItem, ...prev]);
    solveItemFastAnswer(newItem);
    setTextQuestion('');
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    onToast('success', 'Answer copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Hidden Inputs for Native Camera & Multi-File Upload */}
      <input
        type="file"
        ref={nativeCameraInputRef}
        onChange={handleCameraCapture}
        accept="image/*"
        capture="environment"
        className="hidden"
      />
      <input
        type="file"
        ref={multiGalleryInputRef}
        onChange={handleMultipleFiles}
        accept="image/png, image/jpeg, image/webp"
        multiple
        className="hidden"
      />

      {/* TOP ACTION BAR: SNAP / UPLOAD MULTIPLE PHOTOS */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500 fill-current" />
              <span>Instant Question Solver (Answer Only)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Zero latency: gives answer immediately. Never searches explanations unless you click &apos;Get Explanation&apos;.
            </p>
          </div>
          <button
            onClick={onOpenSettings}
            className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-semibold hover:underline"
          >
            {geminiConfig.provider.toUpperCase()}: {geminiConfig.model}
          </button>
        </div>

        {/* Buttons to snap photo or upload multiple photos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => nativeCameraInputRef.current?.click()}
            className="p-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2.5 transition-all transform active:scale-95"
          >
            <Camera className="w-5 h-5" />
            <span>📸 Snap Photo with Camera</span>
          </button>

          <button
            type="button"
            onClick={() => multiGalleryInputRef.current?.click()}
            className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2.5 transition-all transform active:scale-95"
          >
            <UploadCloud className="w-5 h-5 text-indigo-500" />
            <span>📁 Upload Photos (Single or Multiple)</span>
          </button>
        </div>

        {/* Text Question Option */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={textQuestion}
            onChange={(e) => setTextQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
            placeholder="Or type/paste question text here and press Enter..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={handleTextSubmit}
            disabled={!textQuestion.trim()}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40"
          >
            Solve
          </button>
        </div>
      </div>

      {/* QUESTIONS & ANSWERS IN ORDER (ONE BY ONE BELOW) */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 space-y-2">
            <Camera className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No questions added yet
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Tap &apos;Snap Photo with Camera&apos; or upload photos above. Answers will appear in order right below!
            </p>
          </div>
        ) : (
          questions.map((q, idx) => (
            <div
              key={q.id}
              className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden transition-all animate-in fade-in"
            >
              {/* Question Header */}
              <div className="bg-slate-50 dark:bg-slate-800/60 px-4 sm:px-5 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  Question #{questions.length - idx}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveQuestion(q.id)}
                  className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                  title="Remove from list"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-4 sm:p-5 space-y-4">
                {/* Image or Text Preview */}
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  {q.imagePreview && (
                    <div className="w-full sm:w-56 max-h-48 overflow-hidden rounded-xl bg-slate-950/20 border border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-center">
                      <img
                        src={q.imagePreview}
                        alt={`Question ${idx + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  {/* ANSWER CONTAINER */}
                  <div className="flex-1 w-full space-y-3">
                    {q.status === 'solving' && (
                      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5 text-xs text-amber-700 dark:text-amber-300 font-semibold animate-pulse">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Searching answer (Ultra Fast)...</span>
                      </div>
                    )}

                    {q.status === 'error' && (
                      <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs space-y-2">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{q.error}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => solveItemFastAnswer(q)}
                          className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold text-xs inline-flex items-center gap-1 hover:bg-rose-700 transition-colors"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Retry</span>
                        </button>
                      </div>
                    )}

                    {q.status === 'done' && q.answer && (
                      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 dark:from-emerald-950/40 dark:via-slate-900 dark:to-indigo-950/40 border-2 border-emerald-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                        <div className="space-y-1">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            Correct Answer:
                          </span>
                          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-snug">
                            {q.answer}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopy(q.id, q.answer!)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1 transition-all"
                          >
                            {copiedId === q.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedId === q.id ? 'Copied' : 'Copy'}</span>
                          </button>

                          {/* GET EXPLANATION BUTTON (Only searches when clicked!) */}
                          {!q.explanation?.length && (
                            <button
                              type="button"
                              onClick={() => handleFetchExplanation(q)}
                              disabled={q.isLoadingExplanation}
                              className="px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-40"
                              title="Search explanation on-demand & add to notebook"
                            >
                              {q.isLoadingExplanation ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                              )}
                              <span>{q.isLoadingExplanation ? 'Loading...' : '💡 Get Explanation'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* EXPLANATION CONTAINER (Only displayed if user clicked "Get Explanation") */}
                {q.explanation && q.explanation.length > 0 && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2 text-xs leading-relaxed animate-in fade-in">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                      <FileCheck2 className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Step-by-Step Explanation (Saved to Notebook):</span>
                    </div>
                    <div className="space-y-1.5 pl-1">
                      {q.explanation.map((step, sIdx) => (
                        <p key={sIdx} className="text-slate-700 dark:text-slate-300">
                          {step}
                        </p>
                      ))}
                    </div>
                    {q.calculation && (
                      <pre className="p-2.5 rounded-lg bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto">
                        {q.calculation}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
