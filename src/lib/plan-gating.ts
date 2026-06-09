import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export type PlanTier = 'starter' | 'professional' | 'enterprise';

const PLAN_HIERARCHY: PlanTier[] = ['starter', 'professional', 'enterprise'];

export function clinicHasPlan(clinicPlan: string | null, requiredPlan: PlanTier): boolean {
  const clinicIdx = PLAN_HIERARCHY.indexOf(clinicPlan as PlanTier);
  const requiredIdx = PLAN_HIERARCHY.indexOf(requiredPlan);
  if (clinicIdx === -1) return false;
  return clinicIdx >= requiredIdx;
}

export async function requirePlan(
  clinicId: string,
  requiredPlan: PlanTier,
): Promise<true | NextResponse> {
  const { data: clinic, error } = await supabaseAdmin
    .from('clinics')
    .select('subscription_plan, is_subscription_active, payment_status')
    .eq('id', clinicId)
    .single();

  if (error || !clinic) {
    return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
  }

  if (!clinicHasPlan(clinic.subscription_plan, requiredPlan)) {
    return NextResponse.json(
      {
        error: `Upgrade to ${requiredPlan} to access this feature`,
        requiredPlan,
        currentPlan: clinic.subscription_plan,
      },
      { status: 403 },
    );
  }

  return true;
}
