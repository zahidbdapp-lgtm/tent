"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { PRICING_PLANS, SubscriptionPlan, PaymentMethod } from "@/types";
import { Building2, Mail, Lock, User, Phone, CheckCircle, Check, Smartphone, Calendar, Eye, ArrowLeft } from "lucide-react";

const paymentMethods: { id: PaymentMethod; name: string; number: string; color: string }[] = [
  { id: "bkash", name: "bKash", number: "01727132605", color: "bg-[#E2136E]" },
  { id: "nagad", name: "Nagad", number: "01727132605", color: "bg-[#F6921E]" },
  { id: "rocket", name: "Rocket", number: "017271326058", color: "bg-[#8B2F89]" },
];

export default function RegisterPage() {
  // Step state
  const [step, setStep] = useState<1 | 2>(1);
  
  // Step 1: User Info
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Step 2: Payment Info
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>("monthly");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentNumber, setPaymentNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signUp, enterDemoMode } = useAuth();
  const router = useRouter();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^(\+880|01)[3-9]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ""));
   };

   const validateStep1 = () => {
    if (!displayName.trim()) {
      setError("নাম দিন।");
      return false;
    }
    if (!email.trim()) {
      setError("ইমেইল দিন।");
      return false;
    }
    if (!validateEmail(email)) {
      setError("সঠিক ইমেইল ফরম্যাট দিন (যেমন: user@example.com)");
      return false;
    }
    if (!phone.trim()) {
      setError("ফোন নম্বর দিন।");
      return false;
    }
    if (!validatePhone(phone)) {
      setError("সঠিক ফোন নম্বর ফরম্যাট দিন (যেমন: 01712345678 বা +8801712345678)");
      return false;
    }
    if (password !== confirmPassword) {
      setError("পাসওয়ার্ড মিলছে না।");
      return false;
    }
    if (password.length < 6) {
      setError("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।");
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    setError("");
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedPaymentMethod) {
      setError("পেমেন্ট মেথড সিলেক্ট করুন।");
      return;
    }

    if (!paymentNumber.trim()) {
      setError("যে নম্বর থেকে পেমেন্ট করেছেন সেটা দিন।");
      return;
    }

    if (!transactionId.trim()) {
      setError("Transaction ID দিন।");
      return;
    }

    if (!paymentDate) {
      setError("পেমেন্ট তারিখ দিন।");
      return;
    }

    setIsLoading(true);

    try {
      await signUp(email, password, displayName, phone, {
        paymentMethod: selectedPaymentMethod,
        paymentNumber: paymentNumber.trim(),
        transactionId: transactionId.trim(),
        amount: PRICING_PLANS[selectedPlan].price,
        plan: selectedPlan,
      });
      setSuccess("সফলভাবে একাউন্ট তৈরি হয়েছে! Admin approval এর অপেক্ষায়...");
      setTimeout(() => {
        router.push("/registration-pending");
      }, 2000);
    } catch (err) {
      console.error('Sign up error:', err);
      const supabaseError = err as { message?: string; status?: number };
      const message = supabaseError.message?.toLowerCase() || '';

      // Check for specific error types
      if (message.includes('already registered') || message.includes('email already in use') || message.includes('user already exists')) {
        setError("এই ইমেইল দিয়ে আগে থেকেই একাউন্ট আছে।");
      } else if (message.includes('email rate limit exceeded') || message.includes('rate limit exceeded')) {
        setError("ইমেইল রেট লিমিট অতিক্রম করেছে। ১ ঘন্টা অপেক্ষা করে আবার চেষ্টা করুন।");
      } else if (message.includes('invalid email') || message.includes('email address invalid') || message.includes('email format')) {
        setError("ইমেইল ফরম্যাট সঠিক নয়।");
      } else if (message.includes('weak password') || message.includes('password') || message.includes('short')) {
        setError("পাসওয়ার্ড আরো শক্তিশালী করুন।");
      } else {
        setError("একাউন্ট তৈরি করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
      }
     } finally {
      setIsLoading(false);
    }
  };

  const handleDemoMode = () => {
    router.push("/demo");
  };

  const handleGoHome = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleGoHome}
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

         {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className={`flex items-center gap-2 ${step === 1 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 1 ? 'bg-primary text-primary-foreground' : step > 1 ? 'bg-success text-success-foreground' : 'bg-muted'}`}>
              {step > 1 ? <Check className="h-4 w-4" /> : '1'}
            </div>
            <span className="text-sm font-medium hidden sm:inline">তথ্য দিন</span>
          </div>
          <div className="w-8 h-0.5 bg-muted" />
          <div className={`flex items-center gap-2 ${step === 2 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              2
            </div>
            <span className="text-sm font-medium hidden sm:inline">পেমেন্ট তথ্য</span>
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
              {step === 1 ? "একাউন্ট তৈরি করুন" : "পেমেন্ট তথ্য দিন"}
            </CardTitle>
            <CardDescription>
              {step === 1 
                ? "আজই আপনার property management শুরু করুন" 
                : "পেমেন্ট করে একাউন্ট একটিভেট করুন"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 ? (
              // Step 1: User Information
              <div>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="displayName">Full Name</FieldLabel>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="displayName"
                        type="text"
                        placeholder="আপনার নাম"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="01XXX-XXXXXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10"
                        required
                        pattern="(01|\\+8801)[3-9][0-9]{8}"
                        title="Please enter a valid Bangladeshi phone number (e.g., 01712345678)"
                      />
                    </div>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="পাসওয়ার্ড তৈরি করুন"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="পাসওয়ার্ড আবার দিন"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </Field>

                  {error && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}

                  <Button type="button" className="w-full" onClick={handleNextStep}>
                    পরবর্তী ধাপ
                  </Button>
                </FieldGroup>

                <div className="space-y-3 mt-6">
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={handleDemoMode}
                    disabled={isLoading}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Demo দেখুন (Login ছাড়া)
                  </Button>
                </div>
              </div>
            ) : (
              // Step 2: Payment Information
              <form onSubmit={handleSubmit}>
                <FieldGroup>
                  {/* Package Selection */}
                  <Field>
                    <FieldLabel>প্যাকেজ সিলেক্ট করুন</FieldLabel>
                    <div className="grid gap-3 md:grid-cols-3">
                      {(Object.entries(PRICING_PLANS) as [SubscriptionPlan, typeof PRICING_PLANS[SubscriptionPlan]][]).map(
                        ([key, plan]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setSelectedPlan(key)}
                            className={`relative p-3 rounded-lg border-2 text-left transition-all ${
                              selectedPlan === key
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            {selectedPlan === key && (
                              <div className="absolute top-2 right-2">
                                <Check className="h-4 w-4 text-primary" />
                              </div>
                            )}
                            {"discount" in plan && (
                              <span className="absolute -top-2 left-2 text-xs bg-success text-success-foreground px-1.5 py-0.5 rounded">
                                {plan.discount} ছাড়
                              </span>
                            )}
                            <h4 className="font-medium text-sm mt-1">{plan.nameBn}</h4>
                            <p className="text-lg font-bold">৳{plan.price}</p>
                          </button>
                        )
                      )}
                    </div>
                  </Field>

                  {/* Payment Method Selection */}
                  <Field>
                    <FieldLabel>
                      <Smartphone className="h-4 w-4 inline mr-1" />
                      পেমেন্ট মেথড
                    </FieldLabel>
                    <div className="grid gap-3 md:grid-cols-3">
                      {paymentMethods.map((method) => (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setSelectedPaymentMethod(method.id)}
                          className={`relative p-3 rounded-lg border-2 text-center transition-all ${
                            selectedPaymentMethod === method.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          {selectedPaymentMethod === method.id && (
                            <div className="absolute top-1 right-1">
                              <Check className="h-4 w-4 text-primary" />
                            </div>
                          )}
                          <div
                            className={`${method.color} w-10 h-10 rounded-full mx-auto mb-1 flex items-center justify-center`}
                          >
                            <span className="text-white font-bold">{method.name[0]}</span>
                          </div>
                          <h4 className="font-medium text-sm">{method.name}</h4>
                          <p className="text-xs text-muted-foreground">{method.number}</p>
                        </button>
                      ))}
                    </div>
                  </Field>

                  {selectedPaymentMethod && (
                    <div className="bg-muted p-3 rounded-lg text-sm">
                      <p className="font-medium mb-2">পেমেন্ট করুন:</p>
                      <p className="text-muted-foreground">
                        {paymentMethods.find((m) => m.id === selectedPaymentMethod)?.name} এ Send Money করুন:{" "}
                        <span className="font-mono font-medium text-foreground">
                          {paymentMethods.find((m) => m.id === selectedPaymentMethod)?.number}
                        </span>
                      </p>
                      <p className="text-muted-foreground mt-1">
                        Amount: <span className="font-bold text-foreground">৳{PRICING_PLANS[selectedPlan].price}</span>
                      </p>
                    </div>
                   )}

                    {/* Payment Number (sender's mobile) */}
                    <Field>
                      <FieldLabel htmlFor="paymentNumber">পেমেন্টের নম্বর (যেখান থেকে পেমেন্ট করেছেন)</FieldLabel>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="paymentNumber"
                          type="tel"
                          placeholder="যে নম্বর থেকে পেমেন্ট করেছেন সেটা দিন"
                          value={paymentNumber}
                          onChange={(e) => setPaymentNumber(e.target.value)}
                          className="pl-10"
                          required
                          pattern="(01|\\+8801)[3-9][0-9]{8}"
                          title="Valid Bangladeshi mobile number (e.g., 01712345678)"
                        />
                      </div>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="transactionId">Transaction ID</FieldLabel>
                    <Input
                      id="transactionId"
                      type="text"
                      placeholder="যেমন: 8N7XXXXXX"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="paymentDate">পেমেন্টের তারিখ</FieldLabel>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="paymentDate"
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </Field>

                  {error && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}

                  {success && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <p className="text-sm text-green-600">{success}</p>
                    </div>
                  )}

                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">মোট পেমেন্ট:</span>
                      <span className="text-xl font-bold">৳{PRICING_PLANS[selectedPlan].price}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex-1" 
                      onClick={() => setStep(1)}
                    >
                      পূর্বে যান
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isLoading}>
                      {isLoading ? <Spinner className="mr-2" /> : null}
                      একাউন্ট তৈরি করুন
                    </Button>
                  </div>
                </FieldGroup>
              </form>
            )}

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">ইতোমধ্যে একাউন্ট আছে? </span>
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in করুন
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
