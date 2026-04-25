"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Building2, Mail, Lock, CheckCircle, Eye, AlertCircle, ArrowLeft } from "lucide-react";


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const { signIn, isConfigured, enterDemoMode, userStatusMessage, userData } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (userStatusMessage && !statusMessage) {
      setStatusMessage(userStatusMessage);
    }
  }, [userStatusMessage]);

  useEffect(() => {
    if (userStatusMessage && !statusMessage) {
      setStatusMessage(userStatusMessage);
    }
  }, [userStatusMessage]);

  useEffect(() => {
    if (userStatusMessage && !statusMessage) {
      setStatusMessage(userStatusMessage);
    }
  }, [userStatusMessage]);

   if (!isConfigured) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-background p-4">
         <Card className="w-full max-w-md">
           <CardHeader className="text-center">
             <div className="flex items-center justify-center gap-2 mb-4">
               <Building2 className="h-8 w-8 text-primary" />
               <span className="text-2xl font-bold text-foreground">PropManager</span>
             </div>
             <CardTitle className="text-xl text-amber-600">Supabase Setup Required</CardTitle>
             <CardDescription className="mt-2">
               Please add your Supabase environment variables to use this app.
             </CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
             <div className="bg-muted p-4 rounded-lg text-sm">
               <p className="font-medium mb-2">Required Variables:</p>
               <ul className="space-y-1 text-muted-foreground font-mono text-xs">
                 <li>NEXT_PUBLIC_SUPABASE_URL</li>
                 <li>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</li>
               </ul>
             </div>
             <p className="text-sm text-muted-foreground">
               Click the Settings icon (gear) in the top right, then go to Vars to add these.
             </p>
           </CardContent>
         </Card>
       </div>
     );
   }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setStatusMessage(null);
    setIsLoading(true);

    try {
      const result = await signIn(email, password);
      
      // Check if admin login
      if (result.isAdminLogin) {
        setSuccess("Admin Login সফল হয়েছে! Admin Panel এ যাচ্ছে...");
        setTimeout(() => {
          router.push("/admin");
        }, 1000);
      } else {
        // Update status message from auth context
        if (userStatusMessage) {
          setStatusMessage(userStatusMessage);
        }
        
        setSuccess("সফলভাবে লগইন হয়েছে! Dashboard এ যাচ্ছে...");
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      }
     } catch (err) {
       console.error('Login error:', err);
       const supabaseError = err as { message?: string; status?: number };
       const message = supabaseError.message?.toLowerCase() || '';

       // Handle Supabase auth errors
       if (message.includes('invalid login credentials') || message.includes('email not confirmed')) {
         setError("ইমেইল বা পাসওয়ার্ড ভুল হয়েছে।");
       } else if (message.includes('email not confirmed') || message.includes('email address not authorized')) {
         setError("আপনার ইমেইল কনফার্ম করা হয়নি। ইমেইল চেক করে কনফার্মেশন লিংকে ক্লিক করুন।");
       } else if (message.includes('too many requests') || message.includes('rate limit')) {
         setError("অনেকবার চেষ্টা করেছেন। কিছুক্ষণ পর আবার চেষ্টা করুন।");
       } else if (message.includes('invalid email')) {
         setError("ইমেইল ফরম্যাট সঠিক নয়।");
       } else {
         setError("লগইন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
       }
     } finally {
      setIsLoading(false);
    }
  };

  const handleDemoMode = () => {
    router.push("/demo");
  };

  const handleGoHome = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleGoHome}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Home</span>
          </button>
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">PropManager</span>
          </div>
         </div>

         <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>আপনার একাউন্টে লগইন করুন</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </Field>

                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="আপনার পাসওয়ার্ড"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </Field>

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                {statusMessage && (
                  <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-warning-foreground">{statusMessage}</p>
                  </div>
                )}

                {success && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <p className="text-sm text-green-600">{success}</p>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Spinner className="mr-2" /> : null}
                  Sign In
                </Button>
              </FieldGroup>
            </form>

            <div className="space-y-3 mt-6">
              {/* Demo Mode Button */}
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={handleDemoMode}
                disabled={isLoading}
              >
                <Eye className="mr-2 h-4 w-4" />
                Demo দেখুন (Login ছাড়া)
              </Button>
            </div>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">{"একাউন্ট নেই? "}</span>
              <Link href="/register" className="text-primary hover:underline font-medium">
                Sign up করুন
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
