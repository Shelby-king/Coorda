'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import type { Toast as ToastType } from '@/hooks/useToast';

interface ToastProps extends ToastType {
  onRemove: (id: string) => void;
}

function ToastItem({ id, message, type, onRemove }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const t = setTimeout(() => setVisible(false), 3500);
    return () => clearTimeout(t);
  }, []);

  const iconMap = {
    success: (
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    info: (
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const colorMap = {
    success: 'border-green-accent/40 text-green-accent bg-green-900/20',
    error:   'border-red-500/40 text-red-400 bg-red-900/20',
    info:    'border-cyan/40 text-cyan bg-cyan-900/20',
  };

  return (
    <div
      className={clsx(
        'flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-card',
        'min-w-[260px] max-w-sm font-body text-sm',
        'transition-all duration-300 ease-out',
        colorMap[type],
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
      )}
    >
      {iconMap[type]}
      <span className="flex-1 leading-relaxed">{message}</span>
      <button
        onClick={() => onRemove(id)}
        className="opacity-50 hover:opacity-100 transition-opacity shrink-0"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: ToastType[];
  onRemove: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem {...t} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
}
