"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { PRICING_PLANS, SubscriptionPlan, PaymentMethod } from "@/types";
import { Building2, Phone, Smartphone, Calendar, CheckCircle, ArrowLeft, Check } from "lucide-react";

const paymentMethods: { id: PaymentMethod; name: string; number: string; color: string }[] = [
  { id: "bkash", name: "bKash", number: "01727132605", color: "bg-[#E2136E]" },
  { id: "nagad", name: "Nagad", number: "01727132605", color: "bg-[#F6921E]" },
  { id: "rocket", name: "Rocket", number: "017271326058", color: "bg-[#8B2F89]" },
];

interface PendingSignupData {
  email: string;
  password: string;
  displayName: string;
  phoneNumber: string;
}

export default function PaymentPage() {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>("monthly");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentNumber, setPaymentNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [signupType, setSignupType] = useState<"email" | "google" | null>(null);
  const [pendingUserData, setPendingUserData] = useState<{ displayName: string; phone: string } | null>(null);
  const [pendingEmailData, setPendingEmailData] = useState<PendingSignupData | null>(null);

  const { user, completeGoogleSignUp, completeEmailSignUp } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check for email signup data
    const emailSignupStored = localStorage.getItem("pendingSignup");
    if (emailSignupStored) {
      try {
        setPendingEmailData(JSON.parse(emailSignupStored));
        setSignupType("email");
        console.log("[PaymentPage] Email signup data loaded");
        return;
      } catch (err) {
        console.error("Failed to parse email signup data:", err);
      }
    }

    // Check for Google signup data
    const googleSignupStored = localStorage.getItem("pendingGoogleSignup");
    const isSignupFlow = localStorage.getItem("isGoogleSignupFlow");
    
    console.log("[PaymentPage] Checking Google signup:", { stored: !!googleSignupStored, isSignupFlow, userEmail: user?.email });
    
    if (googleSignupStored) {
      try {
        setPendingUserData(JSON.parse(googleSignupStored));
        setSignupType("google");
        console.log("[PaymentPage] Google signup data loaded");
      } catch (err) {
        console.error("Failed to parse Google signup data:", err);
      }
    }

    // If no pending data at all, redirect to register
    if (!emailSignupStored && !googleSignupStored && !isSignupFlow) {
      console.log("[PaymentPage] No pending data, redirecting to register");
      router.push("/register");
    }
    
    if (user && googleSignupStored) {
      localStorage.setItem("isGoogleSignupFlow", "true");
    }
  }, [user, router]);

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
      if (signupType === "email" && pendingEmailData) {
        // Handle email signup with payment
        await completeEmailSignUp(
          pendingEmailData.email,
          pendingEmailData.password,
          pendingEmailData.displayName,
          pendingEmailData.phoneNumber,
          {
            paymentMethod: selectedPaymentMethod,
            paymentNumber: paymentNumber.trim(),
            transactionId: transactionId.trim(),
            amount: PRICING_PLANS[selectedPlan].price,
            plan: selectedPlan,
          }
        );

        setSuccess("সফলভাবে একাউন্ট তৈরি হয়েছে! Admin approval এর অপেক্ষায়...");
        localStorage.removeItem("pendingSignup");
        
        setTimeout(() => {
          router.push("/registration-pending");
        }, 3000);
      } else if (signupType === "google") {
        // Handle Google signup with payment
        await completeGoogleSignUp({
          paymentMethod: selectedPaymentMethod,
          paymentNumber: paymentNumber.trim(),
          transactionId: transactionId.trim(),
          amount: PRICING_PLANS[selectedPlan].price,
          plan: selectedPlan,
        });

        setSuccess("সফলভাবে একাউন্ট তৈরি হয়েছে! Admin approval এর অপেক্ষায়...");
        localStorage.removeItem("pendingGoogleSignup");
        localStorage.removeItem("isGoogleSignupFlow");
        
        setTimeout(() => {
          router.push("/registration-pending");
        }, 3000);
      }
    } catch (err) {
      console.error("Payment error:", err);
      const errorMessage = (err as any)?.message || "একটি ত্রুটি ঘটেছে। আবার চেষ্টা করুন।";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
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
            <CardTitle className="text-2xl">পেমেন্ট তথ্য দিন</CardTitle>
            <CardDescription>আপনার সাবস্ক্রিপশন সক্রিয় করতে পেমেন্ট তথ্য যোগ করুন</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* User Info Display */}
              {pendingEmailData && (
                <div className="bg-muted p-3 rounded-lg mb-4">
                  <p className="text-sm"><strong>নাম:</strong> {pendingEmailData.displayName}</p>
                  <p className="text-sm"><strong>ফোন:</strong> {pendingEmailData.phoneNumber}</p>
                  <p className="text-sm"><strong>ইমেইল:</strong> {pendingEmailData.email}</p>
                </div>
              )}

              {pendingUserData && (
                <div className="bg-muted p-3 rounded-lg mb-4">
                  <p className="text-sm"><strong>নাম:</strong> {pendingUserData.displayName}</p>
                  <p className="text-sm"><strong>ফোন:</strong> {pendingUserData.phone}</p>
                  {user?.email && <p className="text-sm"><strong>ইমেইল:</strong> {user.email}</p>}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-md p-3 text-sm">
                  {error}
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-600 rounded-md p-3 text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  {success}
                </div>
              )}

              {/* Package Selection */}
              <FieldGroup>
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
                          <h4 className="font-medium text-sm">{plan.nameBn}</h4>
                          <p className="text-lg font-bold">৳{plan.price}</p>
                        </button>
                      )
                    )}
                  </div>
                </Field>
              </FieldGroup>

              {/* Payment Method Selection */}
              <FieldGroup>
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
              </FieldGroup>

              {/* Payment Instructions */}
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

              {/* Payment Number */}
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="paymentNumber">পেমেন্টের নম্বর (যেখান থেকে পেমেন্ট করেছেন)</FieldLabel>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="paymentNumber"
                      type="tel"
                      placeholder="01712345678"
                      value={paymentNumber}
                      onChange={(e) => setPaymentNumber(e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </Field>
              </FieldGroup>

              {/* Transaction ID */}
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="transactionId">Transaction ID</FieldLabel>
                  <Input
                    id="transactionId"
                    type="text"
                    placeholder="যেমন: 8N7XXXXXX"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </Field>
              </FieldGroup>

              {/* Payment Date */}
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="paymentDate">পেমেন্টের তারিখ</FieldLabel>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="paymentDate"
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </Field>
              </FieldGroup>

              {/* Total */}
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">মোট পেমেন্ট:</span>
                  <span className="text-xl font-bold">৳{PRICING_PLANS[selectedPlan].price}</span>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    প্রসেসিং...
                  </>
                ) : (
                  "একাউন্ট সম্পন্ন করুন"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>টিপ:</strong> পেমেন্টের সঠিক তথ্য দিন। Admin আপনার পেমেন্ট যাচাই করার পর আপনার অ্যাকাউন্ট সক্রিয় হবে।
          </p>
        </div>
      </div>
    </div>
  );
}
