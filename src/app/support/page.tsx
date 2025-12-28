"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Activity, ArrowLeft, Send, Mail, MessageCircle, Phone, Clock } from "lucide-react";

export default function SupportPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent("Support Request from MediFlow Website");
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
    );
    window.location.href = `mailto:info@apprisingcreatives.com?subject=${subject}&body=${body}`;
  };

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
              Contact Support
            </h1>
            <p className="text-lg text-clinic-text/70 dark:text-white/70 max-w-2xl mx-auto">
              We're here to help. Reach out to our support team and we'll get back to you as soon as possible.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-glass text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-clinic-teal/10 flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-clinic-teal" />
              </div>
              <h3 className="font-display font-semibold text-clinic-navy dark:text-white mb-2">
                Email
              </h3>
              <p className="text-sm text-clinic-text/60 dark:text-white/60">
                info@apprisingcreatives.com
              </p>
            </div>
            <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-glass text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-clinic-teal/10 flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6 text-clinic-teal" />
              </div>
              <h3 className="font-display font-semibold text-clinic-navy dark:text-white mb-2">
                Live Chat
              </h3>
              <p className="text-sm text-clinic-text/60 dark:text-white/60">
                Available 9 AM - 6 PM PHT
              </p>
            </div>
            <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-glass text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-clinic-teal/10 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-clinic-teal" />
              </div>
              <h3 className="font-display font-semibold text-clinic-navy dark:text-white mb-2">
                Response Time
              </h3>
              <p className="text-sm text-clinic-text/60 dark:text-white/60">
                Within 24 hours
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-8">
            <h2 className="font-display text-xl font-bold text-clinic-navy dark:text-white mb-6">
              Send us a Message
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-clinic-navy dark:text-white">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-12 border-clinic-navy/20 dark:border-white/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-clinic-navy dark:text-white">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 border-clinic-navy/20 dark:border-white/20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message" className="text-clinic-navy dark:text-white">
                  Message
                </Label>
                <Textarea
                  id="message"
                  placeholder="How can we help you?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={5}
                  className="border-clinic-navy/20 dark:border-white/20"
                />
              </div>
              <Button
                type="submit"
                className="w-full sm:w-auto bg-clinic-teal hover:bg-clinic-teal/90 text-white"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
