"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Activity, ArrowLeft, Heart, Target, Users, Award } from "lucide-react";

const team = [
  {
    name: "Dr. Sarah Chen",
    role: "CEO & Co-Founder",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80",
  },
  {
    name: "Michael Rodriguez",
    role: "CTO & Co-Founder",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80",
  },
  {
    name: "Dr. Emily Watson",
    role: "Chief Medical Officer",
    image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=80",
  },
  {
    name: "James Park",
    role: "VP of Engineering",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
  },
];

const values = [
  {
    icon: Heart,
    title: "Patient First",
    description: "Every decision we make prioritizes patient care and outcomes.",
  },
  {
    icon: Target,
    title: "Innovation",
    description: "We constantly push boundaries to improve healthcare technology.",
  },
  {
    icon: Users,
    title: "Collaboration",
    description: "We work closely with clinics to build solutions that truly work.",
  },
  {
    icon: Award,
    title: "Excellence",
    description: "We hold ourselves to the highest standards in everything we do.",
  },
];

export default function AboutPage() {
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
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-clinic-navy dark:text-white mb-4">
              About MediFlow
            </h1>
            <p className="text-lg text-clinic-text/70 dark:text-white/70 max-w-2xl mx-auto">
              We're on a mission to transform healthcare management through intelligent technology,
              making clinics more efficient and patient care more personal.
            </p>
          </div>

          {/* Story */}
          <div className="mb-16">
            <h2 className="font-display text-2xl font-bold text-clinic-navy dark:text-white mb-4">
              Our Story
            </h2>
            <div className="prose prose-lg dark:prose-invert max-w-none text-clinic-text/70 dark:text-white/70">
              <p>
                MediFlow was founded in 2020 by a team of healthcare professionals and technologists
                who saw firsthand the challenges that clinics face with patient intake, scheduling,
                and administrative tasks.
              </p>
              <p>
                We believed that AI could help streamline these processes without losing the human
                touch that's essential in healthcare. Today, MediFlow serves thousands of clinics
                worldwide, helping them focus on what matters most: their patients.
              </p>
            </div>
          </div>

          {/* Values */}
          <div className="mb-16">
            <h2 className="font-display text-2xl font-bold text-clinic-navy dark:text-white mb-8 text-center">
              Our Values
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {values.map((value) => (
                <div
                  key={value.title}
                  className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-glass"
                >
                  <div className="w-12 h-12 rounded-xl bg-clinic-teal/10 flex items-center justify-center mb-4">
                    <value.icon className="w-6 h-6 text-clinic-teal" />
                  </div>
                  <h3 className="font-display font-semibold text-clinic-navy dark:text-white mb-2">
                    {value.title}
                  </h3>
                  <p className="text-sm text-clinic-text/60 dark:text-white/60">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Team */}
          <div className="mb-16">
            <h2 className="font-display text-2xl font-bold text-clinic-navy dark:text-white mb-8 text-center">
              Leadership Team
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {team.map((member) => (
                <div key={member.name} className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden bg-clinic-navy/10">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-display font-semibold text-clinic-navy dark:text-white">
                    {member.name}
                  </h3>
                  <p className="text-sm text-clinic-text/60 dark:text-white/60">
                    {member.role}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center p-8 bg-gradient-to-br from-clinic-navy to-clinic-navy/90 rounded-2xl text-white">
            <h2 className="font-display text-2xl font-bold mb-4">
              Join Our Mission
            </h2>
            <p className="text-white/70 mb-6">
              We're always looking for talented people to join our team.
            </p>
            <Button className="bg-clinic-teal hover:bg-clinic-teal/90 text-white" asChild>
              <Link href="/careers">View Open Positions</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
