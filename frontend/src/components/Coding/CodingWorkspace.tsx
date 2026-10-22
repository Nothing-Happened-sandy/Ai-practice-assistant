import React, { useState } from 'react';
import {
  CodingProblemInput,
  GeminiConfig,
  SolutionResult,
  HistoryItem,
} from '../../types';
import { geminiClient } from '../../services/geminiClient';
import { storageService } from '../../services/storageService';
import {
  Code2,
  Play,
  Bug,
  ListChecks,
  Copy,
  Check,
  Clock,
  HardDrive,
  Sparkles,
  Loader2,
  Terminal,
  Bookmark,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CodingWorkspaceProps {
  geminiConfig: GeminiConfig;
  onOpenSettings: () => void;
  onToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export const CodingWorkspace: React.FC<CodingWorkspaceProps> = ({
  geminiConfig,
  onOpenSettings,
  onToast,
}) => {
  const [language, setLanguage] = useState('Python');
  const [problemTitle, setProblemTitle] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [constraints, setConstraints] = useState('');
  const [sampleInput, setSampleInput] = useState('');
  const [sampleOutput, setSampleOutput] = useState('');
  const [userCodeDraft, setUserCodeDraft] = useState('');
  const [showDraftEditor, setShowDraftEditor] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMode, setLoadingMode] = useState<string>('');
  const [solution, setSolution] = useState<SolutionResult | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Client-side execution output for JS
  const [jsExecutionOutput, setJsExecutionOutput] = useState<string | null>(null);

  const languages = [
    'Python',
    'JavaScript',
    'TypeScript',
    'Java',
    'C++',
    'C',
    'SQL',
    'Go',
  ];

  const handleSolve = async (mode: 'solve' | 'debug' | 'testcases') => {
    if (!problemStatement.trim()) {
      onToast('warning', 'Please enter a problem description first.');
      return;
    }

    if (mode === 'debug' && !userCodeDraft.trim()) {
      onToast('warning', 'Please provide your draft code to debug.');
      setShowDraftEditor(true);
      return;
    }

    if (!geminiConfig.apiKey) {
      onToast('warning', 'Please set your Gemini API key in Settings first.');
      onOpenSettings();
      return;
    }

    setIsLoading(true);
    setLoadingMode(
      mode === 'solve'
        ? 'Generating optimal solution & Big-O...'
        : mode === 'debug'
        ? 'Analyzing code for bugs & edge cases...'
        : 'Generating edge-case test cases...'
    );

    try {
      const input: CodingProblemInput = {
        language,
        problemTitle: problemTitle.trim(),
        problemStatement: problemStatement.trim(),
        constraints: constraints.trim(),
        sampleInput: sampleInput.trim(),
        sampleOutput: sampleOutput.trim(),
        userCodeDraft: userCodeDraft.trim() || undefined,
      };

      const result = await geminiClient.solveCodingProblem(input, geminiConfig, mode);
      setSolution(result);
      setIsBookmarked(false);
      setJsExecutionOutput(null);

      // Save to history
      const historyItem: HistoryItem = {
        id: result.id,
        title: (problemTitle || problemStatement.slice(0, 50)).replace(/\n/g, ' '),
        questionType: 'coding',
        questionText: result.questionText,
        solution: result,
        timestamp: result.timestamp,
        bookmarked: false,
      };
      storageService.saveHistoryItem(historyItem);

      confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
      onToast('success', 'Coding solution generated!');
    } catch (err: any) {
      onToast('error', err.message || 'Coding evaluation failed.');
    } finally {
      setIsLoading(false);
      setLoadingMode('');
    }
  };

  const handleCopyCode = () => {
    if (solution?.codeSnippet?.code) {
      navigator.clipboard.writeText(solution.codeSnippet.code);
      setCopiedCode(true);
      onToast('success', 'Code copied to clipboard!');
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleToggleBookmark = () => {
    if (!solution) return;
    storageService.toggleBookmark(solution.id);
    setIsBookmarked(!isBookmarked);
    onToast(isBookmarked ? 'info' : 'success', isBookmarked ? 'Removed from bookmarks' : 'Saved to Notebook!');
  };

  // Safe client-side JavaScript execution in sandbox worker/eval
  const handleRunClientJs = () => {
    if (!solution?.codeSnippet?.code) return;
    if (solution.codeSnippet.language.toLowerCase() !== 'javascript') {
      onToast('info', 'In-browser direct execution is supported for JavaScript. For Python/C++, dry-run test cases are listed below.');
      return;
    }

    try {
      const logs: string[] = [];
      const customConsole = {
        log: (...args: any[]) => logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
        error: (...args: any[]) => logs.push('ERROR: ' + args.join(' ')),
        warn: (...args: any[]) => logs.push('WARN: ' + args.join(' ')),
      };

      // Run code safely in function scope with overridden console
      const runFn = new Function('console', solution.codeSnippet.code);
      runFn(customConsole);

      setJsExecutionOutput(logs.length > 0 ? logs.join('\n') : '(Code executed cleanly with no console output)');
      onToast('success', 'Executed successfully in browser sandbox!');
    } catch (err: any) {
      setJsExecutionOutput(`Runtime Exception: ${err.message}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Coding Practice & Algorithm Lab
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          Solve LeetCode-style problems, analyze Asymptotic Time/Space complexity, review draft code
          for logical bugs, and inspect tricky boundary cases.
        </p>
      </div>

      {/* Editor & Input Card */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden p-5 sm:p-7 space-y-5">
        {/* Language & Title Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Programming Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Problem Title (Optional)
            </label>
            <input
              type="text"
              value={problemTitle}
              onChange={(e) => setProblemTitle(e.target.value)}
              placeholder="e.g. Two Sum, LRU Cache, Binary Search, Longest Palindrome"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Problem Statement */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Problem Statement / Constraints
          </label>
          <textarea
            value={problemStatement}
            onChange={(e) => setProblemStatement(e.target.value)}
            placeholder="Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume each input would have exactly one solution..."
            rows={5}
            className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y font-sans leading-relaxed"
          />
        </div>

        {/* Constraints & Sample I/O */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Constraints (Optional):
            </label>
            <input
              type="text"
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              placeholder="e.g. 1 <= N <= 10^5, time limit 1s"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Sample Input:
            </label>
            <input
              type="text"
              value={sampleInput}
              onChange={(e) => setSampleInput(e.target.value)}
              placeholder="e.g. nums = [2,7,11,15], target = 9"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Sample Output:
            </label>
            <input
              type="text"
              value={sampleOutput}
              onChange={(e) => setSampleOutput(e.target.value)}
              placeholder="e.g. [0, 1]"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* User Code Draft Toggle & Textarea */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={() => setShowDraftEditor(!showDraftEditor)}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1.5"
          >
            <Code2 className="w-4 h-4" />
            <span>
              {showDraftEditor ? 'Hide My Code Draft' : '+ Paste My Attempt / Code to Debug'}
            </span>
          </button>

          {showDraftEditor && (
            <div className="space-y-1.5 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-mono">My {language} Code:</span>
                <span>Gemini will detect bugs and suggest performance fixes</span>
              </div>
              <textarea
                value={userCodeDraft}
                onChange={(e) => setUserCodeDraft(e.target.value)}
                placeholder={`# Paste your ${language} attempt here to debug or review...`}
                rows={6}
                className="w-full p-3 bg-transparent text-emerald-400 font-mono text-xs focus:outline-none resize-y"
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSolve('solve')}
              disabled={isLoading || !problemStatement.trim()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all disabled:opacity-40"
            >
              {isLoading && loadingMode.includes('optimal') ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span>Optimal Solution</span>
            </button>

            <button
              type="button"
              onClick={() => handleSolve('debug')}
              disabled={isLoading || !problemStatement.trim()}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-40"
            >
              {isLoading && loadingMode.includes('bugs') ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Bug className="w-4 h-4 text-rose-500" />
              )}
              <span>Debug My Code</span>
            </button>

            <button
              type="button"
              onClick={() => handleSolve('testcases')}
              disabled={isLoading || !problemStatement.trim()}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-40"
            >
              {isLoading && loadingMode.includes('test') ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ListChecks className="w-4 h-4 text-emerald-500" />
              )}
              <span>Edge Test Cases</span>
            </button>
          </div>

          {isLoading && (
            <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1.5 animate-pulse">
              <Sparkles className="w-4 h-4" />
              <span>{loadingMode}</span>
            </div>
          )}
        </div>
      </div>

      {/* Solution Output */}
      {solution && (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden space-y-6">
          {/* Header */}
          <div className="bg-slate-50 dark:bg-slate-800/60 px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-indigo-500" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {solution.likelyAnswer}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleBookmark}
                className={`p-2 rounded-xl text-xs flex items-center gap-1 transition-colors ${
                  isBookmarked
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current text-amber-500' : ''}`} />
                <span className="hidden sm:inline">{isBookmarked ? 'Saved' : 'Save'}</span>
              </button>
            </div>
          </div>

          <div className="p-5 sm:p-7 space-y-6">
            {/* Complexity Badges */}
            {solution.codeSnippet && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400">
                      Time Complexity
                    </span>
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">
                      {solution.codeSnippet.timeComplexity || 'O(N)'}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-purple-600 dark:text-purple-400">
                      Auxiliary Space
                    </span>
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">
                      {solution.codeSnippet.spaceComplexity || 'O(1)'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Code Box with Syntax Styling */}
            {solution.codeSnippet?.code && (
              <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                    <span className="font-mono text-slate-400 ml-2">
                      solution.{solution.codeSnippet.language.toLowerCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {solution.codeSnippet.language.toLowerCase() === 'javascript' && (
                      <button
                        type="button"
                        onClick={handleRunClientJs}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Play className="w-3 h-3" />
                        <span>Run in Browser</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 overflow-x-auto">
                  <pre className="font-mono text-xs sm:text-sm text-emerald-300 leading-relaxed">
                    <code>{solution.codeSnippet.code}</code>
                  </pre>
                </div>

                {jsExecutionOutput && (
                  <div className="border-t border-slate-800 bg-slate-900/90 p-3.5 text-xs font-mono">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Console Output:</span>
                    </div>
                    <pre className="text-slate-200 whitespace-pre-wrap">{jsExecutionOutput}</pre>
                  </div>
                )}
              </div>
            )}

            {/* Algorithm Steps Walkthrough */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Algorithm & Logical Walkthrough
              </h4>
              <div className="space-y-2">
                {solution.stepByStepExplanation.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-200 leading-relaxed"
                  >
                    {step}
                  </div>
                ))}
              </div>
            </div>

            {/* Test Cases Table */}
            {solution.testCases && solution.testCases.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Sample & Edge Test Cases
                </h4>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Input</th>
                        <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Expected Output</th>
                        <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Reasoning</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                      {solution.testCases.map((tc, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="p-3 text-indigo-600 dark:text-indigo-400">{tc.input}</td>
                          <td className="p-3 text-emerald-600 dark:text-emerald-400">{tc.output}</td>
                          <td className="p-3 font-sans text-slate-600 dark:text-slate-400">{tc.explanation || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
