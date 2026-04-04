'use client';

import { createContext, useContext } from 'react';

export interface SuperAdmin {
  id: string;
  email: string;
  name: string;
  status: string;
  auth_user_id: string;
}

export interface SuperAdminContextType {
  admin: SuperAdmin | null;
}

export const SuperAdminContext = createContext<SuperAdminContextType>({
  admin: null,
});

export const useSuperAdminContext = () => useContext(SuperAdminContext);
