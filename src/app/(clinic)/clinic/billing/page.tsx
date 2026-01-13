"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Activity,
  Building2,
  CreditCard,
  Check,
  ArrowLeft,
  Shield,
  Sparkles,
  Calendar,
  Users,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Clinic {
  id: string;
  name: string;
  email: string;
  subscription_plan: string;
  trial_start_date?: string;
  trial_end_date?: string;
  is_trial_active?: boolean;
  payment_status?: string;
}

interface PaymentHistory {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  paid_at: string;
}

const plans = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 5000,
    yearlyPrice: 50000,
    features: [
      "Up to 500 patients",
      "AI-powered intake forms",
      "Basic appointment scheduling",
      "Email support",
      "1 practitioner",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    monthlyPrice: 10000,
    yearlyPrice: 100000,
    popular: true,
    features: [
      "Up to 2,000 patients",
      "Advanced AI features",
      "Smart scheduling & reminders",
      "Priority support",
      "Analytics dashboard",
      "Up to 5 practitioners",
      "Secure messaging",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthlyPrice: 25000,
    yearlyPrice: 250000,
    features: [
      "Unlimited patients",
      "Full AI suite",
      "Custom integrations",
      "Dedicated support",
      "Advanced analytics",
      "Unlimited practitioners",
      "Multi-location support",
      "API access",
    ],
  },
];

export default function ClinicBillingPage() {
  const router = useRouter();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [selectedPlan, setSelectedPlan] = useState("professional");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  
  // Payment form state
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("clinicToken");
    const clinicData = localStorage.getItem("clinic");

    if (!token) {
      router.push("/clinic/login");
      return;
    }

    if (clinicData) {
      const parsed = JSON.parse(clinicData);
      setClinic(parsed);
      setSelectedPlan(parsed.subscription_plan || "professional");
    }

    fetchPaymentHistory();
  }, [router]);

  const fetchPaymentHistory = async () => {
    const clinicData = localStorage.getItem("clinic");
    if (!clinicData) return;

    const clinic = JSON.parse(clinicData);
    try {
      const res = await fetch(`/api/clinic/${clinic.id}/payments`);
      if (res.ok) {
        const data = await res.json();
        setPaymentHistory(data.payments || []);
      }
    } catch (error) {
      console.error("Failed to fetch payment history:", error);
    }
  };

  const handleSubscribe = async () => {
    if (!clinic) return;

    setIsProcessing(true);

    try {
      const plan = plans.find((p) => p.id === selectedPlan);
      const amount = billingCycle === "monthly" ? plan?.monthlyPrice : plan?.yearlyPrice;

      const res = await fetch(`/api/clinic/${clinic.id}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          billing_cycle: billingCycle,
          amount,
          card_last_four: cardNumber.slice(-4),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPaymentSuccess(true);
        
        // Update local storage with new clinic data
        const updatedClinic = {
          ...clinic,
          subscription_plan: selectedPlan,
          payment_status: "active",
          is_subscription_active: true,
        };
        localStorage.setItem("clinic", JSON.stringify(updatedClinic));
        setClinic(updatedClinic);

        // Redirect after success
        setTimeout(() => {
          router.push("/clinic/dashboard");
        }, 2000);
      }
    } catch (error) {
      console.error("Subscription failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-clinic-bg dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl p-8 text-center shadow-glass">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-display font-bold text-clinic-navy dark:text-white mb-2">
            Payment Successful!
          </h2>
          <p className="text-clinic-text/60 dark:text-white/60 mb-6">
            Thank you for subscribing. Your {selectedPlan} plan is now active.
          </p>
          <p className="text-sm text-clinic-text/40 dark:text-white/40">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-clinic-bg dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-clinic-navy/5 dark:border-white/5 px-6 py-4 sticky top-0 z-40">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/clinic/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="h-6 w-px bg-clinic-navy/10 dark:bg-white/10" />
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-br from-clinic-navy to-clinic-teal">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-clinic-navy dark:text-white">
                MediFlow
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2 text-sm text-clinic-text/60 dark:text-white/60">
            <Shield className="w-4 h-4 text-clinic-teal" />
            Secure Payment
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-clinic-navy dark:text-white mb-2">
            Choose Your Plan
          </h1>
          <p className="text-clinic-text/60 dark:text-white/60">
            Select the plan that best fits your clinic's needs
          </p>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 p-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                billingCycle === "monthly"
                  ? "bg-clinic-teal text-white"
                  : "text-clinic-text/60 dark:text-white/60 hover:text-clinic-navy dark:hover:text-white"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                billingCycle === "yearly"
                  ? "bg-clinic-teal text-white"
                  : "text-clinic-text/60 dark:text-white/60 hover:text-clinic-navy dark:hover:text-white"
              )}
            >
              Yearly
              <span className="ml-1 text-xs text-green-500 font-bold">Save 17%</span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={cn(
                "relative p-6 rounded-2xl cursor-pointer transition-all",
                selectedPlan === plan.id
                  ? "bg-white dark:bg-slate-800 border-2 border-clinic-teal shadow-glass"
                  : "bg-white dark:bg-slate-800 border-2 border-transparent hover:border-clinic-teal/30 shadow-sm"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-clinic-teal text-white text-xs font-medium rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-lg font-display font-bold text-clinic-navy dark:text-white">
                  {plan.name}
                </h3>
                <div className="mt-2">
                  <span className="text-3xl font-display font-bold text-clinic-navy dark:text-white">
                    ₱{(billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice).toLocaleString()}
                  </span>
                  <span className="text-clinic-text/60 dark:text-white/60 text-sm">
                    /{billingCycle === "monthly" ? "month" : "year"}
                  </span>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-clinic-teal flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-clinic-text/70 dark:text-white/70">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <div
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                  selectedPlan === plan.id
                    ? "border-clinic-teal bg-clinic-teal"
                    : "border-clinic-navy/20 dark:border-white/20"
                )}
              >
                {selectedPlan === plan.id && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Payment Form */}
        {showPaymentForm ? (
          <div className="max-w-md mx-auto">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-glass">
              <h3 className="text-lg font-display font-bold text-clinic-navy dark:text-white mb-4">
                Payment Details
              </h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="cardName">Cardholder Name</Label>
                  <Input
                    id="cardName"
                    placeholder="John Doe"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <div className="relative">
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      maxLength={19}
                      className="mt-1 pl-10"
                    />
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-clinic-text/40 mt-0.5" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/YY"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(formatExpiry(e.target.value))}
                      maxLength={5}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      maxLength={4}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-clinic-navy/10 dark:border-white/10">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-clinic-text/60 dark:text-white/60">Plan</span>
                    <span className="font-medium text-clinic-navy dark:text-white">
                      {plans.find((p) => p.id === selectedPlan)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mb-4">
                    <span className="text-clinic-text/60 dark:text-white/60">Amount</span>
                    <span className="font-bold text-clinic-navy dark:text-white">
                      ₱{(billingCycle === "monthly" 
                        ? plans.find((p) => p.id === selectedPlan)?.monthlyPrice 
                        : plans.find((p) => p.id === selectedPlan)?.yearlyPrice
                      )?.toLocaleString()}/{billingCycle === "monthly" ? "mo" : "yr"}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleSubscribe}
                  disabled={isProcessing || !cardNumber || !expiryDate || !cvv || !cardName}
                  className="w-full bg-clinic-teal hover:bg-clinic-teal/90 text-white h-12"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Subscribe Now
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-clinic-text/50 dark:text-white/50">
                  Your payment information is securely processed. Cancel anytime.
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              onClick={() => setShowPaymentForm(false)}
              className="w-full mt-4"
            >
              Back to Plans
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <Button
              onClick={() => setShowPaymentForm(true)}
              size="lg"
              className="bg-clinic-teal hover:bg-clinic-teal/90 text-white px-8"
            >
              Continue to Payment
            </Button>
          </div>
        )}

        {/* Payment History */}
        {paymentHistory.length > 0 && (
          <div className="mt-12">
            <h3 className="text-lg font-display font-bold text-clinic-navy dark:text-white mb-4">
              Payment History
            </h3>
            <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-clinic-navy/5 dark:border-white/5">
                    <th className="px-6 py-3 text-left text-sm font-medium text-clinic-text/60 dark:text-white/60">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-clinic-text/60 dark:text-white/60">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-clinic-text/60 dark:text-white/60">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-clinic-text/60 dark:text-white/60">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map((payment) => (
                    <tr key={payment.id} className="border-b border-clinic-navy/5 dark:border-white/5 last:border-0">
                      <td className="px-6 py-4 text-sm text-clinic-navy dark:text-white">
                        {new Date(payment.paid_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-clinic-text/70 dark:text-white/70">
                        {payment.description}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-clinic-navy dark:text-white">
                        {payment.currency} {payment.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-medium",
                          payment.status === "paid"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                        )}>
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
