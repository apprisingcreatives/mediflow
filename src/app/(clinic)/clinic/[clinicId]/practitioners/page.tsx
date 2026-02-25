'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
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
import {
  Stethoscope,
  Plus,
  Search,
  Filter,
  Mail,
  MoreVertical,
  Loader2,
  CheckCircle2,
  Clock,
  UserX,
} from 'lucide-react';
import { useClinicContext } from '../layout';
import { useGetPractitioners, type Practitioner } from '@/hooks';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

// Common specializations
const SPECIALIZATIONS = [
  'General Practice',
  'Dentist',
  'Pediatrics',
  'Cardiology',
  'Dermatology',
  'Ophthalmology',
  'Orthopedics',
  'OB-GYN',
  'ENT',
  'Psychiatry',
  'Neurology',
  'Internal Medicine',
  'Surgery',
  'Radiology',
  'Pathology',
];

export default function PractitionersPage() {
  const {user} = useAuth();
  console.log(`@@@@@@@@@@@@user`,user)
  const params = useParams();
  const clinicId = params.clinicId as string;
  const { isTrialExpired } = useClinicContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [specialization, setSpecialization] = useState('');

  const {
    practitioners,
    loading,
    error,
    fetchPractitioners,
  } = useGetPractitioners();

  // Fetch practitioners on mount
  useEffect(() => {
    if (clinicId) {
      fetchPractitioners({ clinicId, activeOnly: false });
    }
  }, [clinicId, fetchPractitioners]);

  // Filter practitioners by search query
  const filteredPractitioners = practitioners.filter((practitioner) => {
    if (!searchQuery.trim()) return true;
    const search = searchQuery.toLowerCase();
    return (
      practitioner.name.toLowerCase().includes(search) ||
      practitioner.email?.toLowerCase().includes(search) ||
      practitioner.specialization?.toLowerCase().includes(search)
    );
  });

  const resetForm = () => {
    setName('');
    setEmail('');
    setSpecialization('');
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
    
    if (!name.trim() || !email.trim() || !specialization) {
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

      const response = await fetch(`/api/clinic/${clinicId}/practitioners/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          specialization,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to invite practitioner');
      }

      setSubmitSuccess(true);
      
      // Refresh the practitioners list
      await fetchPractitioners({ clinicId, activeOnly: false });

      // Close dialog after a short delay
      setTimeout(() => {
        setIsAddDialogOpen(false);
        resetForm();
      }, 2000);
    } catch (err) {
      console.error('Error inviting practitioner:', err);
      setSubmitError(err instanceof Error ? err.message : 'Failed to invite practitioner');
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
            Practitioners
          </h2>
          <p className='text-clinic-text/60 dark:text-white/60'>
            Manage your clinic&apos;s medical staff
          </p>
        </div>
        <Button 
          className='bg-clinic-teal hover:bg-clinic-teal/90 text-white'
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className='w-4 h-4 mr-2' />
          Add Practitioner
        </Button>
      </div>

      {/* Filters */}
      <div className='flex items-center gap-4'>
        <div className='relative flex-1 max-w-md'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-clinic-text/40' />
          <Input
            placeholder='Search practitioners...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-10 border-clinic-navy/10'
          />
        </div>
        <Button variant='outline' size='icon'>
          <Filter className='w-4 h-4' />
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className='text-center py-12'>
          <Loader2 className='w-8 h-8 text-clinic-teal animate-spin mx-auto mb-4' />
          <p className='text-clinic-text/60'>Loading practitioners...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className='text-center py-12'>
          <p className='text-red-500'>{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredPractitioners.length === 0 && (
        <div className='text-center py-12 bg-white dark:bg-slate-800 rounded-2xl shadow-glass'>
          <Stethoscope className='w-12 h-12 text-clinic-text/20 mx-auto mb-4' />
          <h3 className='text-lg font-semibold text-clinic-navy dark:text-white mb-2'>
            No practitioners found
          </h3>
          <p className='text-clinic-text/60 dark:text-white/60 mb-4'>
            {searchQuery
              ? 'No practitioners match your search criteria'
              : 'Get started by adding your first practitioner'}
          </p>
          {!searchQuery && (
            <Button 
              className='bg-clinic-teal hover:bg-clinic-teal/90 text-white'
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className='w-4 h-4 mr-2' />
              Add Practitioner
            </Button>
          )}
        </div>
      )}

      {/* Practitioners Grid */}
      {!loading && !error && filteredPractitioners.length > 0 && (
        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {filteredPractitioners.map((practitioner) => (
            <PractitionerCard key={practitioner.id} practitioner={practitioner} />
          ))}
        </div>
      )}

      {/* Add Practitioner Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Stethoscope className='w-5 h-5 text-clinic-teal' />
              Add New Practitioner
            </DialogTitle>
            <DialogDescription>
              Send an invitation to a new practitioner. They will receive an email to set up their account.
            </DialogDescription>
          </DialogHeader>

          {submitSuccess ? (
            <div className='py-8 text-center'>
              <CheckCircle2 className='w-12 h-12 text-green-500 mx-auto mb-4' />
              <h3 className='text-lg font-semibold text-clinic-navy mb-2'>
                Invitation Sent!
              </h3>
              <p className='text-clinic-text/60'>
                The practitioner will receive an email to set up their account.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className='space-y-4'>
              {submitError && (
                <div className='p-3 bg-red-50 border border-red-200 rounded-lg'>
                  <p className='text-sm text-red-600'>{submitError}</p>
                </div>
              )}

              <div className='space-y-2'>
                <Label htmlFor='name'>Full Name *</Label>
                <Input
                  id='name'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder='Dr. Juan Dela Cruz'
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='email'>Email Address *</Label>
                <Input
                  id='email'
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='doctor@clinic.com'
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='specialization'>Specialization *</Label>
                <Select value={specialization} onValueChange={setSpecialization}>
                  <SelectTrigger>
                    <SelectValue placeholder='Select specialization' />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIALIZATIONS.map((spec) => (
                      <SelectItem key={spec} value={spec}>
                        {spec}
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
    </div>
  );
}

function PractitionerCard({ practitioner }: { practitioner: Practitioner }) {
  const getStatusBadge = () => {
    if (practitioner.is_active) {
      return (
        <span className='flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700'>
          <CheckCircle2 className='w-3 h-3' />
          Active
        </span>
      );
    }
    if (practitioner.auth_user_id) {
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
          <div className='w-12 h-12 rounded-full bg-clinic-ai/10 flex items-center justify-center'>
            {practitioner.image_url ? (
              <img
                src={practitioner.image_url}
                alt={practitioner.name}
                className='w-12 h-12 rounded-full object-cover'
              />
            ) : (
              <Stethoscope className='w-6 h-6 text-clinic-ai' />
            )}
          </div>
          <div>
            <h3 className='font-semibold text-clinic-navy dark:text-white'>
              {practitioner.name}
            </h3>
            <p className='text-xs text-clinic-text/60 dark:text-white/60'>
              {practitioner.specialization || 'General Practice'}
            </p>
          </div>
        </div>
        <Button variant='ghost' size='icon'>
          <MoreVertical className='w-4 h-4' />
        </Button>
      </div>

      <div className='space-y-2'>
        {practitioner.email && (
          <div className='flex items-center gap-2 text-sm text-clinic-text/70 dark:text-white/70'>
            <Mail className='w-4 h-4' />
            <span className='truncate'>{practitioner.email}</span>
          </div>
        )}
      </div>

      <div className='mt-4 pt-4 border-t border-clinic-navy/10 dark:border-white/10 flex items-center justify-between'>
        {getStatusBadge()}
        <p className='text-xs text-clinic-text/50 dark:text-white/50'>
          Added {new Date(practitioner.created_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
