"use client";

import { useState } from "react";
import {
  Activity,
  Users,
  Calendar,
  TrendingUp,
  Clock,
  Bell,
  Search,
  Settings,
  ChevronDown,
  MoreVertical,
  Brain,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const stats = [
  {
    title: "Total Patients",
    value: "1,248",
    change: "+12%",
    trend: "up",
    icon: Users,
    color: "text-clinic-teal",
    bg: "bg-clinic-teal/10",
  },
  {
    title: "Today's Appointments",
    value: "24",
    change: "+3",
    trend: "up",
    icon: Calendar,
    color: "text-clinic-ai",
    bg: "bg-clinic-ai/10",
  },
  {
    title: "Avg. Wait Time",
    value: "12 min",
    change: "-18%",
    trend: "down",
    icon: Clock,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    title: "Revenue (MTD)",
    value: "$48,520",
    change: "+8%",
    trend: "up",
    icon: TrendingUp,
    color: "text-clinic-navy",
    bg: "bg-clinic-navy/10",
  },
];

const patientQueue = [
  {
    id: 1,
    name: "Sarah Johnson",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
    reason: "Annual checkup",
    time: "9:00 AM",
    status: "in-progress",
    priority: "normal",
    aiTriage: "Routine",
  },
  {
    id: 2,
    name: "Michael Chen",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
    reason: "Chest pain, shortness of breath",
    time: "9:30 AM",
    status: "waiting",
    priority: "high",
    aiTriage: "Urgent - Cardiac symptoms",
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
    reason: "Follow-up appointment",
    time: "10:00 AM",
    status: "waiting",
    priority: "normal",
    aiTriage: "Follow-up",
  },
  {
    id: 4,
    name: "David Kim",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80",
    reason: "Persistent headaches",
    time: "10:30 AM",
    status: "waiting",
    priority: "medium",
    aiTriage: "Neurological eval recommended",
  },
];

const aiInsights = [
  {
    type: "recommendation",
    title: "High-risk patient identified",
    description: "Michael Chen's symptoms suggest immediate cardiac evaluation",
    confidence: 92,
    action: "Prioritize",
  },
  {
    type: "optimization",
    title: "Schedule optimization",
    description: "3 patients could be rescheduled to reduce wait times by 20%",
    confidence: 87,
    action: "Review",
  },
  {
    type: "alert",
    title: "Follow-up reminder",
    description: "5 patients due for follow-up visits this week",
    confidence: 100,
    action: "View",
  },
];

export default function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-clinic-bg dark:bg-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-slate-800 border-b border-clinic-navy/5 dark:border-white/5">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Logo & Search */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-clinic-navy to-clinic-teal">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-display font-bold text-clinic-navy dark:text-white">
                MediFlow
              </span>
            </div>

            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-clinic-text/40" />
              <Input
                placeholder="Search patients, appointments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-80 pl-10 h-10 bg-clinic-bg dark:bg-slate-700"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-clinic-teal text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&q=80" />
                    <AvatarFallback>DR</AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block text-sm font-medium">
                    Dr. Rachel
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem className="text-red-500">Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 h-[calc(100vh-73px)] bg-white dark:bg-slate-800 border-r border-clinic-navy/5 dark:border-white/5 p-4 sticky top-[73px]">
          <nav className="space-y-1">
            {[
              { icon: Activity, label: "Dashboard", active: true },
              { icon: Users, label: "Patients" },
              { icon: Calendar, label: "Appointments" },
              { icon: Brain, label: "AI Insights" },
              { icon: TrendingUp, label: "Analytics" },
              { icon: Settings, label: "Settings" },
            ].map((item) => (
              <button
                key={item.label}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                  item.active
                    ? "bg-clinic-navy text-white"
                    : "text-clinic-text/70 dark:text-white/70 hover:bg-clinic-navy/5 dark:hover:bg-white/5"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-display text-2xl font-bold text-clinic-navy dark:text-white mb-1">
              Good morning, Dr. Rachel
            </h1>
            <p className="text-clinic-text/60 dark:text-white/60">
              Here's what's happening at your clinic today
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => (
              <Card key={stat.title} className="border-0 shadow-glass">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", stat.bg)}>
                      <stat.icon className={cn("w-6 h-6", stat.color)} />
                    </div>
                    <div
                      className={cn(
                        "flex items-center gap-1 text-sm font-medium",
                        stat.trend === "up" ? "text-emerald-500" : "text-rose-500"
                      )}
                    >
                      {stat.trend === "up" ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                      {stat.change}
                    </div>
                  </div>
                  <h3 className="text-2xl font-display font-bold text-clinic-navy dark:text-white mb-1">
                    {stat.value}
                  </h3>
                  <p className="text-sm text-clinic-text/60 dark:text-white/60">
                    {stat.title}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Patient Queue */}
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-glass">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="font-display text-lg font-semibold text-clinic-navy dark:text-white">
                    Patient Queue
                  </CardTitle>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="w-4 h-4" />
                    Filter
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-clinic-navy/5 dark:divide-white/5">
                    {patientQueue.map((patient) => (
                      <div
                        key={patient.id}
                        className="flex items-center gap-4 p-4 hover:bg-clinic-bg/50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={patient.avatar} />
                          <AvatarFallback>
                            {patient.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-clinic-navy dark:text-white truncate">
                              {patient.name}
                            </h4>
                            <Badge
                              variant={
                                patient.priority === "high"
                                  ? "destructive"
                                  : patient.priority === "medium"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {patient.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-clinic-text/60 dark:text-white/60 truncate">
                            {patient.reason}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Brain className="w-3.5 h-3.5 text-clinic-ai" />
                            <span className="text-xs text-clinic-ai">
                              {patient.aiTriage}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-clinic-navy dark:text-white">
                            {patient.time}
                          </p>
                          <Badge
                            variant={
                              patient.status === "in-progress"
                                ? "default"
                                : "outline"
                            }
                            className={cn(
                              "mt-1",
                              patient.status === "in-progress" &&
                                "bg-clinic-teal text-white"
                            )}
                          >
                            {patient.status === "in-progress"
                              ? "In Progress"
                              : "Waiting"}
                          </Badge>
                        </div>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Insights Panel */}
            <div>
              <Card className="border-0 shadow-glass bg-gradient-to-br from-clinic-navy to-clinic-navy/90 text-white">
                <CardHeader className="pb-4">
                  <CardTitle className="font-display text-lg font-semibold flex items-center gap-2">
                    <Brain className="w-5 h-5 text-clinic-ai" />
                    AI Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {aiInsights.map((insight, index) => (
                    <div
                      key={index}
                      className="p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">{insight.title}</h4>
                        {insight.type === "alert" ? (
                          <AlertCircle className="w-4 h-4 text-amber-400" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-clinic-teal" />
                        )}
                      </div>
                      <p className="text-xs text-white/60 mb-3">
                        {insight.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Progress
                            value={insight.confidence}
                            className="w-16 h-1.5 bg-white/10"
                          />
                          <span className="text-xs text-white/60">
                            {insight.confidence}% confidence
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-clinic-teal hover:bg-clinic-teal/10"
                        >
                          {insight.action}
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* AI Disclaimer */}
                  <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
                    <p className="text-xs text-white/50 leading-relaxed">
                      ⚠️ AI assistance does not replace medical diagnosis. All
                      recommendations should be reviewed by qualified healthcare
                      professionals.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
