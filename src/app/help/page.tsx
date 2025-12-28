"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Activity, ArrowLeft, Search, Book, MessageCircle, Video, FileQuestion, ChevronRight } from "lucide-react";

const categories = [
  {
    title: "Getting Started",
    icon: Book,
    articles: ["Setting up your clinic", "Importing patient data", "Configuring team members"],
  },
  {
    title: "Patient Management",
    icon: MessageCircle,
    articles: ["Adding new patients", "Managing appointments", "Secure messaging"],
  },
  {
    title: "AI Features",
    icon: Video,
    articles: ["AI intake forms", "Smart scheduling", "Analytics insights"],
  },
  {
    title: "Billing & Payments",
    icon: FileQuestion,
    articles: ["Payment processing", "Invoice management", "Subscription billing"],
  },
];

const faqs = [
  {
    question: "How do I reset my password?",
    answer: "You can reset your password from the login page by clicking 'Forgot Password'.",
  },
  {
    question: "Can I export my patient data?",
    answer: "Yes, you can export patient data in CSV or PDF format from the Patient Management section.",
  },
  {
    question: "How does the AI intake form work?",
    answer: "The AI intake form adapts questions based on patient responses, making the process faster and more accurate.",
  },
  {
    question: "Is MediFlow HIPAA compliant?",
    answer: "Yes, MediFlow is fully HIPAA compliant with end-to-end encryption and SOC 2 certification.",
  },
];

export default function HelpPage() {
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
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-clinic-navy dark:text-white mb-4">
              Help Center
            </h1>
            <p className="text-lg text-clinic-text/70 dark:text-white/70 max-w-2xl mx-auto mb-8">
              Find answers, guides, and resources to help you get the most out of MediFlow.
            </p>
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-clinic-text/40" />
              <Input
                placeholder="Search for help..."
                className="pl-12 h-12 bg-white dark:bg-slate-800 border-clinic-navy/10 dark:border-white/10"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="grid sm:grid-cols-2 gap-6 mb-12">
            {categories.map((category) => (
              <div
                key={category.title}
                className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-glass"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-clinic-teal/10 flex items-center justify-center">
                    <category.icon className="w-5 h-5 text-clinic-teal" />
                  </div>
                  <h3 className="font-display font-semibold text-clinic-navy dark:text-white">
                    {category.title}
                  </h3>
                </div>
                <ul className="space-y-2">
                  {category.articles.map((article) => (
                    <li key={article}>
                      <span className="text-sm text-clinic-text/60 dark:text-white/60 hover:text-clinic-teal cursor-pointer transition-colors flex items-center gap-1">
                        <ChevronRight className="w-3 h-3" />
                        {article}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* FAQs */}
          <div className="mb-12">
            <h2 className="font-display text-xl font-bold text-clinic-navy dark:text-white mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div
                  key={faq.question}
                  className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-glass"
                >
                  <h3 className="font-display font-semibold text-clinic-navy dark:text-white mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-sm text-clinic-text/60 dark:text-white/60">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center p-8 bg-gradient-to-br from-clinic-navy to-clinic-navy/90 rounded-2xl text-white">
            <h2 className="font-display text-2xl font-bold mb-4">
              Still Need Help?
            </h2>
            <p className="text-white/70 mb-6">
              Our support team is here to help you with any questions.
            </p>
            <Button className="bg-clinic-teal hover:bg-clinic-teal/90 text-white" asChild>
              <Link href="/support">Contact Support</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
