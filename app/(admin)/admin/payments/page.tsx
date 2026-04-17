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

  useEffect(() => {
    fetchPayments();
  }, []);

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
        .from("paymentRequests")
        .select("*")
        .order("createdAt", { ascending: false });

      if (error) throw error;

      setPayments((data as PaymentRequest[]) || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedPayment || !currentUser) return;
    setIsProcessing(true);

    try {
      const now = new Date().toISOString();
      const duration = PRICING_PLANS[selectedPayment.plan].duration;
      const startDate = now;
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + duration);
      const expiryIso = expiryDate.toISOString();

      // Update payment request status
      const { error: paymentError } = await supabase
        .from("paymentRequests")
        .update({
          status: "approved",
          processedAt: now,
          processedBy: currentUser.id,
        })
        .eq("id", selectedPayment.id);

      if (paymentError) throw paymentError;

      // Update user subscription
      const { error: userError } = await supabase
        .from("users")
        .update({
          subscriptionStatus: "active",
          subscriptionPlan: selectedPayment.plan,
          subscriptionStartDate: startDate,
          subscriptionExpiry: expiryIso,
          updatedAt: now,
        })
        .eq("id", selectedPayment.userId);

      if (userError) throw userError;

      await fetchPayments();
      setActionDialog(null);
      setSelectedPayment(null);
    } catch (error) {
      console.error("Error approving payment:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPayment || !currentUser) return;
    setIsProcessing(true);

    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("paymentRequests")
        .update({
          status: "rejected",
          processedAt: now,
          processedBy: currentUser.id,
          rejectionReason: rejectionReason.trim() || "পেমেন্ট যাচাই করা যায়নি",
        })
        .eq("id", selectedPayment.id);

      if (error) throw error;

      await fetchPayments();
      setActionDialog(null);
      setSelectedPayment(null);
      setRejectionReason("");
    } catch (error) {
      console.error("Error rejecting payment:", error);
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

  const getPaymentMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      bkash: "bg-[#E2136E] text-white",
      nagad: "bg-[#F6921E] text-white",
      rocket: "bg-[#8B2F89] text-white",
    };
    return (
      <Badge className={colors[method] || "bg-secondary"}>
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
      <div className="grid gap-4">
        {filteredPayments.map((payment) => (
          <Card key={payment.id}>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusBadge(payment.status)}
                    {getPaymentMethodBadge(payment.paymentMethod)}
                    <Badge variant="outline">
                      {PRICING_PLANS[payment.plan]?.nameBn || payment.plan}
                    </Badge>
                  </div>
                  <div>
                    <p className="font-medium">{payment.userName}</p>
                    <p className="text-sm text-muted-foreground">{payment.userEmail}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span>
                      <strong>TxID:</strong>{" "}
                      <span className="font-mono">{payment.transactionId}</span>
                    </span>
                    <span>
                      <strong>Amount:</strong> ৳{payment.amount}
                    </span>
                  </div>
                   <p className="text-xs text-muted-foreground">
                     {payment.createdAt
                       ? new Date(payment.createdAt).toLocaleString("bn-BD")
                       : "-"}
                   </p>
                  {payment.rejectionReason && (
                    <p className="text-sm text-destructive">
                      <strong>Rejection Reason:</strong> {payment.rejectionReason}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewImage(payment.screenshotUrl)}
                    className="gap-1"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Screenshot দেখুন
                  </Button>

                  {payment.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setActionDialog("approve");
                        }}
                        className="bg-success hover:bg-success/90"
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

      {/* Approve Dialog */}
      <Dialog open={actionDialog === "approve"} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>পেমেন্ট Approve করুন</DialogTitle>
            <DialogDescription>
              আপনি কি নিশ্চিত {selectedPayment?.userName} এর পেমেন্ট approve করতে চান?
            </DialogDescription>
          </DialogHeader>
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
