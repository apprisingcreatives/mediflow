'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Filter, ChevronLeft, ChevronRight, Clock, User, Loader2, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useStaffAuditLogs, { type AuditLogFilters, type AuditLog } from '@/hooks/useStaffAuditLogs';

const ACTION_LABELS: Record<string, string> = {
  'staff.invite': 'Invited Staff',
  'staff.role_change': 'Changed Role',
  'staff.deactivate': 'Deactivated Staff',
  'staff.reactivate': 'Reactivated Staff',
  'appointment.create': 'Created Appointment',
  'appointment.update': 'Updated Appointment',
  'appointment.cancel': 'Cancelled Appointment',
  'patient.create': 'Created Patient',
  'patient.update': 'Updated Patient',
  'settings.update': 'Updated Settings',
  'service.create': 'Created Service',
  'service.update': 'Updated Service',
};

const ACTION_BADGE_COLORS: Record<string, string> = {
  'staff.invite': 'bg-blue-100 text-blue-700 border-blue-200',
  'staff.role_change': 'bg-purple-100 text-purple-700 border-purple-200',
  'staff.deactivate': 'bg-red-100 text-red-700 border-red-200',
  'staff.reactivate': 'bg-green-100 text-green-700 border-green-200',
  'appointment.create': 'bg-teal-100 text-teal-700 border-teal-200',
  'appointment.update': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'appointment.cancel': 'bg-red-100 text-red-700 border-red-200',
  'patient.create': 'bg-blue-100 text-blue-700 border-blue-200',
  'patient.update': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'settings.update': 'bg-gray-100 text-gray-700 border-gray-200',
  'service.create': 'bg-teal-100 text-teal-700 border-teal-200',
  'service.update': 'bg-yellow-100 text-yellow-700 border-yellow-200',
};

const PAGE_LIMIT = 20;

function ActionBadge({ action }: { action: string }) {
  const label = ACTION_LABELS[action] ?? action;
  const colorClass = ACTION_BADGE_COLORS[action] ?? 'bg-gray-100 text-gray-700 border-gray-200';
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${colorClass}`}>
      {label}
    </span>
  );
}

function MetadataRow({ log }: { log: AuditLog }) {
  const [expanded, setExpanded] = useState(false);
  const hasMetadata = log.metadata && Object.keys(log.metadata).length > 0;

  if (!hasMetadata) return null;

  return (
    <div className='mt-2'>
      <button
        onClick={() => setExpanded((v) => !v)}
        className='text-xs text-clinic-teal hover:underline focus:outline-none'
      >
        {expanded ? 'Hide details' : 'Show details'}
      </button>
      {expanded && (
        <pre className='mt-2 rounded-lg bg-slate-50 dark:bg-slate-900 p-3 text-xs text-clinic-text/80 dark:text-white/70 overflow-x-auto border border-clinic-navy/10 dark:border-white/10'>
          {JSON.stringify(log.metadata, null, 2)}
        </pre>
      )}
    </div>
  );
}

function LogRow({ log }: { log: AuditLog }) {
  return (
    <div className='px-6 py-4 border-b border-clinic-navy/8 dark:border-white/8 last:border-b-0 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors'>
      <div className='flex flex-col sm:flex-row sm:items-start gap-3'>
        {/* Timestamp */}
        <div className='flex items-center gap-1.5 text-xs text-clinic-text/50 dark:text-white/50 shrink-0 min-w-[140px]'>
          <Clock className='w-3.5 h-3.5' />
          {format(parseISO(log.created_at), 'MMM d, yyyy HH:mm')}
        </div>

        {/* Actor */}
        <div className='flex items-center gap-1.5 text-sm shrink-0 min-w-[160px]'>
          <User className='w-3.5 h-3.5 text-clinic-text/40 dark:text-white/40' />
          <div>
            <p className='font-medium text-clinic-navy dark:text-white leading-tight'>
              {log.actor_name ?? 'Unknown'}
            </p>
            {log.actor_type && (
              <p className='text-xs text-clinic-text/50 dark:text-white/50 capitalize'>
                {log.actor_type.replace('_', ' ')}
              </p>
            )}
          </div>
        </div>

        {/* Action badge */}
        <div className='shrink-0'>
          <ActionBadge action={log.action} />
        </div>

        {/* Entity info */}
        <div className='flex-1 min-w-0'>
          {(log.entity_type || log.entity_id) && (
            <p className='text-xs text-clinic-text/60 dark:text-white/60 truncate'>
              {log.entity_type && (
                <span className='capitalize'>{log.entity_type.replace('_', ' ')}</span>
              )}
              {log.entity_id && (
                <span className='ml-1 font-mono text-clinic-text/40 dark:text-white/40'>
                  #{log.entity_id.slice(0, 8)}
                </span>
              )}
            </p>
          )}
          <MetadataRow log={log} />
        </div>

        {/* IP address */}
        {log.ip_address && (
          <p className='text-xs text-clinic-text/30 dark:text-white/30 shrink-0 font-mono'>
            {log.ip_address}
          </p>
        )}
      </div>
    </div>
  );
}

export default function AuditLogsPage() {
  const params = useParams();
  const clinicId = params.clinicId as string;

  const { logs, total, loading, error, fetchLogs } = useStaffAuditLogs(clinicId);

  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [appliedFilters, setAppliedFilters] = useState<AuditLogFilters>({ page: 1, limit: PAGE_LIMIT });

  const totalPages = Math.ceil(total / PAGE_LIMIT);
  const showingFrom = total === 0 ? 0 : (page - 1) * PAGE_LIMIT + 1;
  const showingTo = Math.min(page * PAGE_LIMIT, total);

  useEffect(() => {
    fetchLogs(appliedFilters);
  }, [appliedFilters]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const handleApplyFilters = () => {
    const filters: AuditLogFilters = {
      page: 1,
      limit: PAGE_LIMIT,
      ...(startDate && { start_date: startDate }),
      ...(endDate && { end_date: endDate }),
      ...(actionFilter.trim() && { action: actionFilter.trim() }),
    };
    setPage(1);
    setAppliedFilters(filters);
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setActionFilter('');
    setPage(1);
    setAppliedFilters({ page: 1, limit: PAGE_LIMIT });
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    setAppliedFilters((prev) => ({ ...prev, page: nextPage }));
  };

  const hasActiveFilters = startDate || endDate || actionFilter.trim();

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h2 className='text-2xl font-display font-bold text-clinic-navy dark:text-white'>
          Audit Logs
        </h2>
        <p className='text-clinic-text/60 dark:text-white/60'>
          Track all staff actions
        </p>
      </div>

      {/* Filters Bar */}
      <Card className='shadow-glass border-clinic-navy/10 dark:border-white/10'>
        <CardHeader className='pb-3'>
          <CardTitle className='text-sm font-medium text-clinic-navy dark:text-white flex items-center gap-2'>
            <Filter className='w-4 h-4 text-clinic-teal' />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap items-end gap-3'>
            <div className='flex flex-col gap-1'>
              <label className='text-xs text-clinic-text/60 dark:text-white/60'>Start date</label>
              <Input
                type='date'
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className='border-clinic-navy/10 w-40 text-sm'
              />
            </div>
            <div className='flex flex-col gap-1'>
              <label className='text-xs text-clinic-text/60 dark:text-white/60'>End date</label>
              <Input
                type='date'
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className='border-clinic-navy/10 w-40 text-sm'
              />
            </div>
            <div className='flex flex-col gap-1'>
              <label className='text-xs text-clinic-text/60 dark:text-white/60'>Action</label>
              <Input
                type='text'
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                placeholder='e.g. staff.invite'
                className='border-clinic-navy/10 w-44 text-sm'
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
              />
            </div>
            <div className='flex items-center gap-2 pb-0.5'>
              <Button
                onClick={handleApplyFilters}
                className='bg-clinic-teal hover:bg-clinic-teal/90 text-white h-9'
              >
                <Filter className='w-3.5 h-3.5 mr-1.5' />
                Apply Filters
              </Button>
              {hasActiveFilters && (
                <Button
                  variant='outline'
                  onClick={handleClearFilters}
                  className='h-9 border-clinic-navy/10'
                >
                  <X className='w-3.5 h-3.5 mr-1.5' />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className='shadow-glass border-clinic-navy/10 dark:border-white/10 overflow-hidden'>
        {/* Loading */}
        {loading && (
          <div className='flex items-center justify-center py-16'>
            <Loader2 className='w-7 h-7 text-clinic-teal animate-spin mr-3' />
            <span className='text-clinic-text/60 dark:text-white/60'>Loading audit logs...</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && logs.length === 0 && (
          <div className='flex flex-col items-center justify-center py-16 text-center px-6'>
            <div className='w-14 h-14 rounded-2xl bg-clinic-navy/5 dark:bg-white/5 flex items-center justify-center mb-4'>
              <FileText className='w-7 h-7 text-clinic-text/30 dark:text-white/30' />
            </div>
            <h3 className='text-base font-semibold text-clinic-navy dark:text-white mb-1'>
              No audit logs found
            </h3>
            <p className='text-sm text-clinic-text/50 dark:text-white/50 max-w-xs'>
              {hasActiveFilters
                ? 'No logs match the selected filters. Try adjusting or clearing them.'
                : 'Staff actions will appear here as they happen.'}
            </p>
            {hasActiveFilters && (
              <Button
                variant='outline'
                onClick={handleClearFilters}
                className='mt-4 border-clinic-navy/10 text-sm'
              >
                <X className='w-3.5 h-3.5 mr-1.5' />
                Clear filters
              </Button>
            )}
          </div>
        )}

        {/* Log rows */}
        {!loading && logs.length > 0 && (
          <div>
            {logs.map((log) => (
              <LogRow key={log.id} log={log} />
            ))}
          </div>
        )}
      </Card>

      {/* Pagination */}
      {!loading && total > 0 && (
        <div className='flex items-center justify-between'>
          <p className='text-sm text-clinic-text/60 dark:text-white/60'>
            Showing {showingFrom}–{showingTo} of {total}
          </p>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className='border-clinic-navy/10'
            >
              <ChevronLeft className='w-4 h-4' />
              Prev
            </Button>
            <div className='flex items-center gap-1'>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === 'ellipsis' ? (
                    <span key={`ellipsis-${idx}`} className='px-1 text-clinic-text/40 dark:text-white/40 text-sm'>
                      ...
                    </span>
                  ) : (
                    <Button
                      key={item}
                      variant={item === page ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => handlePageChange(item as number)}
                      className={
                        item === page
                          ? 'bg-clinic-teal hover:bg-clinic-teal/90 text-white border-transparent min-w-[32px]'
                          : 'border-clinic-navy/10 min-w-[32px]'
                      }
                    >
                      {item}
                    </Button>
                  ),
                )}
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className='border-clinic-navy/10'
            >
              Next
              <ChevronRight className='w-4 h-4' />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
