'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { BookOpen, ChevronDown, HelpCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import useGetHelpGuides from '@/hooks/useGetHelpGuides';
import { HelpGuideCategory, HelpGuide, HelpGuideFaq } from '@/types/super-admin';

interface HelpGuideViewerProps {
  category: HelpGuideCategory;
}

export function HelpGuideViewer({ category }: HelpGuideViewerProps) {
  const { guides, loading, fetchGuides } = useGetHelpGuides();
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);
  const [expandedFaqs, setExpandedFaqs] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchGuides(category);
  }, [category, fetchGuides]);

  const publishedGuides = guides.filter((g) => g.is_published);

  const toggleGuide = (id: string) => {
    setExpandedGuide((prev) => (prev === id ? null : id));
    setExpandedFaqs(new Set());
  };

  const toggleFaq = (id: string) => {
    setExpandedFaqs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-clinic-teal" />
      </div>
    );
  }

  if (publishedGuides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <BookOpen className="w-12 h-12 text-clinic-navy/20 dark:text-white/20 mb-4" />
        <h3 className="font-display font-semibold text-clinic-navy dark:text-white mb-1">
          No help guides available
        </h3>
        <p className="text-sm text-clinic-text/60 dark:text-white/60">
          Help guides will appear here once published.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {publishedGuides.map((guide) => {
        const isExpanded = expandedGuide === guide.id;
        const faqs = guide.help_guide_faqs?.sort((a, b) => a.sort_order - b.sort_order) ?? [];

        return (
          <div
            key={guide.id}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-glass border border-clinic-navy/5 dark:border-white/5 overflow-hidden"
          >
            {/* Guide header */}
            <button
              onClick={() => toggleGuide(guide.id)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-clinic-navy/[0.02] dark:hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-clinic-teal/10 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 text-clinic-teal" />
                </div>
                <span className="font-display font-semibold text-clinic-navy dark:text-white">
                  {guide.title}
                </span>
              </div>
              <ChevronDown
                className={cn(
                  'w-5 h-5 text-clinic-text/40 dark:text-white/40 transition-transform',
                  isExpanded && 'rotate-180',
                )}
              />
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="px-5 pb-5 space-y-4">
                {guide.body && (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-clinic-text/70 dark:text-white/70 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-clinic-navy [&_h2]:dark:text-white [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-clinic-navy [&_h3]:dark:text-white [&_h3]:mt-3 [&_h3]:mb-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_p]:my-1.5 [&_strong]:text-clinic-navy [&_strong]:dark:text-white">
                    <ReactMarkdown>{guide.body}</ReactMarkdown>
                  </div>
                )}

                {faqs.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-clinic-text/40 dark:text-white/40 uppercase tracking-wider">
                      Frequently Asked Questions
                    </p>
                    {faqs.map((faq) => {
                      const faqExpanded = expandedFaqs.has(faq.id);
                      return (
                        <div
                          key={faq.id}
                          className="rounded-lg border border-clinic-navy/10 dark:border-white/10 overflow-hidden"
                        >
                          <button
                            onClick={() => toggleFaq(faq.id)}
                            className="w-full flex items-center justify-between p-3 text-left hover:bg-clinic-navy/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <HelpCircle className="w-4 h-4 text-clinic-teal shrink-0" />
                              <span className="text-sm font-medium text-clinic-navy dark:text-white">
                                {faq.question}
                              </span>
                            </div>
                            <ChevronDown
                              className={cn(
                                'w-4 h-4 text-clinic-text/40 dark:text-white/40 transition-transform shrink-0',
                                faqExpanded && 'rotate-180',
                              )}
                            />
                          </button>
                          {faqExpanded && (
                            <div className="px-3 pb-3 pl-9">
                              <div className="prose prose-sm dark:prose-invert max-w-none text-clinic-text/60 dark:text-white/60 [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_strong]:text-clinic-navy [&_strong]:dark:text-white">
                                <ReactMarkdown>{faq.answer}</ReactMarkdown>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
