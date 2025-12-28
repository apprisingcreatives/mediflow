"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Activity, ArrowLeft, Calendar, Clock, ArrowRight } from "lucide-react";

const posts = [
  {
    title: "The Future of AI in Healthcare: 2024 Trends",
    excerpt: "Explore how artificial intelligence is reshaping patient care, diagnostics, and clinic operations in the coming year.",
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80",
    date: "Dec 15, 2024",
    readTime: "8 min read",
    category: "Industry Insights",
  },
  {
    title: "5 Ways to Reduce Patient No-Shows",
    excerpt: "Practical strategies to minimize appointment cancellations and keep your schedule running smoothly.",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=600&q=80",
    date: "Dec 10, 2024",
    readTime: "5 min read",
    category: "Best Practices",
  },
  {
    title: "HIPAA Compliance in the Digital Age",
    excerpt: "Everything you need to know about protecting patient data when using modern healthcare software.",
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&q=80",
    date: "Dec 5, 2024",
    readTime: "10 min read",
    category: "Compliance",
  },
  {
    title: "How AI Intake Forms Improve Patient Experience",
    excerpt: "Learn how intelligent forms can streamline the check-in process while gathering better patient data.",
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80",
    date: "Nov 28, 2024",
    readTime: "6 min read",
    category: "Product",
  },
  {
    title: "Building a Patient-Centric Clinic Culture",
    excerpt: "Tips from healthcare leaders on creating an environment where patients feel valued and heard.",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&q=80",
    date: "Nov 20, 2024",
    readTime: "7 min read",
    category: "Culture",
  },
  {
    title: "Telemedicine Integration Best Practices",
    excerpt: "How to seamlessly blend virtual and in-person care for a hybrid healthcare model.",
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80",
    date: "Nov 15, 2024",
    readTime: "9 min read",
    category: "Technology",
  },
];

export default function BlogPage() {
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
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-clinic-navy dark:text-white mb-4">
              MediFlow Blog
            </h1>
            <p className="text-lg text-clinic-text/70 dark:text-white/70 max-w-2xl mx-auto">
              Insights, tips, and best practices for modern healthcare management.
            </p>
          </div>

          {/* Featured Post */}
          <div className="mb-12 p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-glass overflow-hidden">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="aspect-video md:aspect-auto rounded-xl overflow-hidden">
                <img
                  src={posts[0].image}
                  alt={posts[0].title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-sm font-medium text-clinic-teal mb-2">
                  {posts[0].category}
                </span>
                <h2 className="font-display text-2xl font-bold text-clinic-navy dark:text-white mb-3">
                  {posts[0].title}
                </h2>
                <p className="text-clinic-text/70 dark:text-white/70 mb-4">
                  {posts[0].excerpt}
                </p>
                <div className="flex items-center gap-4 text-sm text-clinic-text/50 dark:text-white/50 mb-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {posts[0].date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {posts[0].readTime}
                  </span>
                </div>
                <Button className="w-fit bg-clinic-teal hover:bg-clinic-teal/90 text-white group">
                  Read More
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>

          {/* Blog Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.slice(1).map((post) => (
              <article
                key={post.title}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-glass overflow-hidden hover:shadow-glass-lg transition-all cursor-pointer group"
              >
                <div className="aspect-video overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <span className="text-xs font-medium text-clinic-teal mb-2 block">
                    {post.category}
                  </span>
                  <h3 className="font-display font-semibold text-clinic-navy dark:text-white mb-2 group-hover:text-clinic-teal transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-clinic-text/60 dark:text-white/60 mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-clinic-text/50 dark:text-white/50">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {post.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
