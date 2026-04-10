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
  CheckCircle,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { useClinicContext } from '../layout';

export default function SettingsPage() {
  const { clinic, admin } = useClinicContext();
  const clinicId = clinic?.id;
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Form state
  const [clinicName, setClinicName] = useState('');
  const [clinicEmail, setClinicEmail] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [appointmentReminders, setAppointmentReminders] = useState(true);

  // Initialize form from clinic data
  useEffect(() => {
    if (clinic) {
      setClinicName(clinic.name || '');
      setClinicEmail(clinic.email || '');
      setEmailNotifications(clinic.email_notifications_enabled ?? true);
      setAppointmentReminders(clinic.appointment_reminders_enabled ?? true);
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
    setSaveStatus('idle');

    try {
      const res = await fetch(`/api/clinic/${clinicId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: clinicName,
          email: clinicEmail,
          email_notifications_enabled: emailNotifications,
          appointment_reminders_enabled: appointmentReminders,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save settings');
      }

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
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
      <div className='flex items-center justify-end gap-3'>
        {saveStatus === 'success' && (
          <span className='flex items-center gap-1 text-sm text-green-600 dark:text-green-400'>
            <CheckCircle className='w-4 h-4' />
            Settings saved
          </span>
        )}
        {saveStatus === 'error' && (
          <span className='flex items-center gap-1 text-sm text-red-600 dark:text-red-400'>
            <AlertCircle className='w-4 h-4' />
            Failed to save
          </span>
        )}
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
