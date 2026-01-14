"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  Building2,
  Users,
  Calendar,
  Settings,
  LogOut,
  FileText,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  CreditCard,
  AlertCircle,
  Lock,
} from "lucide-react";

interface Clinic {
  id: string;
  name: string;
  email: string;
  subscription_plan: string;
  trial_start_date?: string;
  trial_end_date?: string;
  is_trial_active?: boolean;
  is_subscription_active?: boolean;
  payment_status?: string;
}

interface AIFeature {
  id: string;
  is_enabled: boolean;
  ai_features: {
    name: string;
    slug: string;
    description: string;
    category: string;
  };
}

export default function ClinicDashboard() {
  const router = useRouter();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [adminName, setAdminName] = useState("Admin");
  const [aiFeatures, setAIFeatures] = useState<AIFeature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number | null>(
    null
  );
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isTrialExpired, setIsTrialExpired] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("clinicToken");
    const clinicData = localStorage.getItem("clinic");
    const adminData = localStorage.getItem("clinicAdmin");

    if (!token) {
      router.push("/clinic/login");
      return;
    }

    if (clinicData) {
      const parsedClinic = JSON.parse(clinicData);
      setClinic(parsedClinic);

      // Calculate trial days remaining
      if (parsedClinic.trial_end_date) {
        const trialEnd = new Date(parsedClinic.trial_end_date);
        const today = new Date();
        const diffTime = trialEnd.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setTrialDaysRemaining(diffDays);

        if (diffDays <= 0 && parsedClinic.payment_status === "trial") {
          setIsTrialExpired(true);
        }
      }
    }

    if (adminData) {
      const parsed = JSON.parse(adminData);
      setAdminName(parsed.name);
    }

    fetchAIFeatures();
    fetchLatestClinicData();
  }, [router]);

  const fetchLatestClinicData = async () => {
    const clinicData = localStorage.getItem("clinic");
    if (!clinicData) return;

    const clinic = JSON.parse(clinicData);
    try {
      const res = await fetch(`/api/clinic/${clinic.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.clinic) {
          setClinic(data.clinic);
          localStorage.setItem("clinic", JSON.stringify(data.clinic));

          // Update trial status
          if (data.clinic.trial_end_date) {
            const trialEnd = new Date(data.clinic.trial_end_date);
            const today = new Date();
            const diffTime = trialEnd.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setTrialDaysRemaining(diffDays);

            if (diffDays <= 0 && data.clinic.payment_status === "trial") {
              setIsTrialExpired(true);
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch clinic data:", error);
    }
  };

  const fetchAIFeatures = async () => {
    const clinicData = localStorage.getItem("clinic");
    if (!clinicData) return;

    const clinic = JSON.parse(clinicData);

    try {
      const res = await fetch(`/api/clinic/${clinic.id}/features`);
      const data = await res.json();
      setAIFeatures(data.features || []);
    } catch (error) {
      console.error("Failed to fetch AI features:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("clinicToken");
    localStorage.removeItem("clinicAdmin");
    localStorage.removeItem("clinic");
    router.push("/clinic/login");
  };

  const enabledFeatures = aiFeatures.filter((f) => f.is_enabled);
  const disabledFeatures = aiFeatures.filter((f) => !f.is_enabled);

  return (
    <div className="min-h-screen bg-clinic-bg dark:bg-slate-900">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-800 border-r border-clinic-navy/5 dark:border-white/5 hidden lg:block">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-clinic-navy to-clinic-teal">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-display font-bold text-clinic-navy dark:text-white">
              MediFlow
            </span>
          </Link>
        </div>

        <nav className="px-4 space-y-1">
          <Link
            href="/clinic/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-clinic-teal/10 text-clinic-teal font-medium"
          >
            <Building2 className="w-5 h-5" />
            Dashboard
          </Link>
          <Link
            href="/clinic/appointments"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-clinic-text/70 dark:text-white/70 hover:bg-clinic-navy/5 dark:hover:bg-white/5 ${isTrialExpired ? "opacity-50 pointer-events-none" : ""}`}
          >
            <Calendar className="w-5 h-5" />
            Appointments
            {isTrialExpired && <Lock className="w-3 h-3 ml-auto" />}
          </Link>
          <Link
            href="/clinic/patients"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-clinic-text/70 dark:text-white/70 hover:bg-clinic-navy/5 dark:hover:bg-white/5 ${isTrialExpired ? "opacity-50 pointer-events-none" : ""}`}
          >
            <Users className="w-5 h-5" />
            Patients
            {isTrialExpired && <Lock className="w-3 h-3 ml-auto" />}
          </Link>
          <Link
            href="/clinic/services"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-clinic-text/70 dark:text-white/70 hover:bg-clinic-navy/5 dark:hover:bg-white/5 ${isTrialExpired ? "opacity-50 pointer-events-none" : ""}`}
          >
            <FileText className="w-5 h-5" />
            Services
            {isTrialExpired && <Lock className="w-3 h-3 ml-auto" />}
          </Link>
          <Link
            href="/clinic/ai-features"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-clinic-text/70 dark:text-white/70 hover:bg-clinic-navy/5 dark:hover:bg-white/5 ${isTrialExpired ? "opacity-50 pointer-events-none" : ""}`}
          >
            <Sparkles className="w-5 h-5" />
            AI Features
            {isTrialExpired && <Lock className="w-3 h-3 ml-auto" />}
          </Link>
          <Link
            href="/clinic/billing"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-clinic-text/70 dark:text-white/70 hover:bg-clinic-navy/5 dark:hover:bg-white/5"
          >
            <CreditCard className="w-5 h-5" />
            Billing
          </Link>
          <Link
            href="/clinic/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-clinic-text/70 dark:text-white/70 hover:bg-clinic-navy/5 dark:hover:bg-white/5"
          >
            <Settings className="w-5 h-5" />
            Settings
          </Link>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-clinic-text/60 hover:text-red-500"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64">
        {/* Header */}
        <header className="bg-white dark:bg-slate-800 border-b border-clinic-navy/5 dark:border-white/5 px-6 py-4 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-clinic-navy dark:text-white">
                {clinic?.name || "Clinic Dashboard"}
              </h1>
              <p className="text-sm text-clinic-text/60 dark:text-white/60">
                Welcome back, {adminName}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span
                className={`text-xs px-3 py-1 rounded-full font-medium ${
                  clinic?.subscription_plan === "professional"
                    ? "bg-clinic-ai/10 text-clinic-ai"
                    : clinic?.subscription_plan === "enterprise"
                      ? "bg-yellow-500/10 text-yellow-600"
                      : "bg-clinic-navy/10 text-clinic-navy dark:bg-white/10 dark:text-white"
                }`}
              >
                {clinic?.subscription_plan || "starter"} plan
              </span>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Trial/Subscription Banner */}
          {clinic?.payment_status === "trial" &&
            trialDaysRemaining !== null && (
              <div
                className={`mb-6 p-4 rounded-2xl ${
                  isTrialExpired
                    ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                    : trialDaysRemaining <= 3
                      ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                      : "bg-clinic-teal/5 dark:bg-clinic-teal/10 border border-clinic-teal/20"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {isTrialExpired ? (
                      <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                    ) : trialDaysRemaining <= 3 ? (
                      <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Clock className="w-6 h-6 text-clinic-teal flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h3
                        className={`font-semibold ${
                          isTrialExpired
                            ? "text-red-700 dark:text-red-400"
                            : trialDaysRemaining <= 3
                              ? "text-amber-700 dark:text-amber-400"
                              : "text-clinic-navy dark:text-white"
                        }`}
                      >
                        {isTrialExpired
                          ? "Your Trial Has Expired"
                          : trialDaysRemaining <= 3
                            ? `Only ${trialDaysRemaining} day${trialDaysRemaining === 1 ? "" : "s"} left in your trial!`
                            : `${trialDaysRemaining} days remaining in your free trial`}
                      </h3>
                      <p
                        className={`text-sm mt-1 ${
                          isTrialExpired
                            ? "text-red-600/80 dark:text-red-400/80"
                            : trialDaysRemaining <= 3
                              ? "text-amber-600/80 dark:text-amber-400/80"
                              : "text-clinic-text/60 dark:text-white/60"
                        }`}
                      >
                        {isTrialExpired
                          ? "Subscribe now to restore access to all features."
                          : "Upgrade to a paid plan to continue using all features after your trial ends."}
                      </p>
                      {!isTrialExpired && (
                        <div className="mt-3">
                          <Progress
                            value={((14 - trialDaysRemaining) / 14) * 100}
                            className="h-2 w-48"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <Link href="/clinic/billing">
                    <Button
                      className={
                        isTrialExpired
                          ? "bg-red-500 hover:bg-red-600 text-white"
                          : "bg-clinic-teal hover:bg-clinic-teal/90 text-white"
                      }
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      {isTrialExpired ? "Subscribe Now" : "Upgrade Plan"}
                    </Button>
                  </Link>
                </div>
              </div>
            )}

          {/* Trial Expired Overlay Content */}
          {isTrialExpired && (
            <div className="mb-6 p-8 bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-red-200 dark:border-red-800">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-display font-bold text-clinic-navy dark:text-white mb-2">
                  Features Locked
                </h2>
                <p className="text-clinic-text/60 dark:text-white/60 max-w-md mx-auto mb-6">
                  Your 14-day free trial has ended. Subscribe to a plan to
                  restore access to all features including appointments, patient
                  management, and AI tools.
                </p>
                <Link href="/clinic/billing">
                  <Button
                    size="lg"
                    className="bg-clinic-teal hover:bg-clinic-teal/90 text-white"
                  >
                    <CreditCard className="w-5 h-5 mr-2" />
                    View Plans & Subscribe
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div
            className={`grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 ${isTrialExpired ? "opacity-50 pointer-events-none" : ""}`}
          >
            <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-glass">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-clinic-teal/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-clinic-teal" />
                </div>
                <div>
                  <p className="text-sm text-clinic-text/60 dark:text-white/60">
                    Today's Appointments
                  </p>
                  <p className="text-2xl font-display font-bold text-clinic-navy dark:text-white">
                    12
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-glass">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-clinic-text/60 dark:text-white/60">
                    Total Patients
                  </p>
                  <p className="text-2xl font-display font-bold text-clinic-navy dark:text-white">
                    248
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-glass">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-clinic-ai/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-clinic-ai" />
                </div>
                <div>
                  <p className="text-sm text-clinic-text/60 dark:text-white/60">
                    This Month Revenue
                  </p>
                  <p className="text-2xl font-display font-bold text-clinic-navy dark:text-white">
                    ₱45,200
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-glass">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-clinic-text/60 dark:text-white/60">
                    Avg. Wait Time
                  </p>
                  <p className="text-2xl font-display font-bold text-clinic-navy dark:text-white">
                    8 min
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* AI Features Status */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-clinic-ai" />
                <h2 className="font-display text-xl font-bold text-clinic-navy dark:text-white">
                  AI Features Status
                </h2>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-16 bg-clinic-navy/5 dark:bg-white/5 rounded-xl animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-6">
                    <h3 className="text-sm font-medium text-clinic-text/60 dark:text-white/60 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Enabled ({enabledFeatures.length})
                    </h3>
                    {enabledFeatures.map((feature) => (
                      <div
                        key={feature.id}
                        className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl"
                      >
                        <p className="font-medium text-sm text-green-700 dark:text-green-400">
                          {feature.ai_features.name}
                        </p>
                        <p className="text-xs text-green-600/70 dark:text-green-400/70">
                          {feature.ai_features.description}
                        </p>
                      </div>
                    ))}
                  </div>

                  {disabledFeatures.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-clinic-text/60 dark:text-white/60 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        Not Enabled ({disabledFeatures.length})
                      </h3>
                      {disabledFeatures.slice(0, 3).map((feature) => (
                        <div
                          key={feature.id}
                          className="p-3 bg-clinic-navy/5 dark:bg-white/5 border border-clinic-navy/10 dark:border-white/10 rounded-xl"
                        >
                          <p className="font-medium text-sm text-clinic-navy/70 dark:text-white/70">
                            {feature.ai_features.name}
                          </p>
                          <p className="text-xs text-clinic-text/50 dark:text-white/50">
                            Contact support to enable
                          </p>
                        </div>
                      ))}
                      {disabledFeatures.length > 3 && (
                        <p className="text-xs text-clinic-text/50 dark:text-white/50 text-center">
                          +{disabledFeatures.length - 3} more features available
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Today's Schedule */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-clinic-teal" />
                  <h2 className="font-display text-xl font-bold text-clinic-navy dark:text-white">
                    Today's Schedule
                  </h2>
                </div>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>

              <div className="space-y-4">
                {[
                  {
                    time: "9:00 AM",
                    patient: "Maria Santos",
                    service: "General Consultation",
                    status: "completed",
                  },
                  {
                    time: "10:00 AM",
                    patient: "Juan Dela Cruz",
                    service: "Physical Exam",
                    status: "in-progress",
                  },
                  {
                    time: "11:00 AM",
                    patient: "Anna Reyes",
                    service: "Vaccination",
                    status: "upcoming",
                  },
                  {
                    time: "2:00 PM",
                    patient: "Michael Lim",
                    service: "Follow-up",
                    status: "upcoming",
                  },
                ].map((apt, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-clinic-navy/10 dark:border-white/10 rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-clinic-navy dark:text-white w-20">
                        {apt.time}
                      </span>
                      <div>
                        <p className="font-medium text-clinic-navy dark:text-white">
                          {apt.patient}
                        </p>
                        <p className="text-xs text-clinic-text/60 dark:text-white/60">
                          {apt.service}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        apt.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : apt.status === "in-progress"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {apt.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
