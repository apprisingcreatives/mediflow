'use client';

import { useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Loader2, Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useGetReceipt } from '@/hooks/useGetReceipt';

interface PaymentReceiptDialogProps {
  appointmentId: string;
  isOpen: boolean;
  onClose: () => void;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  gcash: 'GCash',
  grab_pay: 'GrabPay',
  paymaya: 'Maya',
  card: 'Card',
  cash: 'Cash',
};

function formatTime(time: string) {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

export function PaymentReceiptDialog({ appointmentId, isOpen, onClose }: PaymentReceiptDialogProps) {
  const { receipt, loading, error, fetchReceipt } = useGetReceipt();

  useEffect(() => {
    if (isOpen && appointmentId) {
      fetchReceipt(appointmentId);
    }
  }, [isOpen, appointmentId, fetchReceipt]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Payment Receipt</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-clinic-teal" />
          </div>
        ) : error ? (
          <p className="text-sm text-red-500 py-4">{error}</p>
        ) : receipt ? (
          <div className="space-y-4 text-sm" id="receipt-content">
            <div className="text-center border-b pb-4">
              <h3 className="font-semibold text-lg text-clinic-navy dark:text-white">
                {receipt.clinic.name}
              </h3>
              {receipt.clinic.address && (
                <p className="text-clinic-text/60 dark:text-white/60 text-xs">{receipt.clinic.address}</p>
              )}
            </div>

            <div className="space-y-2">
              <Row label="Date" value={format(parseISO(receipt.date), 'MMMM d, yyyy')} />
              <Row label="Time" value={formatTime(receipt.time)} />
              <Row label="Patient" value={receipt.patient.name} />
              <Row label="Practitioner" value={receipt.practitioner.name} />
              <Row label="Service" value={receipt.service.name} />
            </div>

            <div className="border-t pt-3 space-y-2">
              <Row
                label="Amount"
                value={`₱${(receipt.amount || 0).toLocaleString()}`}
                bold
              />
              <Row
                label="Method"
                value={PAYMENT_METHOD_LABELS[receipt.payment_method || ''] || receipt.payment_method || '—'}
              />
              <Row
                label="Status"
                value={receipt.payment_status === 'refunded' ? 'Refunded' : 'Paid'}
              />
              {receipt.paid_at && (
                <Row label="Paid at" value={format(parseISO(receipt.paid_at), 'MMM d, yyyy h:mm a')} />
              )}
              {receipt.refunded_at && (
                <Row label="Refunded at" value={format(parseISO(receipt.refunded_at), 'MMM d, yyyy h:mm a')} />
              )}
            </div>

            <div className="border-t pt-3 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
              >
                <Download className="w-4 h-4 mr-1" />
                Print
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-clinic-text/60 dark:text-white/60">{label}</span>
      <span className={bold ? 'font-semibold text-clinic-navy dark:text-white' : 'text-clinic-navy dark:text-white'}>
        {value}
      </span>
    </div>
  );
}
