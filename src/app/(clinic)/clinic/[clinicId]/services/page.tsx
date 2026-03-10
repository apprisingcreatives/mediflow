'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FileText,
  Plus,
  Search,
  Clock,
  DollarSign,
  Edit,
  Trash2,
  Loader2,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
} from 'lucide-react';
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
import { useClinicContext } from '../layout';
import useGetServices, { ClinicService } from '@/hooks/useGetServices';
import useServiceMutations from '@/hooks/useServiceMutations';
import { ServiceFormModal, ServiceFormData } from '@/components/clinic/services';

export default function ServicesPage() {
  const params = useParams();
  const clinicId = params.clinicId as string;
  const { isTrialExpired } = useClinicContext();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ClinicService | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<ClinicService | null>(null);

  // Hooks
  const { services, loading: servicesLoading, error: servicesError, fetchServices } = useGetServices();
  const {
    loading: mutationLoading,
    error: mutationError,
    createService,
    updateService,
    deleteService,
    toggleServiceStatus,
    clearError,
  } = useServiceMutations();

  // Fetch services on mount
  useEffect(() => {
    if (clinicId) {
      fetchServices({ clinicId, activeOnly: false });
    }
  }, [clinicId, fetchServices]);

  // Filter services based on search
  const filteredServices = services.filter(
    (service) =>
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handlers
  const handleOpenCreateModal = () => {
    setSelectedService(null);
    clearError();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (service: ClinicService) => {
    setSelectedService(service);
    clearError();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedService(null);
  };

  const handleSubmit = async (data: ServiceFormData) => {
    let success = false;

    if (selectedService) {
      // Update existing service
      const result = await updateService(selectedService.id, {
        name: data.name,
        description: data.description || null,
        duration_minutes: data.duration_minutes,
        price: data.price,
        is_active: data.is_active,
      });
      success = !!result;
    } else {
      // Create new service
      const result = await createService({
        clinic_id: clinicId,
        name: data.name,
        description: data.description || null,
        duration_minutes: data.duration_minutes,
        price: data.price,
        is_active: data.is_active,
      });
      success = !!result;
    }

    if (success) {
      handleCloseModal();
      // Refresh services list
      await fetchServices({ clinicId, activeOnly: false });
    }
  };

  const handleToggleStatus = async (service: ClinicService) => {
    const success = await toggleServiceStatus(service.id, !service.is_active);
    if (success) {
      await fetchServices({ clinicId, activeOnly: false });
    }
  };

  const handleDeleteClick = (service: ClinicService) => {
    setServiceToDelete(service);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!serviceToDelete) return;

    const success = await deleteService(serviceToDelete.id);
    if (success) {
      await fetchServices({ clinicId, activeOnly: false });
    }
    setDeleteDialogOpen(false);
    setServiceToDelete(null);
  };

  if (isTrialExpired) {
    return (
      <div className="text-center py-12">
        <p className="text-clinic-text/60">
          This feature is locked. Please upgrade your plan.
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
            Services
          </h2>
          <p className="text-clinic-text/60 dark:text-white/60">
            Manage your clinic services and pricing
          </p>
        </div>
        <Button
          onClick={handleOpenCreateModal}
          className="bg-clinic-teal hover:bg-clinic-teal/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Service
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-clinic-text/40" />
        <Input
          placeholder="Search services..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 border-clinic-navy/10"
        />
      </div>

      {/* Error State */}
      {servicesError && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-600 dark:text-red-400">{servicesError}</p>
        </div>
      )}

      {/* Loading State */}
      {servicesLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-clinic-teal" />
        </div>
      )}

      {/* Empty State */}
      {!servicesLoading && !servicesError && filteredServices.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl shadow-glass">
          <FileText className="w-12 h-12 text-clinic-navy/20 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-clinic-navy dark:text-white mb-2">
            {searchQuery ? 'No services found' : 'No services yet'}
          </h3>
          <p className="text-clinic-text/60 dark:text-white/60 mb-4">
            {searchQuery
              ? 'Try adjusting your search terms'
              : 'Add your first service to get started'}
          </p>
          {!searchQuery && (
            <Button
              onClick={handleOpenCreateModal}
              className="bg-clinic-teal hover:bg-clinic-teal/90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </Button>
          )}
        </div>
      )}

      {/* Services List */}
      {!servicesLoading && filteredServices.length > 0 && (
        <div className="space-y-4">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className={`bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6 transition-opacity ${
                !service.is_active ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-clinic-ai/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-clinic-ai" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-clinic-navy dark:text-white">
                        {service.name}
                      </h3>
                      {!service.is_active && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          Inactive
                        </span>
                      )}
                    </div>
                    {service.description && (
                      <p className="text-sm text-clinic-text/60 dark:text-white/60 mt-1">
                        {service.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1 text-sm text-clinic-text/70 dark:text-white/70">
                        <Clock className="w-4 h-4" />
                        {service.duration_minutes} min
                      </div>
                      <div className="flex items-center gap-1 text-sm font-medium text-clinic-teal">
                        <DollarSign className="w-4 h-4" />₱
                        {service.price.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleStatus(service)}
                    title={service.is_active ? 'Deactivate' : 'Activate'}
                    disabled={mutationLoading}
                  >
                    {service.is_active ? (
                      <ToggleRight className="w-5 h-5 text-clinic-teal" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-gray-400" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenEditModal(service)}
                    disabled={mutationLoading}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => handleDeleteClick(service)}
                    disabled={mutationLoading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Service Form Modal */}
      <ServiceFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        service={selectedService}
        isLoading={mutationLoading}
        error={mutationError}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{serviceToDelete?.name}"? This action
              cannot be undone. Existing appointments with this service will not be
              affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutationLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={mutationLoading}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {mutationLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
