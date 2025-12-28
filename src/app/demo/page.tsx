"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, Send, CheckCircle, ArrowLeft } from "lucide-react";

export default function DemoPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Send email via mailto link
    const subject = encodeURIComponent("Demo Request from MediFlow Website");
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\nThis person has requested a demo of MediFlow.`
    );
    
    window.location.href = `mailto:info@apprisingcreatives.com?subject=${subject}&body=${body}`;
    
    // Simulate submission delay
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1000);
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

            <Button
              variant="ghost"
              className="text-clinic-navy dark:text-white"
              asChild
            >
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
        <div className="max-w-md mx-auto">
          {!isSubmitted ? (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="font-display text-3xl sm:text-4xl font-bold text-clinic-navy dark:text-white mb-4">
                  Book a Demo
                </h1>
                <p className="text-clinic-text/70 dark:text-white/70">
                  Fill in your details and we'll get in touch to schedule a
                  personalized demo of MediFlow.
                </p>
              </div>

              {/* Form */}
              <form
                onSubmit={handleSubmit}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-8"
              >
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-clinic-navy dark:text-white">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Dr. John Smith"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="h-12 border-clinic-navy/20 dark:border-white/20 focus:border-clinic-teal"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-clinic-navy dark:text-white">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@clinic.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 border-clinic-navy/20 dark:border-white/20 focus:border-clinic-teal"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 bg-clinic-teal hover:bg-clinic-teal/90 text-white shadow-glow"
                  >
                    {isSubmitting ? (
                      "Sending..."
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Request Demo
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </>
          ) : (
            /* Success State */
            <div className="text-center bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-12">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-clinic-teal/10 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-clinic-teal" />
              </div>
              <h2 className="font-display text-2xl font-bold text-clinic-navy dark:text-white mb-4">
                Thank You!
              </h2>
              <p className="text-clinic-text/70 dark:text-white/70 mb-8">
                Your demo request has been sent. We'll get back to you within 24
                hours to schedule your personalized demo.
              </p>
              <Button
                className="bg-clinic-teal hover:bg-clinic-teal/90 text-white"
                asChild
              >
                <Link href="/">Return to Home</Link>
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
