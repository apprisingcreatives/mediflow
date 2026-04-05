"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, ArrowLeft, ArrowRight } from "lucide-react";

interface AdminAccountStepProps {
  adminName: string;
  setAdminName: (value: string) => void;
  adminEmail: string;
  setAdminEmail: (value: string) => void;
  adminPassword: string;
  setAdminPassword: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function AdminAccountStep({
  adminName,
  setAdminName,
  adminEmail,
  setAdminEmail,
  adminPassword,
  setAdminPassword,
  onNext,
  onBack,
}: AdminAccountStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <User className="w-5 h-5 text-clinic-teal" />
        <h2 className="font-display text-xl font-bold text-clinic-navy dark:text-white">
          Admin Account
        </h2>
      </div>

      <div className="space-y-2">
        <Label className="text-clinic-navy dark:text-white">
          Admin Name *
        </Label>
        <Input
          placeholder="Dr. Juan Dela Cruz"
          value={adminName}
          onChange={(e) => setAdminName(e.target.value)}
          className="h-12"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-clinic-navy dark:text-white">
          Admin Email *
        </Label>
        <Input
          type="email"
          placeholder="admin@clinic.com"
          value={adminEmail}
          onChange={(e) => setAdminEmail(e.target.value)}
          className="h-12"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-clinic-navy dark:text-white">
          Password *
        </Label>
        <Input
          type="password"
          placeholder="••••••••"
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
          className="h-12"
        />
      </div>

      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1 h-12"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!adminName || !adminEmail || !adminPassword}
          className="flex-1 h-12 bg-clinic-teal hover:bg-clinic-teal/90 text-white"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
