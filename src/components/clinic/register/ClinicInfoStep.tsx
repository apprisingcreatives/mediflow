'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Building2, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';

interface ClinicInfoStepProps {
  clinicName: string;
  setClinicName: (value: string) => void;
  clinicEmail: string;
  setClinicEmail: (value: string) => void;
  adminPassword: string;
  setAdminPassword: (value: string) => void;
  clinicPhone: string;
  setClinicPhone: (value: string) => void;
  clinicAddress: string;
  setClinicAddress: (value: string) => void;
  clinicCity: string;
  setClinicCity: (value: string) => void;
  clinicDescription: string;
  setClinicDescription: (value: string) => void;
  onNext: () => void;
}

function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {met ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
      ) : (
        <XCircle className="w-3.5 h-3.5 text-clinic-text/30" />
      )}
      <span className={`text-xs ${met ? "text-green-600 font-medium" : "text-clinic-text/60"}`}>
        {text}
      </span>
    </div>
  );
}

export function ClinicInfoStep({
  clinicName,
  setClinicName,
  clinicEmail,
  setClinicEmail,
  adminPassword,
  setAdminPassword,
  clinicPhone,
  setClinicPhone,
  clinicAddress,
  setClinicAddress,
  clinicCity,
  setClinicCity,
  clinicDescription,
  setClinicDescription,
  onNext,
}: ClinicInfoStepProps) {
  const hasMinLength = adminPassword.length >= 8;
  const hasUpperCase = /[A-Z]/.test(adminPassword);
  const hasLowerCase = /[a-z]/.test(adminPassword);
  const hasNumber = /[0-9]/.test(adminPassword);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(adminPassword);
  const isPasswordValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;

  return (
    <div className='space-y-6 w-full max-w-2xl mx-auto'>
      <div className='flex items-center gap-2 mb-4 '>
        <Building2 className='w-5 h-5 text-clinic-teal' />
        <h2 className='font-display text-xl font-bold text-clinic-navy dark:text-white'>
          Clinic Information
        </h2>
      </div>

      <div className='grid sm:grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label className='text-clinic-navy dark:text-white'>
            Clinic Name *
          </Label>
          <Input
            placeholder='Manila Medical Center'
            value={clinicName}
            onChange={(e) => setClinicName(e.target.value)}
            className='h-12'
          />
        </div>
        <div className='space-y-2'>
          <Label className='text-clinic-navy dark:text-white'>
            Clinic Email (Admin Login) *
          </Label>
          <Input
            type='email'
            placeholder='contact@clinic.com'
            value={clinicEmail}
            onChange={(e) => setClinicEmail(e.target.value)}
            className='h-12'
          />
        </div>
      </div>

      <div className='space-y-2'>
        <Label className='text-clinic-navy dark:text-white'>
          Admin Account Password *
        </Label>
        <Input
          type='password'
          placeholder='••••••••'
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
          className='h-12'
        />
        {adminPassword && (
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <PasswordRequirement met={hasMinLength} text="8+ characters" />
            <PasswordRequirement met={hasUpperCase} text="Uppercase letter" />
            <PasswordRequirement met={hasLowerCase} text="Lowercase letter" />
            <PasswordRequirement met={hasNumber} text="Number" />
            <PasswordRequirement met={hasSpecialChar} text="Special character" />
          </div>
        )}
      </div>

      <div className='grid sm:grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label className='text-clinic-navy dark:text-white'>Phone</Label>
          <Input
            placeholder='+63 2 8123 4567'
            value={clinicPhone}
            onChange={(e) => setClinicPhone(e.target.value)}
            className='h-12'
          />
        </div>
        <div className='space-y-2'>
          <Label className='text-clinic-navy dark:text-white'>City</Label>
          <Input
            placeholder='Manila'
            value={clinicCity}
            onChange={(e) => setClinicCity(e.target.value)}
            className='h-12'
          />
        </div>
      </div>

      <div className='space-y-2'>
        <Label className='text-clinic-navy dark:text-white'>Address</Label>
        <Input
          placeholder='123 Rizal Avenue'
          value={clinicAddress}
          onChange={(e) => setClinicAddress(e.target.value)}
          className='h-12'
        />
      </div>

      <div className='space-y-2'>
        <Label className='text-clinic-navy dark:text-white'>Description</Label>
        <Textarea
          placeholder='Tell us about your clinic...'
          value={clinicDescription}
          onChange={(e) => setClinicDescription(e.target.value)}
          rows={3}
        />
      </div>

      <Button
        onClick={onNext}
        disabled={!clinicName || !clinicEmail || !isPasswordValid}
        className='w-full h-12 bg-clinic-teal hover:bg-clinic-teal/90 text-white'
      >
        Continue
        <ArrowRight className='w-4 h-4 ml-2' />
      </Button>
    </div>
  );
}
