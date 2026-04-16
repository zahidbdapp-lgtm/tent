"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { 
  PRICING_PLANS, 
  SubscriptionPlan, 
  PaymentMethod,
  PaymentRequestFormData 
} from "@/types";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  Check,
  CheckCircle,
  CreditCard,
  Upload,
  AlertCircle,
  Clock,
  Smartphone,
} from "lucide-react";

const paymentMethods: { id: PaymentMethod; name: string; number: string; color: string }[] = [
  { id: "bkash", name: "bKash", number: "01XXXXXXXXX", color: "bg-[#E2136E]" },
  { id: "nagad", name: "Nagad", number: "01XXXXXXXXX", color: "bg-[#F6921E]" },
  { id: "rocket", name: "Rocket", number: "01XXXXXXXXX", color: "bg-[#8B2F89]" },
];

export default function SubscriptionPage() {
  const { user, userData, isAdmin } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Screenshot ফাইল 5MB এর বেশি হতে পারবে না।");
        return;
      }
      setScreenshot(file);
      setScreenshotPreview(URL.createObjectURL(file));
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userData || !selectedPlan || !selectedPaymentMethod || !transactionId || !screenshot) {
      setError("সব তথ্য পূরণ করুন।");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Upload screenshot to Firebase Storage
      const screenshotRef = ref(
        storage,
        `payment-screenshots/${user.uid}/${Date.now()}_${screenshot.name}`
      );
      await uploadBytes(screenshotRef, screenshot);
      const screenshotUrl = await getDownloadURL(screenshotRef);

      // Create payment request
      const paymentRequest: Omit<PaymentRequestFormData, "screenshotUrl"> & { 
        screenshotUrl: string;
        userId: string;
        userEmail: string;
        userName: string;
        amount: number;
        status: string;
        createdAt: ReturnType<typeof serverTimestamp>;
        processedAt: null;
        processedBy: null;
        rejectionReason: null;
      } = {
        userId: user.uid,
        userEmail: user.email || "",
        userName: userData.displayName,
        plan: selectedPlan,
        amount: PRICING_PLANS[selectedPlan].price,
        paymentMethod: selectedPaymentMethod,
        transactionId: transactionId.trim(),
        screenshotUrl,
        status: "pending",
        createdAt: serverTimestamp(),
        processedAt: null,
        processedBy: null,
        rejectionReason: null,
      };

      await addDoc(collection(db, "paymentRequests"), paymentRequest);

      setSubmitSuccess(true);
      setSelectedPlan(null);
      setSelectedPaymentMethod(null);
      setTransactionId("");
      setScreenshot(null);
      setScreenshotPreview(null);
    } catch (err) {
      console.error("Payment request error:", err);
      setError("পেমেন্ট রিকোয়েস্ট পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
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
                  Expires: {new Date(userData.subscriptionExpiry.toDate()).toLocaleDateString("bn-BD")}
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

      {/* Only show payment form for non-admin demo/expired users */}
      {!isAdmin && userData?.subscriptionStatus === "demo" && (
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
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
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
                  পেমেন্ট করার পর Transaction ID ও Screenshot দিন
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
                      <FieldLabel>Payment Screenshot *</FieldLabel>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                          screenshotPreview ? "border-primary" : "border-border hover:border-primary/50"
                        }`}
                      >
                        {screenshotPreview ? (
                          <div className="space-y-2">
                            <img
                              src={screenshotPreview}
                              alt="Screenshot preview"
                              className="max-h-48 mx-auto rounded"
                            />
                            <p className="text-sm text-muted-foreground">ক্লিক করে অন্য ছবি দিন</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              Screenshot আপলোড করতে ক্লিক করুন
                            </p>
                            <p className="text-xs text-muted-foreground">PNG, JPG (Max 5MB)</p>
                          </div>
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
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

                    <Button type="submit" className="w-full" disabled={isSubmitting || !screenshot}>
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
