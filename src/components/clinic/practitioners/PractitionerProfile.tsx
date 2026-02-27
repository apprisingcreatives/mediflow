'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Briefcase, FileText, Save, Loader2, Camera, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PractitionerProfile as ProfileType } from '@/hooks/usePractitionerDashboard';

interface PractitionerProfileProps {
  profile: ProfileType | null;
  isLoading: boolean;
  onSave: (updates: {
    practitionerId: string;
    name?: string;
    specialization?: string;
    bio?: string;
    image_url?: string;
  }) => Promise<ProfileType | null>;
}

export function PractitionerProfile({
  profile,
  isLoading,
  onSave,
}: PractitionerProfileProps) {
  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    bio: '',
    image_url: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Initialize form data from profile
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        specialization: profile.specialization || '',
        bio: profile.bio || '',
        image_url: profile.image_url || '',
      });
      setHasChanges(false);
    }
  }, [profile]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
    setSuccess(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!profile) return;

    setError(null);
    setSuccess(false);

    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    setIsSaving(true);

    const result = await onSave({
      practitionerId: profile.id,
      name: formData.name.trim(),
      specialization: formData.specialization.trim() || undefined,
      bio: formData.bio.trim() || undefined,
      image_url: formData.image_url.trim() || undefined,
    });

    if (result) {
      setHasChanges(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError('Failed to save profile. Please try again.');
    }

    setIsSaving(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-clinic-teal" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <User className="w-12 h-12 text-clinic-navy/20 mx-auto mb-4" />
        <p className="text-clinic-text/60 dark:text-white/60">
          Profile not found
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-clinic-navy dark:text-white">
            My Profile
          </h2>
          <p className="text-clinic-text/60 dark:text-white/60">
            Manage your professional information
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="bg-clinic-teal hover:bg-clinic-teal/90"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <AlertDescription>Profile saved successfully!</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Photo Card */}
        <Card className="bg-white dark:bg-slate-800 border-clinic-navy/10 dark:border-white/10">
          <CardHeader>
            <CardTitle className="text-clinic-navy dark:text-white">Profile Photo</CardTitle>
            <CardDescription>Your professional photo</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Avatar className="h-32 w-32 border-4 border-clinic-teal/20">
              <AvatarImage src={formData.image_url || undefined} alt={formData.name} />
              <AvatarFallback className="bg-clinic-teal/10 text-clinic-teal text-3xl font-semibold">
                {getInitials(formData.name || 'P')}
              </AvatarFallback>
            </Avatar>
            <div className="w-full space-y-2">
              <Label htmlFor="image_url" className="text-sm text-clinic-text/60 dark:text-white/60">
                Image URL
              </Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) => handleChange('image_url', e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Profile Details Card */}
        <Card className="lg:col-span-2 bg-white dark:bg-slate-800 border-clinic-navy/10 dark:border-white/10">
          <CardHeader>
            <CardTitle className="text-clinic-navy dark:text-white">Profile Details</CardTitle>
            <CardDescription>Your professional information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="w-4 h-4 text-clinic-text/40" />
                Full Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Dr. John Smith"
              />
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-clinic-text/40" />
                Email
              </Label>
              <Input
                value={profile.email || ''}
                disabled
                className="bg-clinic-navy/5 dark:bg-white/5"
              />
              <p className="text-xs text-clinic-text/50 dark:text-white/50">
                Email cannot be changed here. Contact your administrator.
              </p>
            </div>

            {/* Specialization */}
            <div className="space-y-2">
              <Label htmlFor="specialization" className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-clinic-text/40" />
                Specialization
              </Label>
              <Input
                id="specialization"
                value={formData.specialization}
                onChange={(e) => handleChange('specialization', e.target.value)}
                placeholder="e.g., General Dentistry, Orthodontics"
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio" className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-clinic-text/40" />
                Bio
              </Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                placeholder="Tell patients about yourself, your experience, and your approach to care..."
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-clinic-text/50 dark:text-white/50">
                This will be visible to patients when they book appointments.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Clinic Info Card */}
        <Card className="lg:col-span-3 bg-white dark:bg-slate-800 border-clinic-navy/10 dark:border-white/10">
          <CardHeader>
            <CardTitle className="text-clinic-navy dark:text-white">Clinic Information</CardTitle>
            <CardDescription>The clinic you are associated with</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-clinic-text/60 dark:text-white/60">Clinic Name</p>
                <p className="font-medium text-clinic-navy dark:text-white">
                  {profile.clinic?.name || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-clinic-text/60 dark:text-white/60">Address</p>
                <p className="font-medium text-clinic-navy dark:text-white">
                  {profile.clinic?.address || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-clinic-text/60 dark:text-white/60">Phone</p>
                <p className="font-medium text-clinic-navy dark:text-white">
                  {profile.clinic?.phone || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Status Card */}
        <Card className="lg:col-span-3 bg-white dark:bg-slate-800 border-clinic-navy/10 dark:border-white/10">
          <CardHeader>
            <CardTitle className="text-clinic-navy dark:text-white">Account Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  profile.is_active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {profile.is_active ? 'Active' : 'Inactive'}
              </div>
              <p className="text-sm text-clinic-text/60 dark:text-white/60">
                {profile.is_active
                  ? 'Your account is active and you can receive appointments.'
                  : 'Your account is inactive. Contact your clinic administrator.'}
              </p>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-clinic-text/60 dark:text-white/60">Member Since</p>
                <p className="font-medium text-clinic-navy dark:text-white">
                  {new Date(profile.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-clinic-text/60 dark:text-white/60">Role</p>
                <p className="font-medium text-clinic-navy dark:text-white capitalize">
                  {profile.role || 'Practitioner'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default PractitionerProfile;
