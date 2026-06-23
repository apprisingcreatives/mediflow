'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  BarChart3,
  TrendingUp,
  Users,
  Lock,
  Loader2,
  DollarSign,
  GitBranch,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useClinicContext } from '../clinic-context';
import { useAdvancedAnalytics } from '@/hooks';
import useBranchComparison from '@/hooks/useBranchComparison';
import { DemographicsCharts } from '@/components/clinic/analytics/DemographicsCharts';
import { ServiceTrendsChart } from '@/components/clinic/analytics/ServiceTrendsChart';
import { RevenueForecastChart } from '@/components/clinic/analytics/RevenueForecastChart';
import { BranchComparisonChart } from '@/components/clinic/analytics/BranchComparisonChart';
import { cn } from '@/lib/utils';

type Tab = 'demographics' | 'service-trends' | 'revenue-forecast' | 'branch-comparison';

interface TabConfig {
  id: Tab;
  label: string;
  icon: React.ElementType;
  requiresPlan: 'professional' | 'enterprise';
}

const TABS: TabConfig[] = [
  {
    id: 'demographics',
    label: 'Demographics',
    icon: Users,
    requiresPlan: 'professional',
  },
  {
    id: 'service-trends',
    label: 'Service Trends',
    icon: BarChart3,
    requiresPlan: 'professional',
  },
  {
    id: 'revenue-forecast',
    label: 'Revenue Forecast',
    icon: DollarSign,
    requiresPlan: 'enterprise',
  },
  {
    id: 'branch-comparison',
    label: 'Branch Comparison',
    icon: GitBranch,
    requiresPlan: 'enterprise',
  },
];

interface UpgradePromptProps {
  planName: string;
  featureName: string;
  clinicId: string;
}

function UpgradePrompt({ planName, featureName, clinicId }: UpgradePromptProps) {
  return (
    <div className="text-center py-16">
      <Lock className="w-12 h-12 text-clinic-text/30 dark:text-white/20 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-clinic-navy dark:text-white mb-2">
        {planName} Plan Required
      </h3>
      <p className="text-clinic-text/60 dark:text-white/60 mb-6 max-w-md mx-auto">
        Upgrade to unlock {featureName}
      </p>
      <Link href={`/clinic/${clinicId}/billing`}>
        <Button className="bg-clinic-teal hover:bg-clinic-teal/90 text-white">
          Upgrade Plan
        </Button>
      </Link>
    </div>
  );
}

interface LoadingStateProps {
  message?: string;
}

function LoadingState({ message = 'Loading analytics...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Loader2 className="w-8 h-8 text-clinic-teal animate-spin" />
      <p className="text-sm text-clinic-text/60 dark:text-white/60">{message}</p>
    </div>
  );
}

interface ErrorStateProps {
  message: string;
}

function ErrorState({ message }: ErrorStateProps) {
  return (
    <div className="text-center py-12">
      <p className="text-sm text-red-500">{message}</p>
    </div>
  );
}

export default function AdvancedAnalyticsPage() {
  const params = useParams();
  const clinicId = params.clinicId as string;
  const { clinic, activeBranchId } = useClinicContext();

  const plan = clinic?.subscription_plan ?? 'starter';
  const isProfessional = plan === 'professional' || plan === 'enterprise';
  const isEnterprise = plan === 'enterprise';

  const [activeTab, setActiveTab] = useState<Tab>('demographics');

  const {
    demographics,
    serviceTrends,
    revenueForecast,
    hasEnoughData,
    loading,
    error,
    fetchDemographics,
    fetchServiceTrends,
    fetchRevenueForecast,
  } = useAdvancedAnalytics(clinicId, activeBranchId);

  const {
    data: branchComparisonData,
    loading: branchComparisonLoading,
    error: branchComparisonError,
    fetchComparison,
  } = useBranchComparison(clinicId);

  // Fetch data when tab changes, only when the plan allows it
  useEffect(() => {
    if (activeTab === 'demographics' && isProfessional && !demographics) {
      fetchDemographics();
    }
  }, [activeTab, isProfessional, demographics, fetchDemographics]);

  useEffect(() => {
    if (activeTab === 'service-trends' && isProfessional && serviceTrends.length === 0) {
      fetchServiceTrends();
    }
  }, [activeTab, isProfessional, serviceTrends.length, fetchServiceTrends]);

  useEffect(() => {
    if (activeTab === 'revenue-forecast' && isEnterprise && revenueForecast.length === 0) {
      fetchRevenueForecast(3);
    }
  }, [activeTab, isEnterprise, revenueForecast.length, fetchRevenueForecast]);

  useEffect(() => {
    if (activeTab === 'branch-comparison' && isEnterprise && branchComparisonData.length === 0) {
      const now = new Date();
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      fetchComparison(
        threeMonthsAgo.toISOString().split('T')[0],
        now.toISOString().split('T')[0],
      );
    }
  }, [activeTab, isEnterprise, branchComparisonData.length, fetchComparison]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'demographics': {
        if (!isProfessional) {
          return (
            <UpgradePrompt
              planName="Professional"
              featureName="patient demographics insights"
              clinicId={clinicId}
            />
          );
        }
        if (loading.demographics) return <LoadingState message="Loading demographics..." />;
        if (error.demographics) return <ErrorState message={error.demographics} />;
        if (!demographics) return <LoadingState message="Loading demographics..." />;
        return <DemographicsCharts demographics={demographics} />;
      }

      case 'service-trends': {
        if (!isProfessional) {
          return (
            <UpgradePrompt
              planName="Professional"
              featureName="service trend analytics"
              clinicId={clinicId}
            />
          );
        }
        if (loading.services) return <LoadingState message="Loading service trends..." />;
        if (error.services) return <ErrorState message={error.services} />;
        return <ServiceTrendsChart serviceTrends={serviceTrends} />;
      }

      case 'revenue-forecast': {
        if (!isEnterprise) {
          return (
            <UpgradePrompt
              planName="Enterprise"
              featureName="revenue forecasting"
              clinicId={clinicId}
            />
          );
        }
        if (loading.forecast) return <LoadingState message="Loading revenue forecast..." />;
        if (error.forecast) return <ErrorState message={error.forecast} />;
        return (
          <RevenueForecastChart
            revenueForecast={revenueForecast}
            hasEnoughData={hasEnoughData}
          />
        );
      }

      case 'branch-comparison': {
        if (!isEnterprise) {
          return (
            <UpgradePrompt
              planName="Enterprise"
              featureName="branch comparison analytics"
              clinicId={clinicId}
            />
          );
        }
        if (branchComparisonLoading) return <LoadingState message="Loading branch comparison..." />;
        if (branchComparisonError) return <ErrorState message={branchComparisonError} />;
        return <BranchComparisonChart data={branchComparisonData} />;
      }

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-display font-bold text-clinic-navy dark:text-white">
          Advanced Analytics
        </h2>
        <p className="text-clinic-text/60 dark:text-white/60">
          Deep insights into patient demographics, service performance, and revenue trends
        </p>
      </div>

      {/* Plan Badge */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'px-3 py-1 rounded-full text-xs font-semibold capitalize',
            plan === 'enterprise'
              ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
              : plan === 'professional'
              ? 'bg-clinic-teal/10 text-clinic-teal'
              : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/60',
          )}
        >
          {plan} plan
        </span>
        {!isProfessional && (
          <span className="text-xs text-clinic-text/50 dark:text-white/40">
            Upgrade to Professional or Enterprise to unlock analytics
          </span>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm w-fit">
        {TABS.map((tab) => {
          const isLocked =
            tab.requiresPlan === 'enterprise' ? !isEnterprise : !isProfessional;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'bg-clinic-teal text-white shadow-sm'
                  : 'text-clinic-text/60 dark:text-white/60 hover:text-clinic-navy dark:hover:text-white',
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {isLocked && (
                <Lock className="w-3 h-3 opacity-60" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-64">
        {renderTabContent()}
      </div>
    </div>
  );
}
