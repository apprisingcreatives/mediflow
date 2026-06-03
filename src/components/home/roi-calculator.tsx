"use client";

import React, { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calculator, CheckCircle2, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export function RoiCalculator() {
  const [patients, setPatients] = useState<number>(300);
  const [fee, setFee] = useState<number>(800);
  const [noShowRate, setNoShowRate] = useState<number>(15);

  const [lostRevenue, setLostRevenue] = useState<number>(0);
  const [recoveredRevenue, setRecoveredRevenue] = useState<number>(0);
  const [netGain, setNetGain] = useState<number>(0);
  const [roi, setRoi] = useState<number>(0);

  const subscriptionCost = 10000; // AI Professional Plan

  useEffect(() => {
    const totalNoShows = Math.round(patients * (noShowRate / 100));
    const monthlyLost = totalNoShows * fee;
    // Assume MediFlow's automated reminder system recovers 70% of no-shows
    const monthlyRecovered = Math.round(monthlyLost * 0.70);
    const gain = monthlyRecovered - subscriptionCost;
    const computedRoi = Math.max(0, Math.round((gain / subscriptionCost) * 100));

    setLostRevenue(monthlyLost);
    setRecoveredRevenue(monthlyRecovered);
    setNetGain(gain);
    setRoi(computedRoi);
  }, [patients, fee, noShowRate]);

  return (
    <section id="roi-calculator" className="py-20 lg:py-32 bg-white dark:bg-slate-900 border-b border-clinic-navy/5 dark:border-white/5">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-clinic-teal/10 rounded-full text-clinic-teal text-sm font-medium mb-4">
            <Calculator className="w-4 h-4" />
            ROI Calculator
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-clinic-navy dark:text-white tracking-tight mb-4">
            Calculate Your Recovered Revenue
          </h2>
          <p className="text-lg text-clinic-text/70 dark:text-white/70">
            See how much manual coordination and missed appointments are costing your practice, and how much you will save with MediFlow.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 max-w-5xl mx-auto items-center">
          {/* Controls Column */}
          <div className="lg:col-span-7 space-y-8 bg-clinic-bg dark:bg-slate-800/50 p-6 lg:p-8 rounded-2xl border border-clinic-navy/5 dark:border-white/5 shadow-glass">
            {/* Input 1: Patients per Month */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-clinic-navy dark:text-white">
                  Monthly Patients
                </label>
                <span className="text-lg font-bold text-clinic-teal font-display">
                  {patients} patients
                </span>
              </div>
              <Slider
                value={[patients]}
                onValueChange={(val) => setPatients(val[0])}
                min={50}
                max={1500}
                step={10}
                className="[&_.relative]:bg-clinic-teal"
              />
              <div className="flex justify-between text-xs text-clinic-text/40 dark:text-white/40">
                <span>50</span>
                <span>500</span>
                <span>1,000</span>
                <span>1,500</span>
              </div>
            </div>

            {/* Input 2: Consultation Fee */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-clinic-navy dark:text-white">
                  Average Consultation Fee (PHP)
                </label>
                <span className="text-lg font-bold text-clinic-teal font-display">
                  ₱{fee.toLocaleString()}
                </span>
              </div>
              <Slider
                value={[fee]}
                onValueChange={(val) => setFee(val[0])}
                min={200}
                max={4000}
                step={50}
              />
              <div className="flex justify-between text-xs text-clinic-text/40 dark:text-white/40">
                <span>₱200</span>
                <span>₱1,500</span>
                <span>₱3,000</span>
                <span>₱4,000</span>
              </div>
            </div>

            {/* Input 3: No-Show Rate */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-clinic-navy dark:text-white">
                  No-Show / Cancellation Rate (%)
                </label>
                <span className="text-lg font-bold text-clinic-teal font-display">
                  {noShowRate}%
                </span>
              </div>
              <Slider
                value={[noShowRate]}
                onValueChange={(val) => setNoShowRate(val[0])}
                min={5}
                max={50}
                step={1}
              />
              <div className="flex justify-between text-xs text-clinic-text/40 dark:text-white/40">
                <span>5% (Low)</span>
                <span>15% (Avg)</span>
                <span>30%</span>
                <span>50% (High)</span>
              </div>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-5 flex flex-col h-full justify-between gap-6">
            <Card className="bg-gradient-to-br from-clinic-navy to-clinic-navy/95 text-white border-0 shadow-glass-lg rounded-2xl overflow-hidden relative">
              {/* Decorative Glow */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-clinic-teal/20 rounded-full blur-3xl" />
              
              <CardContent className="p-8 space-y-6">
                <div>
                  <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">
                    Monthly Revenue Lost to No-Shows
                  </p>
                  <p className="text-3xl font-display font-bold text-rose-400">
                    ₱{lostRevenue.toLocaleString()}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">
                    Revenue Recovered by MediFlow (70%)
                  </p>
                  <p className="text-4xl font-display font-bold text-clinic-teal">
                    ₱{recoveredRevenue.toLocaleString()}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">
                      Estimated Net Monthly Gain
                    </p>
                    <p className="text-2xl font-display font-bold text-white">
                      ₱{netGain > 0 ? netGain.toLocaleString() : 0}
                    </p>
                  </div>
                  {roi > 0 && (
                    <div className="px-3 py-1.5 bg-clinic-teal/10 border border-clinic-teal/20 rounded-lg text-clinic-teal text-center">
                      <div className="text-xs font-bold">{roi}%</div>
                      <div className="text-[10px] text-white/70">ROI</div>
                    </div>
                  )}
                </div>

                <div className="pt-4 text-xs text-white/60 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-clinic-teal flex-shrink-0" />
                    <span>Based on a PHP 10,000/mo subscription.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-clinic-teal flex-shrink-0" />
                    <span>MediFlow pays for itself in less than a week.</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              size="lg"
              className="bg-clinic-teal hover:bg-clinic-teal/90 text-white w-full h-14 text-base shadow-glow hover:shadow-lg transition-all duration-300 group"
              asChild
            >
              <Link href="/demo">
                Reclaim Your Revenue Now
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
