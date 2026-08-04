'use client';

import { useState, useEffect } from 'react';
import { Download, Smartphone, Laptop, Share, CheckCircle2, Sparkles, ArrowRight, X, Monitor, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

type OSName = 'windows' | 'mac' | 'android' | 'ios' | 'linux' | 'unknown';

interface DeviceInfo {
  os: OSName;
  osName: string;
  isMobile: boolean;
  buttonText: string;
  badgeText: string;
}

function detectDevice(): DeviceInfo {
  if (typeof window === 'undefined') {
    return { os: 'windows', osName: 'Windows PC', isMobile: false, buttonText: 'Download for Windows', badgeText: 'Windows' };
  }

  const ua = navigator.userAgent;
  const platform = (navigator as any).userAgentData?.platform || navigator.platform || '';

  if (/iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) {
    return { os: 'ios', osName: 'iPhone / iPad', isMobile: true, buttonText: 'Install on iOS', badgeText: 'iOS' };
  }
  if (/Android/.test(ua)) {
    return { os: 'android', osName: 'Android Device', isMobile: true, buttonText: 'Install on Android', badgeText: 'Android' };
  }
  if (/Win/.test(platform) || /Windows/.test(ua)) {
    return { os: 'windows', osName: 'Windows PC', isMobile: false, buttonText: 'Download for Windows', badgeText: 'Windows' };
  }
  if (/Mac/.test(platform) || /Macintosh/.test(ua)) {
    return { os: 'mac', osName: 'Mac', isMobile: false, buttonText: 'Download for Mac', badgeText: 'macOS' };
  }
  if (/Linux/.test(platform) || /Linux/.test(ua)) {
    return { os: 'linux', osName: 'Linux PC', isMobile: false, buttonText: 'Install for Linux', badgeText: 'Linux' };
  }

  return { os: 'unknown', osName: 'Desktop', isMobile: false, buttonText: 'Download App', badgeText: 'PWA App' };
}

interface AppDownloadSectionProps {
  variant?: 'card' | 'compact' | 'sidebar';
  className?: string;
}

export function AppDownloadSection({ variant = 'card', className = '' }: AppDownloadSectionProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [device, setDevice] = useState<DeviceInfo>({
    os: 'windows',
    osName: 'Windows PC',
    isMobile: false,
    buttonText: 'Download for Windows',
    badgeText: 'Windows',
  });
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Detect OS dynamically on client
    setDevice(detectDevice());

    // Check standalone mode (already installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
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

    // Fallback based on device
    if (device.os === 'windows') {
      downloadWindowsShortcut();
    }
    setShowInstructions(true);
  };

  const downloadWindowsShortcut = () => {
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

  const renderOsIcon = () => {
    if (device.os === 'ios' || device.os === 'android') {
      return <Smartphone className="w-5 h-5" />;
    }
    return <Laptop className="w-5 h-5" />;
  };

  if (isInstalled) {
    return (
      <div className={`p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-3 ${className}`}>
        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span className="text-xs font-medium text-emerald-800 dark:text-emerald-200">
          MediFlow App is installed on this {device.osName}.
        </span>
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className={`p-5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 text-white ${className}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-clinic-teal/20 border border-clinic-teal/30 flex items-center justify-center text-clinic-teal">
            {renderOsIcon()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-clinic-teal">
                Detected: {device.osName}
              </span>
              <Sparkles className="w-3 h-3 text-clinic-teal animate-pulse" />
            </div>
            <h4 className="font-semibold text-sm">Download App</h4>
          </div>
        </div>

        <p className="text-xs text-white/70 mb-4 leading-relaxed">
          Install MediFlow on your {device.osName} for 1-click home screen access and real-time appointment alerts.
        </p>

        <Button
          onClick={handleInstallClick}
          className="w-full h-10 bg-clinic-teal hover:bg-clinic-teal/90 text-white text-xs font-medium gap-2 shadow-lg shadow-clinic-teal/20 transition-all hover:scale-[1.02]"
        >
          <Download className="w-4 h-4" />
          {deferredPrompt ? `Install for ${device.badgeText}` : device.buttonText}
        </Button>

        {showInstructions && (
          <div className="mt-3 p-3 rounded-xl bg-white/10 border border-white/10 text-[11px] text-white/80 space-y-1.5 animate-in fade-in">
            <div className="flex items-center justify-between font-medium text-white">
              <span>{device.osName} Instructions:</span>
              <button onClick={() => setShowInstructions(false)}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {device.os === 'ios' ? (
              <ol className="list-decimal list-inside space-y-1 text-white/70">
                <li>Tap <Share className="w-3 h-3 inline text-clinic-teal" /> Share in Safari</li>
                <li>Tap <span className="font-semibold text-white">Add to Home Screen</span></li>
              </ol>
            ) : device.os === 'android' ? (
              <ol className="list-decimal list-inside space-y-1 text-white/70">
                <li>Tap Chrome Menu (⋮)</li>
                <li>Select <span className="font-semibold text-white">Install App</span></li>
              </ol>
            ) : (
              <ol className="list-decimal list-inside space-y-1 text-white/70">
                <li>Click <span className="font-semibold text-clinic-teal font-mono">⊕</span> or <Monitor className="w-3 h-3 inline text-clinic-teal" /> in your address bar.</li>
                <li>Click <span className="font-semibold text-white">Install MediFlow</span>.</li>
              </ol>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-clinic-navy/5 via-clinic-teal/5 to-clinic-navy/5 dark:from-slate-800/80 dark:via-slate-800/40 dark:to-slate-900/80 border border-clinic-teal/20 dark:border-clinic-teal/30 p-4 sm:p-5 ${className}`}>
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 bg-clinic-teal/15 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-clinic-teal/10 dark:bg-clinic-teal/20 border border-clinic-teal/30 flex items-center justify-center text-clinic-teal flex-shrink-0 mt-0.5">
            <Download className="w-5 h-5 animate-bounce" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="font-display text-sm font-bold text-clinic-navy dark:text-white">
                Download MediFlow App
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-clinic-teal/10 text-clinic-teal dark:bg-clinic-teal/20 dark:text-clinic-teal flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> {device.osName}
              </span>
            </div>
            <p className="text-xs text-clinic-text/70 dark:text-white/70">
              Install MediFlow on your phone for one-tap logins, appointment reminders, and offline access.
            </p>

            {/* Supported platforms list */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[10px]">
              <span className={`px-2 py-0.5 rounded-md font-medium transition-all ${device.os === 'ios' ? 'bg-clinic-teal text-white shadow-sm' : 'text-clinic-text/50 dark:text-white/50 bg-clinic-navy/5 dark:bg-white/5'}`}>
                iOS
              </span>
              <span className={`px-2 py-0.5 rounded-md font-medium transition-all ${device.os === 'android' ? 'bg-clinic-teal text-white shadow-sm' : 'text-clinic-text/50 dark:text-white/50 bg-clinic-navy/5 dark:bg-white/5'}`}>
                Android
              </span>
            </div>
          </div>
        </div>

        <Button
          onClick={handleInstallClick}
          className="w-full h-11 bg-clinic-teal hover:bg-clinic-teal/90 text-white text-xs font-semibold gap-2 shadow-md shadow-clinic-teal/20 transition-all hover:scale-[1.01]"
        >
          <Download className="w-4 h-4" />
          <span>{deferredPrompt ? `Install on ${device.osName}` : device.buttonText}</span>
          <ArrowRight className="w-3.5 h-3.5 opacity-70 ml-auto" />
        </Button>
      </div>

      {/* OS Instructions Dropdown */}
      {showInstructions && (
        <div className="mt-4 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-clinic-teal/30 text-xs text-clinic-text/80 dark:text-white/80 space-y-2.5 animate-in fade-in">
          <div className="flex items-center justify-between font-semibold text-clinic-navy dark:text-white">
            <span className="flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-clinic-teal" />
              Installation Guide for {device.osName}:
            </span>
            <button
              onClick={() => setShowInstructions(false)}
              className="text-clinic-text/40 hover:text-clinic-text dark:text-white/40 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {device.os === 'ios' ? (
            <ol className="list-decimal list-inside space-y-1.5 text-clinic-text/80 dark:text-white/80 pl-1">
              <li>Open MediFlow in Safari on your iPhone / iPad.</li>
              <li>Tap the <Share className="w-3.5 h-3.5 inline text-clinic-teal" /> <span className="font-semibold text-clinic-teal">Share</span> button at the bottom.</li>
              <li>Select <span className="font-bold text-clinic-navy dark:text-white">Add to Home Screen</span>.</li>
            </ol>
          ) : (
            <ol className="list-decimal list-inside space-y-1.5 text-clinic-text/80 dark:text-white/80 pl-1">
              <li>Open Chrome on your Android device.</li>
              <li>Tap the Menu button (⋮) at top right.</li>
              <li>Select <span className="font-bold text-clinic-teal">Install App</span> or <span className="font-bold text-clinic-navy dark:text-white">Add to Home screen</span>.</li>
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
