'use client';

import { useState, useEffect } from 'react';
import useGetUserReports from '@/hooks/useGetUserReports';
import useReportMutations from '@/hooks/useReportMutations';
import { ReportStatus } from '@/types/super-admin';
import { Button } from '@/components/ui/button';
import { Flag, Loader2 } from 'lucide-react';

type ReportTypeFilter = 'all' | 'bug' | 'feedback' | 'complaint' | 'other';
type StatusFilter = 'all' | ReportStatus;

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

const TYPE_BADGE: Record<string, string> = {
  bug: 'bg-red-100 text-red-700',
  feedback: 'bg-blue-100 text-blue-700',
  complaint: 'bg-amber-100 text-amber-700',
  other: 'bg-gray-100 text-gray-700',
};

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  reviewed: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
};

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'resolved', label: 'Resolved' },
];

const TYPE_OPTIONS: { value: ReportTypeFilter; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'bug', label: 'Bug' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'complaint', label: 'Complaint' },
  { value: 'other', label: 'Other' },
];

export default function ReportsPage() {
  const { reports, loading, fetchReports } = useGetUserReports();
  const { updateReportStatus, loading: saving } = useReportMutations();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<ReportTypeFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Per-card editable state: { [id]: { adminNotes, status } }
  const [cardEdits, setCardEdits] = useState<
    Record<string, { adminNotes: string; status: ReportStatus }>
  >({});

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = reports.filter((r) => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesType = typeFilter === 'all' || r.type === typeFilter;
    return matchesStatus && matchesType;
  });

  function toggleExpand(id: string, adminNotes: string | null, status: ReportStatus) {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      // Initialise editable state if not already set
      if (!cardEdits[id]) {
        setCardEdits((prev) => ({
          ...prev,
          [id]: { adminNotes: adminNotes ?? '', status },
        }));
      }
    }
  }

  function updateCardEdit(id: string, field: 'adminNotes' | 'status', value: string) {
    setCardEdits((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  }

  async function handleSave(id: string) {
    const edit = cardEdits[id];
    if (!edit) return;
    try {
      await updateReportStatus(id, edit.status, edit.adminNotes);
      await fetchReports();
    } catch {
      // error stored in hook
    }
  }

  return (
    <div>
      {/* Page header */}
      <div className='flex items-center justify-between mb-6'>
        <h2 className='font-display text-xl font-bold text-clinic-navy dark:text-white'>
          User Reports
        </h2>
      </div>

      {/* Filters row */}
      <div className='flex flex-wrap items-center gap-3 mb-6'>
        {/* Status tabs */}
        <div className='flex gap-1'>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === tab.value
                  ? 'bg-clinic-teal text-white'
                  : 'bg-transparent text-clinic-text/60 dark:text-white/60 hover:bg-clinic-navy/5 dark:hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Type dropdown */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as ReportTypeFilter)}
          className='border border-clinic-navy/10 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-clinic-text dark:text-white'
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Loading state */}
      {loading && (
        <div className='flex items-center justify-center py-16'>
          <Loader2 className='w-6 h-6 animate-spin text-clinic-teal' />
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className='flex flex-col items-center justify-center py-16 text-center'>
          <Flag className='w-12 h-12 text-clinic-navy/20 dark:text-white/20 mb-4' />
          <p className='text-clinic-text/60 dark:text-white/60 text-sm'>
            No reports match the current filters.
          </p>
        </div>
      )}

      {/* Reports list */}
      {!loading && filtered.length > 0 && (
        <div className='flex flex-col gap-4'>
          {filtered.map((report) => {
            const isExpanded = expandedId === report.id;
            const edit = cardEdits[report.id];

            return (
              <div
                key={report.id}
                className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-4 cursor-pointer hover:shadow-md transition-shadow'
                onClick={() => toggleExpand(report.id, report.admin_notes, report.status)}
              >
                {/* Card header */}
                <div className='flex items-start justify-between gap-3'>
                  <div className='min-w-0 flex-1'>
                    <p className='font-display font-semibold text-clinic-navy dark:text-white truncate'>
                      {report.title}
                    </p>
                    <p className='text-sm text-clinic-text/60 dark:text-white/60 mt-1'>
                      {report.description.length > 100
                        ? report.description.slice(0, 100) + '...'
                        : report.description}
                    </p>
                  </div>

                  {/* Badges */}
                  <div className='flex items-center gap-2 shrink-0 flex-wrap justify-end'>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full capitalize ${TYPE_BADGE[report.type] ?? TYPE_BADGE.other}`}
                    >
                      {report.type}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[report.status] ?? STATUS_BADGE.pending}`}
                    >
                      {report.status}
                    </span>
                  </div>
                </div>

                {/* Meta row */}
                <div className='flex items-center gap-3 mt-3 flex-wrap'>
                  <span className='text-xs text-clinic-text/60 dark:text-white/60'>
                    {report.submitted_by_email}
                  </span>
                  <span className='text-xs px-2 py-0.5 rounded-full bg-clinic-navy/10 text-clinic-navy capitalize'>
                    {report.submitted_by_role}
                  </span>
                  <span className='text-xs text-clinic-text/40 dark:text-white/40 ml-auto'>
                    {formatRelativeTime(report.created_at)}
                  </span>
                </div>

                {/* Expanded area */}
                {isExpanded && edit && (
                  <div
                    className='mt-4 pt-4 border-t border-clinic-navy/10'
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Full description */}
                    <p className='text-sm text-clinic-text/80 dark:text-white/80 mb-4'>
                      {report.description}
                    </p>

                    {/* Admin notes */}
                    <div className='mb-3'>
                      <label className='text-xs font-medium text-clinic-text/70 dark:text-white/70 mb-1 block'>
                        Admin Notes
                      </label>
                      <textarea
                        value={edit.adminNotes}
                        onChange={(e) =>
                          updateCardEdit(report.id, 'adminNotes', e.target.value)
                        }
                        placeholder='Add internal notes…'
                        className='w-full min-h-[100px] p-3 border border-clinic-navy/10 rounded-xl text-sm bg-transparent text-clinic-text dark:text-white placeholder:text-clinic-text/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-clinic-teal/30 resize-y'
                      />
                    </div>

                    {/* Status + save row */}
                    <div className='flex items-center gap-3'>
                      <select
                        value={edit.status}
                        onChange={(e) =>
                          updateCardEdit(report.id, 'status', e.target.value)
                        }
                        className='border border-clinic-navy/10 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-clinic-text dark:text-white'
                      >
                        <option value='pending'>Pending</option>
                        <option value='reviewed'>Reviewed</option>
                        <option value='resolved'>Resolved</option>
                      </select>

                      <Button
                        onClick={() => handleSave(report.id)}
                        disabled={saving}
                        size='sm'
                      >
                        {saving && <Loader2 className='w-3 h-3 mr-1 animate-spin' />}
                        Save
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
