'use client';

import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Laptop, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAlreadyInstalled, setIsAlreadyInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone mode (installed)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsAlreadyInstalled(true);
      return;
    }

    // Check if dismissed previously in this session/localStorage
    const isDismissed = localStorage.getItem('mediflow-pwa-dismissed');
    if (isDismissed) {
      return;
    }

    // Detect iOS
    const isIOSDevice = 
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // If iOS, we can show instructions directly since beforeinstallprompt is not fired on iOS
    if (isIOSDevice) {
      setIsVisible(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show the install promotion banner
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again, discard it
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Persist dismissal so we don't annoy the user
    localStorage.setItem('mediflow-pwa-dismissed', 'true');
  };

  if (isAlreadyInstalled || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999] max-w-sm w-full mx-auto p-1 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="relative overflow-hidden bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl text-white">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-clinic-teal/20 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-white/40 hover:text-white/80 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex gap-4 items-start">
          <div className="p-3 bg-gradient-to-br from-clinic-navy to-clinic-teal rounded-xl shrink-0 shadow-lg">
            {isIOS ? (
              <Smartphone className="w-6 h-6 text-white" />
            ) : (
              <Laptop className="w-6 h-6 text-white" />
            )}
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-bold text-base leading-tight">
              Use MediFlow App
            </h3>
            <p className="text-xs text-white/70 leading-relaxed">
              Install MediFlow on your phone or PC for a faster experience, offline access, and easy updates.
            </p>
          </div>
        </div>

        {isIOS ? (
          <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
            <p className="text-[11px] text-white/50 flex items-center gap-1.5">
              To install on your iPhone/iPad:
            </p>
            <div className="bg-white/5 rounded-lg p-2.5 text-[11px] text-white/80 space-y-1">
              <div className="flex items-center gap-1.5">
                <span>1. Tap the share button</span>
                <Share className="w-3.5 h-3.5 inline text-clinic-teal" />
              </div>
              <div>2. Scroll down and tap "Add to Home Screen"</div>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex gap-2">
            <Button
              onClick={handleInstallClick}
              className="flex-1 bg-clinic-teal hover:bg-clinic-teal/90 text-white font-semibold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md shadow-clinic-teal/20"
            >
              <Download className="w-4 h-4" />
              Download App
            </Button>
            <Button
              variant="ghost"
              onClick={handleDismiss}
              className="text-white/60 hover:text-white hover:bg-white/5 text-xs py-2 px-3 rounded-lg"
            >
              Later
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
