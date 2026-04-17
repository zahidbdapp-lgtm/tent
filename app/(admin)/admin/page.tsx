"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabaseClient";
import { AdminDashboardStats, PRICING_PLANS } from "@/types";
import {
  Users,
  CreditCard,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingPaymentUsers, setPendingPaymentUsers] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
      try {
        // Fetch users
        const { data: users, error } = await supabase
          .from("users")
          .select("*");

        if (error) throw error;

        const totalUsers = users?.length || 0;
        const paidUsers = users?.filter(
          (u) => u.subscriptionStatus === "active"
        ).length || 0;
        const demoUsers = users?.filter(
          (u) => u.subscriptionStatus === "demo"
        ).length || 0;
        const pendingPaymentUsersCount = users?.filter(
          (u) => u.subscriptionStatus === "payment_pending"
        ).length || 0;

        setPendingPaymentUsers(pendingPaymentUsersCount);

        // Calculate total revenue
        const totalRevenue = users
          ?.filter((u) => u.subscriptionStartDate && (u.subscriptionStatus === "active" || u.subscriptionStatus === "payment_due"))
          .reduce((sum, u) => sum + (u.paymentAmount || 0), 0) || 0;

        // Calculate monthly revenue (users activated this month)
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyRevenue = users
          ?.filter((u) => {
            const startDate = u.subscriptionStartDate ? new Date(u.subscriptionStartDate) : null;
            return startDate && startDate >= startOfMonth && (u.subscriptionStatus === "active" || u.subscriptionStatus === "payment_due");
          })
          .reduce((sum, u) => sum + (u.paymentAmount || 0), 0) || 0;

        setStats({
          totalUsers,
          paidUsers,
          demoUsers,
          pendingPayments: pendingPaymentUsersCount,
          totalRevenue,
          monthlyRevenue,
        });
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Overview</h1>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "রিফ্রেশ হচ্ছে..." : "রিফ্রেশ করুন"}
        </Button>
      </div>

      {/* Payment Pending Users Alert */}
      {pendingPaymentUsers > 0 && (
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-warning" />
              <div>
                <p className="font-medium">পেমেন্ট অপেক্ষমাণ ইউজার</p>
                <p className="text-sm text-muted-foreground">
                  {pendingPaymentUsers}টি ইউজারের পেমেন্ট ভেরিফিকেশন বাকি
                </p>
              </div>
            </div>
            <Link href="/admin/users">
              <Button>ম্যানেজ করুন</Button>
            </Link>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">মোট ইউজার</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">সব রেজিস্টার্ড</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">একটিভ ইউজার</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats?.paidUsers || 0}</div>
            <p className="text-xs text-muted-foreground">সক্রিয় সাবস্ক্রিপশন</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">অপেক্ষমাণ পেমেন্ট</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats?.pendingPayments || 0}</div>
            <p className="text-xs text-muted-foreground">যাচাইকরণ বাকি</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">মোট রাজস্ব</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{(stats?.totalRevenue || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">সর্বকালীন</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">এই মাসের রাজস্ব</CardTitle>
            <CreditCard className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">৳{(stats?.monthlyRevenue || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">চলমান মাস</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">এই মাসের রেভিনিউ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">৳{stats?.monthlyRevenue?.toLocaleString() || 0}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date().toLocaleDateString("bn-BD", { month: "long", year: "numeric" })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">ইউজার ব্রেকডাউন</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Paid Users</span>
                <span className="font-medium text-success">{stats?.paidUsers || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Demo Users</span>
                <span className="font-medium">{stats?.demoUsers || 0}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm font-medium">Total</span>
                <span className="font-bold">{stats?.totalUsers || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/users">
              <Button variant="outline" className="gap-2">
                <Users className="h-4 w-4" />
                সব ইউজার দেখুন
              </Button>
            </Link>
            <Link href="/admin/payments">
              <Button variant="outline" className="gap-2">
                <CreditCard className="h-4 w-4" />
                পেমেন্ট রিকোয়েস্ট
                {pendingPaymentUsers > 0 && (
                  <span className="ml-1 bg-warning text-warning-foreground text-xs px-1.5 py-0.5 rounded-full">
                    {pendingPaymentUsers}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Plans Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">প্যাকেজ প্রাইসিং</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(PRICING_PLANS).map(([key, plan]) => (
              <div key={key} className="p-4 border rounded-lg">
                <h3 className="font-medium">{plan.nameBn}</h3>
                <p className="text-2xl font-bold mt-1">৳{plan.price}</p>
                <p className="text-xs text-muted-foreground">
                  {plan.duration} {plan.durationUnit === "month" ? "মাস" : "বছর"}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
