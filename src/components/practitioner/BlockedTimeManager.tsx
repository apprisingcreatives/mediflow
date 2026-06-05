'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, addMonths, parseISO } from 'date-fns';
import { CalendarOff, Plus, Trash2, Loader2, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useBlockedTimes } from '@/hooks/useBlockedTimes';
import { toast } from 'sonner';

interface BlockedTimeManagerProps {
  clinicId: string;
  practitionerId: string;
}

export function BlockedTimeManager({ clinicId, practitionerId }: BlockedTimeManagerProps) {
  const {
    blockedTimes,
    loading,
    error,
    fetchBlockedTimes,
    createBlockedTime,
    deleteBlockedTime,
  } = useBlockedTimes(clinicId, practitionerId);

  const [showForm, setShowForm] = useState(false);
  const [formDate, setFormDate] = useState('');
  const [formStartTime, setFormStartTime] = useState('');
  const [formEndTime, setFormEndTime] = useState('');
  const [formReason, setFormReason] = useState('');
  const [isFullDay, setIsFullDay] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (clinicId && practitionerId) {
      const start = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const end = format(endOfMonth(addMonths(new Date(), 2)), 'yyyy-MM-dd');
      fetchBlockedTimes(start, end);
    }
  }, [clinicId, practitionerId, fetchBlockedTimes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDate) return;

    setSubmitting(true);
    const result = await createBlockedTime({
      blockDate: formDate,
      startTime: isFullDay ? undefined : formStartTime || undefined,
      endTime: isFullDay ? undefined : formEndTime || undefined,
      reason: formReason || undefined,
    });
    setSubmitting(false);

    if (result) {
      toast.success('Blocked time added');
      if (result.conflicting_appointments) {
        toast.warning(
          `Warning: ${result.conflicting_appointments.length} existing appointment(s) conflict with this block`,
        );
      }
      setShowForm(false);
      resetForm();
    } else {
      toast.error(error || 'Failed to add blocked time');
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await deleteBlockedTime(id);
    if (ok) {
      toast.success('Blocked time removed');
    } else {
      toast.error('Failed to remove blocked time');
    }
  };

  const resetForm = () => {
    setFormDate('');
    setFormStartTime('');
    setFormEndTime('');
    setFormReason('');
    setIsFullDay(true);
  };

  const formatTimeDisplay = (time: string | null) => {
    if (!time) return '';
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  return (
    <Card className="border-0 shadow-glass">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-display text-lg font-semibold text-clinic-navy dark:text-white flex items-center gap-2">
          <CalendarOff className="w-5 h-5 text-clinic-teal" />
          Blocked Times / Leave
        </CardTitle>
        <Button
          size="sm"
          className="bg-clinic-teal hover:bg-clinic-teal/90 text-white"
          onClick={() => setShowForm(true)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Block Time
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-clinic-teal" />
          </div>
        ) : blockedTimes.length === 0 ? (
          <p className="text-sm text-clinic-text/50 dark:text-white/50 text-center py-6">
            No blocked times scheduled
          </p>
        ) : (
          <div className="space-y-3">
            {blockedTimes.map((bt) => (
              <div
                key={bt.id}
                className="flex items-center justify-between p-3 rounded-lg bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-clinic-navy dark:text-white">
                      {format(parseISO(bt.block_date), 'EEEE, MMMM d, yyyy')}
                    </span>
                    {bt.start_time && bt.end_time ? (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatTimeDisplay(bt.start_time)} — {formatTimeDisplay(bt.end_time)}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs bg-red-100 text-red-700 border-0">
                        Full Day
                      </Badge>
                    )}
                  </div>
                  {bt.reason && (
                    <p className="text-xs text-clinic-text/60 dark:text-white/60 mt-1">{bt.reason}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleDelete(bt.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Block Time Off</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                required
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={isFullDay}
                  onChange={() => setIsFullDay(true)}
                  className="accent-clinic-teal"
                />
                <span className="text-sm">Full Day</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!isFullDay}
                  onChange={() => setIsFullDay(false)}
                  className="accent-clinic-teal"
                />
                <span className="text-sm">Time Range</span>
              </label>
            </div>

            {!isFullDay && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    required={!isFullDay}
                  />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    required={!isFullDay}
                  />
                </div>
              </div>
            )}

            <div>
              <Label>Reason (optional)</Label>
              <Input
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                placeholder="e.g. Vacation, Conference, Personal"
              />
            </div>

            <div className="flex items-center gap-2 p-2 rounded bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Blocking time does not auto-cancel existing appointments in this range.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-clinic-teal hover:bg-clinic-teal/90 text-white"
                disabled={submitting}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Block Time'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
