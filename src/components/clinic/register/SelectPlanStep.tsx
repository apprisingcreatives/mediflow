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
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  // Sync billingCycle state with selectedPlan if selectedPlan is set externally/initially
  useEffect(() => {
    if (selectedPlan) {
      if (selectedPlan.endsWith("-yearly")) {
        setBillingCycle("yearly");
      } else {
        setBillingCycle("monthly");
      }
    }
  }, [selectedPlan]);

  useEffect(() => {
    if (plansData.length === 0) {
      setPlansLoading(true);
      fetch("/api/subscription-plans")
        .then((res) => res.json())
        .then((data) => {
          const plans = data.plans || [];
          setPlansData(plans);
          if (!selectedPlan && plans.length > 0) {
            const defaultPlan = plans.find((p: any) => p.billing_cycle === "monthly") || plans[0];
            setSelectedPlan(defaultPlan.slug);
          }
        })
        .catch((err) => console.error("Failed to fetch plans:", err))
        .finally(() => setPlansLoading(false));
    }
  }, [plansData.length, selectedPlan, setSelectedPlan]);

  const handleBillingCycleChange = (cycle: "monthly" | "yearly") => {
    setBillingCycle(cycle);
    if (selectedPlan) {
      if (cycle === "yearly" && !selectedPlan.endsWith("-yearly")) {
        setSelectedPlan(`${selectedPlan}-yearly`);
      } else if (cycle === "monthly" && selectedPlan.endsWith("-yearly")) {
        setSelectedPlan(selectedPlan.replace("-yearly", ""));
      }
    }
  };

  const filteredPlans = plansData.filter(
    (plan) => plan.billing_cycle === billingCycle
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-clinic-teal" />
          <h2 className="font-display text-xl font-bold text-clinic-navy dark:text-white">
            Select Your Plan
          </h2>
        </div>

        {/* Billing Cycle Toggle */}
        {!plansLoading && plansData.length > 0 && (
          <div className="inline-flex items-center gap-1 p-1 bg-clinic-navy/5 dark:bg-slate-800 rounded-xl border border-clinic-navy/10 dark:border-white/10 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => handleBillingCycleChange("monthly")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                billingCycle === "monthly"
                  ? "bg-clinic-teal text-white shadow-sm"
                  : "text-clinic-text/60 dark:text-white/60 hover:text-clinic-navy dark:hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => handleBillingCycleChange("yearly")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                billingCycle === "yearly"
                  ? "bg-clinic-teal text-white shadow-sm"
                  : "text-clinic-text/60 dark:text-white/60 hover:text-clinic-navy dark:hover:text-white"
              }`}
            >
              Yearly
              <span className="text-[10px] text-green-600 dark:text-green-400 font-bold bg-green-100 dark:bg-green-900/30 px-1 rounded">
                Save 17%
              </span>
            </button>
          </div>
        )}
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
          className={`grid gap-4 ${
            filteredPlans.length >= 3
              ? "md:grid-cols-3"
              : filteredPlans.length === 2
              ? "sm:grid-cols-2"
              : ""
          }`}
        >
          {filteredPlans.map((plan, index) => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.slug)}
              className={`p-6 border-2 rounded-xl cursor-pointer transition-all flex flex-col justify-between ${
                selectedPlan === plan.slug
                  ? "border-clinic-teal bg-clinic-teal/5"
                  : "border-clinic-navy/10 dark:border-white/10 hover:border-clinic-teal/50"
              }`}
            >
              <div>
                {index === 1 && (
                  <span className="text-xs font-semibold text-clinic-teal mb-2 block uppercase tracking-wider">
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
                      <Check className="w-4 h-4 text-clinic-teal flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
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
            setSelectedPlan("starter");
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
