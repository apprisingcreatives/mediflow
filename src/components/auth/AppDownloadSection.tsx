'use client';

import { useState, useEffect } from 'react';
import { Download, Smartphone, Laptop, Share, CheckCircle2, Sparkles, ArrowRight, X, Monitor, HelpCircle, ExternalLink } from 'lucide-react';
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
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Detect standalone mode (already installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Detect Device Type
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) {
      setDeviceType('ios');
    } else if (/Android/.test(ua)) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }

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
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
        return;
      } catch (err) {
        console.error('PWA install prompt error:', err);
      }
    }

    // Fallback if beforeinstallprompt is not triggered automatically
    if (deviceType === 'desktop') {
      // Download Desktop Shortcut as a direct fallback
      downloadDesktopShortcut();
    }
    setShowInstructions(true);
  };

  const downloadDesktopShortcut = () => {
    const appUrl = window.location.origin;
    const shortcutContent = `[InternetShortcut]\nURL=${appUrl}\nIDList=\nIconIndex=0\n[{000214A0-0000-0000-C000-000000000046}]\nProp3=19,2\n`;
    const blob = new Blob([shortcutContent], { type: 'application/x-ms-shortcut' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'MediFlow App.url';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isInstalled) {
    return (
      <div className={`p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-3 ${className}`}>
        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span className="text-xs font-medium text-emerald-800 dark:text-emerald-200">
          MediFlow App is installed on your device.
        </span>
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className={`p-5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 text-white ${className}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-clinic-teal/20 border border-clinic-teal/30 flex items-center justify-center text-clinic-teal">
            {deviceType === 'desktop' ? <Laptop className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-clinic-teal">
                MediFlow {deviceType === 'desktop' ? 'Desktop App' : 'Mobile App'}
              </span>
              <Sparkles className="w-3 h-3 text-clinic-teal animate-pulse" />
            </div>
            <h4 className="font-semibold text-sm">Download App</h4>
          </div>
        </div>

        <p className="text-xs text-white/70 mb-4 leading-relaxed">
          Install MediFlow on your desktop or mobile home screen for quick 1-click access and offline capability.
        </p>

        <Button
          onClick={handleInstallClick}
          className="w-full h-10 bg-clinic-teal hover:bg-clinic-teal/90 text-white text-xs font-medium gap-2 shadow-lg shadow-clinic-teal/20 transition-all hover:scale-[1.02]"
        >
          <Download className="w-4 h-4" />
          {deferredPrompt ? 'Install App Now' : deviceType === 'desktop' ? 'Download Desktop App' : 'Install Mobile App'}
        </Button>

        {showInstructions && (
          <div className="mt-3 p-3 rounded-xl bg-white/10 border border-white/10 text-[11px] text-white/80 space-y-1.5 animate-in fade-in">
            <div className="flex items-center justify-between font-medium text-white">
              <span>{deviceType === 'desktop' ? 'Desktop App Installation:' : 'Mobile Installation:'}</span>
              <button onClick={() => setShowInstructions(false)}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {deviceType === 'desktop' ? (
              <ol className="list-decimal list-inside space-y-1 text-white/70">
                <li>Look for the <span className="font-semibold text-clinic-teal font-mono">⊕</span> or <Monitor className="w-3 h-3 inline text-clinic-teal" /> icon in your browser's address bar.</li>
                <li>Click <span className="font-semibold text-white">Install MediFlow</span>.</li>
                <li>Or open your downloaded desktop shortcut to launch instantly.</li>
              </ol>
            ) : deviceType === 'ios' ? (
              <ol className="list-decimal list-inside space-y-1 text-white/70">
                <li>Tap the <Share className="w-3 h-3 inline text-clinic-teal" /> Share button in Safari</li>
                <li>Tap <span className="font-semibold text-white">Add to Home Screen</span></li>
              </ol>
            ) : (
              <ol className="list-decimal list-inside space-y-1 text-white/70">
                <li>Tap Chrome Menu (⋮)</li>
                <li>Select <span className="font-semibold text-white">Install App / Add to Home Screen</span></li>
              </ol>
            )}
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
                Desktop & Mobile PWA
              </span>
            </div>
            <p className="text-xs text-clinic-text/70 dark:text-white/70 max-w-sm">
              Install MediFlow directly on Windows, macOS, ChromeOS, iOS, or Android for desktop notifications and instant access.
            </p>

            {/* Supported platforms */}
            <div className="flex items-center gap-3 mt-2 text-[11px] text-clinic-text/50 dark:text-white/50">
              <span className="flex items-center gap-1 font-medium text-clinic-teal">
                <Laptop className="w-3.5 h-3.5" /> Windows & macOS
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-clinic-teal" /> iOS & Android
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            onClick={handleInstallClick}
            className="w-full sm:w-auto h-10 px-4 bg-clinic-teal hover:bg-clinic-teal/90 text-white text-xs font-semibold gap-2 shadow-md shadow-clinic-teal/20 flex-shrink-0 transition-all hover:scale-105"
          >
            <Download className="w-4 h-4" />
            <span>{deferredPrompt ? 'Install App Now' : deviceType === 'desktop' ? 'Download Desktop App' : 'Install Mobile App'}</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-70" />
          </Button>
        </div>
      </div>

      {/* Instructions Dropdown */}
      {showInstructions && (
        <div className="mt-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-clinic-teal/30 text-xs text-clinic-text/80 dark:text-white/80 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between font-semibold text-clinic-navy dark:text-white">
            <span className="flex items-center gap-1.5">
              <Monitor className="w-4 h-4 text-clinic-teal" />
              {deviceType === 'desktop' ? 'How to Install MediFlow App on Desktop:' : 'How to Install on Mobile:'}
            </span>
            <button
              onClick={() => setShowInstructions(false)}
              className="text-clinic-text/40 hover:text-clinic-text dark:text-white/40 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {deviceType === 'desktop' ? (
            <div className="space-y-2">
              <p className="text-xs text-clinic-text/70 dark:text-white/70">
                A desktop shortcut (<code className="bg-clinic-teal/10 px-1 py-0.5 rounded text-clinic-teal font-semibold">MediFlow App.url</code>) has been saved to your downloads. You can also install the full native web app directly in your browser:
              </p>
              <ol className="list-decimal list-inside space-y-1.5 text-clinic-text/80 dark:text-white/80 pl-1">
                <li>Look for the <span className="font-bold text-clinic-teal font-mono">⊕</span> or <span className="font-bold text-clinic-teal font-mono">🖥️ Install</span> icon in your browser address bar (top right).</li>
                <li>Click <span className="font-bold text-clinic-navy dark:text-white">Install MediFlow</span> to add it as a standalone desktop app on your taskbar / launchpad.</li>
                <li>In Chrome/Edge menu (⋮), go to <span className="font-bold text-clinic-navy dark:text-white">Save and share</span> → <span className="font-bold text-clinic-teal">Install page as app</span>.</li>
              </ol>
            </div>
          ) : deviceType === 'ios' ? (
            <ol className="list-decimal list-inside space-y-1.5 text-clinic-text/80 dark:text-white/80 pl-1">
              <li>Open MediFlow in Safari on your iPhone / iPad.</li>
              <li>Tap the <Share className="w-3.5 h-3.5 inline text-clinic-teal" /> <span className="font-semibold text-clinic-teal">Share</span> button at the bottom.</li>
              <li>Select <span className="font-bold text-clinic-navy dark:text-white">Add to Home Screen</span>.</li>
            </ol>
          ) : (
            <ol className="list-decimal list-inside space-y-1.5 text-clinic-text/80 dark:text-white/80 pl-1">
              <li>Open Chrome / Edge on your Android phone.</li>
              <li>Tap the Menu button (⋮) at top right.</li>
              <li>Select <span className="font-bold text-clinic-teal">Install App</span> or <span className="font-bold text-clinic-navy dark:text-white">Add to Home screen</span>.</li>
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
