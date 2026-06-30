'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Mail, Loader2, CheckCircle2, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/lib/permissions';
import type { StaffRole } from '@/lib/permissions';

const INVITABLE_ROLES: StaffRole[] = ['admin', 'receptionist', 'viewer'];

interface InviteStaffModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (params: { email: string; name: string; staff_role: StaffRole }) => Promise<void>;
}

export function InviteStaffModal({ open, onOpenChange, onInvite }: InviteStaffModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [staffRole, setStaffRole] = useState<StaffRole | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const resetForm = () => {
    setName('');
    setEmail('');
    setStaffRole('');
    setSubmitSuccess(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !staffRole) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await onInvite({ name: name.trim(), email: email.trim().toLowerCase(), staff_role: staffRole });
      setSubmitSuccess(true);
      toast.success(`Invitation sent to ${email.trim().toLowerCase()}`);
      setTimeout(() => {
        handleOpenChange(false);
      }, 1800);
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? err?.message ?? 'Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <UserCog className='w-5 h-5 text-clinic-teal' />
            Invite Staff Member
          </DialogTitle>
          <DialogDescription>
            Send an invitation email so the staff member can set up their account.
          </DialogDescription>
        </DialogHeader>

        {submitSuccess ? (
          <div className='py-8 text-center'>
            <CheckCircle2 className='w-12 h-12 text-green-500 mx-auto mb-4' />
            <h3 className='text-lg font-semibold text-clinic-navy mb-2'>Invitation Sent!</h3>
            <p className='text-clinic-text/60'>
              The staff member will receive an email to set up their account.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='staff-name'>Full Name *</Label>
              <Input
                id='staff-name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='Jane Santos'
                required
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='staff-email'>Email Address *</Label>
              <Input
                id='staff-email'
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='staff@clinic.com'
                required
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='staff-role'>Role *</Label>
              <Select value={staffRole} onValueChange={(v) => setStaffRole(v as StaffRole)}>
                <SelectTrigger id='staff-role'>
                  <SelectValue placeholder='Select a role' />
                </SelectTrigger>
                <SelectContent>
                  {INVITABLE_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      <div>
                        <span className='font-medium'>{ROLE_LABELS[role]}</span>
                        <span className='block text-xs text-muted-foreground'>
                          {ROLE_DESCRIPTIONS[role]}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='flex justify-end gap-3 pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                className='bg-clinic-teal hover:bg-clinic-teal/90 text-white'
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className='w-4 h-4 mr-2' />
                    Send Invitation
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
