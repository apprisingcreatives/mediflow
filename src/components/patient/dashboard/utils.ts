import { HealthMetric, PatientInfo } from './types';

/**
 * Format time string (HH:MM:SS or HH:MM) to 12-hour format
 */
export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

/**
 * Get status badge color based on appointment status
 */
export const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
    confirmed: 'bg-green-100 text-green-700 border-green-200',
    'in-progress': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    completed: 'bg-gray-100 text-gray-600 border-gray-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
    'no-show': 'bg-orange-100 text-orange-700 border-orange-200',
  };
  return statusColors[status] || 'bg-gray-100 text-gray-600 border-gray-200';
};

/**
 * Generate health summary metrics from patient data
 */
export const getHealthSummary = (patient: PatientInfo | null): HealthMetric[] => [
  {
    label: 'Blood Type',
    value: patient?.blood_type || 'Not Set',
    status: patient?.blood_type ? 'normal' : 'pending',
    date: 'Profile',
  },
  {
    label: 'Allergies',
    value:
      (patient?.allergies?.length || 0) > 0
        ? `${patient?.allergies?.length} recorded`
        : 'None',
    status: 'normal',
    date: 'Profile',
  },
  {
    label: 'Conditions',
    value:
      (patient?.chronic_conditions?.length || 0) > 0
        ? `${patient?.chronic_conditions?.length} active`
        : 'None',
    status: (patient?.chronic_conditions?.length || 0) > 0 ? 'attention' : 'normal',
    date: 'Profile',
  },
  {
    label: 'Profile',
    value: patient?.onboarding_completed ? 'Complete' : 'Incomplete',
    status: patient?.onboarding_completed ? 'normal' : 'attention',
    date: '',
  },
];

/**
 * Mock messages data - replace with real data when messaging is implemented
 */
export const MOCK_MESSAGES = [
  {
    id: 1,
    from: 'Dr. Sarah Chen',
    preview: 'Your lab results are in. Everything looks good...',
    time: '2 hours ago',
    unread: true,
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&q=80',
  },
  {
    id: 2,
    from: 'Reception',
    preview: 'Reminder: Please bring your insurance card to your...',
    time: 'Yesterday',
    unread: false,
    avatar: null,
  },
];
