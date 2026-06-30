'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Plus, Shield, Loader2, UserMinus, UserCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useStaffMembers } from '@/hooks';
import type { StaffMember } from '@/hooks';
import { STAFF_ROLES, ROLE_LABELS } from '@/lib/permissions';
import type { StaffRole } from '@/lib/permissions';
import { InviteStaffModal } from '@/components/clinic/InviteStaffModal';
import { PermissionGate } from '@/components/clinic/PermissionGate';
import { useClinicContext } from '../clinic-context';

const ROLE_BADGE_CLASS: Record<StaffRole, string> = {
  owner: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  receptionist: 'bg-green-100 text-green-700',
  viewer: 'bg-gray-100 text-gray-700',
};

interface StaffRowProps {
  member: StaffMember;
  isBusy: boolean;
  onRoleChange: (member: StaffMember, role: StaffRole) => void;
  onDeactivate: (member: StaffMember) => void;
  onReactivate: (member: StaffMember) => void;
}

function StaffTableRow({ member, isBusy, onRoleChange, onDeactivate, onReactivate }: StaffRowProps) {
  return (
    <TableRow className='border-clinic-navy/5 dark:border-white/5 hover:bg-clinic-bg/50 dark:hover:bg-slate-700/50'>
      <TableCell className='font-medium text-clinic-navy dark:text-white'>{member.name}</TableCell>
      <TableCell className='text-clinic-text/70 dark:text-white/70 text-sm'>{member.email}</TableCell>
      <TableCell>
        <PermissionGate
          permission='staff.manage'
          fallback={
            <Badge className={`text-xs ${ROLE_BADGE_CLASS[member.staff_role]}`}>
              {ROLE_LABELS[member.staff_role]}
            </Badge>
          }
        >
          <Select
            value={member.staff_role}
            onValueChange={(v) => onRoleChange(member, v as StaffRole)}
            disabled={isBusy}
          >
            <SelectTrigger className='w-36 h-8 text-xs border-clinic-navy/10'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAFF_ROLES.map((role) => (
                <SelectItem key={role} value={role} className='text-xs'>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE_CLASS[role]}`}>
                    {ROLE_LABELS[role]}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PermissionGate>
      </TableCell>
      <TableCell>
        {member.is_active
          ? <Badge className='bg-green-100 text-green-700 text-xs'>Active</Badge>
          : <Badge className='bg-red-100 text-red-700 text-xs'>Inactive</Badge>
        }
      </TableCell>
      <TableCell className='text-clinic-text/60 dark:text-white/60 text-sm'>
        {format(new Date(member.created_at), 'MMM d, yyyy')}
      </TableCell>
      <TableCell className='text-right'>
        <PermissionGate permission='staff.manage'>
          {isBusy ? (
            <Loader2 className='w-4 h-4 animate-spin text-clinic-teal inline' />
          ) : member.is_active ? (
            <Button
              variant='ghost'
              size='sm'
              className='text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 px-2'
              onClick={() => onDeactivate(member)}
            >
              <UserMinus className='w-4 h-4 mr-1' />
              Deactivate
            </Button>
          ) : (
            <Button
              variant='ghost'
              size='sm'
              className='text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 h-8 px-2'
              onClick={() => onReactivate(member)}
            >
              <UserCheck className='w-4 h-4 mr-1' />
              Reactivate
            </Button>
          )}
        </PermissionGate>
      </TableCell>
    </TableRow>
  );
}

export default function StaffPage() {
  const params = useParams();
  const clinicId = params.clinicId as string;
  const { activeBranchId } = useClinicContext();

  const { staff, loading, error, fetchStaff, inviteStaff, updateStaffRole, deactivateStaff } =
    useStaffMembers(clinicId, activeBranchId);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState<StaffMember | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleInvite = async (params: { email: string; name: string; staff_role: StaffRole }) => {
    await inviteStaff(params);
  };

  const handleRoleChange = async (member: StaffMember, newRole: StaffRole) => {
    if (newRole === member.staff_role) return;
    if (member.staff_role === 'owner') {
      const activeOwners = staff.filter((s) => s.staff_role === 'owner' && s.is_active);
      if (activeOwners.length <= 1) {
        toast.error('Cannot change the role of the only active owner.');
        return;
      }
    }
    setActionLoading(member.id);
    try {
      await updateStaffRole(member.id, { staff_role: newRole });
      toast.success(`${member.name}'s role updated to ${ROLE_LABELS[newRole]}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to update role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivate = async (member: StaffMember) => {
    if (member.staff_role === 'owner') {
      const activeOwners = staff.filter((s) => s.staff_role === 'owner' && s.is_active);
      if (activeOwners.length <= 1) {
        toast.error('Cannot deactivate the only active owner.');
        setConfirmDeactivate(null);
        return;
      }
    }
    setActionLoading(member.id);
    try {
      await deactivateStaff(member.id);
      toast.success(`${member.name} has been deactivated`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to deactivate staff member');
    } finally {
      setActionLoading(null);
      setConfirmDeactivate(null);
    }
  };

  const handleReactivate = async (member: StaffMember) => {
    setActionLoading(member.id);
    try {
      await updateStaffRole(member.id, { is_active: true });
      toast.success(`${member.name} has been reactivated`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to reactivate staff member');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-display font-bold text-clinic-navy dark:text-white flex items-center gap-2'>
            <Shield className='w-6 h-6 text-clinic-teal' />
            Staff Management
          </h2>
          <p className='text-clinic-text/60 dark:text-white/60 mt-1'>
            Manage your clinic&apos;s staff members, roles, and access levels.
          </p>
        </div>
        <PermissionGate permission='staff.manage'>
          <Button
            className='bg-clinic-teal hover:bg-clinic-teal/90 text-white'
            onClick={() => setIsInviteOpen(true)}
          >
            <Plus className='w-4 h-4 mr-2' />
            Invite Staff
          </Button>
        </PermissionGate>
      </div>

      {/* Loading */}
      {loading && (
        <div className='text-center py-12'>
          <Loader2 className='w-8 h-8 text-clinic-teal animate-spin mx-auto mb-4' />
          <p className='text-clinic-text/60'>Loading staff...</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className='text-center py-12'>
          <p className='text-red-500'>{error}</p>
          <Button variant='outline' className='mt-4' onClick={fetchStaff}>Retry</Button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && staff.length === 0 && (
        <div className='text-center py-12 bg-white dark:bg-slate-800 rounded-2xl shadow-glass'>
          <Users className='w-12 h-12 text-clinic-text/20 mx-auto mb-4' />
          <h3 className='text-lg font-semibold text-clinic-navy dark:text-white mb-2'>
            No staff members yet
          </h3>
          <p className='text-clinic-text/60 dark:text-white/60 mb-4'>
            Invite your first staff member to get started.
          </p>
          <PermissionGate permission='staff.manage'>
            <Button
              className='bg-clinic-teal hover:bg-clinic-teal/90 text-white'
              onClick={() => setIsInviteOpen(true)}
            >
              <Plus className='w-4 h-4 mr-2' />
              Invite Staff
            </Button>
          </PermissionGate>
        </div>
      )}

      {/* Staff Table */}
      {!loading && !error && staff.length > 0 && (
        <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass overflow-hidden'>
          <Table>
            <TableHeader>
              <TableRow className='border-clinic-navy/5 dark:border-white/5'>
                {['Name', 'Email', 'Role', 'Status', 'Joined'].map((h) => (
                  <TableHead key={h} className='text-clinic-navy dark:text-white font-semibold'>{h}</TableHead>
                ))}
                <TableHead className='text-clinic-navy dark:text-white font-semibold text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((member) => (
                <StaffTableRow
                  key={member.id}
                  member={member}
                  isBusy={actionLoading === member.id}
                  onRoleChange={handleRoleChange}
                  onDeactivate={setConfirmDeactivate}
                  onReactivate={handleReactivate}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Invite Modal */}
      <InviteStaffModal open={isInviteOpen} onOpenChange={setIsInviteOpen} onInvite={handleInvite} />

      {/* Deactivate Confirmation */}
      <Dialog open={!!confirmDeactivate} onOpenChange={(o) => !o && setConfirmDeactivate(null)}>
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-red-600'>
              <UserMinus className='w-5 h-5' />
              Deactivate Staff Member
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate{' '}
              <span className='font-semibold text-clinic-navy dark:text-white'>
                {confirmDeactivate?.name}
              </span>
              ? They will lose access to the clinic dashboard immediately.
            </DialogDescription>
          </DialogHeader>
          <div className='flex justify-end gap-3 pt-2'>
            <Button variant='outline' onClick={() => setConfirmDeactivate(null)}>Cancel</Button>
            <Button
              className='bg-red-500 hover:bg-red-600 text-white'
              onClick={() => confirmDeactivate && handleDeactivate(confirmDeactivate)}
              disabled={actionLoading === confirmDeactivate?.id}
            >
              {actionLoading === confirmDeactivate?.id
                ? <Loader2 className='w-4 h-4 animate-spin' />
                : 'Deactivate'
              }
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
