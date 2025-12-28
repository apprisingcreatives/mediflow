"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Activity, ArrowLeft, Users, MessageSquare, Calendar, Award, ExternalLink } from "lucide-react";

const channels = [
  {
    name: "Discussion Forum",
    description: "Connect with other clinic owners and share best practices.",
    icon: MessageSquare,
    members: "2,500+",
  },
  {
    name: "Monthly Webinars",
    description: "Join live sessions with healthcare technology experts.",
    icon: Calendar,
    members: "500+",
  },
  {
    name: "User Groups",
    description: "Regional groups for local networking and support.",
    icon: Users,
    members: "50+",
  },
  {
    name: "Ambassador Program",
    description: "Become a MediFlow ambassador and earn rewards.",
    icon: Award,
    members: "100+",
  },
];

const events = [
  {
    title: "MediFlow User Conference 2025",
    date: "March 15-16, 2025",
    location: "Manila, Philippines",
    type: "In-person",
  },
  {
    title: "AI in Healthcare Webinar",
    date: "January 20, 2025",
    location: "Online",
    type: "Virtual",
  },
  {
    title: "Clinic Efficiency Workshop",
    date: "February 5, 2025",
    location: "Online",
    type: "Virtual",
  },
];

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-clinic-bg dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-b border-clinic-navy/5 dark:border-white/5">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-clinic-navy to-clinic-teal">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-display font-bold text-clinic-navy dark:text-white">
                MediFlow
              </span>
            </Link>
            <Button variant="ghost" className="text-clinic-navy dark:text-white" asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-clinic-navy dark:text-white mb-4">
              MediFlow Community
            </h1>
            <p className="text-lg text-clinic-text/70 dark:text-white/70 max-w-2xl mx-auto">
              Connect with thousands of healthcare professionals using MediFlow to transform their practices.
            </p>
          </div>

          {/* Community Channels */}
          <div className="grid sm:grid-cols-2 gap-6 mb-12">
            {channels.map((channel) => (
              <div
                key={channel.name}
                className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-glass hover:shadow-glass-lg transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-clinic-teal/10 flex items-center justify-center flex-shrink-0">
                    <channel.icon className="w-6 h-6 text-clinic-teal" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-clinic-navy dark:text-white mb-1 group-hover:text-clinic-teal transition-colors">
                      {channel.name}
                    </h3>
                    <p className="text-sm text-clinic-text/60 dark:text-white/60 mb-2">
                      {channel.description}
                    </p>
                    <span className="text-xs text-clinic-teal font-medium">
                      {channel.members} members
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Upcoming Events */}
          <div className="mb-12">
            <h2 className="font-display text-xl font-bold text-clinic-navy dark:text-white mb-6">
              Upcoming Events
            </h2>
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event.title}
                  className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-glass flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <span className="text-xs px-2 py-1 bg-clinic-teal/10 text-clinic-teal rounded-full mb-2 inline-block">
                      {event.type}
                    </span>
                    <h3 className="font-display font-semibold text-clinic-navy dark:text-white">
                      {event.title}
                    </h3>
                    <p className="text-sm text-clinic-text/60 dark:text-white/60">
                      {event.date} • {event.location}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Learn More
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center p-8 bg-gradient-to-br from-clinic-navy to-clinic-navy/90 rounded-2xl text-white">
            <h2 className="font-display text-2xl font-bold mb-4">
              Join the Community
            </h2>
            <p className="text-white/70 mb-6">
              Get access to exclusive resources, networking opportunities, and expert insights.
            </p>
            <Button className="bg-clinic-teal hover:bg-clinic-teal/90 text-white" asChild>
              <Link href="/demo">Get Started</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
