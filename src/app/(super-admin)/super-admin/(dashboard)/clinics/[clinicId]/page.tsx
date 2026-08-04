'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Building2,
  Mail,
  MapPin,
  Phone,
  Globe,
  Loader2,
  Pencil,
  Trash2,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useGetFeatures,
  useGetClinicFeatures,
  usePutClinicFeatures,
  useGetServices,
  useServiceMutations,
  useClinicMutations,
} from '@/hooks';
import { Clinic, ClinicService } from '@/types/database';
import { AIFeature } from '@/hooks/useGetFeatures';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'services' | 'ai-features' | 'admins' | 'billing';

interface ClinicStats {
  services: number;
  practitioners: number;
  patients: number;
}

interface ClinicAdmin {
  id: string;
  clinic_id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface ClinicPayment {
  id: string;
  clinic_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

// ─── Badge helpers ─────────────────────────────────────────────────────────────

const PLAN_BADGE_CLASSES: Record<string, string> = {
  starter:
    'bg-clinic-navy/10 text-clinic-navy dark:bg-clinic-navy/20 dark:text-white',
  professional:
    'bg-clinic-ai/10 text-clinic-ai dark:bg-clinic-ai/20 dark:text-clinic-ai',
  enterprise:
    'bg-yellow-400/20 text-yellow-700 dark:bg-yellow-400/20 dark:text-yellow-300',
};

function getPlanBadgeClass(plan: string | null | undefined): string {
  if (!plan)
    return 'bg-clinic-navy/10 text-clinic-navy dark:bg-white/10 dark:text-white/60';
  return (
    PLAN_BADGE_CLASSES[plan.toLowerCase()] ??
    'bg-clinic-navy/10 text-clinic-navy dark:bg-white/10 dark:text-white'
  );
}

function getPaymentStatusClass(status: string | null | undefined): string {
  switch (status) {
    case 'active':
      return 'bg-green-500/10 text-green-600 dark:text-green-400';
    case 'trial':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
    case 'past_due':
      return 'bg-orange-500/10 text-orange-600 dark:text-orange-400';
    case 'canceled':
      return 'bg-red-500/10 text-red-500 dark:text-red-400';
    default:
      return 'bg-gray-500/10 text-gray-500 dark:text-gray-400';
  }
}

// ─── Form data types ──────────────────────────────────────────────────────────

interface ClinicFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  description: string;
  subscription_plan: string;
  slug: string;
}

interface ServiceFormData {
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  currency: string;
}

const EMPTY_SERVICE_FORM: ServiceFormData = {
  name: '',
  description: '',
  duration_minutes: 30,
  price: 0,
  currency: 'PHP',
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ClinicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clinicId = params.clinicId as string;

  // Core state
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<ClinicStats>({
    services: 0,
    practitioners: 0,
    patients: 0,
  });

  // Edit clinic dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<ClinicFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    description: '',
    subscription_plan: 'starter',
    slug: '',
  });

  // Delete clinic dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Clinic mutations
  const {
    updateClinic,
    deleteClinic,
    loading: clinicMutating,
    error: clinicMutationError,
    clearError: clearClinicError,
  } = useClinicMutations();

  // Admins tab
  const [admins, setAdmins] = useState<ClinicAdmin[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);

  // Billing tab
  const [payments, setPayments] = useState<ClinicPayment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  // AI Features hooks
  const { features, fetchFeatures } = useGetFeatures();
  const { clinicFeatures, fetchClinicFeatures } = useGetClinicFeatures();
  const { toggleClinicFeature, loading: togglingFeature } =
    usePutClinicFeatures();

  // Services tab hooks
  const {
    services,
    loading: servicesLoading,
    fetchServices,
  } = useGetServices();
  const {
    createService,
    updateService: updateServiceMutation,
    deleteService: deleteServiceMutation,
    loading: serviceMutating,
    error: serviceMutationError,
    clearError: clearServiceError,
  } = useServiceMutations();

  // Service form state
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [serviceDialogMode, setServiceDialogMode] = useState<
    'add' | 'edit'
  >('add');
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceForm, setServiceForm] =
    useState<ServiceFormData>(EMPTY_SERVICE_FORM);
  const [deleteServiceDialogOpen, setDeleteServiceDialogOpen] = useState(false);
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(
    null
  );
  const [serviceSuccessMessage, setServiceSuccessMessage] = useState('');

  // ── Fetch main clinic data + stats ──────────────────────────────────────────

  const loadClinic = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', clinicId)
        .single();

      if (error) throw error;
      setClinic(data);

      // Fetch counts in parallel
      const [servicesRes, practitionersRes, patientsRes] = await Promise.all([
        supabase
          .from('clinic_services')
          .select('id', { count: 'exact', head: true })
          .eq('clinic_id', clinicId),
        supabase
          .from('practitioners')
          .select('id', { count: 'exact', head: true })
          .eq('clinic_id', clinicId),
        supabase
          .from('patients')
          .select('id', { count: 'exact', head: true })
          .eq('clinic_id', clinicId),
      ]);

      setStats({
        services: servicesRes.count ?? 0,
        practitioners: practitionersRes.count ?? 0,
        patients: patientsRes.count ?? 0,
      });
    } catch (err) {
      console.error('Failed to load clinic:', err);
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    if (clinicId) {
      loadClinic();
    }
  }, [clinicId, loadClinic]);

  // ── Load tab-specific data on demand ────────────────────────────────────────

  useEffect(() => {
    if (activeTab === 'ai-features') {
      fetchFeatures();
      fetchClinicFeatures({ clinicId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, clinicId]);

  useEffect(() => {
    if (activeTab === 'services' && clinicId) {
      fetchServices({ clinicId, activeOnly: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, clinicId]);

  useEffect(() => {
    if (activeTab === 'admins' && clinicId) {
      setAdminsLoading(true);
      supabase
        .from('clinic_admins')
        .select('*')
        .eq('clinic_id', clinicId)
        .then(({ data, error }) => {
          if (!error) setAdmins(data ?? []);
          setAdminsLoading(false);
        });
    }
  }, [activeTab, clinicId]);

  useEffect(() => {
    if (activeTab === 'billing' && clinicId) {
      (async () => {
        setPaymentsLoading(true);
        try {
          const { data, error } = await supabase
            .from('clinic_payments')
            .select('*')
            .eq('clinic_id', clinicId)
            .order('created_at', { ascending: false });
          if (!error) setPayments(data ?? []);
        } catch {
          // Table might not exist yet
          setPayments([]);
        } finally {
          setPaymentsLoading(false);
        }
      })();
    }
  }, [activeTab, clinicId]);

  // ── AI feature toggle ────────────────────────────────────────────────────────

  const getAdminId = (): string => {
    try {
      const raw = localStorage.getItem('superAdmin');
      if (!raw) return '';
      const parsed = JSON.parse(raw);
      return parsed?.id ?? '';
    } catch {
      return '';
    }
  };

  const isFeatureEnabled = (featureId: string): boolean => {
    const cf = clinicFeatures.find((f) => f.feature_id === featureId);
    return cf?.is_enabled ?? false;
  };

  const handleToggleFeature = async (feature: AIFeature) => {
    const currentlyEnabled = isFeatureEnabled(feature.id);
    try {
      await toggleClinicFeature({
        clinicId,
        featureId: feature.id,
        isEnabled: !currentlyEnabled,
        enabledBy: getAdminId(),
      });
    } catch {
      // Error handled by hook
    }
  };

  // ── Edit clinic handlers ────────────────────────────────────────────────────

  const openEditDialog = () => {
    if (!clinic) return;
    setEditForm({
      name: clinic.name || '',
      email: clinic.email || '',
      phone: clinic.phone || '',
      address: clinic.address || '',
      city: clinic.city || '',
      description: clinic.description || '',
      subscription_plan: clinic.subscription_plan || 'starter',
      slug: clinic.slug || '',
    });
    clearClinicError();
    setEditDialogOpen(true);
  };

  const handleUpdateClinic = async () => {
    if (!editForm.name.trim() || !editForm.email.trim()) return;

    const result = await updateClinic(clinicId, {
      name: editForm.name.trim(),
      email: editForm.email.trim(),
      phone: editForm.phone.trim() || null,
      address: editForm.address.trim() || null,
      city: editForm.city.trim() || null,
      description: editForm.description.trim() || null,
      subscription_plan: editForm.subscription_plan,
      slug: editForm.slug.trim() || null,
    });

    if (result) {
      setClinic(result);
      setEditDialogOpen(false);
    }
  };

  // ── Delete clinic handler ───────────────────────────────────────────────────

  const handleDeleteClinic = async () => {
    const success = await deleteClinic(clinicId);
    if (success) {
      setDeleteDialogOpen(false);
      router.push('/super-admin/clinics');
    }
  };

  // ── Service CRUD handlers ───────────────────────────────────────────────────

  const openAddServiceDialog = () => {
    setServiceDialogMode('add');
    setEditingServiceId(null);
    setServiceForm(EMPTY_SERVICE_FORM);
    setServiceSuccessMessage('');
    clearServiceError();
    setServiceDialogOpen(true);
  };

  const openEditServiceDialog = (service: ClinicService) => {
    setServiceDialogMode('edit');
    setEditingServiceId(service.id);
    setServiceForm({
      name: service.name,
      description: service.description || '',
      duration_minutes: service.duration_minutes,
      price: service.price,
      currency: service.currency || 'PHP',
    });
    setServiceSuccessMessage('');
    clearServiceError();
    setServiceDialogOpen(true);
  };

  const handleSaveService = async () => {
    if (!serviceForm.name.trim()) return;

    if (serviceDialogMode === 'add') {
      const result = await createService({
        clinic_id: clinicId,
        name: serviceForm.name.trim(),
        description: serviceForm.description.trim() || null,
        duration_minutes: serviceForm.duration_minutes,
        price: serviceForm.price,
        currency: serviceForm.currency,
      });
      if (result) {
        setServiceSuccessMessage(`"${result.name}" created successfully.`);
        setServiceForm(EMPTY_SERVICE_FORM);
        fetchServices({ clinicId, activeOnly: false });
        setTimeout(() => setServiceDialogOpen(false), 1200);
      }
    } else if (editingServiceId) {
      const result = await updateServiceMutation(editingServiceId, {
        name: serviceForm.name.trim(),
        description: serviceForm.description.trim() || null,
        duration_minutes: serviceForm.duration_minutes,
        price: serviceForm.price,
        currency: serviceForm.currency,
      });
      if (result) {
        setServiceSuccessMessage(`"${result.name}" updated successfully.`);
        fetchServices({ clinicId, activeOnly: false });
        setTimeout(() => setServiceDialogOpen(false), 1200);
      }
    }
  };

  const openDeleteServiceDialog = (serviceId: string) => {
    setDeletingServiceId(serviceId);
    setDeleteServiceDialogOpen(true);
  };

  const handleDeleteService = async () => {
    if (!deletingServiceId) return;
    const success = await deleteServiceMutation(deletingServiceId);
    if (success) {
      setDeleteServiceDialogOpen(false);
      setDeletingServiceId(null);
      fetchServices({ clinicId, activeOnly: false });
    }
  };

  const updateServiceField = (
    field: keyof ServiceFormData,
    value: string | number
  ) => {
    setServiceForm((prev) => ({ ...prev, [field]: value }));
  };

  // ── Tab definitions ──────────────────────────────────────────────────────────

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'services', label: 'Services' },
    { id: 'ai-features', label: 'AI Features' },
    { id: 'admins', label: 'Admins' },
    { id: 'billing', label: 'Billing' },
  ];

  // ─── Loading skeleton ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <Loader2 className='w-8 h-8 animate-spin text-clinic-teal' />
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className='flex flex-col items-center justify-center h-64 gap-4'>
        <Building2 className='w-12 h-12 text-clinic-navy/20 dark:text-white/20' />
        <p className='text-clinic-text/60 dark:text-white/60'>
          Clinic not found.
        </p>
        <Link href='/super-admin/clinics'>
          <Button variant='outline' size='sm'>
            Back to Clinics
          </Button>
        </Link>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className='space-y-6'>
      {/* Back button */}
      <Link
        href='/super-admin/clinics'
        className='inline-flex items-center gap-2 text-sm text-clinic-text/60 dark:text-white/60 hover:text-clinic-navy dark:hover:text-white transition-colors'
      >
        <ArrowLeft className='w-4 h-4' />
        Back to Clinics
      </Link>

      {/* Clinic header */}
      <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div className='flex items-center gap-4'>
          <div className='w-12 h-12 rounded-xl bg-clinic-teal/10 flex items-center justify-center shrink-0'>
            <Building2 className='w-6 h-6 text-clinic-teal' />
          </div>
          <div>
            <h1 className='font-display text-xl font-bold text-clinic-navy dark:text-white'>
              {clinic.name}
            </h1>
            <p className='text-sm text-clinic-text/60 dark:text-white/60'>
              {clinic.email}
            </p>
          </div>
        </div>
        <div className='flex items-center gap-2 flex-wrap'>
          {clinic.subscription_plan && (
            <span
              className={cn(
                'text-xs px-2.5 py-1 rounded-full capitalize font-medium',
                getPlanBadgeClass(clinic.subscription_plan)
              )}
            >
              {clinic.subscription_plan}
            </span>
          )}
          <span
            className={cn(
              'text-xs px-2.5 py-1 rounded-full font-medium',
              clinic.is_active
                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                : 'bg-red-500/10 text-red-500 dark:text-red-400'
            )}
          >
            {clinic.is_active ? 'Active' : 'Inactive'}
          </span>

          {/* Edit & Delete buttons */}
          <Button
            id='edit-clinic-button'
            variant='outline'
            size='sm'
            onClick={openEditDialog}
            className='gap-1.5 ml-2'
          >
            <Pencil className='w-3.5 h-3.5' />
            Edit
          </Button>
          <Button
            id='delete-clinic-button'
            variant='outline'
            size='sm'
            onClick={() => setDeleteDialogOpen(true)}
            className='gap-1.5 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-800 dark:hover:bg-red-900/20'
          >
            <Trash2 className='w-3.5 h-3.5' />
            Delete
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className='border-b border-clinic-navy/10 dark:border-white/10'>
        <div className='flex gap-1 overflow-x-auto'>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-clinic-teal text-clinic-teal'
                  : 'border-transparent text-clinic-text/60 hover:text-clinic-navy dark:text-white/60 dark:hover:text-white'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div>
        {/* ── Overview Tab ── */}
        {activeTab === 'overview' && (
          <div className='space-y-6'>
            {/* Clinic info card */}
            <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6'>
              <h2 className='font-display text-lg font-semibold text-clinic-navy dark:text-white mb-5'>
                Clinic Information
              </h2>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
                <div>
                  <p className='text-sm text-clinic-text/60 dark:text-white/60 mb-1 flex items-center gap-1.5'>
                    <Building2 className='w-3.5 h-3.5' /> Name
                  </p>
                  <p className='text-sm font-medium text-clinic-navy dark:text-white'>
                    {clinic.name}
                  </p>
                </div>

                <div>
                  <p className='text-sm text-clinic-text/60 dark:text-white/60 mb-1 flex items-center gap-1.5'>
                    <Mail className='w-3.5 h-3.5' /> Email
                  </p>
                  <p className='text-sm font-medium text-clinic-navy dark:text-white'>
                    {clinic.email}
                  </p>
                </div>

                <div>
                  <p className='text-sm text-clinic-text/60 dark:text-white/60 mb-1 flex items-center gap-1.5'>
                    <Phone className='w-3.5 h-3.5' /> Phone
                  </p>
                  <p className='text-sm font-medium text-clinic-navy dark:text-white'>
                    {clinic.phone ?? '—'}
                  </p>
                </div>

                <div>
                  <p className='text-sm text-clinic-text/60 dark:text-white/60 mb-1 flex items-center gap-1.5'>
                    <MapPin className='w-3.5 h-3.5' /> Address
                  </p>
                  <p className='text-sm font-medium text-clinic-navy dark:text-white'>
                    {clinic.address
                      ? `${clinic.address}${clinic.city ? ', ' + clinic.city : ''}`
                      : '—'}
                  </p>
                </div>

                <div>
                  <p className='text-sm text-clinic-text/60 dark:text-white/60 mb-1 flex items-center gap-1.5'>
                    <MapPin className='w-3.5 h-3.5' /> City
                  </p>
                  <p className='text-sm font-medium text-clinic-navy dark:text-white'>
                    {clinic.city ?? '—'}
                  </p>
                </div>

                <div>
                  <p className='text-sm text-clinic-text/60 dark:text-white/60 mb-1 flex items-center gap-1.5'>
                    <Globe className='w-3.5 h-3.5' /> Slug
                  </p>
                  <p className='text-sm font-medium text-clinic-navy dark:text-white font-mono'>
                    {clinic.slug ?? '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className='grid grid-cols-3 gap-4'>
              {[
                { label: 'Services', value: stats.services },
                { label: 'Practitioners', value: stats.practitioners },
                { label: 'Patients', value: stats.patients },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-5 text-center'
                >
                  <p className='text-2xl font-bold text-clinic-navy dark:text-white'>
                    {value}
                  </p>
                  <p className='text-sm text-clinic-text/60 dark:text-white/60 mt-1'>
                    {label}
                  </p>
                </div>
              ))}
            </div>

            {/* Subscription info */}
            <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6'>
              <h2 className='font-display text-lg font-semibold text-clinic-navy dark:text-white mb-5'>
                Subscription
              </h2>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
                <div>
                  <p className='text-sm text-clinic-text/60 dark:text-white/60 mb-1'>
                    Plan
                  </p>
                  {clinic.subscription_plan ? (
                    <span
                      className={cn(
                        'text-xs px-2.5 py-1 rounded-full capitalize font-medium',
                        getPlanBadgeClass(clinic.subscription_plan)
                      )}
                    >
                      {clinic.subscription_plan}
                    </span>
                  ) : (
                    <p className='text-sm font-medium text-clinic-navy dark:text-white'>
                      —
                    </p>
                  )}
                </div>

                <div>
                  <p className='text-sm text-clinic-text/60 dark:text-white/60 mb-1'>
                    Payment Status
                  </p>
                  {clinic.payment_status ? (
                    <span
                      className={cn(
                        'text-xs px-2.5 py-1 rounded-full capitalize font-medium',
                        getPaymentStatusClass(clinic.payment_status)
                      )}
                    >
                      {clinic.payment_status.replace('_', ' ')}
                    </span>
                  ) : (
                    <p className='text-sm font-medium text-clinic-navy dark:text-white'>
                      —
                    </p>
                  )}
                </div>

                <div>
                  <p className='text-sm text-clinic-text/60 dark:text-white/60 mb-1'>
                    Trial Start
                  </p>
                  <p className='text-sm font-medium text-clinic-navy dark:text-white'>
                    {clinic.trial_start_date
                      ? new Date(clinic.trial_start_date).toLocaleDateString()
                      : '—'}
                  </p>
                </div>

                <div>
                  <p className='text-sm text-clinic-text/60 dark:text-white/60 mb-1'>
                    Trial End
                  </p>
                  <p className='text-sm font-medium text-clinic-navy dark:text-white'>
                    {clinic.trial_end_date
                      ? new Date(clinic.trial_end_date).toLocaleDateString()
                      : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Services Tab ── */}
        {activeTab === 'services' && (
          <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6'>
            <div className='flex items-center justify-between mb-5'>
              <h2 className='font-display text-lg font-semibold text-clinic-navy dark:text-white'>
                Services
              </h2>
              <Button
                id='add-service-button'
                size='sm'
                onClick={openAddServiceDialog}
                className='bg-clinic-teal hover:bg-clinic-teal/90 text-white gap-1.5'
              >
                <Plus className='w-4 h-4' />
                Add Service
              </Button>
            </div>

            {servicesLoading ? (
              <div className='flex items-center justify-center py-12'>
                <Loader2 className='w-6 h-6 animate-spin text-clinic-teal' />
              </div>
            ) : services.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-12 text-center'>
                <DollarSign className='w-10 h-10 text-clinic-navy/20 dark:text-white/20 mb-3' />
                <p className='text-sm text-clinic-text/60 dark:text-white/60'>
                  No services yet. Add your first service to get started.
                </p>
              </div>
            ) : (
              <div className='space-y-3'>
                {services.map((service) => (
                  <div
                    key={service.id}
                    className='flex items-center justify-between gap-4 p-4 rounded-xl border border-clinic-navy/5 dark:border-white/5 hover:border-clinic-teal/30 transition-colors'
                  >
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 flex-wrap'>
                        <p className='text-sm font-medium text-clinic-navy dark:text-white'>
                          {service.name}
                        </p>
                        <span
                          className={cn(
                            'text-xs px-2 py-0.5 rounded-full font-medium',
                            service.is_active
                              ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                              : 'bg-red-500/10 text-red-500 dark:text-red-400'
                          )}
                        >
                          {service.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {service.description && (
                        <p className='text-xs text-clinic-text/50 dark:text-white/50 mt-0.5 truncate'>
                          {service.description}
                        </p>
                      )}
                      <div className='flex items-center gap-4 mt-1.5'>
                        <span className='text-xs text-clinic-text/60 dark:text-white/60 flex items-center gap-1'>
                          <Clock className='w-3 h-3' />
                          {service.duration_minutes} min
                        </span>
                        <span className='text-xs text-clinic-text/60 dark:text-white/60 flex items-center gap-1'>
                          <DollarSign className='w-3 h-3' />
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: service.currency || 'PHP',
                          }).format(service.price)}
                        </span>
                      </div>
                    </div>

                    <div className='flex items-center gap-1 shrink-0'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => openEditServiceDialog(service)}
                        className='h-8 w-8 p-0 text-clinic-text/60 hover:text-clinic-teal'
                      >
                        <Pencil className='w-3.5 h-3.5' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => openDeleteServiceDialog(service.id)}
                        className='h-8 w-8 p-0 text-clinic-text/60 hover:text-red-500'
                      >
                        <Trash2 className='w-3.5 h-3.5' />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── AI Features Tab ── */}
        {activeTab === 'ai-features' && (
          <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6'>
            <h2 className='font-display text-lg font-semibold text-clinic-navy dark:text-white mb-5'>
              AI Features
            </h2>

            {features.length === 0 ? (
              <p className='text-sm text-clinic-text/60 dark:text-white/60'>
                No AI features available.
              </p>
            ) : (
              <div className='space-y-4'>
                {features.map((feature) => {
                  const enabled = isFeatureEnabled(feature.id);
                  return (
                    <div
                      key={feature.id}
                      className='flex items-center justify-between gap-4 py-3 border-b border-clinic-navy/5 dark:border-white/5 last:border-0'
                    >
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 flex-wrap'>
                          <p className='text-sm font-medium text-clinic-navy dark:text-white'>
                            {feature.name}
                          </p>
                          {feature.is_premium && (
                            <span className='text-xs px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-700 dark:text-yellow-300'>
                              Premium
                            </span>
                          )}
                          {feature.category && (
                            <span className='text-xs px-1.5 py-0.5 rounded bg-clinic-navy/5 dark:bg-white/5 text-clinic-text/60 dark:text-white/60'>
                              {feature.category}
                            </span>
                          )}
                        </div>
                        {feature.description && (
                          <p className='text-xs text-clinic-text/50 dark:text-white/50 mt-0.5 truncate'>
                            {feature.description}
                          </p>
                        )}
                      </div>
                      <Switch
                        checked={enabled}
                        onCheckedChange={() => handleToggleFeature(feature)}
                        disabled={togglingFeature}
                        aria-label={`Toggle ${feature.name}`}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Admins Tab ── */}
        {activeTab === 'admins' && (
          <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6'>
            <h2 className='font-display text-lg font-semibold text-clinic-navy dark:text-white mb-5'>
              Clinic Admins
            </h2>

            {adminsLoading ? (
              <div className='flex items-center justify-center py-12'>
                <Loader2 className='w-6 h-6 animate-spin text-clinic-teal' />
              </div>
            ) : admins.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-12 text-center'>
                <Building2 className='w-10 h-10 text-clinic-navy/20 dark:text-white/20 mb-3' />
                <p className='text-sm text-clinic-text/60 dark:text-white/60'>
                  No admins found for this clinic.
                </p>
              </div>
            ) : (
              <div className='space-y-3'>
                {admins.map((admin) => (
                  <div
                    key={admin.id}
                    className='flex items-center justify-between gap-4 p-4 rounded-xl border border-clinic-navy/5 dark:border-white/5'
                  >
                    <div>
                      <p className='text-sm font-medium text-clinic-navy dark:text-white'>
                        {admin.name}
                      </p>
                      <div className='flex items-center gap-1.5 mt-0.5'>
                        <Mail className='w-3 h-3 text-clinic-text/40 dark:text-white/40' />
                        <p className='text-xs text-clinic-text/60 dark:text-white/60'>
                          {admin.email}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'text-xs px-2.5 py-1 rounded-full font-medium',
                        admin.is_active
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                          : 'bg-red-500/10 text-red-500 dark:text-red-400'
                      )}
                    >
                      {admin.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Billing Tab ── */}
        {activeTab === 'billing' && (
          <div className='space-y-6'>
            {/* Subscription summary */}
            <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6'>
              <h2 className='font-display text-lg font-semibold text-clinic-navy dark:text-white mb-5'>
                Subscription Summary
              </h2>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
                <div>
                  <p className='text-sm text-clinic-text/60 dark:text-white/60 mb-1'>
                    Plan
                  </p>
                  {clinic.subscription_plan ? (
                    <span
                      className={cn(
                        'text-xs px-2.5 py-1 rounded-full capitalize font-medium',
                        getPlanBadgeClass(clinic.subscription_plan)
                      )}
                    >
                      {clinic.subscription_plan}
                    </span>
                  ) : (
                    <p className='text-sm font-medium text-clinic-navy dark:text-white'>
                      —
                    </p>
                  )}
                </div>

                <div>
                  <p className='text-sm text-clinic-text/60 dark:text-white/60 mb-1'>
                    Payment Status
                  </p>
                  {clinic.payment_status ? (
                    <span
                      className={cn(
                        'text-xs px-2.5 py-1 rounded-full capitalize font-medium',
                        getPaymentStatusClass(clinic.payment_status)
                      )}
                    >
                      {clinic.payment_status.replace('_', ' ')}
                    </span>
                  ) : (
                    <p className='text-sm font-medium text-clinic-navy dark:text-white'>
                      —
                    </p>
                  )}
                </div>

                <div>
                  <p className='text-sm text-clinic-text/60 dark:text-white/60 mb-1'>
                    Trial Start
                  </p>
                  <p className='text-sm font-medium text-clinic-navy dark:text-white'>
                    {clinic.trial_start_date
                      ? new Date(clinic.trial_start_date).toLocaleDateString()
                      : '—'}
                  </p>
                </div>

                <div>
                  <p className='text-sm text-clinic-text/60 dark:text-white/60 mb-1'>
                    Trial End
                  </p>
                  <p className='text-sm font-medium text-clinic-navy dark:text-white'>
                    {clinic.trial_end_date
                      ? new Date(clinic.trial_end_date).toLocaleDateString()
                      : '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment history */}
            <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6'>
              <h2 className='font-display text-lg font-semibold text-clinic-navy dark:text-white mb-5'>
                Payment History
              </h2>

              {paymentsLoading ? (
                <div className='flex items-center justify-center py-12'>
                  <Loader2 className='w-6 h-6 animate-spin text-clinic-teal' />
                </div>
              ) : payments.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-12 text-center'>
                  <p className='text-sm text-clinic-text/60 dark:text-white/60'>
                    No payment history found.
                  </p>
                </div>
              ) : (
                <div className='overflow-x-auto'>
                  <table className='w-full text-sm'>
                    <thead>
                      <tr className='border-b border-clinic-navy/5 dark:border-white/5'>
                        <th className='text-left py-2 pr-4 text-clinic-text/60 dark:text-white/60 font-medium'>
                          Date
                        </th>
                        <th className='text-left py-2 pr-4 text-clinic-text/60 dark:text-white/60 font-medium'>
                          Amount
                        </th>
                        <th className='text-left py-2 text-clinic-text/60 dark:text-white/60 font-medium'>
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr
                          key={payment.id}
                          className='border-b border-clinic-navy/5 dark:border-white/5 last:border-0'
                        >
                          <td className='py-3 pr-4 text-clinic-navy dark:text-white'>
                            {new Date(payment.created_at).toLocaleDateString()}
                          </td>
                          <td className='py-3 pr-4 text-clinic-navy dark:text-white'>
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: payment.currency ?? 'USD',
                            }).format(payment.amount / 100)}
                          </td>
                          <td className='py-3'>
                            <span
                              className={cn(
                                'text-xs px-2 py-0.5 rounded-full capitalize font-medium',
                                payment.status === 'succeeded' ||
                                  payment.status === 'paid'
                                  ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                  : payment.status === 'pending'
                                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                    : 'bg-red-500/10 text-red-500 dark:text-red-400'
                              )}
                            >
                              {payment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          DIALOGS
          ═══════════════════════════════════════════════════════════════════════ */}

      {/* ── Edit Clinic Dialog ── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className='sm:max-w-lg max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='font-display text-lg font-bold text-clinic-navy dark:text-white'>
              Edit Clinic
            </DialogTitle>
            <DialogDescription className='text-clinic-text/60 dark:text-white/60'>
              Update the clinic&apos;s information.
            </DialogDescription>
          </DialogHeader>

          {clinicMutationError && (
            <div className='flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm'>
              <AlertCircle className='w-4 h-4 shrink-0' />
              {clinicMutationError}
            </div>
          )}

          <div className='space-y-4 py-2'>
            <div className='space-y-2'>
              <Label className='text-sm font-medium text-clinic-navy dark:text-white'>
                Clinic Name *
              </Label>
              <Input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, name: e.target.value }))
                }
                className='border-clinic-navy/10 dark:border-white/10'
              />
            </div>

            <div className='space-y-2'>
              <Label className='text-sm font-medium text-clinic-navy dark:text-white'>
                Email *
              </Label>
              <Input
                type='email'
                value={editForm.email}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, email: e.target.value }))
                }
                className='border-clinic-navy/10 dark:border-white/10'
              />
            </div>

            <div className='space-y-2'>
              <Label className='text-sm font-medium text-clinic-navy dark:text-white'>
                Phone
              </Label>
              <Input
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, phone: e.target.value }))
                }
                className='border-clinic-navy/10 dark:border-white/10'
              />
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-2'>
                <Label className='text-sm font-medium text-clinic-navy dark:text-white'>
                  Address
                </Label>
                <Input
                  value={editForm.address}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, address: e.target.value }))
                  }
                  className='border-clinic-navy/10 dark:border-white/10'
                />
              </div>
              <div className='space-y-2'>
                <Label className='text-sm font-medium text-clinic-navy dark:text-white'>
                  City
                </Label>
                <Input
                  value={editForm.city}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, city: e.target.value }))
                  }
                  className='border-clinic-navy/10 dark:border-white/10'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label className='text-sm font-medium text-clinic-navy dark:text-white'>
                Description
              </Label>
              <Textarea
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, description: e.target.value }))
                }
                className='border-clinic-navy/10 dark:border-white/10 resize-none'
                rows={3}
              />
            </div>

            <div className='space-y-2'>
              <Label className='text-sm font-medium text-clinic-navy dark:text-white'>
                Slug
              </Label>
              <Input
                value={editForm.slug}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, slug: e.target.value }))
                }
                className='border-clinic-navy/10 dark:border-white/10 font-mono text-sm'
                placeholder='auto-generated-slug'
              />
            </div>

            <div className='space-y-2'>
              <Label className='text-sm font-medium text-clinic-navy dark:text-white'>
                Subscription Plan
              </Label>
              <Select
                value={editForm.subscription_plan}
                onValueChange={(val) =>
                  setEditForm((f) => ({ ...f, subscription_plan: val }))
                }
              >
                <SelectTrigger className='border-clinic-navy/10 dark:border-white/10'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='starter'>Starter</SelectItem>
                  <SelectItem value='professional'>Professional</SelectItem>
                  <SelectItem value='enterprise'>Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className='gap-2 sm:gap-0'>
            <Button
              variant='outline'
              onClick={() => setEditDialogOpen(false)}
              disabled={clinicMutating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateClinic}
              disabled={
                clinicMutating ||
                !editForm.name.trim() ||
                !editForm.email.trim()
              }
              className='bg-clinic-teal hover:bg-clinic-teal/90 text-white gap-2'
            >
              {clinicMutating && <Loader2 className='w-4 h-4 animate-spin' />}
              {clinicMutating ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Clinic Dialog ── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className='font-display text-clinic-navy dark:text-white'>
              Delete Clinic
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <strong className='text-clinic-navy dark:text-white'>
                {clinic.name}
              </strong>
              ? This will deactivate the clinic. All data will be preserved but
              the clinic will no longer be accessible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={clinicMutating}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteClinic}
              disabled={clinicMutating}
              className='bg-red-500 hover:bg-red-600 text-white gap-2'
            >
              {clinicMutating && <Loader2 className='w-4 h-4 animate-spin' />}
              {clinicMutating ? 'Deleting…' : 'Delete Clinic'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Add / Edit Service Dialog ── */}
      <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='font-display text-lg font-bold text-clinic-navy dark:text-white'>
              {serviceDialogMode === 'add' ? 'Add Service' : 'Edit Service'}
            </DialogTitle>
            <DialogDescription className='text-clinic-text/60 dark:text-white/60'>
              {serviceDialogMode === 'add'
                ? 'Add a new service to this clinic.'
                : 'Update the service details.'}
            </DialogDescription>
          </DialogHeader>

          {serviceSuccessMessage && (
            <div className='flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm'>
              <CheckCircle2 className='w-4 h-4 shrink-0' />
              {serviceSuccessMessage}
            </div>
          )}

          {serviceMutationError && (
            <div className='flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm'>
              <AlertCircle className='w-4 h-4 shrink-0' />
              {serviceMutationError}
            </div>
          )}

          <div className='space-y-4 py-2'>
            <div className='space-y-2'>
              <Label className='text-sm font-medium text-clinic-navy dark:text-white'>
                Service Name *
              </Label>
              <Input
                placeholder='e.g. General Consultation'
                value={serviceForm.name}
                onChange={(e) => updateServiceField('name', e.target.value)}
                className='border-clinic-navy/10 dark:border-white/10'
              />
            </div>

            <div className='space-y-2'>
              <Label className='text-sm font-medium text-clinic-navy dark:text-white'>
                Description
              </Label>
              <Textarea
                placeholder='Brief description of the service…'
                value={serviceForm.description}
                onChange={(e) =>
                  updateServiceField('description', e.target.value)
                }
                className='border-clinic-navy/10 dark:border-white/10 resize-none'
                rows={2}
              />
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-2'>
                <Label className='text-sm font-medium text-clinic-navy dark:text-white'>
                  Duration (minutes) *
                </Label>
                <Input
                  type='number'
                  min={1}
                  value={serviceForm.duration_minutes}
                  onChange={(e) =>
                    updateServiceField(
                      'duration_minutes',
                      parseInt(e.target.value) || 0
                    )
                  }
                  className='border-clinic-navy/10 dark:border-white/10'
                />
              </div>
              <div className='space-y-2'>
                <Label className='text-sm font-medium text-clinic-navy dark:text-white'>
                  Price *
                </Label>
                <Input
                  type='number'
                  min={0}
                  step='0.01'
                  value={serviceForm.price}
                  onChange={(e) =>
                    updateServiceField(
                      'price',
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className='border-clinic-navy/10 dark:border-white/10'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label className='text-sm font-medium text-clinic-navy dark:text-white'>
                Currency
              </Label>
              <Select
                value={serviceForm.currency}
                onValueChange={(val) => updateServiceField('currency', val)}
              >
                <SelectTrigger className='border-clinic-navy/10 dark:border-white/10'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='PHP'>PHP (₱)</SelectItem>
                  <SelectItem value='USD'>USD ($)</SelectItem>
                  <SelectItem value='EUR'>EUR (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className='gap-2 sm:gap-0'>
            <Button
              variant='outline'
              onClick={() => setServiceDialogOpen(false)}
              disabled={serviceMutating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveService}
              disabled={serviceMutating || !serviceForm.name.trim()}
              className='bg-clinic-teal hover:bg-clinic-teal/90 text-white gap-2'
            >
              {serviceMutating && (
                <Loader2 className='w-4 h-4 animate-spin' />
              )}
              {serviceMutating
                ? 'Saving…'
                : serviceDialogMode === 'add'
                  ? 'Add Service'
                  : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Service Dialog ── */}
      <AlertDialog
        open={deleteServiceDialogOpen}
        onOpenChange={setDeleteServiceDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className='font-display text-clinic-navy dark:text-white'>
              Delete Service
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this service? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={serviceMutating}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteService}
              disabled={serviceMutating}
              className='bg-red-500 hover:bg-red-600 text-white gap-2'
            >
              {serviceMutating && (
                <Loader2 className='w-4 h-4 animate-spin' />
              )}
              {serviceMutating ? 'Deleting…' : 'Delete Service'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
