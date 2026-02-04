export const isSuperAdmin = (role: string) => {
  return role === 'super_admin';
};

export const isClinicAdmin = (role: string) => {
  return role === 'clinic_admin';
};

export const isPatient = (role: string) => {
  return role === 'patient';
};



 