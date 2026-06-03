"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function StickyMobileCTA() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 400px
      setIsVisible(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (isDismissed) return null;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 lg:hidden transition-all duration-300",
        isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-full opacity-0 pointer-events-none"
      )}
    >
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-clinic-navy/10 dark:border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] px-4 py-3 safe-area-inset-bottom">
        <div className="flex items-center gap-3">
          <Button
            size="lg"
            className="flex-1 h-12 bg-clinic-teal hover:bg-clinic-teal/90 text-white text-base font-semibold shadow-glow group"
            asChild
          >
            <Link href="/register">
              Start Free Trial
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 border-clinic-navy/20 dark:border-white/20 flex-shrink-0"
            onClick={() => setIsDismissed(true)}
            aria-label="Dismiss mobile CTA"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
