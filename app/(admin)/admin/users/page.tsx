"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabaseClient";
import { User, SubscriptionStatus, SubscriptionPlan, PRICING_PLANS } from "@/types";
 import { databaseUserToTypescriptUser, typescriptUserToDatabaseUser } from "@/lib/supabase/userConverter";
import {
  Search,
  MoreHorizontal,
  Shield,
  CheckCircle,
  AlertTriangle,
  Ban,
  Calendar,
  CreditCard,
  Edit2,
  Trash2,
  X,
  Loader2,
  Eye,
  Clock,
  UserCheck,
  UserX,
  Lock,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Spinner } from "@/components/ui/spinner";

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    type: "activate" | "deactivate" | "extend" | "details" | "delete" | "change_password" | null;
    plan?: SubscriptionPlan;
  }>({ type: null });
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = users;
    
    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((u) => u.subscriptionStatus === statusFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.displayName?.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query) ||
          u.phone?.includes(query) ||
          u.paymentTransactionId?.toLowerCase().includes(query)
      );
    }
    
    setFilteredUsers(filtered);
  }, [searchQuery, users, statusFilter]);

  const fetchUsers = async () => {
    console.log("[fetchUsers] Starting...");
    try {
      console.log("[fetchUsers] Querying users table...");
      const { data, error, status, statusText } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      console.log("[fetchUsers] Response:", { 
        dataLength: data?.length, 
        errorObj: error,
        errorString: JSON.stringify(error),
        status,
        statusText
      });

      if (error) {
        console.error("[fetchUsers] Full error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          status: error.status
        });
        throw error;
      }

      // Convert database format (snake_case) to TypeScript format (camelCase)
      const usersData = (data || [])
        .map(dbUser => databaseUserToTypescriptUser(dbUser))
        .filter((user): user is User => user !== null);

      console.log("[fetchUsers] Fetched", usersData.length, "users");
      console.log("[fetchUsers] First user data:", usersData[0]);
      setUsers(usersData);
    } catch (error) {
      console.error("[fetchUsers] Caught error:", error);
      console.error("[fetchUsers] Error type:", typeof error);
      if (error instanceof Error) {
        console.error("[fetchUsers] Error.name:", error.name);
        console.error("[fetchUsers] Error.message:", error.message);
      } else {
        console.error("[fetchUsers] Not an Error object. Inspecting:");
        for (let key in error) {
          console.error(`[fetchUsers] error.${key}:`, error[key]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: SubscriptionStatus, reason?: string) => {
    if (!selectedUser) return;
    setIsProcessing(true);

    try {
      const now = new Date().toISOString();
      
      // Build update object in camelCase
      const updateData: Partial<User> = {
        subscriptionStatus: newStatus,
        updatedAt: now,
      };
      
      if (newStatus === "banned" || newStatus === "payment_due") {
        updateData.rejectionReason = reason || null;
      } else {
        updateData.rejectionReason = null;
      }

      if (newStatus === "active" && !selectedUser.subscriptionStartDate) {
        updateData.subscriptionStartDate = now;
      }

      const dbUpdates = typescriptUserToDatabaseUser(updateData);

      const { error } = await supabase
        .from("users")
        .update(dbUpdates)
        .eq("id", selectedUser.id);

      if (error) throw error;

      await fetchUsers();
      setActionDialog({ type: null });
      setSelectedUser(null);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Status পরিবর্তন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleActivateSubscription = async (plan: SubscriptionPlan) => {
    if (!selectedUser) return;
    setIsProcessing(true);

    try {
      const duration = PRICING_PLANS[plan].duration;
      const startDate = new Date().toISOString();
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + duration);
      const expiryIso = expiryDate.toISOString();

      const updateData = {
        subscriptionStatus: "active" as const,
        subscriptionPlan: plan,
        subscriptionStartDate: startDate,
        subscriptionExpiry: expiryIso,
        updatedAt: startDate,
        rejectionReason: null,
      };

      const dbUpdates = typescriptUserToDatabaseUser(updateData);

      const { error } = await supabase
        .from("users")
        .update(dbUpdates)
        .eq("id", selectedUser.id);

      if (error) throw error;

      await fetchUsers();
      setActionDialog({ type: null });
      setSelectedUser(null);
    } catch (error) {
      console.error("Error activating subscription:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeactivateSubscription = async () => {
    if (!selectedUser) return;
    setIsProcessing(true);

    try {
      const now = new Date().toISOString();
      const updateData = {
        subscriptionStatus: "payment_due" as const,
        updatedAt: now,
        rejectionReason: null,
      };
      
      const dbUpdates = typescriptUserToDatabaseUser(updateData);

      const { error } = await supabase
        .from("users")
        .update(dbUpdates)
        .eq("id", selectedUser.id);

      if (error) throw error;

      await fetchUsers();
      setActionDialog({ type: null });
      setSelectedUser(null);
    } catch (error) {
      console.error("Error deactivating subscription:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExtendSubscription = async (months: number) => {
    if (!selectedUser) return;
    setIsProcessing(true);

    try {
      const currentExpiry = selectedUser.subscriptionExpiry ? new Date(selectedUser.subscriptionExpiry) : new Date();
      const newExpiry = new Date(currentExpiry);
      newExpiry.setMonth(newExpiry.getMonth() + months);
      const newExpiryIso = newExpiry.toISOString();
      const now = new Date().toISOString();

      const updateData = {
        subscriptionExpiry: newExpiryIso,
        subscriptionStatus: "active" as const,
        updatedAt: now,
      };

      const dbUpdates = typescriptUserToDatabaseUser(updateData);

      const { error } = await supabase
        .from("users")
        .update(dbUpdates)
        .eq("id", selectedUser.id);

      if (error) throw error;

      await fetchUsers();
      setActionDialog({ type: null });
      setSelectedUser(null);
    } catch (error) {
      console.error("Error extending subscription:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setIsProcessing(true);

    try {
      const response = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: selectedUser.id }),
      });

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`সার্ভার একটি অপ্রত্যাশিত প্রতিক্রিয়া পাঠিয়েছে। স্ট্যাটাস: ${response.status}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "ইউজার ডিলিট করতে সমস্যা হয়েছে");
      }

      await fetchUsers();
      setActionDialog({ type: null });
      setSelectedUser(null);
      alert("ইউজার এবং সব ডেটা সফলভাবে ডিলিট হয়েছে");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert(error instanceof Error ? error.message : "ইউজার ডিলিট করতে সমস্যা হয়েছে");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChangePassword = async () => {
    if (!selectedUser || !newPassword.trim()) return;
    setIsProcessing(true);

    try {
      const response = await fetch("/api/admin/change-user-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          newPassword: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to change password");
      }

      setNewPassword("");
      setActionDialog({ type: null });
      setSelectedUser(null);
      alert(`${selectedUser.displayName} এর পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে`);
    } catch (error: any) {
      console.error("Error changing password:", error);
      alert(error.message || "পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে");
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (user: User) => {
    if (user.role === "admin") {
      return <Badge className="bg-primary">Admin</Badge>;
    }
    switch (user.subscriptionStatus) {
      case "active":
        return <Badge className="bg-success">Active</Badge>;
      case "payment_pending":
        return <Badge className="bg-warning text-warning-foreground">Payment Pending</Badge>;
      case "banned":
        return <Badge variant="destructive">Banned</Badge>;
      case "payment_due":
        return <Badge variant="destructive">Payment Due</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("bn-BD", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        <Card>
          <CardContent className="p-0">
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setStatusFilter("all")}>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">মোট ইউজার</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setStatusFilter("active")}>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-success">
              {users.filter((u) => u.subscriptionStatus === "active").length}
            </div>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setStatusFilter("payment_pending")}>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-warning">
              {users.filter((u) => u.subscriptionStatus === "payment_pending").length}
            </div>
            <p className="text-xs text-muted-foreground">Payment Pending</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setStatusFilter("payment_due")}>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-orange-500">
              {users.filter((u) => u.subscriptionStatus === "payment_due").length}
            </div>
            <p className="text-xs text-muted-foreground">Payment Due</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setStatusFilter("banned")}>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-destructive">
              {users.filter((u) => u.subscriptionStatus === "banned").length}
            </div>
            <p className="text-xs text-muted-foreground">Banned</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="নাম, ইমেইল, ফোন বা Transaction ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {statusFilter !== "all" && (
          <Button variant="outline" onClick={() => setStatusFilter("all")}>
            Filter Clear করুন
          </Button>
        )}
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            সব ইউজার ({filteredUsers.length})
            {statusFilter !== "all" && (
              <Badge variant="outline" className="ml-2 capitalize">
                {statusFilter}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ইউজার</TableHead>
                  <TableHead>ফোন</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Payment Info</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.displayName}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{user.phone || "-"}</TableCell>
                    <TableCell>{getStatusBadge(user)}</TableCell>
                    <TableCell className="text-sm">
                      {user.subscriptionPlan
                        ? PRICING_PLANS[user.subscriptionPlan]?.nameBn
                        : "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(user.subscriptionStartDate)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(user.subscriptionExpiry)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {user.paymentTransactionId ? (
                        <div className="text-xs">
                          <p className="font-mono">{user.paymentTransactionId}</p>
                          <p className="text-muted-foreground">{user.paymentMethod} - ৳{user.paymentAmount}</p>
                        </div>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {user.role !== "admin" && user.id !== currentUser?.uid && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            {/* View Details */}
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setActionDialog({ type: "details" });
                              }}
                            >
                              <CreditCard className="mr-2 h-4 w-4" />
                              বিস্তারিত দেখুন
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            {/* Status Change Options */}
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                handleStatusChange("active");
                              }}
                              disabled={user.subscriptionStatus === "active"}
                            >
                              <CheckCircle className="mr-2 h-4 w-4 text-success" />
                              Active
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                handleStatusChange("payment_pending");
                              }}
                              disabled={user.subscriptionStatus === "payment_pending"}
                            >
                              <Clock className="mr-2 h-4 w-4 text-warning" />
                              Payment Pending
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                const reason = window.prompt("Payment Due এর কারণ লিখুন (ইউজার দেখবে):");
                                if (reason !== null) {
                                  setSelectedUser(user);
                                  handleStatusChange("payment_due", reason);
                                }
                              }}
                              disabled={user.subscriptionStatus === "payment_due"}
                            >
                              <AlertTriangle className="mr-2 h-4 w-4 text-orange-500" />
                              Payment Due
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                const reason = window.prompt("Banned এর কারণ লিখুন (ইউজার দেখবে):");
                                if (reason !== null) {
                                  setSelectedUser(user);
                                  handleStatusChange("banned", reason);
                                }
                              }}
                              disabled={user.subscriptionStatus === "banned"}
                              className="text-destructive"
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Banned
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {/* Subscription Actions */}
                            {user.subscriptionStatus !== "active" && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setActionDialog({ type: "activate" });
                                }}
                              >
                                <UserCheck className="mr-2 h-4 w-4" />
                                Subscription একটিভেট
                              </DropdownMenuItem>
                            )}
                            
                            {user.subscriptionStatus === "active" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setActionDialog({ type: "extend" });
                                  }}
                                >
                                  <Calendar className="mr-2 h-4 w-4" />
                                  সময় বাড়ান
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setActionDialog({ type: "deactivate" });
                                  }}
                                  className="text-destructive"
                                >
                                  <UserX className="mr-2 h-4 w-4" />
                                  Deactivate করুন
                                </DropdownMenuItem>
                              </>
                            )}

                            <DropdownMenuSeparator />

                            {/* Change Password */}
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setActionDialog({ type: "change_password" });
                              }}
                            >
                              <Lock className="mr-2 h-4 w-4 text-blue-600" />
                              পাসওয়ার্ড পরিবর্তন করুন
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {/* Delete User */}
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setActionDialog({ type: "delete" });
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              ইউজার ডিলিট করুন
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      কোনো ইউজার পাওয়া যায়নি
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog
        open={actionDialog.type === "details"}
        onOpenChange={() => setActionDialog({ type: null })}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ইউজার বিস্তারিত</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">নাম</p>
                  <p className="font-medium">{selectedUser.displayName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">ফোন</p>
                  <p className="font-medium">{selectedUser.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  {getStatusBadge(selectedUser)}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Subscription তথ্য</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Plan</p>
                    <p className="font-medium">
                      {selectedUser.subscriptionPlan 
                        ? PRICING_PLANS[selectedUser.subscriptionPlan]?.nameBn 
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Amount</p>
                    <p className="font-medium">
                      {selectedUser.paymentAmount 
                        ? `৳${selectedUser.paymentAmount}` 
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Start Date</p>
                    <p className="font-medium">{formatDate(selectedUser.subscriptionStartDate)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">End Date</p>
                    <p className="font-medium">{formatDate(selectedUser.subscriptionExpiry)}</p>
                  </div>
                </div>
              </div>

              {selectedUser.paymentTransactionId && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Payment তথ্য</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Method</p>
                      <p className="font-medium capitalize">{selectedUser.paymentMethod}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Number</p>
                      <p className="font-medium">{selectedUser.paymentNumber || "-"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Transaction ID</p>
                      <p className="font-medium font-mono">{selectedUser.paymentTransactionId}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Payment Date</p>
                      <p className="font-medium">{formatDate(selectedUser.paymentDate)}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Joined</p>
                    <p className="font-medium">{formatDate(selectedUser.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Updated</p>
                    <p className="font-medium">{formatDate(selectedUser.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Activate Dialog */}
      <Dialog
        open={actionDialog.type === "activate"}
        onOpenChange={() => setActionDialog({ type: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subscription একটিভেট করুন</DialogTitle>
            <DialogDescription>
              {selectedUser?.displayName} ({selectedUser?.email}) এর জন্য প্যাকেজ সিলেক্ট করুন
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            {(Object.entries(PRICING_PLANS) as [SubscriptionPlan, typeof PRICING_PLANS[SubscriptionPlan]][]).map(
              ([key, plan]) => (
                <Button
                  key={key}
                  variant="outline"
                  className="justify-between"
                  onClick={() => handleActivateSubscription(key)}
                  disabled={isProcessing}
                >
                  <span>{plan.nameBn}</span>
                  <span className="text-muted-foreground">৳{plan.price} ({plan.duration} মাস)</span>
                </Button>
              )
            )}
          </div>
          {isProcessing && (
            <div className="flex items-center justify-center py-4">
              <Spinner />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Extend Dialog */}
      <Dialog
        open={actionDialog.type === "extend"}
        onOpenChange={() => setActionDialog({ type: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>সময় বাড়ান</DialogTitle>
            <DialogDescription>
              {selectedUser?.displayName} এর subscription সময় কতদিন বাড়াতে চান?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Button variant="outline" onClick={() => handleExtendSubscription(1)} disabled={isProcessing}>
              ১ মাস বাড়ান
            </Button>
            <Button variant="outline" onClick={() => handleExtendSubscription(3)} disabled={isProcessing}>
              ৩ মাস বাড়ান
            </Button>
            <Button variant="outline" onClick={() => handleExtendSubscription(6)} disabled={isProcessing}>
              ৬ মাস বাড়ান
            </Button>
            <Button variant="outline" onClick={() => handleExtendSubscription(12)} disabled={isProcessing}>
              ১ বছর বাড়ান
            </Button>
          </div>
          {isProcessing && (
            <div className="flex items-center justify-center py-4">
              <Spinner />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Deactivate Dialog */}
      <Dialog
        open={actionDialog.type === "deactivate"}
        onOpenChange={() => setActionDialog({ type: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subscription Deactivate করুন</DialogTitle>
            <DialogDescription>
              আপনি কি নিশ্চিত {selectedUser?.displayName} এর subscription বন্ধ করতে চান?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ type: null })}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeactivateSubscription}
              disabled={isProcessing}
            >
              {isProcessing ? <Spinner className="mr-2" /> : null}
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog
        open={actionDialog.type === "delete"}
        onOpenChange={() => setActionDialog({ type: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ইউজার ডিলিট করুন</DialogTitle>
            <DialogDescription>
              আপনি কি নিশ্চিত যে {selectedUser?.displayName} ({selectedUser?.email}) কে সম্পূর্ণভাবে ডিলিট করতে চান?
            </DialogDescription>
          </DialogHeader>
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm">
            <p className="font-medium text-destructive mb-2">⚠️ সতর্কতা: সমস্ত ডেটা ডিলিট হবে</p>
            <ul className="text-sm text-destructive/80 space-y-1 ml-4 list-disc">
              <li>সব প্রপার্টি</li>
              <li>সব ভাড়াটিয়ার তথ্য</li>
              <li>সব বিল ও ইনভয়েস</li>
              <li>সব খরচের রেকর্ড</li>
              <li>সব টিকেট</li>
            </ul>
            <p className="mt-3 font-medium">এই কাজ আন্ডু করা যাবে না।</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ type: null })}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={isProcessing}
            >
              {isProcessing ? <Spinner className="mr-2" /> : null}
              স্থায়ীভাবে ডিলিট করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog
        open={actionDialog.type === "change_password"}
        onOpenChange={() => {
          setActionDialog({ type: null });
          setNewPassword("");
          setShowPassword(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>পাসওয়ার্ড পরিবর্তন করুন</DialogTitle>
            <DialogDescription>
              {selectedUser?.displayName} ({selectedUser?.email}) এর জন্য নতুন পাসওয়ার্ড সেট করুন
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">নতুন পাসওয়ার্ড</label>
              <div className="flex gap-2">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="কমপক্ষে ৬ অক্ষর"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isProcessing}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isProcessing}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
              {newPassword && newPassword.length < 6 && (
                <p className="text-xs text-destructive">পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActionDialog({ type: null });
                setNewPassword("");
                setShowPassword(false);
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={isProcessing || !newPassword || newPassword.length < 6}
            >
              {isProcessing ? <Spinner className="mr-2" /> : null}
              পাসওয়ার্ড পরিবর্তন করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
