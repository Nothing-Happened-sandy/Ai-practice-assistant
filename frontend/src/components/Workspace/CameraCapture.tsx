import React, { useState, useRef, useEffect } from 'react';
import { Camera, SwitchCamera, X, Check, AlertCircle, RefreshCw } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (base64Image: string) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    async function initCamera() {
      setIsInitializing(true);
      setCameraError(null);

      // Clean up previous stream if any
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera access is not supported by your browser.');
        }

        const newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        currentStream = newStream;
        setStream(newStream);

        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
      } catch (err: any) {
        console.error('Camera access error', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraError('Camera permission was denied. Please allow camera access in your browser settings.');
        } else {
          setCameraError(err.message || 'Unable to start camera.');
        }
      } finally {
        setIsInitializing(false);
      }
    }

    initCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  const handleSnap = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

      // Clean up tracks
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      onCapture(dataUrl);
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div className="relative rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-slate-900 p-3 sm:p-4 text-white overflow-hidden shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-semibold">Camera Question Scanner</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleFacingMode}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs flex items-center gap-1.5 transition-colors"
            title="Switch front/back camera"
          >
            <SwitchCamera className="w-3.5 h-3.5 text-indigo-300" />
            <span className="hidden sm:inline">Flip Camera</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Close camera"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {cameraError ? (
        <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-400" />
          <p className="text-sm text-slate-300 max-w-sm">{cameraError}</p>
          <button
            onClick={() => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4 pt-3">
          <div className="relative aspect-video max-h-80 w-full rounded-xl overflow-hidden bg-black flex items-center justify-center border border-slate-800">
            {isInitializing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs text-slate-300">
                Opening camera viewfinder...
              </div>
            )}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Guidance frame overlay */}
            <div className="absolute inset-6 border-2 border-dashed border-white/40 rounded-xl pointer-events-none flex items-end justify-center pb-2">
              <span className="text-[11px] bg-black/60 px-2.5 py-1 rounded-full text-slate-300 backdrop-blur-sm">
                Align question text inside the frame
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleSnap}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/25 flex items-center gap-2 transform active:scale-95 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Capture & Scan Question</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
