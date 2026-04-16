"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Clock, Mail, Phone, ArrowLeft } from "lucide-react";

export default function RegistrationPendingPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // If user becomes active, redirect to dashboard
      if (userData?.subscriptionStatus === "active") {
        router.push("/dashboard");
      }
      // If not logged in, redirect to login
      if (!user) {
        router.push("/login");
      }
    }
  }, [user, userData, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">PropManager</span>
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-warning" />
            </div>
            <CardTitle className="text-xl">রেজিস্ট্রেশন পেন্ডিং</CardTitle>
            <CardDescription>
              আপনার পেমেন্ট ভেরিফিকেশনের অপেক্ষায় আছে
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg text-sm">
              <p className="font-medium mb-2">কি হবে এরপর?</p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">1</span>
                  <span>আমরা আপনার Transaction ID যাচাই করব</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">2</span>
                  <span>Payment confirm হলে আপনার একাউন্ট একটিভ করা হবে</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">3</span>
                  <span>তারপর আপনি Dashboard এ login করতে পারবেন</span>
                </li>
              </ul>
            </div>

            <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">সাধারণত ২৪ ঘণ্টার মধ্যে ভেরিফিকেশন সম্পন্ন হয়।</p>
              <p className="text-xs text-muted-foreground">
                জরুরি প্রয়োজনে যোগাযোগ করুন:
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  support@propmanager.com
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  01XXXXXXXXX
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button variant="outline" asChild className="w-full">
                <Link href="/login">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Login পেজে ফিরে যান
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
