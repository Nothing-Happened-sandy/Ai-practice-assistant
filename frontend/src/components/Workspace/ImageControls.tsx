import React, { useState } from 'react';
import { RotateCw, ZoomIn, ZoomOut, Trash2, Eye } from 'lucide-react';

interface ImageControlsProps {
  imageBase64: string;
  onRemove: () => void;
  onRotated: (newBase64: string) => void;
}

export const ImageControls: React.FC<ImageControlsProps> = ({
  imageBase64,
  onRemove,
  onRotated,
}) => {
  const [zoom, setZoom] = useState(1);
  const [isRotating, setIsRotating] = useState(false);

  const rotateImage90Degrees = () => {
    setIsRotating(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.height;
      canvas.height = img.width;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((90 * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        const newUrl = canvas.toDataURL('image/jpeg', 0.92);
        onRotated(newUrl);
      }
      setIsRotating(false);
    };
    img.src = imageBase64;
  };

  return (
    <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900/5 dark:bg-slate-900/40 p-3 overflow-hidden">
      {/* Top Floating Control Bar */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60 dark:border-slate-800">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-indigo-500" />
          Question Image Preview
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={rotateImage90Degrees}
            disabled={isRotating}
            className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs flex items-center gap-1 shadow-sm transition-colors"
            title="Rotate 90 degrees clockwise"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Rotate</span>
          </button>
          <button
            type="button"
            onClick={() => setZoom((prev) => Math.min(prev + 0.25, 2.5))}
            className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 text-xs shadow-sm"
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((prev) => Math.max(prev - 0.25, 0.75))}
            className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 text-xs shadow-sm"
            title="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-1 hover:bg-rose-100 transition-colors ml-1 shadow-sm"
            title="Remove image"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Remove</span>
          </button>
        </div>
      </div>

      {/* Image Render Area */}
      <div className="relative max-h-72 overflow-auto flex items-center justify-center rounded-xl bg-slate-950/20 p-2">
        <img
          src={imageBase64}
          alt="Practice Question Preview"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          className="max-h-64 object-contain rounded-lg transition-transform duration-150"
        />
      </div>
    </div>
  );
};
