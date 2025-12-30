"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, Lock, Mail, Eye, EyeOff } from "lucide-react";

export default function ClinicLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/clinic/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      localStorage.setItem("clinicToken", data.token);
      localStorage.setItem("clinicAdmin", JSON.stringify(data.admin));
      localStorage.setItem("clinic", JSON.stringify(data.clinic));
      router.push("/clinic/dashboard");
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-clinic-bg dark:bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-clinic-navy to-clinic-teal">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-display font-bold text-clinic-navy dark:text-white">
              MediFlow
            </span>
          </Link>
          <h1 className="font-display text-3xl font-bold text-clinic-navy dark:text-white mb-2">
            Clinic Login
          </h1>
          <p className="text-clinic-text/60 dark:text-white/60">
            Sign in to manage your clinic
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-8"
        >
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-clinic-navy dark:text-white">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-clinic-text/40" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@clinic.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-12 h-12 border-clinic-navy/20 dark:border-white/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-clinic-navy dark:text-white">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-clinic-text/40" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-12 pr-12 h-12 border-clinic-navy/20 dark:border-white/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-clinic-text/40 hover:text-clinic-navy dark:hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-clinic-teal hover:bg-clinic-teal/90 text-white"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </div>
        </form>

        <p className="text-center mt-6 text-sm text-clinic-text/60 dark:text-white/60">
          Don't have an account?{" "}
          <Link href="/clinic/register" className="text-clinic-teal hover:underline">
            Register your clinic
          </Link>
        </p>

        <p className="text-center mt-2 text-sm text-clinic-text/60 dark:text-white/60">
          <Link href="/" className="text-clinic-teal hover:underline">
            ← Back to Website
          </Link>
        </p>
      </div>
    </div>
  );
}
