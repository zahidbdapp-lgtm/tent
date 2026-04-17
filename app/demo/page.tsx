"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  LayoutDashboard,
  Home,
  Users,
  Receipt,
  Megaphone,
  Ticket,
  ChevronUp,
  Eye,
  LogOut,
  Wallet,
  Shield,
  TrendingUp,
  AlertCircle,
  Zap,
} from "lucide-react";
import type { Property, Tenant, Invoice } from "@/types";
import { 
  demoProperties, 
  demoTenants, 
  demoInvoices, 
  demoDashboardStats 
} from "@/lib/demo-data";

const navigation = [
  { name: "Dashboard", href: "#", icon: LayoutDashboard },
  { name: "Properties", href: "#", icon: Home },
  { name: "Tenants", href: "#", icon: Users },
  { name: "Invoices", href: "#", icon: Receipt },
  { name: "Expenses", href: "#", icon: Wallet },
  { name: "Notices", href: "#", icon: Megaphone },
  { name: "Tickets", href: "#", icon: Ticket },
];

export default function DemoPage() {
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState("dashboard");

  const stats = demoDashboardStats;
  const recentInvoices = demoInvoices
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const statCards = [
    {
      title: "মোট প্রপার্টি",
      value: demoProperties.length,
      icon: Building2,
      description: "আপনার সক্রিয় প্রপার্টি",
      color: "text-primary",
    },
    {
      title: "সক্রিয় ভাড়াটিয়া",
      value: demoTenants.filter((t) => t.status === "active").length,
      icon: Users,
      description: "বর্তমানে থাকছে",
      color: "text-chart-2",
    },
    {
      title: "মোট আদায়",
      value: `৳${(stats.totalRevenue || 0).toLocaleString()}`,
      icon: TrendingUp,
      description: "সংগৃহীত পেমেন্ট",
      color: "text-success",
    },
    {
      title: "বাকি পেমেন্ট",
      value: `৳${(stats.pendingPayments || 0).toLocaleString()}`,
      icon: Receipt,
      description: "আদায় বাকি",
      color: "text-warning",
    },
    {
      title: "ওপেন টিকেট",
      value: stats.openTickets || 0,
      icon: Ticket,
      description: "সাপোর্ট রিকোয়েস্ট",
      color: "text-chart-4",
    },
    {
      title: "ওভারডিউ",
      value: stats.overdueInvoices || 0,
      icon: AlertCircle,
      description: "সময় পার হয়ে গেছে",
      color: "text-destructive",
    },
  ];

  const handleBackToHome = () => {
    router.push("/");
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="flex items-center gap-2 px-2 py-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">PropManager</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          {/* Demo Mode Banner */}
          <div className="mx-3 mt-3 mb-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Eye className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs flex-1">
                <p className="font-medium text-blue-600">Demo Mode</p>
                <p className="text-muted-foreground mt-1">
                  আপনি Demo দেখছেন। কোনো ডাটা সংযোজন করতে পারবেন না।
                </p>
              </div>
            </div>
          </div>

          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigation.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={currentSection === item.name.toLowerCase()}
                      onClick={() => setCurrentSection(item.name.toLowerCase())}
                    >
                      <a href="#">
                        <item.icon />
                        <span>{item.name}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <SidebarInset>
        {/* Header */}
        <header className="border-b bg-card sticky top-0 z-50">
          <div className="flex h-16 items-center justify-between px-4 gap-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="h-6" />
              <h1 className="text-lg font-semibold">Demo Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleBackToHome}>
                Home
              </Button>
              <Button variant="outline" size="sm" onClick={handleBackToHome}>
                <LogOut className="h-4 w-4 mr-2" />
                বাড়ি ফিরুন
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 gap-6 p-4 md:p-6">
          {currentSection === "dashboard" && (
            <div className="flex flex-col gap-6">
              {/* Demo Alert */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg h-fit">
                    <Eye className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-blue-900">Demo Mode</h3>
                      <Badge className="bg-blue-600">Sample Data</Badge>
                    </div>
                    <p className="text-sm text-blue-800 mt-1">
                      এটি একটি Demo Dashboard যা read-only mode এ কাজ করে। আপনি এখানে কোনো ডাটা যোগ, সম্পাদনা বা মুছতে পারবেন না।
                      সম্পূর্ণ ফিচার ব্যবহার করতে আমাদের সাথে যোগাযোগ করুন।
                    </p>
                    <div className="mt-3">
                      <Link href="/register">
                        <Button className="gap-2" size="sm">
                          <Zap className="h-4 w-4" />
                          এখনই শুরু করুন
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

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
                <CardHeader>
                  <CardTitle className="text-base">সাম্প্রতিক বিল</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentInvoices.map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{invoice.tenantName}</p>
                          <p className="text-xs text-muted-foreground">{invoice.month} • Unit: {invoice.unitNumber}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">৳{invoice.totalAmount.toLocaleString()}</p>
                          <Badge 
                            variant={invoice.status === "paid" ? "default" : "secondary"}
                            className="text-xs mt-1"
                          >
                            {invoice.status === "paid" ? "প্রদান" : "বকেয়া"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentSection === "properties" && (
            <Card>
              <CardHeader>
                <CardTitle>প্রপার্টি (Demo Data - Read-only)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {demoProperties.map((prop) => (
                    <div key={prop.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{prop.name}</h3>
                          <p className="text-sm text-muted-foreground">{prop.address}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {prop.totalUnits} Units • {prop.propertyType}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {currentSection === "tenants" && (
            <Card>
              <CardHeader>
                <CardTitle>ভাড়াটিয়া (Demo Data - Read-only)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {demoTenants.map((tenant) => (
                    <div key={tenant.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{tenant.name}</h3>
                          <p className="text-sm text-muted-foreground">{tenant.email}</p>
                          <p className="text-xs text-muted-foreground">Unit: {tenant.unitNumber} • ৳{tenant.monthlyRent.toLocaleString()}/মাস</p>
                        </div>
                        <Badge variant="default" className="bg-green-600">Active</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {currentSection !== "dashboard" && currentSection !== "properties" && currentSection !== "tenants" && (
            <Card>
              <CardHeader>
                <CardTitle>Demo Content</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">এই বিভাগটি Demo mode এ উপলব্ধ নয়। সম্পূর্ণ অ্যাক্সেসের জন্য আমাদের সাথে যোগাযোগ করুন।</p>
              </CardContent>
            </Card>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
