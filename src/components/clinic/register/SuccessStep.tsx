"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export function SuccessStep() {
  return (
    <div className="text-center py-8">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-clinic-teal/10 flex items-center justify-center">
        <Check className="w-10 h-10 text-clinic-teal" />
      </div>
      <h2 className="font-display text-2xl font-bold text-clinic-navy dark:text-white mb-4">
        Registration Complete!
      </h2>
      <p className="text-clinic-text/70 dark:text-white/70 mb-8">
        Your clinic has been registered successfully. You can now log in
        to your clinic dashboard.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          className="bg-clinic-teal hover:bg-clinic-teal/90 text-white"
          asChild
        >
          <Link href="/clinic/login">Go to Login</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    </div>
  );
}
