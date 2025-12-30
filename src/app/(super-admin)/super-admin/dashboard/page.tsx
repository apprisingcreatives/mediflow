"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Activity,
  Building2,
  Users,
  Settings,
  LogOut,
  Search,
  Plus,
  ChevronRight,
  Sparkles,
  Shield,
  Clock,
  MapPin,
  Mail,
  Phone,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Clinic {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  is_active: boolean;
  subscription_plan: string;
  created_at: string;
  clinic_services: { id: string }[];
  clinic_ai_features: {
    id: string;
    is_enabled: boolean;
    ai_features: { name: string; slug: string };
  }[];
  practitioners: { id: string }[];
}

interface AIFeature {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  is_premium: boolean;
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [aiFeatures, setAIFeatures] = useState<AIFeature[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [adminName, setAdminName] = useState("Admin");

  useEffect(() => {
    const token = localStorage.getItem("superAdminToken");
    const admin = localStorage.getItem("superAdmin");

    if (!token) {
      router.push("/super-admin/login");
      return;
    }

    if (admin) {
      const parsed = JSON.parse(admin);
      setAdminName(parsed.name);
    }

    fetchData();
  }, [router]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [clinicsRes, featuresRes] = await Promise.all([
        fetch("/api/super-admin/clinics"),
        fetch("/api/super-admin/ai-features"),
      ]);

      const clinicsData = await clinicsRes.json();
      const featuresData = await featuresRes.json();

      setClinics(clinicsData.clinics || []);
      setAIFeatures(featuresData.features || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("superAdminToken");
    localStorage.removeItem("superAdmin");
    router.push("/super-admin/login");
  };

  const toggleFeature = async (
    clinicId: string,
    featureId: string,
    currentValue: boolean
  ) => {
    const admin = localStorage.getItem("superAdmin");
    const adminId = admin ? JSON.parse(admin).id : null;

    try {
      await fetch(`/api/super-admin/clinics/${clinicId}/features`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          featureId,
          isEnabled: !currentValue,
          adminId,
        }),
      });

      fetchData();
    } catch (error) {
      console.error("Failed to toggle feature:", error);
    }
  };

  const filteredClinics = clinics.filter(
    (clinic) =>
      clinic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clinic.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clinic.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalClinics: clinics.length,
    activeClinics: clinics.filter((c) => c.is_active).length,
    totalPractitioners: clinics.reduce(
      (sum, c) => sum + (c.practitioners?.length || 0),
      0
    ),
    premiumClinics: clinics.filter(
      (c) => c.subscription_plan === "professional" || c.subscription_plan === "enterprise"
    ).length,
  };

  return (
    <div className="min-h-screen bg-clinic-bg dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-clinic-navy/5 dark:border-white/5 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-clinic-navy to-clinic-teal">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-display font-bold text-clinic-navy dark:text-white">
                  MediFlow
                </span>
              </Link>
              <span className="px-3 py-1 bg-clinic-ai/10 text-clinic-ai text-xs font-medium rounded-full">
                Super Admin
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-clinic-text/60 dark:text-white/60">
                Welcome, {adminName}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-clinic-text/60 hover:text-red-500"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-glass">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-clinic-teal/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-clinic-teal" />
              </div>
              <div>
                <p className="text-sm text-clinic-text/60 dark:text-white/60">
                  Total Clinics
                </p>
                <p className="text-2xl font-display font-bold text-clinic-navy dark:text-white">
                  {stats.totalClinics}
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-glass">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-clinic-text/60 dark:text-white/60">
                  Active Clinics
                </p>
                <p className="text-2xl font-display font-bold text-clinic-navy dark:text-white">
                  {stats.activeClinics}
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-glass">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-clinic-ai/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-clinic-ai" />
              </div>
              <div>
                <p className="text-sm text-clinic-text/60 dark:text-white/60">
                  Practitioners
                </p>
                <p className="text-2xl font-display font-bold text-clinic-navy dark:text-white">
                  {stats.totalPractitioners}
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-glass">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-clinic-text/60 dark:text-white/60">
                  Premium Plans
                </p>
                <p className="text-2xl font-display font-bold text-clinic-navy dark:text-white">
                  {stats.premiumClinics}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Clinics List */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-bold text-clinic-navy dark:text-white">
                  Registered Clinics
                </h2>
                <Button className="bg-clinic-teal hover:bg-clinic-teal/90 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Clinic
                </Button>
              </div>

              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-clinic-text/40" />
                <Input
                  placeholder="Search clinics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 border-clinic-navy/10 dark:border-white/10"
                />
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-24 bg-clinic-navy/5 dark:bg-white/5 rounded-xl animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredClinics.map((clinic) => (
                    <div
                      key={clinic.id}
                      className={`p-4 border rounded-xl cursor-pointer transition-all ${
                        selectedClinic?.id === clinic.id
                          ? "border-clinic-teal bg-clinic-teal/5"
                          : "border-clinic-navy/10 dark:border-white/10 hover:border-clinic-teal/50"
                      }`}
                      onClick={() => setSelectedClinic(clinic)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-display font-semibold text-clinic-navy dark:text-white">
                              {clinic.name}
                            </h3>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                clinic.subscription_plan === "professional"
                                  ? "bg-clinic-ai/10 text-clinic-ai"
                                  : clinic.subscription_plan === "enterprise"
                                  ? "bg-yellow-500/10 text-yellow-600"
                                  : "bg-clinic-navy/10 text-clinic-navy dark:bg-white/10 dark:text-white"
                              }`}
                            >
                              {clinic.subscription_plan}
                            </span>
                            {!clinic.is_active && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                                Inactive
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-clinic-text/60 dark:text-white/60">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {clinic.email}
                            </span>
                            {clinic.city && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {clinic.city}
                              </span>
                            )}
                            {clinic.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {clinic.phone}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-4 mt-2 text-xs text-clinic-text/50 dark:text-white/50">
                            <span>
                              {clinic.clinic_services?.length || 0} services
                            </span>
                            <span>
                              {clinic.practitioners?.length || 0} practitioners
                            </span>
                            <span>
                              {
                                clinic.clinic_ai_features?.filter(
                                  (f) => f.is_enabled
                                ).length
                              }{" "}
                              AI features enabled
                            </span>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Clinic
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-500">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Clinic
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* AI Features Panel */}
          <div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6 sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-clinic-ai" />
                <h2 className="font-display text-xl font-bold text-clinic-navy dark:text-white">
                  AI Features
                </h2>
              </div>

              {selectedClinic ? (
                <>
                  <p className="text-sm text-clinic-text/60 dark:text-white/60 mb-4">
                    Managing features for{" "}
                    <span className="font-medium text-clinic-navy dark:text-white">
                      {selectedClinic.name}
                    </span>
                  </p>

                  <div className="space-y-4">
                    {aiFeatures.map((feature) => {
                      const clinicFeature = selectedClinic.clinic_ai_features?.find(
                        (cf) => cf.ai_features?.slug === feature.slug
                      );
                      const isEnabled = clinicFeature?.is_enabled || false;

                      return (
                        <div
                          key={feature.id}
                          className="p-4 border border-clinic-navy/10 dark:border-white/10 rounded-xl"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-clinic-navy dark:text-white text-sm">
                                  {feature.name}
                                </h4>
                                {feature.is_premium && (
                                  <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                                    Premium
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-clinic-text/50 dark:text-white/50">
                                {feature.description}
                              </p>
                              <span className="text-xs text-clinic-teal mt-1 block">
                                {feature.category}
                              </span>
                            </div>
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={() =>
                                toggleFeature(
                                  selectedClinic.id,
                                  feature.id,
                                  isEnabled
                                )
                              }
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Settings className="w-12 h-12 text-clinic-text/20 mx-auto mb-4" />
                  <p className="text-clinic-text/60 dark:text-white/60">
                    Select a clinic to manage its AI features
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
