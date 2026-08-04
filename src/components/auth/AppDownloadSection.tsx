'use client';

import { useState, useEffect } from 'react';
import { Download, Smartphone, Laptop, Share, CheckCircle2, Sparkles, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface AppDownloadSectionProps {
  variant?: 'card' | 'compact' | 'sidebar';
  className?: string;
}

export function AppDownloadSection({ variant = 'card', className = '' }: AppDownloadSectionProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Detect standalone mode (already installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback instruction trigger
      setShowIOSInstructions(true);
    }
  };

  if (isInstalled) {
    return (
      <div className={`p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-3 ${className}`}>
        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span className="text-xs font-medium text-emerald-800 dark:text-emerald-200">
          MediFlow App is already installed on your device.
        </span>
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className={`p-5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 text-white ${className}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-clinic-teal/20 border border-clinic-teal/30 flex items-center justify-center text-clinic-teal">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-clinic-teal">
                MediFlow Mobile & Desktop
              </span>
              <Sparkles className="w-3 h-3 text-clinic-teal animate-pulse" />
            </div>
            <h4 className="font-semibold text-sm">Download the App</h4>
          </div>
        </div>

        <p className="text-xs text-white/70 mb-4 leading-relaxed">
          Install MediFlow on your device for one-tap logins, offline access, and instant appointment push notifications.
        </p>

        <Button
          onClick={handleInstallClick}
          className="w-full h-10 bg-clinic-teal hover:bg-clinic-teal/90 text-white text-xs font-medium gap-2 shadow-lg shadow-clinic-teal/20 transition-all hover:scale-[1.02]"
        >
          <Download className="w-4 h-4" />
          {isIOS ? 'Install on iOS' : 'Install App Now'}
        </Button>

        {showIOSInstructions && (
          <div className="mt-3 p-3 rounded-xl bg-white/10 border border-white/10 text-[11px] text-white/80 space-y-1.5 animate-in fade-in">
            <div className="flex items-center justify-between font-medium text-white">
              <span>How to install on iOS:</span>
              <button onClick={() => setShowIOSInstructions(false)}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-white/70">
              <li>Tap the <Share className="w-3 h-3 inline text-clinic-teal" /> Share button in Safari</li>
              <li>Scroll down and select <span className="font-semibold text-white">Add to Home Screen</span></li>
            </ol>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-clinic-navy/5 via-clinic-teal/5 to-clinic-navy/5 dark:from-slate-800/80 dark:via-slate-800/40 dark:to-slate-900/80 border border-clinic-teal/20 dark:border-clinic-teal/30 p-5 ${className}`}>
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 bg-clinic-teal/15 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-clinic-teal/10 dark:bg-clinic-teal/20 border border-clinic-teal/30 flex items-center justify-center text-clinic-teal flex-shrink-0 mt-0.5">
            <Download className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-display text-sm font-bold text-clinic-navy dark:text-white">
                Download MediFlow App
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-clinic-teal/10 text-clinic-teal dark:bg-clinic-teal/20 dark:text-clinic-teal">
                PWA App
              </span>
            </div>
            <p className="text-xs text-clinic-text/70 dark:text-white/70 max-w-sm">
              Install on Mobile or Desktop for fast one-tap access, real-time push alerts, and smooth offline performance.
            </p>

            {/* Supported platforms */}
            <div className="flex items-center gap-3 mt-2 text-[11px] text-clinic-text/50 dark:text-white/50">
              <span className="flex items-center gap-1">
                <Smartphone className="w-3 h-3 text-clinic-teal" /> iOS & Android
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Laptop className="w-3 h-3 text-clinic-teal" /> Windows & macOS
              </span>
            </div>
          </div>
        </div>

        <Button
          onClick={handleInstallClick}
          className="w-full sm:w-auto h-10 px-4 bg-clinic-teal hover:bg-clinic-teal/90 text-white text-xs font-semibold gap-2 shadow-md shadow-clinic-teal/20 flex-shrink-0 transition-all hover:scale-105"
        >
          <Download className="w-4 h-4" />
          <span>{isIOS ? 'Install on iOS' : 'Install App'}</span>
          <ArrowRight className="w-3.5 h-3.5 opacity-70" />
        </Button>
      </div>

      {/* iOS Instructions Dropdown */}
      {showIOSInstructions && (
        <div className="mt-4 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-clinic-teal/30 text-xs text-clinic-text/80 dark:text-white/80 space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between font-semibold text-clinic-navy dark:text-white">
            <span className="flex items-center gap-1.5">
              <Share className="w-3.5 h-3.5 text-clinic-teal" /> iOS Installation Instructions:
            </span>
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="text-clinic-text/40 hover:text-clinic-text dark:text-white/40 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-clinic-text/70 dark:text-white/70">
            <li>Open MediFlow in Safari on your iPhone / iPad.</li>
            <li>Tap the <span className="font-semibold text-clinic-teal">Share</span> button at the bottom of the screen.</li>
            <li>Select <span className="font-semibold text-clinic-navy dark:text-white">Add to Home Screen</span> from the options.</li>
          </ol>
        </div>
      )}
    </div>
  );
}
