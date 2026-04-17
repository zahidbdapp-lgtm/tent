"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
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
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2,
  LayoutDashboard,
  Home,
  Users,
  Receipt,
  Megaphone,
  Ticket,
  LogOut,
  ChevronUp,
  CreditCard,
  Wallet,
  Shield,
  AlertCircle,
  Eye,
  Ban,
  Clock,
  FileText,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Properties", href: "/dashboard/properties", icon: Home },
  { name: "Tenants File Entry", href: "/dashboard/tenants", icon: Users },
  { name: "Tenants File Preview", href: "/dashboard/tenants-files", icon: FileText },
  { name: "Invoices", href: "/dashboard/invoices", icon: Receipt },
  { name: "Expenses", href: "/dashboard/expenses", icon: Wallet },
  { name: "Notices", href: "/dashboard/notices", icon: Megaphone },
  { name: "Tickets", href: "/dashboard/tickets", icon: Ticket },
];

const adminNavigation = [
  { name: "Admin Panel", href: "/admin", icon: Shield },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Payments", href: "/admin/payments", icon: CreditCard },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userData, loading, signOut, isAdmin, isDemoUser, canAccessDashboard, userStatusMessage, isDemoMode, exitDemoMode } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If not in demo mode and no user, redirect to login
    if (!loading && !user && !isDemoMode) {
      router.push("/login");
    }
  }, [user, loading, router, isDemoMode]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  // Allow demo mode without user
  if (!user && !isDemoMode) {
    return null;
  }

  // Check if user cannot access dashboard (pending/banned/payment_due)
  if (user && !canAccessDashboard && !isDemoMode) {
    // Allow payment_due users to access subscription page to complete payment
    if (pathname === "/dashboard/subscription" && userData?.subscriptionStatus === "payment_due") {
      // continue rendering children
    } else {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-destructive/10">
                {userData?.subscriptionStatus === "banned" ? (
                  <Ban className="h-8 w-8 text-destructive" />
                ) : userData?.subscriptionStatus === "payment_pending" ? (
                  <Clock className="h-8 w-8 text-warning" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-warning" />
                )}
              </div>
              <CardTitle className="text-xl">
                {userData?.subscriptionStatus === "banned" 
                  ? "একাউন্ট বন্ধ" 
                  : userData?.subscriptionStatus === "payment_pending"
                  ? "অনুমোদনের অপেক্ষায়"
                  : "Access সীমিত"
                }
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-muted-foreground">{userStatusMessage}</p>
              
              {userData?.subscriptionStatus === "payment_pending" && (
                <div className="bg-muted p-4 rounded-lg text-sm text-left">
                  <p className="font-medium mb-2">আপনার তথ্য:</p>
                  <div className="space-y-1 text-muted-foreground">
                    <p>Email: {userData.email}</p>
                    <p>Plan: {userData.subscriptionPlan}</p>
                    {userData.paymentTransactionId && (
                      <p>Transaction ID: {userData.paymentTransactionId}</p>
                    )}
                  </div>
                </div>
              )}

              {userData?.subscriptionStatus === "payment_due" && (
                <Button asChild className="w-full">
                  <Link href="/dashboard/subscription">
                    <CreditCard className="h-4 w-4 mr-2" />
                    পেমেন্ট করুন
                  </Link>
                </Button>
              )}

              <Button variant="outline" onClick={() => signOut()} className="w-full">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getSubscriptionBadge = () => {
    if (isDemoMode) {
      return <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-600">Demo</Badge>;
    }
    if (isAdmin) {
      return <Badge variant="default" className="text-xs">Admin</Badge>;
    }
    if (userData?.subscriptionStatus === "active") {
      return <Badge variant="default" className="text-xs bg-success">Active</Badge>;
    }
    if (userData?.subscriptionStatus === "payment_due") {
      return <Badge variant="destructive" className="text-xs">Expired</Badge>;
    }
    if (userData?.subscriptionStatus === "payment_pending") {
      return <Badge variant="secondary" className="text-xs bg-warning/20 text-warning">Pending</Badge>;
    }
    if (userData?.subscriptionStatus === "banned") {
      return <Badge variant="destructive" className="text-xs">Banned</Badge>;
    }
    if (userData?.subscriptionStatus === "payment_due") {
      return <Badge variant="destructive" className="text-xs">Due</Badge>;
    }
    return <Badge variant="secondary" className="text-xs">Demo</Badge>;
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
          {isDemoMode && (
            <div className="mx-3 mt-3 mb-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <Eye className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-xs flex-1">
                  <p className="font-medium text-blue-600">Demo Mode</p>
                  <p className="text-muted-foreground mt-1">
                    আপনি Demo Mode এ আছেন। Data add/edit করতে পারবেন না।
                  </p>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="h-auto p-0 text-xs text-primary mt-1"
                    onClick={exitDemoMode}
                  >
                    Demo থেকে বের হন
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* User Demo Banner (not in demo mode but demo subscription) */}
          {!isDemoMode && isDemoUser && !isAdmin && (
            <div className="mx-3 mt-3 mb-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                <div className="text-xs">
                  <p className="font-medium text-warning-foreground">Demo Subscription</p>
                  <p className="text-muted-foreground mt-1">
                    সম্পূর্ণ অ্যাক্সেসের জন্য{" "}
                    <Link href="/dashboard/subscription" className="text-primary hover:underline">
                      Subscribe করুন
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          )}

          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigation.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      tooltip={item.name}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Subscription Link */}
          <SidebarGroup>
            <SidebarGroupLabel>Account</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/dashboard/subscription"}
                    tooltip="Subscription"
                  >
                    <Link href="/dashboard/subscription">
                      <CreditCard className="h-4 w-4" />
                      <span>Subscription</span>
                      {isDemoUser && !isAdmin && (
                        <Badge variant="destructive" className="ml-auto text-xs">
                          Upgrade
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Admin Navigation */}
          {isAdmin && (
            <SidebarGroup>
              <SidebarGroupLabel>Admin</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminNavigation.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href}
                        tooltip={item.name}
                      >
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {getInitials(userData?.displayName || user.email || "U")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate max-w-[100px]">
                          {userData?.displayName || "User"}
                        </span>
                        {getSubscriptionBadge()}
                      </div>
                      <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {user.email}
                      </span>
                    </div>
                    <ChevronUp className="ml-auto h-4 w-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56"
                  side="top"
                  align="start"
                >
                  <DropdownMenuItem className="flex-col items-start">
                    <span className="font-medium">{userData?.displayName}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/subscription">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Subscription
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
          <h1 className="text-lg font-semibold capitalize">
            {pathname === "/dashboard"
              ? "Dashboard"
              : pathname.split("/").pop()?.replace(/-/g, " ")}
          </h1>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
