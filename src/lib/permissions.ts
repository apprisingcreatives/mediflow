export const isSuperAdmin = (role: string) => {
  return role === 'super_admin';
};

export const isClinicAdmin = ({
  role,
  clinicId,
  userClinicId,
}: {
  role: string;
  clinicId: string;
  userClinicId: string;
}) => {
  if (clinicId !== userClinicId) {
    return false;
  }
  return role === 'clinic_admin';
};

export const isPatient = (role: string) => {
  return role === 'patient';
};
