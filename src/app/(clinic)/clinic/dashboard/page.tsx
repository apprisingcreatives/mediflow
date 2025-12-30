"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";

interface Clinic {
  id: string;
  name: string;
  email: string;
  subscription_plan: string;
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

  useEffect(() => {
    const token = localStorage.getItem("clinicToken");
    const clinicData = localStorage.getItem("clinic");
    const adminData = localStorage.getItem("clinicAdmin");

    if (!token) {
      router.push("/clinic/login");
      return;
    }

    if (clinicData) {
      setClinic(JSON.parse(clinicData));
    }

    if (adminData) {
      const parsed = JSON.parse(adminData);
      setAdminName(parsed.name);
    }

    fetchAIFeatures();
  }, [router]);

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
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-clinic-text/70 dark:text-white/70 hover:bg-clinic-navy/5 dark:hover:bg-white/5"
          >
            <Calendar className="w-5 h-5" />
            Appointments
          </Link>
          <Link
            href="/clinic/patients"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-clinic-text/70 dark:text-white/70 hover:bg-clinic-navy/5 dark:hover:bg-white/5"
          >
            <Users className="w-5 h-5" />
            Patients
          </Link>
          <Link
            href="/clinic/services"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-clinic-text/70 dark:text-white/70 hover:bg-clinic-navy/5 dark:hover:bg-white/5"
          >
            <FileText className="w-5 h-5" />
            Services
          </Link>
          <Link
            href="/clinic/ai-features"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-clinic-text/70 dark:text-white/70 hover:bg-clinic-navy/5 dark:hover:bg-white/5"
          >
            <Sparkles className="w-5 h-5" />
            AI Features
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
          {/* Quick Stats */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
