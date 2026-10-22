import React, { useState } from 'react';
import { SolutionResult } from '../../types';
import {
  CheckCircle2,
  Copy,
  Check,
  Bookmark,
  Volume2,
  VolumeX,
  Sparkles,
  HelpCircle,
  Lightbulb,
  FileCheck2,
  ShieldAlert,
  ArrowRight,
  Code2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SolutionCardProps {
  solution: SolutionResult;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export const SolutionCard: React.FC<SolutionCardProps> = ({
  solution,
  isBookmarked,
  onToggleBookmark,
  onToast,
}) => {
  const [copiedAnswer, setCopiedAnswer] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Trigger celebratory confetti on initial render
  React.useEffect(() => {
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#6366f1', '#a855f7', '#3b82f6', '#10b981'],
    });
  }, [solution.id]);

  const handleCopyAnswer = () => {
    navigator.clipboard.writeText(solution.likelyAnswer);
    setCopiedAnswer(true);
    onToast('success', 'Answer copied to clipboard!');
    setTimeout(() => setCopiedAnswer(false), 2000);
  };

  const handleCopyAll = () => {
    const fullText = [
      `Question: ${solution.questionText}`,
      `Category: ${solution.questionType.toUpperCase()}`,
      `Likely Answer: ${solution.likelyAnswer}`,
      '',
      'Step-by-Step Explanation:',
      ...solution.stepByStepExplanation.map((s, i) => `${i + 1}. ${s}`),
      solution.calculationReasoning ? `\nCalculation / Reasoning:\n${solution.calculationReasoning}` : '',
      solution.keyFormulasOrTricks?.length
        ? `\nKey Formulas / Shortcuts:\n- ${solution.keyFormulasOrTricks.join('\n- ')}`
        : '',
      `\nConfidence: ${solution.confidenceNote}`,
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(fullText);
    setCopiedAll(true);
    onToast('success', 'Full explanation copied to clipboard!');
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleTextToSpeech = () => {
    if (!('speechSynthesis' in window)) {
      onToast('warning', 'Text-to-speech is not supported by your browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const narration = `The likely answer is: ${solution.likelyAnswer}. Here is the explanation: ${solution.stepByStepExplanation.join('. ')}`;
    const utterance = new SpeechSynthesisUtterance(narration);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    onToast('info', 'Reading answer aloud...');
  };

  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden transition-all">
      {/* Top Banner / Actions Bar */}
      <div className="bg-slate-50 dark:bg-slate-800/60 px-5 py-3 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            {solution.questionType} Solution
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            • {new Date(solution.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Read Aloud */}
          <button
            type="button"
            onClick={handleTextToSpeech}
            className={`p-2 rounded-xl text-xs flex items-center gap-1 transition-colors ${
              isSpeaking
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
            }`}
            title={isSpeaking ? 'Stop audio' : 'Listen to explanation'}
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isSpeaking ? 'Stop Audio' : 'Listen'}</span>
          </button>

          {/* Bookmark */}
          <button
            type="button"
            onClick={onToggleBookmark}
            className={`p-2 rounded-xl text-xs flex items-center gap-1 transition-colors ${
              isBookmarked
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
            }`}
            title={isBookmarked ? 'Bookmarked in Notebook' : 'Bookmark to Notebook'}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current text-amber-500' : ''}`} />
            <span className="hidden sm:inline">{isBookmarked ? 'Saved' : 'Save'}</span>
          </button>

          {/* Copy Full Explanation */}
          <button
            type="button"
            onClick={handleCopyAll}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 text-xs flex items-center gap-1 transition-colors"
            title="Copy entire breakdown"
          >
            {copiedAll ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span className="hidden sm:inline">{copiedAll ? 'Copied' : 'Copy All'}</span>
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-7 space-y-6">
        {/* Highlighted Likely Answer Box */}
        <div className="relative p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border-2 border-emerald-500/40 dark:border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Suggested Correct Answer
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {solution.likelyAnswer}
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopyAnswer}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all shrink-0"
          >
            {copiedAnswer ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedAnswer ? 'Copied!' : 'Copy Answer'}</span>
          </button>
        </div>

        {/* Step-by-Step Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-indigo-500" />
            Step-by-Step Logic & Explanation
          </h4>
          <div className="space-y-2.5">
            {solution.stepByStepExplanation.map((step, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-200 leading-relaxed"
              >
                <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1 whitespace-pre-wrap">{step}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Calculations / Math Walkthrough */}
        {solution.calculationReasoning && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Mathematical Breakdown & Formula Walkthrough
            </h4>
            <div className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs leading-relaxed overflow-x-auto border border-slate-800">
              <pre className="whitespace-pre-wrap">{solution.calculationReasoning}</pre>
            </div>
          </div>
        )}

        {/* Shortcuts & Formulas */}
        {solution.keyFormulasOrTricks && solution.keyFormulasOrTricks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              Exam Speed Tricks & Key Formulas
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {solution.keyFormulasOrTricks.map((trick, tIdx) => (
                <div
                  key={tIdx}
                  className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>{trick}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Uncertainty / Confidence Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>{solution.confidenceNote}</span>
          </div>
          {solution.uncertaintyNotes && (
            <div className="text-amber-600 dark:text-amber-400 font-medium">
              ⚠️ {solution.uncertaintyNotes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
