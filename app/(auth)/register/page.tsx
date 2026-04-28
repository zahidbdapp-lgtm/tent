"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Building2, Mail, Lock, Eye, ArrowLeft, AlertCircle, User, Phone } from "lucide-react";

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signUp, enterDemoMode } = useAuth();
  const router = useRouter();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const validatePhoneNumber = (phone: string): boolean => {
    // Bangladesh phone format: 01XXXXXXXXX or +880XXXXXXXXXX
    const phoneRegex = /^(\+880|01)[3-9]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ""));
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!displayName.trim()) {
      setError("দয়া করে আপনার নাম দিন।");
      return;
    }

    if (!phoneNumber.trim()) {
      setError("দয়া করে ফোন নম্বর দিন।");
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setError("ফোন নম্বর সঠিক নয়। ফরম্যাট: 01712345678 বা +8801712345678");
      return;
    }

    if (!email.trim()) {
      setError("দয়া করে ইমেইল দিন।");
      return;
    }

    if (!validateEmail(email)) {
      setError("ইমেইল ফরম্যাট সঠিক নয়।");
      return;
    }

    if (!password.trim()) {
      setError("দয়া করে পাসওয়ার্ড দিন।");
      return;
    }

    if (!validatePassword(password)) {
      setError("পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে।");
      return;
    }

    if (password !== confirmPassword) {
      setError("পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড সমান হতে হবে।");
      return;
    }

    setIsLoading(true);

    try {
      // Store signup data in localStorage
      const signupData = {
        email,
        password,
        displayName,
        phoneNumber,
      };
      localStorage.setItem("pendingSignup", JSON.stringify(signupData));
      console.log("[RegisterPage] Signup data stored, redirecting to payment...");

      setSuccess("তথ্য সংরক্ষণ হয়েছে। এখন পেমেন্ট তথ্য দিন।");
      setTimeout(() => {
        router.push("/register/payment");
      }, 1500);
    } catch (err) {
      console.error("Sign up error:", err);
      const errorMessage = (err as any)?.message || "একাউন্ট তৈরি করতে সমস্যা হয়েছে।";
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleDemoMode = () => {
    enterDemoMode();
    router.push("/demo");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Home</span>
          </button>
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">PropManager</span>
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">একাউন্ট তৈরি করুন</CardTitle>
            <CardDescription>আপনার তথ্য দিয়ে সাইন আপ করে শুরু করুন</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleEmailSignUp} className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              )}

              {/* Name Field */}
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="displayName">পূর্ণ নাম</FieldLabel>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="displayName"
                      type="text"
                      placeholder="আপনার নাম"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      disabled={isLoading}
                      className="pl-10"
                      required
                    />
                  </div>
                </Field>
              </FieldGroup>

              {/* Phone Field */}
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="phoneNumber">ফোন নম্বর</FieldLabel>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="01712345678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={isLoading}
                      className="pl-10"
                      required
                    />
                  </div>
                </Field>
              </FieldGroup>

              {/* Email Field */}
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">ইমেইল</FieldLabel>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      className="pl-10"
                      required
                    />
                  </div>
                </Field>
              </FieldGroup>

              {/* Password Field */}
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="password">পাসওয়ার্ড</FieldLabel>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="কমপক্ষে ৬ অক্ষর"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="pl-10"
                      required
                    />
                  </div>
                </Field>
              </FieldGroup>

              {/* Confirm Password Field */}
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="confirmPassword">পাসওয়ার্ড কনফার্ম করুন</FieldLabel>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="পাসওয়ার্ড আবার দিন"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                      className="pl-10"
                      required
                    />
                  </div>
                </Field>
              </FieldGroup>

              {/* Sign Up Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    লোড হচ্ছে...
                  </>
                ) : (
                  "একাউন্ট তৈরি করুন"
                )}
              </Button>

              {/* Demo Mode Link */}
              <div className="text-center pt-4">
                <button
                  type="button"
                  onClick={handleDemoMode}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  ডেমো মোডে চেষ্টা করুন
                </button>
              </div>

              {/* Login Link */}
              <div className="text-center pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}
                  <Link href="/login" className="text-primary hover:underline font-medium">
                    লগইন করুন
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>টিপ:</strong> ইমেইল এবং পাসওয়ার্ড দিয়ে একাউন্ট তৈরি করুন। পরবর্তী ধাপে পেমেন্ট তথ্য দিন।
          </p>
        </div>
      </div>
    </div>
  );
}
