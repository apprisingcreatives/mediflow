"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  Activity,
  Calendar,
  MessageSquare,
  FileText,
  Clock,
  Bell,
  Settings,
  ChevronRight,
  Plus,
  Video,
  Phone,
  MapPin,
  LogOut,
  User,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const upcomingAppointments = [
  {
    id: 1,
    doctor: "Dr. Sarah Chen",
    specialty: "Family Medicine",
    date: "Tomorrow",
    time: "10:00 AM",
    type: "in-person",
    location: "Bay Area Medical Group",
    avatar:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&q=80",
  },
  {
    id: 2,
    doctor: "Dr. Michael Park",
    specialty: "Cardiology",
    date: "Mar 15",
    time: "2:30 PM",
    type: "video",
    avatar:
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&q=80",
  },
];

const recentMessages = [
  {
    id: 1,
    from: "Dr. Sarah Chen",
    preview: "Your lab results are in. Everything looks good...",
    time: "2 hours ago",
    unread: true,
    avatar:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&q=80",
  },
  {
    id: 2,
    from: "Reception",
    preview: "Reminder: Please bring your insurance card to your...",
    time: "Yesterday",
    unread: false,
    avatar: null,
  },
];

const getHealthSummary = (
  patient: {
    blood_type?: string | null;
    allergies?: string[] | null;
    chronic_conditions?: string[] | null;
    onboarding_completed?: boolean;
  } | null
) => [
  {
    label: "Blood Type",
    value: patient?.blood_type || "Not Set",
    status: patient?.blood_type ? "normal" : "pending",
    date: "Profile",
  },
  {
    label: "Allergies",
    value:
      (patient?.allergies?.length || 0) > 0
        ? `${patient?.allergies?.length} recorded`
        : "None",
    status: "normal",
    date: "Profile",
  },
  {
    label: "Conditions",
    value:
      (patient?.chronic_conditions?.length || 0) > 0
        ? `${patient?.chronic_conditions?.length} active`
        : "None",
    status:
      (patient?.chronic_conditions?.length || 0) > 0 ? "attention" : "normal",
    date: "Profile",
  },
  {
    label: "Profile",
    value: patient?.onboarding_completed ? "Complete" : "Incomplete",
    status: patient?.onboarding_completed ? "normal" : "attention",
    date: "",
  },
];

export default function ClinicPatientPortal() {
  const router = useRouter();
  const params = useParams();
  const clinicId = params.clinicId as string;
  const { user, patient, isLoading, signOut, canAccessClinic } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login?redirect=/patient");
      } else if (!canAccessClinic(clinicId)) {
        // Patient cannot access this clinic
        router.push("/patient");
      }
    }
  }, [user, patient, isLoading, router, clinicId, canAccessClinic]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-clinic-bg dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-pulse text-clinic-navy dark:text-white">
          Loading...
        </div>
      </div>
    );
  }

  if (!user || !canAccessClinic(clinicId)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-clinic-bg dark:bg-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-b border-clinic-navy/5 dark:border-white/5">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-clinic-navy to-clinic-teal">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-display font-bold text-clinic-navy dark:text-white">
                MediFlow
              </span>
            </Link>

            {/* Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {[
                { icon: Activity, label: "Dashboard", active: true },
                { icon: Calendar, label: "Appointments" },
                { icon: MessageSquare, label: "Messages" },
                { icon: FileText, label: "Records" },
              ].map((item) => (
                <button
                  key={item.label}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    item.active
                      ? "bg-clinic-navy/5 dark:bg-white/5 text-clinic-navy dark:text-white"
                      : "text-clinic-text/60 dark:text-white/60 hover:bg-clinic-navy/5 dark:hover:bg-white/5"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-clinic-teal text-white text-xs rounded-full flex items-center justify-center">
                  2
                </span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-2"
                  >
                    <Avatar className="w-9 h-9">
                      <AvatarFallback className="bg-clinic-navy text-white">
                        {patient?.first_name?.[0]}
                        {patient?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-clinic-navy dark:text-white">
                        {patient?.first_name} {patient?.last_name}
                      </p>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Bell className="w-4 h-4 mr-2" />
                    Notifications
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <FileText className="w-4 h-4 mr-2" />
                    Medical Records
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-red-500"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-clinic-navy dark:text-white mb-2">
            Welcome back, {patient?.first_name || "Patient"}
          </h1>
          <p className="text-clinic-text/60 dark:text-white/60">
            Here's an overview of your health and upcoming appointments
          </p>
        </div>

        {/* Onboarding Status */}
        {patient && !patient.onboarding_completed && (
          <Card className="mb-8 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                      Complete Your Health Profile
                    </h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Finish your onboarding to get personalized care
                      recommendations
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() =>
                    router.push(`/clinic/${clinicId}/patient/onboarding`)
                  }
                >
                  Complete Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {getHealthSummary(patient).map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-clinic-text/60 dark:text-white/60">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-clinic-navy dark:text-white">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full",
                      stat.status === "normal"
                        ? "bg-green-500"
                        : stat.status === "attention"
                          ? "bg-amber-500"
                          : "bg-gray-400"
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Appointments and Messages */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Upcoming Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-clinic-navy/10 dark:border-white/10 hover:bg-clinic-navy/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={appointment.avatar} />
                      <AvatarFallback>
                        {appointment.doctor
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-semibold text-clinic-navy dark:text-white">
                        {appointment.doctor}
                      </h4>
                      <p className="text-sm text-clinic-text/60 dark:text-white/60">
                        {appointment.specialty}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {appointment.date} at {appointment.time}
                        </Badge>
                        <Badge
                          variant={
                            appointment.type === "video"
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {appointment.type === "video" ? (
                            <Video className="w-3 h-3 mr-1" />
                          ) : (
                            <MapPin className="w-3 h-3 mr-1" />
                          )}
                          {appointment.type}
                        </Badge>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-clinic-text/40" />
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Schedule New Appointment
              </Button>
            </CardContent>
          </Card>

          {/* Recent Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Recent Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentMessages.map((message) => (
                  <div
                    key={message.id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-clinic-navy/10 dark:border-white/10 hover:bg-clinic-navy/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={message.avatar || undefined} />
                      <AvatarFallback>
                        {message.from
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-clinic-navy dark:text-white">
                          {message.from}
                        </h4>
                        <span className="text-xs text-clinic-text/60 dark:text-white/60">
                          {message.time}
                        </span>
                      </div>
                      <p className="text-sm text-clinic-text/60 dark:text-white/60 mt-1">
                        {message.preview}
                      </p>
                    </div>
                    {message.unread && (
                      <div className="w-2 h-2 bg-clinic-teal rounded-full" />
                    )}
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                View All Messages
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
