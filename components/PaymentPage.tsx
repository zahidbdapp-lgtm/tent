"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, CheckCircle, CreditCard, Phone, User, MessageSquare } from "lucide-react";

interface TempUserData {
  fullName: string;
  phoneNumber: string;
  createdAt: string;
}

interface PaymentPageProps {
  tableName?: "profiles" | "users"; // Which table to upsert to
  onPaymentSuccess?: (userId: string) => void; // Callback after successful payment
}

export default function PaymentPage({
  tableName = "users",
  onPaymentSuccess,
}: PaymentPageProps) {
  // ===== STATE VARIABLES =====
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string>("");
  const [tempUserData, setTempUserData] = useState<TempUserData | null>(null);
  const [isUpserting, setIsUpserting] = useState(false);
  const [upsertError, setUpsertError] = useState<string>("");
  const [upsertSuccess, setUpsertSuccess] = useState(false);

  // Payment form fields
  const [paymentMethod, setPaymentMethod] = useState<string>("bkash");
  const [paymentNumber, setPaymentNumber] = useState<string>("");
  const [transactionId, setTransactionId] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>("");
  const [paymentError, setPaymentError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  // ===== STEP 1: CHECK SESSION & UPSERT PROFILE =====
  useEffect(() => {
    const initializePaymentPage = async () => {
      try {
        console.log("[PaymentPage] 🔍 Checking user session...");

        // Step 1: Get current session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("[PaymentPage] ❌ Session error:", sessionError);
          setSessionError("সেশন পেতে সমস্যা হয়েছে।");
          setIsSessionLoading(false);
          return;
        }

        if (!session?.user) {
          console.log("[PaymentPage] ⚠️ No user session found, redirecting to login");
          setSessionError("আপনি লগইন করা নেই। লগইন করতে হবে।");
          setTimeout(() => router.push("/register"), 2000);
          setIsSessionLoading(false);
          return;
        }

        console.log("[PaymentPage] ✅ Session found for user:", session.user.email);

        // Step 2: Get temp_user_data from localStorage
        const storedData = localStorage.getItem("temp_user_data");
        if (!storedData) {
          console.warn("[PaymentPage] ⚠️ No temp_user_data in localStorage");
          setIsSessionLoading(false);
          return;
        }

        const tempData: TempUserData = JSON.parse(storedData);
        console.log("[PaymentPage] ✅ temp_user_data retrieved:", tempData);
        setTempUserData(tempData);

        // Step 3: Upsert to Supabase
        setIsUpserting(true);
        console.log("[PaymentPage] 📤 Upserting to", tableName, "table...");

        const upsertPayload = {
          id: session.user.id,
          email: session.user.email,
          full_name: tempData.fullName,
          phone_number: tempData.phoneNumber,
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from(tableName)
          .upsert(upsertPayload, {
            onConflict: "id", // Upsert based on user id
          })
          .select();

        if (error) {
          console.error("[PaymentPage] ❌ Upsert error:", error);
          setUpsertError(`প্রোফাইল আপডেট ব্যর্থ: ${error.message}`);
          setIsUpserting(false);
          setIsSessionLoading(false);
          return;
        }

        console.log("[PaymentPage] ✅ Profile upserted successfully:", data);
        setUpsertSuccess(true);

        // Step 4: Remove temp_user_data from localStorage
        localStorage.removeItem("temp_user_data");
        console.log("[PaymentPage] 🗑️ temp_user_data removed from localStorage");

        setIsUpserting(false);
      } catch (err) {
        console.error("[PaymentPage] ❌ Unexpected error:", err);
        setSessionError("একটি অপ্রত্যাশিত ত্রুটি ঘটেছে।");
      } finally {
        setIsSessionLoading(false);
      }
    };

    initializePaymentPage();
  }, []);

  // ===== HANDLE PAYMENT SUBMISSION =====
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError("");

    // Validation
    if (!paymentMethod) {
      setPaymentError("পেমেন্ট মেথড নির্বাচন করুন।");
      return;
    }
    if (!paymentNumber.trim()) {
      setPaymentError("যে নম্বর থেকে পেমেন্ট করেছেন সেটা দিন।");
      return;
    }
    if (!transactionId.trim()) {
      setPaymentError("Transaction ID দিন।");
      return;
    }
    if (!paymentDate) {
      setPaymentError("পেমেন্ট তারিখ দিন।");
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("[PaymentPage] 💳 Processing payment...");
      
      // Get current session to get user id
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user.id) {
        setPaymentError("ইউজার সেশন নেই। আবার লগইন করুন।");
        setIsSubmitting(false);
        return;
      }

      // Here you would typically save payment details to a payment_requests table
      // For now, just show success
      console.log("[PaymentPage] ✅ Payment details would be saved:", {
        userId: session.user.id,
        paymentMethod,
        paymentNumber,
        transactionId,
        paymentDate,
      });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (onPaymentSuccess) {
        onPaymentSuccess(session.user.id);
      }

      // Redirect to success/pending page
      setTimeout(() => {
        router.push("/registration-pending");
      }, 1500);
    } catch (err) {
      console.error("[PaymentPage] ❌ Payment error:", err);
      setPaymentError("পেমেন্ট প্রসেস ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
      setIsSubmitting(false);
    }
  };

  // ===== RENDER LOADING STATE =====
  if (isSessionLoading || isUpserting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Spinner className="h-12 w-12 mb-4" />
            <p className="text-center text-muted-foreground">লোড হচ্ছে...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ===== RENDER ERROR STATE =====
  if (sessionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-sm text-destructive">{sessionError}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ===== RENDER PAYMENT PAGE =====
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">পেমেন্ট তথ্য দিন</CardTitle>
            <CardDescription>আপনার সাবস্ক্রিপশন সক্রিয় করতে পেমেন্ট নিশ্চিত করুন</CardDescription>
          </CardHeader>

          <CardContent>
            {/* User Info Display */}
            {tempUserData && upsertSuccess && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-start gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    প্রোফাইল সফলভাবে আপডেট হয়েছে
                  </p>
                </div>
                <div className="space-y-1 text-sm text-green-800 dark:text-green-200">
                  <p>
                    <strong>নাম:</strong> {tempUserData.fullName}
                  </p>
                  <p>
                    <strong>ফোন:</strong> {tempUserData.phoneNumber}
                  </p>
                </div>
              </div>
            )}

            {/* Upsert Error */}
            {upsertError && (
              <div className="mb-6 flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-destructive">{upsertError}</p>
              </div>
            )}

            {/* Payment Form */}
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              {/* Payment Error */}
              {paymentError && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-destructive">{paymentError}</p>
                </div>
              )}

              {/* Payment Method */}
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="paymentMethod">পেমেন্ট মেথড</FieldLabel>
                  <select
                    id="paymentMethod"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground disabled:opacity-50"
                  >
                    <option value="bkash">bKash</option>
                    <option value="nagad">Nagad</option>
                    <option value="rocket">Rocket</option>
                  </select>
                </Field>
              </FieldGroup>

              {/* Payment Number */}
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="paymentNumber">পেমেন্ট নম্বর</FieldLabel>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="paymentNumber"
                      type="tel"
                      placeholder="যে নম্বর থেকে পেমেন্ট করেছেন"
                      value={paymentNumber}
                      onChange={(e) => setPaymentNumber(e.target.value)}
                      disabled={isSubmitting}
                      className="pl-10"
                      required
                    />
                  </div>
                </Field>
              </FieldGroup>

              {/* Transaction ID */}
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="transactionId">Transaction ID</FieldLabel>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="transactionId"
                      type="text"
                      placeholder="TXN123456789"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      disabled={isSubmitting}
                      className="pl-10"
                      required
                    />
                  </div>
                </Field>
              </FieldGroup>

              {/* Payment Date */}
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="paymentDate">পেমেন্ট তারিখ</FieldLabel>
                  <Input
                    id="paymentDate"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </Field>
              </FieldGroup>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    প্রসেস হচ্ছে...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    পেমেন্ট সাবমিট করুন
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>নোট:</strong> পেমেন্ট সাবমিটের পর আপনার অ্যাকাউন্ট admin approval এর অপেক্ষায় থাকবে।
          </p>
        </div>
      </div>
    </div>
  );
}
