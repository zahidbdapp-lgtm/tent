"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Users, Receipt, AlertCircle, Ticket, TrendingUp, Zap } from "lucide-react";
import type { Property, Tenant, Invoice, Ticket as TicketType, DashboardStats } from "@/types";
import { 
  demoProperties, 
  demoTenants, 
  demoInvoices, 
  demoDashboardStats 
} from "@/lib/demo-data";
import Link from "next/link";

export default function DashboardPage() {
  const { user, isDemoUser, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        // For demo users (non-subscribers), show demo data
        if (isDemoUser && !isAdmin) {
          setStats(demoDashboardStats);
          setRecentInvoices(
            demoInvoices
              .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
              .slice(0, 5)
          );
          setLoading(false);
          return;
        }

        // For paid users, fetch real data
        if (!db) {
          setLoading(false);
          return;
        }

        // Fetch properties
        const propertiesQuery = query(
          collection(db, "properties"),
          where("ownerId", "==", user.uid)
        );
        const propertiesSnapshot = await getDocs(propertiesQuery);
        const properties = propertiesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Property[];

        // Fetch tenants
        const tenantsQuery = query(
          collection(db, "tenants"),
          where("ownerId", "==", user.uid)
        );
        const tenantsSnapshot = await getDocs(tenantsQuery);
        const tenants = tenantsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Tenant[];

        // Fetch invoices
        const invoicesQuery = query(
          collection(db, "invoices"),
          where("ownerId", "==", user.uid)
        );
        const invoicesSnapshot = await getDocs(invoicesQuery);
        const invoices = invoicesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Invoice[];

        // Fetch tickets
        const ticketsQuery = query(
          collection(db, "tickets"),
          where("ownerId", "==", user.uid)
        );
        const ticketsSnapshot = await getDocs(ticketsQuery);
        const tickets = ticketsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as TicketType[];

        // Calculate stats
        const totalRevenue = invoices
          .filter((inv) => inv.status === "paid")
          .reduce((acc, inv) => acc + inv.paidAmount, 0);

        const pendingPayments = invoices
          .filter((inv) => inv.status === "unpaid" || inv.status === "partial")
          .reduce((acc, inv) => acc + inv.dueAmount, 0);

        const overdueInvoices = invoices.filter(
          (inv) =>
            inv.status !== "paid" &&
            inv.dueDate.toDate() < new Date()
        ).length;

        const openTickets = tickets.filter(
          (t) => t.status === "open" || t.status === "in-progress"
        ).length;

        setStats({
          totalProperties: properties.length,
          totalTenants: tenants.filter((t) => t.status === "active").length,
          totalRevenue,
          pendingPayments,
          openTickets,
          overdueInvoices,
        });

        // Get recent invoices
        setRecentInvoices(
          invoices
            .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
            .slice(0, 5)
        );
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, isDemoUser, isAdmin]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
              <Skeleton className="mt-2 h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "মোট প্রপার্টি",
      value: stats?.totalProperties || 0,
      icon: Building2,
      description: "আপনার সক্রিয় প্রপার্টি",
      color: "text-primary",
    },
    {
      title: "সক্রিয় ভাড়াটিয়া",
      value: stats?.totalTenants || 0,
      icon: Users,
      description: "বর্তমানে থাকছে",
      color: "text-chart-2",
    },
    {
      title: "মোট আদায়",
      value: `৳${(stats?.totalRevenue || 0).toLocaleString()}`,
      icon: TrendingUp,
      description: "সংগৃহীত পেমেন্ট",
      color: "text-success",
    },
    {
      title: "বাকি পেমেন্ট",
      value: `৳${(stats?.pendingPayments || 0).toLocaleString()}`,
      icon: Receipt,
      description: "আদায় বাকি",
      color: "text-warning",
    },
    {
      title: "ওপেন টিকেট",
      value: stats?.openTickets || 0,
      icon: Ticket,
      description: "সাপোর্ট রিকোয়েস্ট",
      color: "text-chart-4",
    },
    {
      title: "ওভারডিউ",
      value: stats?.overdueInvoices || 0,
      icon: AlertCircle,
      description: "সময় পার হয়ে গেছে",
      color: "text-destructive",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Demo Mode Banner */}
      {isDemoUser && !isAdmin && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Demo Mode</h3>
                  <Badge variant="secondary">Sample Data</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  আপনি এখন demo data দেখছেন। সম্পূর্ণ ফিচার ব্যবহার করতে subscribe করুন।
                </p>
              </div>
            </div>
            <Link href="/dashboard/subscription">
              <Button>
                <Zap className="h-4 w-4 mr-2" />
                Upgrade করুন
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Invoices */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>সাম্প্রতিক বিল</CardTitle>
          {isDemoUser && !isAdmin && (
            <Badge variant="secondary">Demo</Badge>
          )}
        </CardHeader>
        <CardContent>
          {recentInvoices.length === 0 ? (
            <p className="text-muted-foreground text-sm">কোনো বিল নেই।</p>
          ) : (
            <div className="divide-y">
              {recentInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="font-medium">{invoice.tenantName}</p>
                    <p className="text-sm text-muted-foreground">
                      ইউনিট {invoice.unitNumber} - {invoice.month}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      ৳{invoice.totalAmount.toLocaleString()}
                    </p>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        invoice.status === "paid"
                          ? "bg-success/10 text-success"
                          : invoice.status === "overdue"
                          ? "bg-destructive/10 text-destructive"
                          : invoice.status === "partial"
                          ? "bg-warning/10 text-warning"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {invoice.status === "paid" ? "পরিশোধিত" : 
                       invoice.status === "overdue" ? "ওভারডিউ" : 
                       invoice.status === "partial" ? "আংশিক" : "বাকি"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions for Demo Users */}
      {isDemoUser && !isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>কি কি করতে পারবেন?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <Building2 className="h-8 w-8 text-primary mb-2" />
                <h4 className="font-medium">প্রপার্টি ম্যানেজ</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  একাধিক বাড়ি/ফ্ল্যাটের তথ্য রাখুন
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <Users className="h-8 w-8 text-chart-2 mb-2" />
                <h4 className="font-medium">ভাড়াটিয়া রেকর্ড</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  NID, ছবি, Agreement সংরক্ষণ করুন
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <Receipt className="h-8 w-8 text-success mb-2" />
                <h4 className="font-medium">বিল ও রিসিট</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  অটো বিল তৈরি ও PDF রিসিট
                </p>
              </div>
            </div>
            <div className="mt-4 text-center">
              <Link href="/dashboard/subscription">
                <Button size="lg" className="gap-2">
                  <Zap className="h-5 w-5" />
                  মাত্র ৳75/মাস থেকে শুরু করুন
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
