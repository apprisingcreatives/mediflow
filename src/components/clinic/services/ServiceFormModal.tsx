'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ClinicService } from '@/hooks/useGetServices';

// Common service duration options
const DURATION_OPTIONS = [
  { value: 15, label: '15 minutes' },
  { value: 20, label: '20 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
];

export interface ServiceFormData {
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
}

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ServiceFormData) => Promise<void>;
  service?: ClinicService | null; // For editing
  isLoading?: boolean;
  error?: string | null;
}

export function ServiceFormModal({
  isOpen,
  onClose,
  onSubmit,
  service,
  isLoading = false,
  error,
}: ServiceFormModalProps) {
  const isEditMode = !!service;

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [price, setPrice] = useState<string>('');
  const [isActive, setIsActive] = useState(true);

  // Validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes or service changes
  useEffect(() => {
    if (isOpen) {
      if (service) {
        // Edit mode - populate with service data
        setName(service.name);
        setDescription(service.description || '');
        setDurationMinutes(service.duration_minutes);
        setPrice(service.price.toString());
        setIsActive(service.is_active);
      } else {
        // Create mode - reset to defaults
        setName('');
        setDescription('');
        setDurationMinutes(30);
        setPrice('');
        setIsActive(true);
      }
      setValidationErrors({});
    }
  }, [isOpen, service]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = 'Service name is required';
    } else if (name.trim().length < 2) {
      errors.name = 'Service name must be at least 2 characters';
    }

    if (!price || parseFloat(price) < 0) {
      errors.price = 'Price must be a positive number';
    }

    if (!durationMinutes || durationMinutes < 5) {
      errors.duration = 'Duration must be at least 5 minutes';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    await onSubmit({
      name: name.trim(),
      description: description.trim(),
      duration_minutes: durationMinutes,
      price: parseFloat(price),
      is_active: isActive,
    });
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] bg-white dark:bg-slate-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-display font-bold text-clinic-navy dark:text-white">
            {isEditMode ? 'Edit Service' : 'Add New Service'}
          </DialogTitle>
          <DialogDescription className="text-clinic-text/60 dark:text-white/60">
            {isEditMode
              ? 'Update the service details below.'
              : 'Fill in the details to create a new service for your clinic.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          {/* Error display */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Service Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Service Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., General Consultation"
              className={validationErrors.name ? 'border-red-500' : ''}
              disabled={isLoading}
            />
            {validationErrors.name && (
              <p className="text-xs text-red-500">{validationErrors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the service..."
              rows={3}
              disabled={isLoading}
            />
          </div>

          {/* Duration and Price Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-sm font-medium">
                Duration <span className="text-red-500">*</span>
              </Label>
              <Select
                value={durationMinutes.toString()}
                onValueChange={(value) => setDurationMinutes(parseInt(value))}
                disabled={isLoading}
              >
                <SelectTrigger
                  className={validationErrors.duration ? 'border-red-500' : ''}
                >
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.duration && (
                <p className="text-xs text-red-500">{validationErrors.duration}</p>
              )}
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price" className="text-sm font-medium">
                Price (₱) <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-clinic-text/50">
                  ₱
                </span>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className={`pl-8 ${validationErrors.price ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                />
              </div>
              {validationErrors.price && (
                <p className="text-xs text-red-500">{validationErrors.price}</p>
              )}
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between p-4 bg-clinic-bg/50 dark:bg-slate-700/50 rounded-lg">
            <div>
              <Label htmlFor="is-active" className="text-sm font-medium">
                Active Status
              </Label>
              <p className="text-xs text-clinic-text/60 dark:text-white/60 mt-0.5">
                Inactive services won't appear in booking options
              </p>
            </div>
            <Switch
              id="is-active"
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={isLoading}
            />
          </div>
        </form>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-clinic-teal hover:bg-clinic-teal/90 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isEditMode ? 'Updating...' : 'Creating...'}
              </>
            ) : isEditMode ? (
              'Update Service'
            ) : (
              'Create Service'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ServiceFormModal;
