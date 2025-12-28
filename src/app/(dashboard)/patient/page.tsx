"use client";

import { useState } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const upcomingAppointments = [
  {
    id: 1,
    doctor: "Dr. Sarah Chen",
    specialty: "Family Medicine",
    date: "Tomorrow",
    time: "10:00 AM",
    type: "in-person",
    location: "Bay Area Medical Group",
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&q=80",
  },
  {
    id: 2,
    doctor: "Dr. Michael Park",
    specialty: "Cardiology",
    date: "Mar 15",
    time: "2:30 PM",
    type: "video",
    avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&q=80",
  },
];

const recentMessages = [
  {
    id: 1,
    from: "Dr. Sarah Chen",
    preview: "Your lab results are in. Everything looks good...",
    time: "2 hours ago",
    unread: true,
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&q=80",
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

const healthSummary = [
  { label: "Blood Pressure", value: "120/80", status: "normal", date: "Feb 28" },
  { label: "Heart Rate", value: "72 bpm", status: "normal", date: "Feb 28" },
  { label: "Weight", value: "165 lbs", status: "normal", date: "Feb 28" },
  { label: "Blood Glucose", value: "95 mg/dL", status: "normal", date: "Feb 15" },
];

export default function PatientPortal() {
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
                MediFlow<span className="text-clinic-teal">AI</span>
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
              <Avatar className="w-9 h-9">
                <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-clinic-navy dark:text-white mb-2">
            Welcome back, Jessica
          </h1>
          <p className="text-clinic-text/60 dark:text-white/60">
            Here's an overview of your health and upcoming appointments
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Plus, label: "Book Appointment", color: "bg-clinic-teal" },
            { icon: MessageSquare, label: "Send Message", color: "bg-clinic-ai" },
            { icon: FileText, label: "View Records", color: "bg-clinic-navy" },
            { icon: Video, label: "Start Video Call", color: "bg-emerald-500" },
          ].map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 bg-white dark:bg-slate-800 hover:shadow-glass transition-shadow"
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-white",
                  action.color
                )}
              >
                <action.icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-clinic-navy dark:text-white">
                {action.label}
              </span>
            </Button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Upcoming Appointments */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-glass">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-display text-lg font-semibold text-clinic-navy dark:text-white">
                  Upcoming Appointments
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-clinic-teal">
                  View All
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-start gap-4 p-4 rounded-xl bg-clinic-bg/50 dark:bg-slate-700/50"
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={appointment.avatar} />
                      <AvatarFallback>
                        {appointment.doctor
                          .split(" ")
                          .slice(1)
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-clinic-navy dark:text-white">
                          {appointment.doctor}
                        </h4>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            appointment.type === "video"
                              ? "border-clinic-ai/30 text-clinic-ai"
                              : "border-clinic-teal/30 text-clinic-teal"
                          )}
                        >
                          {appointment.type === "video" ? (
                            <>
                              <Video className="w-3 h-3 mr-1" />
                              Video
                            </>
                          ) : (
                            <>
                              <MapPin className="w-3 h-3 mr-1" />
                              In-Person
                            </>
                          )}
                        </Badge>
                      </div>
                      <p className="text-sm text-clinic-text/60 dark:text-white/60">
                        {appointment.specialty}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="flex items-center gap-1 text-clinic-navy dark:text-white">
                          <Calendar className="w-4 h-4 text-clinic-teal" />
                          {appointment.date}
                        </span>
                        <span className="flex items-center gap-1 text-clinic-navy dark:text-white">
                          <Clock className="w-4 h-4 text-clinic-teal" />
                          {appointment.time}
                        </span>
                      </div>
                      {appointment.location && (
                        <p className="text-xs text-clinic-text/50 dark:text-white/50 mt-1">
                          {appointment.location}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button size="sm" className="bg-clinic-teal hover:bg-clinic-teal/90 text-white">
                        {appointment.type === "video" ? "Join Call" : "Check In"}
                      </Button>
                      <Button variant="outline" size="sm">
                        Reschedule
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Health Summary */}
            <Card className="border-0 shadow-glass">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-display text-lg font-semibold text-clinic-navy dark:text-white">
                  Health Summary
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-clinic-teal">
                  View Full History
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {healthSummary.map((metric) => (
                    <div
                      key={metric.label}
                      className="p-4 rounded-xl bg-clinic-bg/50 dark:bg-slate-700/50"
                    >
                      <p className="text-xs text-clinic-text/60 dark:text-white/60 mb-1">
                        {metric.label}
                      </p>
                      <p className="text-xl font-display font-bold text-clinic-navy dark:text-white mb-1">
                        {metric.value}
                      </p>
                      <div className="flex items-center gap-1">
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full",
                            metric.status === "normal"
                              ? "bg-clinic-teal"
                              : "bg-amber-500"
                          )}
                        />
                        <span className="text-xs text-clinic-text/50 dark:text-white/50">
                          {metric.date}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Messages Sidebar */}
          <div className="space-y-6">
            <Card className="border-0 shadow-glass">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-display text-lg font-semibold text-clinic-navy dark:text-white">
                  Messages
                </CardTitle>
                <Button variant="ghost" size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentMessages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "p-3 rounded-xl cursor-pointer transition-colors",
                      message.unread
                        ? "bg-clinic-ai/5 dark:bg-clinic-ai/10"
                        : "hover:bg-clinic-bg/50 dark:hover:bg-slate-700/50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        {message.avatar ? (
                          <AvatarImage src={message.avatar} />
                        ) : null}
                        <AvatarFallback className="bg-clinic-navy/10 dark:bg-white/10">
                          {message.from[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4
                            className={cn(
                              "text-sm",
                              message.unread
                                ? "font-semibold text-clinic-navy dark:text-white"
                                : "font-medium text-clinic-text/80 dark:text-white/80"
                            )}
                          >
                            {message.from}
                          </h4>
                          {message.unread && (
                            <span className="w-2 h-2 bg-clinic-ai rounded-full" />
                          )}
                        </div>
                        <p className="text-sm text-clinic-text/60 dark:text-white/60 truncate">
                          {message.preview}
                        </p>
                        <p className="text-xs text-clinic-text/40 dark:text-white/40 mt-1">
                          {message.time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full mt-2">
                  View All Messages
                </Button>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card className="border-0 shadow-glass bg-gradient-to-br from-clinic-navy to-clinic-navy/90 text-white">
              <CardContent className="p-6">
                <h3 className="font-display font-semibold mb-4">
                  Need Help?
                </h3>
                <div className="space-y-3">
                  <a
                    href="tel:+1234567890"
                    className="flex items-center gap-3 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <Phone className="w-5 h-5 text-clinic-teal" />
                    <div>
                      <p className="text-sm font-medium">Call Us</p>
                      <p className="text-xs text-white/60">(123) 456-7890</p>
                    </div>
                  </a>
                  <button className="flex items-center gap-3 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors w-full text-left">
                    <MessageSquare className="w-5 h-5 text-clinic-ai" />
                    <div>
                      <p className="text-sm font-medium">Live Chat</p>
                      <p className="text-xs text-white/60">Available 24/7</p>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
