"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Mail, Lock, AlertCircle, User, Phone } from "lucide-react";

interface SignUpFormProps {
  redirectAfterAuth?: string;
  title?: string;
  description?: string;
}

export default function SignUpForm({
  redirectAfterAuth = "/payment",
  title = "একাউন্ট তৈরি করুন",
  description = "আপনার তথ্য দিয়ে সাইন আপ করে শুরু করুন",
}: SignUpFormProps) {
  // ===== STATE VARIABLES =====
  const [displayName, setDisplayName] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const router = useRouter();
  const { signUp } = useAuth();

  // ===== VALIDATION FUNCTIONS =====
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^(\+880|01)[3-9]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ""));
  };

  // ===== HANDLE EMAIL SIGN UP =====
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
      await signUp(email, password, displayName, phoneNumber);
      setSuccess("একাউন্ট তৈরি হয়েছে। আপনার ইমেইল চেক করুন।");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      console.error("[SignUpForm] ❌ Error:", err);
      const errorMessage = (err as any)?.message || "একটি ত্রুটি ঘটেছে। আবার চেষ্টা করুন।";
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  // ===== COMPONENT RENDER =====
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
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
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
