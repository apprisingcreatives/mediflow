'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Check, Shield, Loader2, CheckCircle, XCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClinicContext } from '../clinic-context';
import { useAuth } from '@/hooks/use-auth';
import axios from 'axios';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 5000,
    yearlyPrice: 50000,
    features: [
      'Up to 500 patients',
      'AI-powered intake forms',
      'Basic appointment scheduling',
      'Email support',
      '1 practitioner',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    monthlyPrice: 10000,
    yearlyPrice: 100000,
    popular: true,
    features: [
      'Up to 2,000 patients',
      'Advanced AI features',
      'Smart scheduling & reminders',
      'Priority support',
      'Analytics dashboard',
      'Up to 5 practitioners',
      'Secure messaging',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 25000,
    yearlyPrice: 250000,
    features: [
      'Unlimited patients',
      'Full AI suite',
      'Custom integrations',
      'Dedicated support',
      'Advanced analytics',
      'Unlimited practitioners',
      'Multi-location support',
      'API access',
    ],
  },
];

export default function BillingPage() {
  const { clinic } = useClinicContext();
  const { session } = useAuth();
  const searchParams = useSearchParams();
  const params = useParams();
  const clinicId = params.clinicId as string;

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(
    'monthly',
  );
  const [subscribingPlan, setSubscribingPlan] = useState<string | null>(null);
  const [merchantId, setMerchantId] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showPaymongoGuide, setShowPaymongoGuide] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<string | null>(null);

  const paymentStatus = searchParams.get('payment');

  useEffect(() => {
    if (paymentStatus !== 'success' || !session?.access_token || !clinicId) return;

    setVerifying(true);
    axios
      .post(
        `/api/clinic/${clinicId}/verify-payment`,
        {},
        { headers: { Authorization: `Bearer ${session.access_token}` } },
      )
      .then((res) => {
        setVerifyResult(res.data.status);
        if (res.data.status === 'activated' || res.data.status === 'already_active') {
          setTimeout(() => window.location.reload(), 1500);
        }
      })
      .catch(() => {
        setVerifyResult('error');
      })
      .finally(() => setVerifying(false));
  }, [paymentStatus, session?.access_token, clinicId]);

  const currentPlan =
    plans.find((p) => p.id === clinic?.subscription_plan) || plans[0];

  const handleSubscribe = async (planId: string) => {
    if (!session?.access_token || !clinicId) return;
    setSubscribingPlan(planId);

    try {
      const res = await axios.post(
        `/api/clinic/${clinicId}/subscribe`,
        { plan: planId, billing_cycle: billingCycle },
        { headers: { Authorization: `Bearer ${session.access_token}` } },
      );

      if (res.data.checkout_url) {
        window.location.href = res.data.checkout_url;
      }
    } catch (err: any) {
      console.error('Subscribe error:', err);
      alert(err?.response?.data?.error || 'Failed to start checkout');
      setSubscribingPlan(null);
    }
  };

  const handleConnectPaymongo = async () => {
    if (!session?.access_token || !clinicId || !merchantId.trim()) return;
    setConnecting(true);
    try {
      await axios.patch(
        `/api/clinic/${clinicId}/paymongo`,
        { paymongo_merchant_id: merchantId.trim() },
        { headers: { Authorization: `Bearer ${session.access_token}` } },
      );
      window.location.reload();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to connect PayMongo account');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectPaymongo = async () => {
    if (!session?.access_token || !clinicId) return;
    setDisconnecting(true);
    try {
      await axios.patch(
        `/api/clinic/${clinicId}/paymongo`,
        { paymongo_merchant_id: null },
        { headers: { Authorization: `Bearer ${session.access_token}` } },
      );
      window.location.reload();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to disconnect PayMongo account');
    } finally {
      setDisconnecting(false);
    }
  };

  const maskedMerchantId = clinic?.paymongo_merchant_id
    ? `org_***${clinic.paymongo_merchant_id.slice(-4)}`
    : null;
  const isPaymongoConnected =
    clinic?.paymongo_merchant_id && clinic?.paymongo_merchant_status === 'activated';

  return (
    <div className="space-y-6">
      {/* Payment status banner */}
      {paymentStatus === 'success' && (
        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
          {verifying ? (
            <>
              <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
              <p className="text-green-800 dark:text-green-300 font-medium">
                Verifying payment and activating your subscription...
              </p>
            </>
          ) : verifyResult === 'activated' ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-800 dark:text-green-300 font-medium">
                Payment verified! Your subscription is now active. Refreshing...
              </p>
            </>
          ) : verifyResult === 'already_active' ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-800 dark:text-green-300 font-medium">
                Payment successful! Your subscription is active.
              </p>
            </>
          ) : verifyResult === 'error' ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-800 dark:text-green-300 font-medium">
                Payment received! Your plan will update shortly.
              </p>
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-800 dark:text-green-300 font-medium">
                Payment successful! Activating your subscription...
              </p>
            </>
          )}
        </div>
      )}
      {paymentStatus === 'cancelled' && (
        <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
          <XCircle className="w-5 h-5 text-yellow-600" />
          <p className="text-yellow-800 dark:text-yellow-300 font-medium">
            Payment was cancelled. You can try again below.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-clinic-navy dark:text-white">
            Billing & Subscription
          </h2>
          <p className="text-clinic-text/60 dark:text-white/60">
            Manage your subscription plan
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-clinic-text/60">
          <Shield className="w-4 h-4 text-clinic-teal" />
          Secure Payments via PayMongo
        </div>
      </div>

      {/* Current Plan */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6">
        <h3 className="text-lg font-semibold text-clinic-navy dark:text-white mb-4">
          Current Plan
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-display font-bold text-clinic-teal">
              {currentPlan.name}
            </p>
            <p className="text-sm text-clinic-text/60 dark:text-white/60">
              {clinic?.payment_status === 'trial'
                ? 'Free Trial'
                : `₱${currentPlan.monthlyPrice.toLocaleString()}/month`}
            </p>
            {clinic?.next_billing_date && clinic?.payment_status === 'active' && (
              <p className="text-xs text-clinic-text/50 dark:text-white/50 mt-1">
                Next billing:{' '}
                {new Date(clinic.next_billing_date).toLocaleDateString('en-PH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            )}
          </div>
          <span
            className={cn(
              'px-3 py-1 rounded-full text-sm font-medium',
              clinic?.payment_status === 'trial'
                ? 'bg-blue-100 text-blue-700'
                : clinic?.payment_status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : clinic?.payment_status === 'past_due'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-yellow-100 text-yellow-700',
            )}
          >
            {clinic?.payment_status === 'trial'
              ? 'Trial'
              : clinic?.payment_status === 'active'
                ? 'Active'
                : clinic?.payment_status === 'past_due'
                  ? 'Past Due'
                  : 'Pending'}
          </span>
        </div>
      </div>

      {/* PayMongo Connection */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-clinic-navy dark:text-white">
            Collect Online Payments
          </h3>
          <button
            onClick={() => setShowPaymongoGuide(!showPaymongoGuide)}
            className="flex items-center gap-1 text-xs text-clinic-teal hover:text-clinic-teal/80 transition-colors"
          >
            {showPaymongoGuide ? <X className="w-3.5 h-3.5" /> : <Info className="w-3.5 h-3.5" />}
            {showPaymongoGuide ? 'Close' : 'How to set up'}
          </button>
        </div>
        <p className="text-sm text-clinic-text/60 dark:text-white/60 mb-4">
          Connect your PayMongo account to receive appointment payments directly from patients.
        </p>

        {showPaymongoGuide && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-sm space-y-3">
            <p className="font-medium text-blue-800 dark:text-blue-300">How to get your PayMongo Organization ID:</p>
            <ol className="list-decimal list-inside space-y-2 text-blue-700 dark:text-blue-400">
              <li>Go to <a href="https://dashboard.paymongo.com/signup" target="_blank" rel="noopener noreferrer" className="underline font-medium">dashboard.paymongo.com/signup</a> and create an account (or log in if you already have one).</li>
              <li>Complete your business verification (KYC) — PayMongo will ask for business details, valid ID, and bank account information.</li>
              <li>Once verified, go to <strong>Settings</strong> in your PayMongo dashboard.</li>
              <li>Find your <strong>Organization ID</strong> — it starts with <code className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-xs">org_</code></li>
              <li>Copy and paste it in the field below.</li>
            </ol>
            <p className="text-blue-600 dark:text-blue-400 text-xs">
              Verification usually takes 1-3 business days. Once connected, patients can pay online and funds go directly to your bank account.
            </p>
          </div>
        )}

        {isPaymongoConnected ? (
          <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                  PayMongo Connected
                </p>
                <p className="text-xs text-green-600/70 dark:text-green-400/70">
                  Merchant ID: {maskedMerchantId}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-red-300 text-red-600 hover:bg-red-50"
              onClick={handleDisconnectPaymongo}
              disabled={disconnecting}
            >
              {disconnecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Disconnect'
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                placeholder="org_xxxxxxxxxxxxxxxx"
                className="flex-1 h-10 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-clinic-teal"
              />
              <Button
                className="bg-clinic-teal hover:bg-clinic-teal/90 text-white"
                onClick={handleConnectPaymongo}
                disabled={connecting || !merchantId.trim().startsWith('org_')}
              >
                {connecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Connect'
                )}
              </Button>
            </div>
            <p className="text-xs text-clinic-text/50 dark:text-white/50">
              Enter your PayMongo organization ID. You can find this in your PayMongo dashboard under Settings.
            </p>
          </div>
        )}
      </div>

      {/* Billing Cycle Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 p-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              billingCycle === 'monthly'
                ? 'bg-clinic-teal text-white'
                : 'text-clinic-text/60 dark:text-white/60 hover:text-clinic-navy dark:hover:text-white',
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              billingCycle === 'yearly'
                ? 'bg-clinic-teal text-white'
                : 'text-clinic-text/60 dark:text-white/60 hover:text-clinic-navy dark:hover:text-white',
            )}
          >
            Yearly
            <span className="ml-1 text-xs text-green-500 font-bold">
              Save 17%
            </span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = plan.id === clinic?.subscription_plan;
          const isLoading = subscribingPlan === plan.id;
          const price =
            billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;

          return (
            <div
              key={plan.id}
              className={cn(
                'relative p-6 rounded-2xl transition-all flex flex-col',
                isCurrentPlan
                  ? 'bg-white dark:bg-slate-800 border-2 border-clinic-teal shadow-glass'
                  : 'bg-white dark:bg-slate-800 border-2 border-transparent hover:border-clinic-teal/30 shadow-sm',
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-clinic-teal text-white text-xs font-medium rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-lg font-display font-bold text-clinic-navy dark:text-white">
                  {plan.name}
                </h3>
                <div className="mt-2">
                  <span className="text-3xl font-display font-bold text-clinic-navy dark:text-white">
                    ₱{price.toLocaleString()}
                  </span>
                  <span className="text-clinic-text/60 dark:text-white/60 text-sm">
                    /{billingCycle === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>
              </div>

              <ul className="space-y-3 mb-6 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-clinic-teal flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-clinic-text/70 dark:text-white/70">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {isCurrentPlan && clinic?.payment_status === 'active' ? (
                <Button disabled className="w-full" variant="outline">
                  Current Plan
                </Button>
              ) : (
                <Button
                  className="w-full bg-clinic-teal hover:bg-clinic-teal/90 text-white"
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isLoading || !!subscribingPlan}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Redirecting to payment...
                    </>
                  ) : isCurrentPlan ? (
                    'Renew Plan'
                  ) : plan.monthlyPrice > (currentPlan?.monthlyPrice || 0) ? (
                    'Upgrade'
                  ) : (
                    'Downgrade'
                  )}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Payment info */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6">
        <h3 className="text-lg font-semibold text-clinic-navy dark:text-white mb-3">
          Accepted Payment Methods
        </h3>
        <div className="flex flex-wrap gap-3">
          {['GCash', 'Maya', 'Credit/Debit Card', 'GrabPay', 'Bank Transfer'].map(
            (method) => (
              <span
                key={method}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm text-clinic-text/70 dark:text-white/70"
              >
                {method}
              </span>
            ),
          )}
        </div>
        <p className="text-xs text-clinic-text/50 dark:text-white/50 mt-3">
          Payments are processed securely through PayMongo. You will be
          redirected to a secure checkout page.
        </p>
      </div>
    </div>
  );
}
