'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Plus,
  Search,
  Filter,
  Mail,
  Phone,
  MoreVertical,
  Loader2,
  CheckCircle2,
  Clock,
  UserX,
  LayoutGrid,
  List,
  FileText,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClinicContext } from '../layout';
import { useGetPatients, type Patient } from '@/hooks';
import { supabase } from '@/lib/supabase';

export default function PatientsPage() {
  const params = useParams();
  const clinicId = params.clinicId as string;
  const { isTrialExpired } = useClinicContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const {
    patients,
    loading,
    error,
    fetchPatients,
  } = useGetPatients();

  // Fetch patients on mount
  useEffect(() => {
    if (clinicId) {
      fetchPatients({ clinicId });
    }
  }, [clinicId, fetchPatients]);

  // Filter patients by search query
  const filteredPatients = patients.filter((patient) => {
    if (!searchQuery.trim()) return true;
    const search = searchQuery.toLowerCase();
    const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
    return (
      fullName.includes(search) ||
      patient.email?.toLowerCase().includes(search) ||
      patient.phone?.toLowerCase().includes(search)
    );
  });

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsAddDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      setSubmitError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Get the current session for authorization
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/clinic/${clinicId}/patients/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to invite patient');
      }

      setSubmitSuccess(true);

      // Refresh the patients list
      await fetchPatients({ clinicId });

      // Close dialog after a short delay
      setTimeout(() => {
        setIsAddDialogOpen(false);
        resetForm();
      }, 2000);
    } catch (err) {
      console.error('Error inviting patient:', err);
      setSubmitError(err instanceof Error ? err.message : 'Failed to invite patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isTrialExpired) {
    return (
      <div className='text-center py-12'>
        <p className='text-clinic-text/60'>
          This feature is locked. Please upgrade your plan.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-display font-bold text-clinic-navy dark:text-white'>
            Patients
          </h2>
          <p className='text-clinic-text/60 dark:text-white/60'>
            Manage your patient records
          </p>
        </div>
        <Button
          className='bg-clinic-teal hover:bg-clinic-teal/90 text-white'
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className='w-4 h-4 mr-2' />
          Add Patient
        </Button>
      </div>

      {/* Filters */}
      <div className='flex items-center gap-4'>
        <div className='relative flex-1 max-w-md'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-clinic-text/40' />
          <Input
            placeholder='Search patients...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-10 border-clinic-navy/10'
          />
        </div>
        <div className="flex bg-white dark:bg-slate-800 border border-clinic-navy/10 dark:border-white/10 rounded-lg overflow-hidden">
          <button
            className={cn(
              'p-2 transition-colors',
              viewMode === 'card' ? 'bg-clinic-teal text-white' : 'text-clinic-text/50 hover:bg-clinic-bg'
            )}
            onClick={() => setViewMode('card')}
            title="Card view"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            className={cn(
              'p-2 transition-colors',
              viewMode === 'list' ? 'bg-clinic-teal text-white' : 'text-clinic-text/50 hover:bg-clinic-bg'
            )}
            onClick={() => setViewMode('list')}
            title="List view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
        <Button variant='outline' size='icon'>
          <Filter className='w-4 h-4' />
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className='text-center py-12'>
          <Loader2 className='w-8 h-8 text-clinic-teal animate-spin mx-auto mb-4' />
          <p className='text-clinic-text/60'>Loading patients...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className='text-center py-12'>
          <p className='text-red-500'>{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredPatients.length === 0 && (
        <div className='text-center py-12 bg-white dark:bg-slate-800 rounded-2xl shadow-glass'>
          <Users className='w-12 h-12 text-clinic-text/20 mx-auto mb-4' />
          <h3 className='text-lg font-semibold text-clinic-navy dark:text-white mb-2'>
            No patients found
          </h3>
          <p className='text-clinic-text/60 dark:text-white/60 mb-4'>
            {searchQuery
              ? 'No patients match your search criteria'
              : 'Get started by adding your first patient'}
          </p>
          {!searchQuery && (
            <Button
              className='bg-clinic-teal hover:bg-clinic-teal/90 text-white'
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className='w-4 h-4 mr-2' />
              Add Patient
            </Button>
          )}
        </div>
      )}

      {/* Patients Grid / List */}
      {!loading && !error && filteredPatients.length > 0 && (
        viewMode === 'card' ? (
          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {filteredPatients.map((patient) => (
              <PatientCard key={patient.id} patient={patient} clinicId={clinicId} />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-glass overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => (
                  <PatientRow key={patient.id} patient={patient} clinicId={clinicId} />
                ))}
              </TableBody>
            </Table>
          </div>
        )
      )}

      {/* Add Patient Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Users className='w-5 h-5 text-clinic-teal' />
              Add New Patient
            </DialogTitle>
            <DialogDescription>
              Send an invitation to a new patient. They will receive an email to complete their profile.
            </DialogDescription>
          </DialogHeader>

          {submitSuccess ? (
            <div className='py-8 text-center'>
              <CheckCircle2 className='w-12 h-12 text-green-500 mx-auto mb-4' />
              <h3 className='text-lg font-semibold text-clinic-navy mb-2'>
                Invitation Sent!
              </h3>
              <p className='text-clinic-text/60'>
                The patient will receive an email to complete their profile.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className='space-y-4'>
              {submitError && (
                <div className='p-3 bg-red-50 border border-red-200 rounded-lg'>
                  <p className='text-sm text-red-600'>{submitError}</p>
                </div>
              )}

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='firstName'>First Name *</Label>
                  <Input
                    id='firstName'
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder='Juan'
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='lastName'>Last Name *</Label>
                  <Input
                    id='lastName'
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder='Dela Cruz'
                    required
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='email'>Email Address *</Label>
                <Input
                  id='email'
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='patient@email.com'
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='phone'>Phone Number *</Label>
                <Input
                  id='phone'
                  type='tel'
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder='+63 912 345 6789'
                  required
                />
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
    </div>
  );
}

function PatientCard({ patient, clinicId }: { patient: Patient; clinicId: string }) {
  const router = useRouter();

  const getStatusBadge = () => {
    if (patient.is_active && patient.onboarding_completed) {
      return (
        <span className='flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700'>
          <CheckCircle2 className='w-3 h-3' />
          Active
        </span>
      );
    }
    if (patient.auth_user_id) {
      return (
        <span className='flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700'>
          <Clock className='w-3 h-3' />
          Pending Setup
        </span>
      );
    }
    return (
      <span className='flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600'>
        <UserX className='w-3 h-3' />
        Inactive
      </span>
    );
  };

  return (
    <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6 hover:shadow-lg transition-shadow'>
      <div className='flex items-start justify-between mb-4'>
        <div className='flex items-center gap-3'>
          <div className='w-12 h-12 rounded-full bg-clinic-teal/10 flex items-center justify-center'>
            <Users className='w-6 h-6 text-clinic-teal' />
          </div>
          <div>
            <h3 className='font-semibold text-clinic-navy dark:text-white'>
              {patient.first_name} {patient.last_name}
            </h3>
            <p className='text-xs text-clinic-text/60 dark:text-white/60'>
              Patient
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' size='icon'>
              <MoreVertical className='w-4 h-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/clinic/${clinicId}/patients/${patient.id}/history`)}>
              <FileText className="w-4 h-4 mr-2 text-clinic-teal" />
              Visit History
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <MessageSquare className="w-4 h-4 mr-2 text-clinic-teal" />
              Message
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className='space-y-2'>
        <div className='flex items-center gap-2 text-sm text-clinic-text/70 dark:text-white/70'>
          <Mail className='w-4 h-4' />
          <span className='truncate'>{patient.email}</span>
        </div>
        {patient.phone && (
          <div className='flex items-center gap-2 text-sm text-clinic-text/70 dark:text-white/70'>
            <Phone className='w-4 h-4' />
            {patient.phone}
          </div>
        )}
      </div>

      <div className='mt-4 pt-4 border-t border-clinic-navy/10 dark:border-white/10 flex items-center justify-between'>
        {getStatusBadge()}
        <p className='text-xs text-clinic-text/50 dark:text-white/50'>
          Added {new Date(patient.created_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

function PatientRow({ patient, clinicId }: { patient: Patient; clinicId: string }) {
  const router = useRouter();

  const getStatusBadge = () => {
    if (patient.is_active && patient.onboarding_completed) {
      return (
        <span className='flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700'>
          <CheckCircle2 className='w-3 h-3' />Active
        </span>
      );
    }
    if (patient.auth_user_id) {
      return (
        <span className='flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700'>
          <Clock className='w-3 h-3' />Pending
        </span>
      );
    }
    return (
      <span className='flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600'>
        <UserX className='w-3 h-3' />Inactive
      </span>
    );
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-clinic-teal/10 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-clinic-teal" />
          </div>
          <span className="font-semibold text-clinic-navy dark:text-white">
            {patient.first_name} {patient.last_name}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-clinic-text/70 dark:text-white/70">{patient.email}</TableCell>
      <TableCell className="text-clinic-text/70 dark:text-white/70">{patient.phone || '—'}</TableCell>
      <TableCell>{getStatusBadge()}</TableCell>
      <TableCell className="text-clinic-text/50 dark:text-white/50 text-sm">
        {new Date(patient.created_at).toLocaleDateString()}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' size='icon'>
              <MoreVertical className='w-4 h-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/clinic/${clinicId}/patients/${patient.id}/history`)}>
              <FileText className="w-4 h-4 mr-2 text-clinic-teal" />
              Visit History
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <MessageSquare className="w-4 h-4 mr-2 text-clinic-teal" />
              Message
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
