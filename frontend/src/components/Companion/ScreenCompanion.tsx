import React, { useState, useRef, useEffect } from 'react';
import { screenShareManager } from '../../services/screenShareService';
import { aiClient } from '../../services/aiClient';
import { storageService } from '../../services/storageService';
import { GeminiConfig, BatchQuestionItem, HistoryItem } from '../../types';
import {
  Tv,
  Camera,
  StopCircle,
  Play,
  Smartphone,
  Laptop,
  Usb,
  Zap,
  CheckCircle2,
  Copy,
  Check,
  Lightbulb,
  FileCheck2,
  Loader2,
  Trash2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ScreenCompanionProps {
  onFrameCapturedForSolving?: (base64Image: string) => void;
  onToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  isSharing: boolean;
  setIsSharing: (active: boolean) => void;
  onOpenUsbConnect?: () => void;
  geminiConfig: GeminiConfig;
}

export const ScreenCompanion: React.FC<ScreenCompanionProps> = ({
  onToast,
  isSharing,
  setIsSharing,
  onOpenUsbConnect,
  geminiConfig,
}) => {
  const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  // Companion Mode on mobile: 'camera' (live camera scanner) vs 'pc-stream' (view PC screen)
  const [activeCompanionMode, setActiveCompanionMode] = useState<'camera' | 'pc-screen'>(
    isMobile ? 'camera' : 'pc-screen'
  );

  const pcVideoRef = useRef<HTMLVideoElement | null>(null);
  const mobileCameraRef = useRef<HTMLVideoElement | null>(null);
  const nativeSnapInputRef = useRef<HTMLInputElement | null>(null);

  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Streamed answers list in order below the stream
  const [streamAnswers, setStreamAnswers] = useState<BatchQuestionItem[]>([]);
  const [isSolvingCurrent, setIsSolvingCurrent] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [cameraStream]);

  // Start PC Screen Share (Desktop only)
  const handleStartPcShare = async () => {
    if (isMobile) {
      onToast('warning', 'Screen sharing must be started on your PC/laptop. On mobile, use Camera Scanner or PC Receiver!');
      return;
    }

    try {
      const stream = await screenShareManager.startSharing(() => {
        setIsSharing(false);
        onToast('info', 'Screen sharing stopped.');
      });

      if (pcVideoRef.current) {
        pcVideoRef.current.srcObject = stream;
      }
      setIsSharing(true);
      onToast('success', 'PC Screen sharing live! Ready to capture questions.');
    } catch (err: any) {
      onToast('error', err.message || 'Screen share could not start.');
    }
  };

  const handleStopPcShare = () => {
    screenShareManager.stopSharing();
    if (pcVideoRef.current) pcVideoRef.current.srcObject = null;
    setIsSharing(false);
    onToast('info', 'Screen sharing ended.');
  };

  // Start In-Browser Live Camera Scanner (Mobile)
  const handleStartCameraScanner = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Fallback to native camera input
        nativeSnapInputRef.current?.click();
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });

      setCameraStream(stream);
      setIsCameraActive(true);

      if (mobileCameraRef.current) {
        mobileCameraRef.current.srcObject = stream;
      }
      onToast('success', 'Live camera scanner active!');
    } catch (err: any) {
      console.warn('getUserMedia failed, falling back to native phone camera snap', err);
      // Trigger native phone camera picker
      nativeSnapInputRef.current?.click();
    }
  };

  const handleStopCameraScanner = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  // Capture frame from either PC video stream or Mobile camera video stream
  const captureCurrentFrameBase64 = (): string | null => {
    const video = isMobile && activeCompanionMode === 'camera' ? mobileCameraRef.current : pcVideoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  // Solve current frame & append answer to list below stream
  const handleSnapAndSolveCurrent = async (customBase64?: string) => {
    const frameBase64 = customBase64 || captureCurrentFrameBase64();

    if (!frameBase64) {
      if (isMobile) {
        nativeSnapInputRef.current?.click();
      } else {
        onToast('warning', 'Please start screen share or camera stream first.');
      }
      return;
    }

    const newItem: BatchQuestionItem = {
      id: 'stream_q_' + Date.now(),
      imagePreview: frameBase64,
      status: 'solving',
      timestamp: Date.now(),
    };

    setStreamAnswers((prev) => [newItem, ...prev]);
    setIsSolvingCurrent(true);

    try {
      const res = await aiClient.getFastAnswer({
        imageBase64: frameBase64,
        config: geminiConfig,
      });

      setStreamAnswers((prev) =>
        prev.map((item) =>
          item.id === newItem.id
            ? { ...item, status: 'done', answer: res.likelyAnswer }
            : item
        )
      );

      // Save to notebook
      const historyItem: HistoryItem = {
        id: newItem.id,
        title: `Screen Question #${streamAnswers.length + 1}`,
        questionType: 'aptitude',
        questionText: '(Screen Stream Question)',
        imageBase64: frameBase64,
        solution: {
          id: newItem.id,
          questionText: '',
          questionType: 'aptitude',
          likelyAnswer: res.likelyAnswer,
          stepByStepExplanation: [],
          confidenceNote: 'Screen capture verified',
          rawText: res.likelyAnswer,
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
        bookmarked: false,
      };
      storageService.saveHistoryItem(historyItem);

      confetti({ particleCount: 25, spread: 50, origin: { y: 0.8 } });
      onToast('success', 'Answer generated below!');
    } catch (err: any) {
      setStreamAnswers((prev) =>
        prev.map((item) =>
          item.id === newItem.id
            ? { ...item, status: 'error', error: err.message || 'Failed to solve' }
            : item
        )
      );
      onToast('error', err.message || 'Failed to solve question');
    } finally {
      setIsSolvingCurrent(false);
    }
  };

  // Native phone snap fallback
  const handleNativeCameraSnap = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      handleSnapAndSolveCurrent(base64);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // On-demand explanation for any question in stream list
  const handleFetchExplanation = async (item: BatchQuestionItem) => {
    if (!item.answer) return;

    setStreamAnswers((prev) =>
      prev.map((q) => (q.id === item.id ? { ...q, isLoadingExplanation: true } : q))
    );
    onToast('info', 'Searching explanation for this question...');

    try {
      const res = await aiClient.getExplanationOnly({
        answer: item.answer,
        imageBase64: item.imagePreview,
        config: geminiConfig,
      });

      setStreamAnswers((prev) =>
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

      storageService.updateHistoryItem(item.id, {
        solution: {
          id: item.id,
          questionText: '',
          questionType: 'aptitude',
          likelyAnswer: item.answer,
          stepByStepExplanation: res.stepByStepExplanation,
          calculationReasoning: res.calculationReasoning,
          confidenceNote: 'Explanation added to notebook',
          rawText: item.answer,
          timestamp: Date.now(),
        },
      });

      onToast('success', 'Explanation added to notebook!');
    } catch (err: any) {
      setStreamAnswers((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, isLoadingExplanation: false } : q))
      );
      onToast('error', err.message || 'Could not fetch explanation');
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    onToast('success', 'Answer copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Hidden input for Native Phone Camera Snap */}
      <input
        type="file"
        ref={nativeSnapInputRef}
        onChange={handleNativeCameraSnap}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Tv className="w-6 h-6 text-indigo-500" />
            <span>Screen &amp; Camera Live Companion</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Stream PC screen or camera on your phone. Answers appear in order below!
          </p>
        </div>

        {onOpenUsbConnect && (
          <button
            type="button"
            onClick={onOpenUsbConnect}
            className="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Usb className="w-4 h-4" />
            <span>USB Connect Setup</span>
          </button>
        )}
      </div>

      {/* Mode Switcher for Phone */}
      {isMobile && (
        <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setActiveCompanionMode('camera')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeCompanionMode === 'camera'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Live Camera Scanner</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCompanionMode('pc-screen')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeCompanionMode === 'pc-screen'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>PC Screen Stream</span>
          </button>
        </div>
      )}

      {/* STREAMING VIEWER CARD */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden p-4 sm:p-6 space-y-4">
        {/* Stream Controls */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              {isMobile && activeCompanionMode === 'camera' ? 'Camera Viewfinder' : 'PC Test Stream'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* If on mobile in camera mode */}
            {isMobile && activeCompanionMode === 'camera' && (
              <>
                {!isCameraActive ? (
                  <button
                    type="button"
                    onClick={handleStartCameraScanner}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Open Camera</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStopCameraScanner}
                    className="px-3.5 py-1.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold transition-colors"
                  >
                    Close Camera
                  </button>
                )}
              </>
            )}

            {/* If on PC Desktop */}
            {!isMobile && (
              <>
                {!isSharing ? (
                  <button
                    type="button"
                    onClick={handleStartPcShare}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Start Sharing PC Screen</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStopPcShare}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                  >
                    <StopCircle className="w-3.5 h-3.5" />
                    <span>Stop Sharing</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Video Screen Area */}
        <div className="relative aspect-video max-h-[380px] w-full rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-800">
          {/* PC Stream Video */}
          <video
            ref={pcVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-contain ${!isSharing || (isMobile && activeCompanionMode === 'camera') ? 'hidden' : 'block'}`}
          />

          {/* Mobile Camera Video */}
          <video
            ref={mobileCameraRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${!isCameraActive || !isMobile || activeCompanionMode !== 'camera' ? 'hidden' : 'block'}`}
          />

          {/* Fallback Display if inactive */}
          {!isSharing && !isCameraActive && (
            <div className="text-center p-6 space-y-3 max-w-sm">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
                {isMobile ? <Camera className="w-6 h-6" /> : <Tv className="w-6 h-6" />}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isMobile
                  ? 'Tap below to snap questions or connect to PC test screen over USB.'
                  : 'Click "Start Sharing PC Screen" to broadcast your test window.'}
              </p>
              {isMobile ? (
                <button
                  type="button"
                  onClick={() => nativeSnapInputRef.current?.click()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg transition-all"
                >
                  📸 Snap Question Now
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartPcShare}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg transition-all"
                >
                  Share PC Window
                </button>
              )}
            </div>
          )}
        </div>

        {/* Big Action Button to solve current frame */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => handleSnapAndSolveCurrent()}
            disabled={isSolvingCurrent}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-40"
          >
            {isSolvingCurrent ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Solving Question...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-current" />
                <span>⚡ Snap &amp; Get Answer Below</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* STREAM ANSWERS LIST IN ORDER (ONE BY ONE BELOW) */}
      <div className="space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 pl-1">
          Solved Answers from Stream (In Order)
        </h3>

        {streamAnswers.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs text-slate-400">
            Tap &apos;⚡ Snap &amp; Get Answer Below&apos; whenever a question appears. Answers will stack here automatically!
          </div>
        ) : (
          streamAnswers.map((item, idx) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md p-4 space-y-3 animate-in fade-in"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  Question #{streamAnswers.length - idx}
                </span>
                <span className="text-[11px] text-slate-400">
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>

              {item.status === 'solving' && (
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center gap-2 animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Searching answer...</span>
                </div>
              )}

              {item.status === 'done' && item.answer && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 dark:from-emerald-950/40 dark:via-slate-900 dark:to-indigo-950/40 border border-emerald-500/40 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Answer:
                    </span>
                    <div className="text-xl font-black text-slate-900 dark:text-white">
                      {item.answer}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(item.id, item.answer!)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1 transition-all"
                    >
                      {copiedId === item.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === item.id ? 'Copied' : 'Copy'}</span>
                    </button>

                    {!item.explanation?.length && (
                      <button
                        type="button"
                        onClick={() => handleFetchExplanation(item)}
                        disabled={item.isLoadingExplanation}
                        className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-all disabled:opacity-40"
                      >
                        {item.isLoadingExplanation ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Lightbulb className="w-3 h-3 text-amber-500" />
                        )}
                        <span>{item.isLoadingExplanation ? 'Loading...' : '💡 Explanation'}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Explanation loaded only upon button click */}
              {item.explanation && item.explanation.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1 animate-in fade-in">
                  <span className="font-bold uppercase tracking-wider text-[10px] text-slate-900 dark:text-white block">
                    Explanation (Saved to Notebook):
                  </span>
                  {item.explanation.map((s, sIdx) => (
                    <p key={sIdx}>{s}</p>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
