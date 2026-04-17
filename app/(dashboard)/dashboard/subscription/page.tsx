"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Check,
  CheckCircle,
  CreditCard,
  AlertCircle,
  Clock,
  Smartphone,
  Calendar,
  Phone,
} from "lucide-react";
import { PRICING_PLANS, SubscriptionPlan, PaymentMethod } from "@/types";

const paymentMethods: { id: PaymentMethod; name: string; number: string; color: string }[] = [
  { id: "bkash", name: "bKash", number: "01727132605", color: "bg-[#E2136E]" },
  { id: "nagad", name: "Nagad", number: "01727132605", color: "bg-[#F6921E]" },
  { id: "rocket", name: "Rocket", number: "017271326058", color: "bg-[#8B2F89]" },
];

export default function SubscriptionPage() {
  const { user, userData, isAdmin } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentNumber, setPaymentNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError("আপনাকে প্রথমে লগইন করতে হবে।");
      return;
    }
    if (!userData) {
      setError("ব্যবহারকারীর তথ্য লোড হচ্ছে। একটু অপেক্ষা করে আবার চেষ্টা করুন।");
      return;
    }
    if (!selectedPlan) {
      setError("দয়া করে একটি প্যাকেজ সিলেক্ট করুন।");
      return;
    }
    if (!selectedPaymentMethod) {
      setError("দয়া করে একটি পেমেন্ট মেথড সিলেক্ট করুন।");
      return;
    }
    if (!transactionId.trim()) {
      setError("Transaction ID দিন।");
      return;
    }
    if (!paymentNumber.trim()) {
      setError("পেমেন্টের নম্বর দিন।");
      return;
    }
     if (!paymentDate) {
       setError("পেমেন্টের তারিখ দিন।");
       return;
     }

    setIsSubmitting(true);
    setError("");

    try {
      const now = new Date().toISOString();
      const paymentRequest = {
        userId: user.uid,
        userEmail: user.email || "",
        userName: userData.displayName,
        plan: selectedPlan,
        amount: PRICING_PLANS[selectedPlan].price,
        paymentMethod: selectedPaymentMethod,
        transactionId: transactionId.trim(),
        paymentNumber: paymentNumber.trim(),
        paymentDate: paymentDate,
        screenshotUrl: "",
        status: "pending",
        createdAt: now,
        processedAt: null,
        processedBy: null,
        rejectionReason: null,
      };

      const { error } = await supabase
        .from("payment_requests")
        .insert(paymentRequest);
      if (error) throw error;
      console.log("Payment request submitted");

      setSubmitSuccess(true);
      setSelectedPlan(null);
      setSelectedPaymentMethod(null);
      setTransactionId("");
      setPaymentNumber("");
      setPaymentDate("");
    } catch (err) {
      console.error("Payment submission error:", err);
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(`পেমেন্ট রিকোয়েস্ট পাঠেতে সমস্যা했습니다: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSubscriptionStatus = () => {
    if (isAdmin) return { label: "Admin (Unlimited)", color: "bg-primary" };
    if (userData?.subscriptionStatus === "active") return { label: "Active", color: "bg-success" };
    if (userData?.subscriptionStatus === "payment_due") return { label: "Payment Due", color: "bg-destructive" };
    return { label: "Demo", color: "bg-secondary" };
  };

  const status = getSubscriptionStatus();

  if (submitSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-10 pb-10 text-center">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-2xl font-bold mb-2">পেমেন্ট রিকোয়েস্ট পাঠানো হয়েছে!</h2>
            <p className="text-muted-foreground mb-6">
              আমরা আপনার পেমেন্ট যাচাই করে ২৪ ঘণ্টার মধ্যে সাবস্ক্রিপশন একটিভেট করব।
            </p>
            <div className="bg-muted p-4 rounded-lg text-sm text-left mb-6">
              <p className="font-medium mb-2">কি হবে এরপর?</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>1. আমরা আপনার Transaction ID যাচাই করব</li>
                <li>2. Payment confirm হলে আপনাকে email করা হবে</li>
                <li>3. আপনার সাবস্ক্রিপশন অটো একটিভেট হয়ে যাবে</li>
              </ul>
            </div>
            <Button onClick={() => setSubmitSuccess(false)}>
              আরেকটি রিকোয়েস্ট পাঠান
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            আপনার সাবস্ক্রিপশন
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-muted-foreground">Status:</span>
                <Badge className={status.color}>{status.label}</Badge>
              </div>
              {userData?.subscriptionPlan && (
                <p className="text-sm text-muted-foreground">
                  Plan: {PRICING_PLANS[userData.subscriptionPlan]?.nameBn || userData.subscriptionPlan}
                </p>
              )}
               {userData?.subscriptionExpiry && (
                 <p className="text-sm text-muted-foreground flex items-center gap-1">
                   <Clock className="h-3 w-3" />
                   Expires: {new Date(userData.subscriptionExpiry).toLocaleDateString("bn-BD")}
                 </p>
               )}
            </div>
            {isAdmin && (
              <Badge variant="outline" className="text-xs">
                Admin - Unlimited Access
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Show payment form for demo or payment_due users */}
      {!isAdmin && ["demo", "payment_due"].includes(userData?.subscriptionStatus || "") && (
        <>
          {/* Pricing Plans */}
          <Card>
            <CardHeader>
              <CardTitle>প্যাকেজ বেছে নিন</CardTitle>
              <CardDescription>আপনার প্রয়োজন অনুযায়ী প্যাকেজ সিলেক্ট করুন</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {(Object.entries(PRICING_PLANS) as [SubscriptionPlan, typeof PRICING_PLANS[SubscriptionPlan]][]).map(
                  ([key, plan]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedPlan(key)}
                      className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                        selectedPlan === key
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {selectedPlan === key && (
                        <div className="absolute top-2 right-2">
                          <Check className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      {"discount" in plan && (
                        <Badge className="absolute -top-2 left-4 text-xs bg-success">
                          {plan.discount} ছাড়
                        </Badge>
                      )}
                      <h3 className="font-semibold mt-1">{plan.nameBn}</h3>
                      <div className="mt-2">
                        <span className="text-2xl font-bold">৳{plan.price}</span>
                        <span className="text-muted-foreground text-sm">
                          /{plan.duration === 1 ? "মাস" : plan.duration === 12 ? "বছর" : "২ বছর"}
                        </span>
                      </div>
                      {"discount" in plan && (
                        <p className="text-xs text-success mt-1">
                          মাত্র ৳{Math.round(plan.price / plan.duration)}/মাস
                        </p>
                      )}
                    </button>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Selection */}
          {selectedPlan && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  পেমেন্ট মেথড সিলেক্ট করুন
                </CardTitle>
                <CardDescription>
                  নিচের যেকোনো নম্বরে Send Money করুন
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3 mb-6">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setSelectedPaymentMethod(method.id)}
                      className={`relative p-4 rounded-lg border-2 text-center transition-all ${
                        selectedPaymentMethod === method.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {selectedPaymentMethod === method.id && (
                        <div className="absolute top-2 right-2">
                          <Check className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div
                        className={`${method.color} w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center`}
                      >
                        <span className="text-white font-bold text-lg">{method.name[0]}</span>
                      </div>
                      <h3 className="font-semibold">{method.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{method.number}</p>
                    </button>
                  ))}
                </div>

                {selectedPaymentMethod && (
                  <div className="bg-muted p-4 rounded-lg mb-6">
                    <p className="font-medium mb-2">পেমেন্ট করার নিয়ম:</p>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside mb-4">
                      <li>
                        {paymentMethods.find((m) => m.id === selectedPaymentMethod)?.name} অ্যাপ ওপেন করুন
                      </li>
                      <li>Send Money অপশনে যান</li>
                      <li>
                        নম্বর:{" "}
                        <span className="font-mono font-medium text-foreground">
                          {paymentMethods.find((m) => m.id === selectedPaymentMethod)?.number}
                        </span>
                      </li>
                      <li>
                        Amount:{" "}
                        <span className="font-medium text-foreground">
                          ৳{PRICING_PLANS[selectedPlan].price}
                        </span>
                      </li>
                      <li>Reference এ আপনার email দিন</li>
                      <li>পেমেন্ট কনফার্ম করুন</li>
                    </ol>
                    <div className="bg-background border border-primary/30 rounded-lg p-3">
                      <p className="text-sm font-medium mb-1">এই নাম্বারে টাকা পাঠান:</p>
                      <p className="text-lg font-bold text-primary">
                        {paymentMethods.find((m) => m.id === selectedPaymentMethod)?.number}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment Confirmation Form */}
          {selectedPlan && selectedPaymentMethod && (
            <Card>
               <CardHeader>
                 <CardTitle>পেমেন্ট কনফার্ম করুন</CardTitle>
                 <CardDescription>
                   পেমেন্ট করার পর Transaction ID দিন
                 </CardDescription>
               </CardHeader>
               <CardContent>
                 <form onSubmit={handleSubmit}>
                   <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="transactionId">Transaction ID *</FieldLabel>
                        <Input
                          id="transactionId"
                          placeholder="যেমন: 8N7XXXXXX"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          required
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {paymentMethods.find((m) => m.id === selectedPaymentMethod)?.name} থেকে পাওয়া
                          Transaction ID দিন
                        </p>
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="paymentNumber">পেমেন্টের নম্বর *</FieldLabel>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="paymentNumber"
                            type="tel"
                            placeholder="যেমন: 017XXXXXXXX"
                            value={paymentNumber}
                            onChange={(e) => setPaymentNumber(e.target.value)}
                            className="pl-10"
                            required
                            pattern="(01|\\+8801)[3-9][0-9]{8}"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          যে নম্বর থেকে টাকা পাঠিয়েছেন
                        </p>
                       </Field>

                       {error && (
                         <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
                           <AlertCircle className="h-4 w-4 text-destructive" />
                           <p className="text-sm text-destructive">{error}</p>
                         </div>
                       )}

                     <div className="bg-muted p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">মোট পেমেন্ট:</span>
                        <span className="text-xl font-bold">৳{PRICING_PLANS[selectedPlan].price}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {PRICING_PLANS[selectedPlan].nameBn} প্যাকেজ ({PRICING_PLANS[selectedPlan].duration}{" "}
                        মাস)
                      </p>
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? <Spinner className="mr-2" /> : null}
                      পেমেন্ট রিকোয়েস্ট পাঠান
                    </Button>
                  </FieldGroup>
                </form>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Already subscribed message */}
      {!isAdmin && userData?.subscriptionStatus === "active" && (
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">আপনার সাবস্ক্রিপশন একটিভ আছে!</h3>
            <p className="text-muted-foreground">
              আপনি সব ফিচার ব্যবহার করতে পারবেন। ধন্যবাদ PropManager ব্যবহার করার জন্য।
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
