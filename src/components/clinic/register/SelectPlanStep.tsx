"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Activity, Check, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

interface SelectPlanStepProps {
  selectedPlan: string;
  setSelectedPlan: (value: string) => void;
  isLoading: boolean;
  onSubmit: () => void;
  onBack: () => void;
}

const formatPrice = (price: number, currency: string) => {
  if (currency === "PHP") return `₱${price.toLocaleString()}`;
  return `${currency} ${price.toLocaleString()}`;
};

export function SelectPlanStep({
  selectedPlan,
  setSelectedPlan,
  isLoading,
  onSubmit,
  onBack,
}: SelectPlanStepProps) {
  const [plansData, setPlansData] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);

  useEffect(() => {
    if (plansData.length === 0) {
      setPlansLoading(true);
      fetch("/api/subscription-plans")
        .then((res) => res.json())
        .then((data) => {
          const plans = data.plans || [];
          setPlansData(plans);
          if (!selectedPlan && plans.length > 0) {
            setSelectedPlan(plans[0].slug);
          }
        })
        .catch((err) => console.error("Failed to fetch plans:", err))
        .finally(() => setPlansLoading(false));
    }
  }, [plansData.length, selectedPlan, setSelectedPlan]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-clinic-teal" />
        <h2 className="font-display text-xl font-bold text-clinic-navy dark:text-white">
          Select Your Plan
        </h2>
      </div>

      {plansLoading ? (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 text-clinic-teal animate-spin mx-auto mb-4" />
          <p className="text-clinic-text/60">Loading plans...</p>
        </div>
      ) : plansData.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-clinic-text/60">No plans available at the moment.</p>
        </div>
      ) : (
        <div
          className={`grid gap-4 ${plansData.length >= 2 ? "sm:grid-cols-2" : ""}`}
        >
          {plansData.map((plan, index) => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.slug)}
              className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                selectedPlan === plan.slug
                  ? "border-clinic-teal bg-clinic-teal/5"
                  : "border-clinic-navy/10 dark:border-white/10 hover:border-clinic-teal/50"
              }`}
            >
              {index === 1 && (
                <span className="text-xs font-medium text-clinic-teal mb-2 block">
                  Most Popular
                </span>
              )}
              <h3 className="font-display text-lg font-bold text-clinic-navy dark:text-white">
                {plan.name}
              </h3>
              <p className="text-2xl font-bold text-clinic-teal mt-1">
                {formatPrice(plan.price, plan.currency)}
                <span className="text-sm font-normal text-clinic-text/60 dark:text-white/60">
                  /{plan.billing_cycle === "yearly" ? "year" : "month"}
                </span>
              </p>
              {plan.description && (
                <p className="text-sm text-clinic-text/60 dark:text-white/60 mt-2">
                  {plan.description}
                </p>
              )}
              <ul className="mt-4 space-y-2">
                {(plan.features || []).map((feature: string) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-sm text-clinic-text/70 dark:text-white/70"
                  >
                    <Check className="w-4 h-4 text-clinic-teal" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3">
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
            onClick={onSubmit}
            disabled={isLoading || !selectedPlan}
            className="flex-1 h-12 bg-clinic-teal hover:bg-clinic-teal/90 text-white"
          >
            {isLoading ? "Registering..." : "Complete Registration"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
        <Button
          variant="ghost"
          onClick={() => {
            setSelectedPlan("free_trial");
            setTimeout(onSubmit, 0);
          }}
          disabled={isLoading}
          className="text-clinic-text/50 hover:text-clinic-text/70 dark:text-white/50 dark:hover:text-white/70 text-sm"
        >
          Skip — start with free trial
        </Button>
      </div>
    </div>
  );
}
