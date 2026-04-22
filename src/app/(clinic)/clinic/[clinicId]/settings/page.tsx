'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Building2,
  Bell,
  Shield,
  Save,
  Loader2,
  FileText,
  ClipboardList,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useClinicContext } from '../layout';
import OnboardingManagement from '@/components/clinic/onboarding-management';

export default function SettingsPage() {
  const { clinic, admin } = useClinicContext();
  const clinicId = clinic?.id;
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [clinicName, setClinicName] = useState('');
  const [clinicEmail, setClinicEmail] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [appointmentReminders, setAppointmentReminders] = useState(true);
  const [intakeRequired, setIntakeRequired] = useState(false);

  // Initialize form from clinic data
  useEffect(() => {
    if (clinic) {
      setClinicName(clinic.name || '');
      setClinicEmail(clinic.email || '');
      setEmailNotifications(clinic.email_notifications_enabled ?? true);
      setAppointmentReminders(clinic.appointment_reminders_enabled ?? true);
      setIntakeRequired(clinic.intake_required ?? false);
    }
  }, [clinic]);

  const handleEmailToggle = (checked: boolean) => {
    setEmailNotifications(checked);
    if (!checked) {
      setAppointmentReminders(false);
    }
  };

  const handleSave = async () => {
    if (!clinicId) return;
    setIsSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/clinic/${clinicId}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          name: clinicName,
          email: clinicEmail,
          email_notifications_enabled: emailNotifications,
          appointment_reminders_enabled: appointmentReminders,
          intake_required: intakeRequired,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save settings');
      }

      toast.success('Settings saved successfully');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h2 className='text-2xl font-display font-bold text-clinic-navy dark:text-white'>
          Settings
        </h2>
        <p className='text-clinic-text/60 dark:text-white/60'>
          Manage your clinic settings and preferences
        </p>
      </div>

      {/* Clinic Information */}
      <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='w-10 h-10 rounded-xl bg-clinic-teal/10 flex items-center justify-center'>
            <Building2 className='w-5 h-5 text-clinic-teal' />
          </div>
          <div>
            <h3 className='font-semibold text-clinic-navy dark:text-white'>
              Clinic Information
            </h3>
            <p className='text-sm text-clinic-text/60 dark:text-white/60'>
              Basic information about your clinic
            </p>
          </div>
        </div>

        <div className='grid md:grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label htmlFor='clinicName'>Clinic Name</Label>
            <Input
              id='clinicName'
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              className='border-clinic-navy/10'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='clinicEmail'>Clinic Email</Label>
            <Input
              id='clinicEmail'
              type='email'
              value={clinicEmail}
              onChange={(e) => setClinicEmail(e.target.value)}
              className='border-clinic-navy/10'
            />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center'>
            <Bell className='w-5 h-5 text-yellow-500' />
          </div>
          <div>
            <h3 className='font-semibold text-clinic-navy dark:text-white'>
              Notifications
            </h3>
            <p className='text-sm text-clinic-text/60 dark:text-white/60'>
              Configure email notifications sent to patients
            </p>
          </div>
        </div>

        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='font-medium text-clinic-navy dark:text-white'>
                Email Notifications
              </p>
              <p className='text-sm text-clinic-text/60 dark:text-white/60'>
                Send confirmation and update emails to patients when appointments are created or changed
              </p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={handleEmailToggle}
            />
          </div>

          <div className='flex items-center justify-between'>
            <div className={!emailNotifications ? 'opacity-50' : ''}>
              <p className='font-medium text-clinic-navy dark:text-white'>
                Appointment Reminders
              </p>
              <p className='text-sm text-clinic-text/60 dark:text-white/60'>
                Send reminder emails to patients 24 hours before and at appointment start time
              </p>
            </div>
            <Switch
              checked={appointmentReminders}
              onCheckedChange={setAppointmentReminders}
              disabled={!emailNotifications}
            />
          </div>
        </div>
      </div>

      {/* Document Types */}
      <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center'>
            <FileText className='w-5 h-5 text-blue-500' />
          </div>
          <div>
            <h3 className='font-semibold text-clinic-navy dark:text-white'>
              Document Types
            </h3>
            <p className='text-sm text-clinic-text/60 dark:text-white/60'>
              Configure the types of documents patients can upload to your clinic
            </p>
          </div>
        </div>

        <Link href={`/clinic/${clinicId}/settings/document-types`}>
          <Button variant='outline'>Manage Document Types</Button>
        </Link>
      </div>

      {/* Patient Intake */}
      <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center'>
            <ClipboardList className='w-5 h-5 text-purple-500' />
          </div>
          <div className='flex-1'>
            <h3 className='font-semibold text-clinic-navy dark:text-white'>
              Patient Intake
            </h3>
            <p className='text-sm text-clinic-text/60 dark:text-white/60'>
              Configure intake questions and documents patients must complete before appointments
            </p>
          </div>
          <div className='flex items-center gap-3'>
            <span className='text-sm text-clinic-text/60 dark:text-white/60'>
              {intakeRequired ? 'Enabled' : 'Disabled'}
            </span>
            <Switch
              checked={intakeRequired}
              onCheckedChange={setIntakeRequired}
            />
          </div>
        </div>

        {intakeRequired && clinicId && (
          <OnboardingManagement clinicId={clinicId} />
        )}

        {!intakeRequired && (
          <p className='text-sm text-clinic-text/50 dark:text-white/50'>
            Enable patient intake to require patients to complete health questions and upload documents before their appointments.
          </p>
        )}
      </div>

      {/* Security */}
      <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center'>
            <Shield className='w-5 h-5 text-red-500' />
          </div>
          <div>
            <h3 className='font-semibold text-clinic-navy dark:text-white'>
              Security
            </h3>
            <p className='text-sm text-clinic-text/60 dark:text-white/60'>
              Manage your account security settings
            </p>
          </div>
        </div>

        <div className='space-y-4 space-x-2'>
          <Link href={`/clinic/${clinicId}/settings/change-password`}>
            <Button variant='outline'>Change Password</Button>
          </Link>
          <Button variant='outline'>Enable Two-Factor Authentication</Button>
        </div>
      </div>

      {/* Save Button */}
      <div className='flex items-center justify-end'>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className='bg-clinic-teal hover:bg-clinic-teal/90 text-white'
        >
          {isSaving ? (
            <>
              <Loader2 className='w-4 h-4 mr-2 animate-spin' />
              Saving...
            </>
          ) : (
            <>
              <Save className='w-4 h-4 mr-2' />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
