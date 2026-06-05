"use client";

import { createContext, useContext } from "react";

export interface Clinic {
  id: string;
  name: string;
  email: string;
  subscription_plan: string;
  trial_start_date?: string;
  trial_end_date?: string;
  is_trial_active?: boolean;
  is_subscription_active?: boolean;
  payment_status?: string;
  slug?: string;
  email_notifications_enabled: boolean;
  appointment_reminders_enabled: boolean;
  intake_required?: boolean;
  last_payment_date?: string;
  next_billing_date?: string;
  paymongo_merchant_id?: string | null;
  paymongo_merchant_status?: string | null;
}

export interface ClinicAdmin {
  id: string;
  email: string;
  name: string;
  clinic_id: string;
  is_active: boolean;
}

export interface ClinicContextType {
  clinic: Clinic | null;
  admin: ClinicAdmin | null;
  clinicFeatures: any[];
  featuresLoading: boolean;
  isTrialExpired: boolean;
  trialDaysRemaining: number | null;
}

export const ClinicContext = createContext<ClinicContextType>({
  clinic: null,
  admin: null,
  clinicFeatures: [],
  featuresLoading: false,
  isTrialExpired: false,
  trialDaysRemaining: null,
});

export const useClinicContext = () => useContext(ClinicContext);
