import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export type PlanTier = 'starter' | 'professional' | 'enterprise';

const PLAN_HIERARCHY: PlanTier[] = ['starter', 'professional', 'enterprise'];

const NEXT_PLAN: Record<string, string> = {
  starter: 'professional',
  professional: 'enterprise',
};

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

export async function checkResourceLimit(
  clinicId: string,
  resource: 'practitioners' | 'branches',
  branchId?: string,
): Promise<true | NextResponse> {
  const { data: clinic } = await supabaseAdmin
    .from('clinics')
    .select('subscription_plan')
    .eq('id', clinicId)
    .single();

  if (!clinic) {
    return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
  }

  const planSlug = clinic.subscription_plan?.replace(/-yearly$/, '') || 'starter';

  const { data: plan } = await supabaseAdmin
    .from('subscription_plans')
    .select('max_practitioners, max_branches')
    .eq('slug', planSlug)
    .single();

  if (!plan) {
    return true;
  }

  if (resource === 'practitioners') {
    const max = plan.max_practitioners;
    if (max === null) return true;

    if (!branchId) {
      return NextResponse.json({ error: 'Branch ID required for practitioner limit check' }, { status: 400 });
    }

    const { count } = await supabaseAdmin
      .from('practitioner_branches')
      .select('id, practitioners!inner(is_active)', { count: 'exact', head: true })
      .eq('branch_id', branchId)
      .eq('practitioners.is_active', true);

    const current = count ?? 0;

    if (current >= max) {
      const upgradeTo = NEXT_PLAN[planSlug];
      return NextResponse.json(
        {
          error: 'limit_exceeded',
          message: `Your ${planSlug} plan allows up to ${max} practitioners per branch.${upgradeTo ? ` Upgrade to ${upgradeTo} for more.` : ''}`,
          resource: 'practitioners',
          current,
          max,
          plan: planSlug,
          ...(upgradeTo && { upgradeTo }),
        },
        { status: 403 },
      );
    }

    return true;
  }

  if (resource === 'branches') {
    const max = plan.max_branches;
    if (max === null) return true;

    const { count } = await supabaseAdmin
      .from('branches')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .eq('is_active', true);

    const current = count ?? 0;

    if (current >= max) {
      const upgradeTo = NEXT_PLAN[planSlug];
      return NextResponse.json(
        {
          error: 'limit_exceeded',
          message: `Your ${planSlug} plan allows up to ${max} branch${max === 1 ? '' : 'es'}.${upgradeTo ? ` Upgrade to ${upgradeTo} for more.` : ''}`,
          resource: 'branches',
          current,
          max,
          plan: planSlug,
          ...(upgradeTo && { upgradeTo }),
        },
        { status: 403 },
      );
    }

    return true;
  }

  return true;
}
