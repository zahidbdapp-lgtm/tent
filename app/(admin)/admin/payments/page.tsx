"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
 import { Textarea } from "@/components/ui/textarea";
 import { supabase } from "@/lib/supabaseClient";
 import { PaymentRequest, PRICING_PLANS } from "@/types";
 import { useAuth } from "@/contexts/auth-context";
 import { typescriptUserToDatabaseUser } from "@/lib/supabase/userConverter";
 import { typescriptPaymentRequestToDatabase, databasePaymentRequestsToTypescript } from "@/lib/supabase/paymentRequestConverter";
 import { Spinner } from "@/components/ui/spinner";
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

export default function AdminPaymentsPage() {
  const { user: currentUser } = useAuth();
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedPayment, setSelectedPayment] = useState<PaymentRequest | null>(null);
  const [actionDialog, setActionDialog] = useState<"approve" | "reject" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchPayments();
    }
  }, [mounted]);

  useEffect(() => {
    let filtered = payments;

    // Filter by tab
    if (activeTab !== "all") {
      filtered = filtered.filter((p) => p.status === activeTab);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.userName?.toLowerCase().includes(q) ||
          p.userEmail?.toLowerCase().includes(q) ||
          p.transactionId?.toLowerCase().includes(q)
      );
    }

    setFilteredPayments(filtered);
  }, [searchQuery, payments, activeTab]);

   const fetchPayments = async () => {
     try {
       const { data, error } = await supabase
         .from("payment_requests")
         .select("*")
         .order("created_at", { ascending: false });

       if (error) throw error;

       // Convert database format (snake_case) to TypeScript format (camelCase)
       const paymentsData = databasePaymentRequestsToTypescript(data || []);

       console.log("[fetchPayments] Fetched and converted payments:", paymentsData);
       setPayments(paymentsData);
     } catch (error) {
       console.error("Error fetching payments:", error);
     } finally {
       setLoading(false);
     }
   };

   const handleApprove = async () => {
     if (!selectedPayment || !currentUser) return;
     setIsProcessing(true);
     setErrorMessage(null);

     try {
       const now = new Date().toISOString();
       const duration = PRICING_PLANS[selectedPayment.plan].duration;
       const startDate = now;
       const expiryDate = new Date();
       expiryDate.setMonth(expiryDate.getMonth() + duration);
       const expiryIso = expiryDate.toISOString();

       console.log("[handleApprove] Approving payment:", {
         paymentId: selectedPayment.id,
         userId: selectedPayment.userId,
         status: "approved",
       });

       // Update payment request status using converter
       const paymentUpdates = typescriptPaymentRequestToDatabase({
         status: "approved",
         processedAt: now,
         processedBy: currentUser.id,
       });

       const { error: paymentError } = await supabase
         .from("payment_requests")
         .update(paymentUpdates)
         .eq("id", selectedPayment.id);

       if (paymentError) {
         console.error("[handleApprove] Payment update error:", paymentError);
         throw new Error(`Payment update failed: ${paymentError.message}`);
       }

       // Update user subscription using converter
       const userUpdates = typescriptUserToDatabaseUser({
         subscriptionStatus: "active",
         subscriptionPlan: selectedPayment.plan,
         subscriptionStartDate: startDate,
         subscriptionExpiry: expiryIso,
         updatedAt: now,
         rejectionReason: null,
       });

       const { error: userError } = await supabase
         .from("users")
         .update(userUpdates)
         .eq("id", selectedPayment.userId);

       if (userError) {
         console.error("[handleApprove] User update error:", userError);
         throw new Error(`User update failed: ${userError.message}`);
       }

       console.log("[handleApprove] Success!");
       setSuccessMessage("পেমেন্ট সফলভাবে এপ্রুভ হয়েছে!");
       
       setTimeout(() => {
         setSuccessMessage(null);
       }, 3000);

       await fetchPayments();
       setActionDialog(null);
       setSelectedPayment(null);
     } catch (error) {
       const errorMsg = error instanceof Error ? error.message : "পেমেন্ট এপ্রুভ করতে সমস্যা হয়েছে";
       console.error("[handleApprove] Error:", errorMsg);
       setErrorMessage(errorMsg);
     } finally {
       setIsProcessing(false);
     }
   };

   const handleReject = async () => {
     if (!selectedPayment || !currentUser) return;
     setIsProcessing(true);
     setErrorMessage(null);

     try {
       const now = new Date().toISOString();
       
       console.log("[handleReject] Rejecting payment:", {
         paymentId: selectedPayment.id,
         reason: rejectionReason.trim() || "পেমেন্ট যাচাই করা যায়নি",
       });

       const paymentUpdates = typescriptPaymentRequestToDatabase({
         status: "rejected",
         processedAt: now,
         processedBy: currentUser.id,
         rejectionReason: rejectionReason.trim() || "পেমেন্ট যাচাই করা যায়নি",
       });

       const { error } = await supabase
         .from("payment_requests")
         .update(paymentUpdates)
         .eq("id", selectedPayment.id);

       if (error) {
         console.error("[handleReject] Rejection error:", error);
         throw new Error(`Rejection failed: ${error.message}`);
       }

       console.log("[handleReject] Success!");
       setSuccessMessage("পেমেন্ট রিজেক্ট হয়েছে!");
       
       setTimeout(() => {
         setSuccessMessage(null);
       }, 3000);

       await fetchPayments();
       setActionDialog(null);
       setSelectedPayment(null);
       setRejectionReason("");
     } catch (error) {
       const errorMsg = error instanceof Error ? error.message : "পেমেন্ট রিজেক্ট করতে সমস্যা হয়েছে";
       console.error("[handleReject] Error:", errorMsg);
       setErrorMessage(errorMsg);
     } finally {
       setIsProcessing(false);
     }
   };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-success gap-1">
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1 bg-warning text-warning-foreground">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
    }
  };

  const getPaymentMethodBadge = (method?: string | null) => {
    // সমাধান: যদি method null বা undefined হয়, তবে Unknown রিটার্ন করবে
    if (!method) {
      return <Badge variant="secondary">Unknown</Badge>;
    }

    const colors: Record<string, string> = {
      bkash: "bg-[#E2136E] text-white hover:bg-[#E2136E]/80",
      nagad: "bg-[#F6921E] text-white hover:bg-[#F6921E]/80",
      rocket: "bg-[#8B2F89] text-white hover:bg-[#8B2F89]/80",
    };

    const normalizedMethod = method.toLowerCase();

    return (
      <Badge className={colors[normalizedMethod] || "bg-secondary"}>
        {method.charAt(0).toUpperCase() + method.slice(1)}
      </Badge>
    );
  };

  const pendingCount = payments.filter((p) => p.status === "pending").length;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-success/10 border border-success/20 text-success p-4 rounded-lg flex items-start gap-3">
          <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <p className="font-medium">{successMessage}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-warning">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-success">
              {payments.filter((p) => p.status === "approved").length}
            </div>
            <p className="text-xs text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-destructive">
              {payments.filter((p) => p.status === "rejected").length}
            </div>
            <p className="text-xs text-muted-foreground">Rejected</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{payments.length}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Alert */}
      {pendingCount > 0 && (
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-warning" />
            <p className="font-medium">{pendingCount}টি পেমেন্ট রিকোয়েস্ট ভেরিফিকেশনের অপেক্ষায়</p>
          </div>
        </div>
      )}

      {/* Tabs and Search */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending" className="gap-1">
              Pending
              {pendingCount > 0 && (
                <span className="ml-1 bg-warning text-warning-foreground text-xs px-1.5 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="নাম, ইমেইল বা Transaction ID দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Payment Cards */}
      {mounted && (
      <div className="grid gap-4">
        {filteredPayments.map((payment) => (
          <Card key={payment.id}>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex-1 space-y-4">
                  {/* Status and Plan Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusBadge(payment.status)}
                    {getPaymentMethodBadge(payment.paymentMethod)}
                    <Badge variant="outline">
                      {PRICING_PLANS[payment.plan]?.nameBn || payment.plan}
                    </Badge>
                  </div>

                  {/* User Information */}
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">ব্যবহারকারীর নাম</p>
                    <p className="font-semibold text-base">{payment.userName}</p>
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">ইমেইল</p>
                    <p className="text-sm font-mono break-all">{payment.userEmail}</p>
                  </div>

                  {/* Payment Details Grid */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    {/* Transaction ID */}
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">লেনদেন আইডি</p>
                      <p className="text-sm font-mono font-bold break-all">{payment.transactionId}</p>
                    </div>

                    {/* Payment Number */}
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">পেমেন্ট নম্বর</p>
                      <p className="text-sm font-mono font-bold break-all">{payment.paymentNumber || "-"}</p>
                    </div>

                    {/* Amount */}
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">পরিমাণ</p>
                      <p className="text-sm font-semibold">৳{payment.amount}</p>
                    </div>

                    {/* Payment Date */}
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">পেমেন্ট তারিখ</p>
                      <p className="text-sm">
                        {payment.paymentDate
                          ? new Date(payment.paymentDate).toLocaleDateString("bn-BD")
                          : "-"}
                      </p>
                    </div>
                  </div>

                  {/* Request Date */}
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">অনুরোধের তারিখ</p>
                    <p className="text-xs">
                      {payment.createdAt
                        ? new Date(payment.createdAt).toLocaleString("bn-BD")
                        : "-"}
                    </p>
                  </div>

                  {/* Rejection Reason */}
                  {payment.rejectionReason && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded p-2 mt-2">
                      <p className="text-xs text-destructive font-semibold mb-1">অস্বীকার কারণ:</p>
                      <p className="text-xs text-destructive">{payment.rejectionReason}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 md:min-w-fit">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewImage(payment.screenshotUrl)}
                    className="gap-1 w-full md:w-auto"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Screenshot দেখুন
                  </Button>

                  {payment.status === "pending" && (
                    <div className="flex flex-col md:flex-row gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setActionDialog("approve");
                        }}
                        className="bg-success hover:bg-success/90 w-full md:w-auto"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setActionDialog("reject");
                        }}
                        className="w-full md:w-auto"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredPayments.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              কোনো পেমেন্ট রিকোয়েস্ট পাওয়া যায়নি
            </CardContent>
          </Card>
        )}
      </div>
      )}

      {/* Approve Dialog */}
      <Dialog open={actionDialog === "approve"} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>পেমেন্ট Approve করুন</DialogTitle>
            <DialogDescription>
              আপনি কি নিশ্চিত {selectedPayment?.userName} এর পেমেন্ট approve করতে চান?
            </DialogDescription>
          </DialogHeader>
          {errorMessage && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}
          {selectedPayment && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p>
                <strong>User:</strong> {selectedPayment.userName}
              </p>
              <p>
                <strong>Email:</strong> {selectedPayment.userEmail}
              </p>
              <p>
                <strong>Plan:</strong> {PRICING_PLANS[selectedPayment.plan]?.nameBn}
              </p>
              <p>
                <strong>Amount:</strong> ৳{selectedPayment.amount}
              </p>
              <p>
                <strong>Transaction ID:</strong> {selectedPayment.transactionId}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isProcessing} className="bg-success hover:bg-success/90">
              {isProcessing ? <Spinner className="mr-2" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Approve & Activate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={actionDialog === "reject"} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>পেমেন্ট Reject করুন</DialogTitle>
            <DialogDescription>
              {selectedPayment?.userName} এর পেমেন্ট reject করার কারণ লিখুন
            </DialogDescription>
          </DialogHeader>
          {errorMessage && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}
          <Textarea
            placeholder="Rejection কারণ (optional)"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isProcessing}>
              {isProcessing ? <Spinner className="mr-2" /> : <XCircle className="mr-2 h-4 w-4" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Screenshot Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Payment Screenshot</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="flex justify-center">
              <img
                src={previewImage}
                alt="Payment screenshot"
                className="max-h-[70vh] rounded-lg object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
