'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquareWarning,
  Bug,
  MessageCircle,
  HelpCircle,
  Send,
  CheckCircle2,
  Clock,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';

interface ReportFormProps {
  userEmail: string;
  userRole: string;
}

interface UserReport {
  id: string;
  title: string;
  description: string | null;
  type: 'bug' | 'feedback' | 'complaint' | 'other';
  status: 'pending' | 'reviewed' | 'resolved';
  created_at: string;
}

const reportTypeOptions = [
  { value: 'bug', label: 'Bug Report', icon: Bug },
  { value: 'feedback', label: 'Feedback', icon: MessageCircle },
  { value: 'complaint', label: 'Complaint', icon: MessageSquareWarning },
  { value: 'other', label: 'Other', icon: HelpCircle },
] as const;

const statusConfig = {
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
  reviewed: { label: 'Reviewed', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: Eye },
  resolved: { label: 'Resolved', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle2 },
};

const typeConfig: Record<string, { label: string; className: string }> = {
  bug: { label: 'Bug', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  feedback: { label: 'Feedback', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  complaint: { label: 'Complaint', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  other: { label: 'Other', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
};

export default function ReportForm({ userEmail, userRole }: ReportFormProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<string>('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pastReports, setPastReports] = useState<UserReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);

  const fetchPastReports = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error: fetchError } = await supabase
        .from('user_reports')
        .select('id, title, description, type, status, created_at')
        .eq('submitted_by_user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching reports:', fetchError);
        return;
      }

      setPastReports(data || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setReportsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPastReports();
  }, [fetchPastReports]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to submit a report.');
        return;
      }

      const { error: insertError } = await supabase
        .from('user_reports')
        .insert({
          title: title.trim(),
          description: description.trim(),
          type,
          submitted_by_email: userEmail,
          submitted_by_role: userRole,
          submitted_by_user_id: user.id,
        });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      setIsSuccess(true);
      setTitle('');
      setType('');
      setDescription('');
      fetchPastReports();
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAnother = () => {
    setIsSuccess(false);
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Submit Report Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquareWarning className="w-5 h-5 text-clinic-teal" />
            Submit a Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Report Submitted Successfully
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Thank you for your report. Our team will review it shortly.
              </p>
              <Button onClick={handleSubmitAnother} variant="outline">
                Submit Another Report
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                <Input
                  id="title"
                  placeholder="Brief summary of your report"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type <span className="text-red-500">*</span></Label>
                <Select value={type} onValueChange={setType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className="flex items-center gap-2">
                          <option.icon className="w-4 h-4" />
                          {option.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
                <Textarea
                  id="description"
                  placeholder="Please provide details about your report..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <Button
                type="submit"
                disabled={isSubmitting || !title.trim() || !type || !description.trim()}
                className="w-full"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Submit Report
                  </span>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Past Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-clinic-teal" />
            Your Past Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reportsLoading ? (
            <div className="text-center py-8">
              <Clock className="w-6 h-6 animate-spin text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading reports...</p>
            </div>
          ) : pastReports.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquareWarning className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                You haven&apos;t submitted any reports yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pastReports.map((report) => {
                const status = statusConfig[report.status];
                const reportType = typeConfig[report.type];
                return (
                  <div
                    key={report.id}
                    className="flex items-start justify-between gap-4 p-4 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-slate-800/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {report.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge className={`${reportType.className} border-0 text-xs`}>
                          {reportType.label}
                        </Badge>
                        <Badge className={`${status.className} border-0 text-xs`}>
                          <status.icon className="w-3 h-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {format(new Date(report.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
