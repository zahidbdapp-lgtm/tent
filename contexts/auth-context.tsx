"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { User, SubscriptionPlan, PaymentMethod } from "@/types";

// Admin credentials (hardcoded as per requirement)
const ADMIN_EMAIL = "zahid.bdapp2026@gmail.com";
const ADMIN_PASSWORD = "za@#11708022";

interface AuthContextType {
  user: SupabaseUser | null;
  userData: User | null;
  loading: boolean;
  isConfigured: boolean;
  isAdmin: boolean;
  isDemoUser: boolean;
  canAccessDashboard: boolean;
  userStatusMessage: string | null;
  signIn: (email: string, password: string) => Promise<{ isAdminLogin?: boolean }>;
  signUp: (
    email: string, 
    password: string, 
    displayName: string, 
    phone: string,
    paymentInfo: {
      paymentMethod: string;
      paymentNumber: string;
      transactionId: string;
      amount: number;
      plan: string;
    }
  ) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Fetch user profile from 'users' table
  const fetchUserProfile = async (uid: string) => {
    console.log("[fetchUserProfile] Starting for uid:", uid);
    console.log("[fetchUserProfile] supabase available:", !!supabase);
    
    if (!supabase) {
      console.error("[fetchUserProfile] Supabase client is null!");
      return null;
    }

    try {
      console.log("[fetchUserProfile] About to query users table with eq('id', uid)");
      const { data, error, status, statusText } = await supabase
        .from("users")
        .select("*")
        .eq("id", uid)
        .single();

      console.log("[fetchUserProfile] Full response object:", { 
        data, 
        error: error ? { 
          code: error.code, 
          message: error.message, 
          details: error.details, 
          hint: error.hint,
          status: error.status 
        } : null,
        status,
        statusText
      });

      if (error) {
        console.error("[fetchUserProfile] ❌ QUERY FAILED");
        console.error("[fetchUserProfile] Error code:", error.code);
        console.error("[fetchUserProfile] Error message:", error.message);
        console.error("[fetchUserProfile] Error details:", error.details);
        console.error("[fetchUserProfile] Error hint:", error.hint);
        
        if (error.code === "PGRST116") {
          console.log("[fetchUserProfile] No rows found (PGRST116)");
          return null;
        }
        throw error;
      }
      
      console.log("[fetchUserProfile] ✅ Success! User data retrieved:", {
        id: data.id,
        email: data.email,
        role: data.role,
        subscriptionStatus: data.subscription_status
      });
      return data as User;
    } catch (err) {
      console.error("[fetchUserProfile] Caught error:", err);
      console.error("[fetchUserProfile] Error type:", typeof err);
      if (err && typeof err === 'object') {
        console.error("[fetchUserProfile] Error keys:", Object.keys(err));
        // Try to extract code from PostgREST error
        const anyErr = err as any;
        if (anyErr.code) console.error("[fetchUserProfile] err.code:", anyErr.code);
        if (anyErr.message) console.error("[fetchUserProfile] err.message:", anyErr.message);
      }
      return null;
    }
  };

  // Create user profile in 'users' table
  const createUserProfile = async (uid: string, profile: Partial<User>) => {
    const { error } = await supabase.from("users").insert({
      id: uid,
      ...profile,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    if (error) {
      console.error("Error creating user profile:", error);
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (uid: string, updates: Partial<User>) => {
    const { error } = await supabase
      .from("users")
      .update({ ...updates, updatedAt: new Date().toISOString() })
      .eq("id", uid);
    if (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setUserData(profile);
      }
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: string, session: Session | null) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setUserData(profile);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<{ isAdminLogin?: boolean }> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Check if admin (by email)
    const isAdminLogin = email === ADMIN_EMAIL;

    // If admin login, ensure admin profile exists in database
    if (isAdminLogin && data.user) {
      const { data: existingProfile } = await supabase
        .from("users")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (!existingProfile) {
        // Create admin profile
        const { error: insertError } = await supabase
          .from("users")
          .insert({
            id: data.user.id,
            email: ADMIN_EMAIL,
            displayName: "Admin",
            phone: "",
            role: "admin",
            subscriptionStatus: "active",
            subscriptionPlan: "yearly",
            subscriptionStartDate: new Date().toISOString(),
            subscriptionExpiry: null,
            paymentMethod: null,
            paymentNumber: null,
            paymentTransactionId: null,
            paymentAmount: null,
            paymentDate: null,
            rejectionReason: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

        if (insertError) {
          console.error("Failed to create admin profile:", insertError);
          // Don't throw here, just log - admin can still login
        }
      } else {
        // Ensure existing profile has admin role
        const { error: updateError } = await supabase
          .from("users")
          .update({
            role: "admin",
            subscriptionStatus: "active",
            updatedAt: new Date().toISOString(),
          })
          .eq("id", data.user.id);

        if (updateError) {
          console.error("Failed to update admin profile:", updateError);
        }
      }
    }

    return { isAdminLogin };
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    phone: string,
    paymentInfo: {
      paymentMethod: string;
      paymentNumber: string;
      transactionId: string;
      amount: number;
      plan: string;
    }
  ) => {
    // Sign up with Supabase Auth
    const { data: { user: newUser }, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          displayName,
          phone,
        },
      },
    });

    if (error) throw error;
    if (!newUser) throw new Error("Registration failed");

    // Create user profile in 'users' table
    await createUserProfile(newUser.id, {
      email,
      displayName,
      phone,
      role: "landlord",
      subscriptionStatus: "payment_pending",
      subscriptionPlan: paymentInfo.plan as SubscriptionPlan,
      subscriptionStartDate: null,
      subscriptionExpiry: null,
      paymentMethod: paymentInfo.paymentMethod as PaymentMethod,
      paymentNumber: paymentInfo.paymentNumber,
      paymentTransactionId: paymentInfo.transactionId,
      paymentAmount: paymentInfo.amount,
      paymentDate: new Date().toISOString(),
      rejectionReason: null,
    });

    // Create a payment request for admin to verify
    const { error: paymentError } = await supabase.from("paymentRequests").insert({
      userId: newUser.id,
      userEmail: email,
      userName: displayName,
      plan: paymentInfo.plan,
      amount: paymentInfo.amount,
      paymentMethod: paymentInfo.paymentMethod,
      transactionId: paymentInfo.transactionId,
      screenshotUrl: "",
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    if (paymentError) {
      console.error("Error creating payment request:", paymentError);
    }
  };

  const signInWithGoogle = async (): Promise<void> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUserData(null);
    setIsDemoMode(false);
  };

  const isAdmin = userData?.role === "admin" || user?.email === ADMIN_EMAIL;
  const isDemoUser = userData?.subscriptionStatus === "demo";
  const canAccessDashboard = isAdmin || (userData?.subscriptionStatus === "active" && !isDemoMode) || isDemoMode;

  const getUserStatusMessage = (): string | null => {
    if (isDemoMode) return null;
    if (!userData) return null;

    switch (userData.subscriptionStatus) {
      case "demo":
        return "আপনি Demo মোডে আছেন। সম্পূর্ণ access এর জন্য কোন package কিনুন।";
      case "payment_pending":
        return "আপনার পেমেন্ট যাচাইকরণের অপেক্ষায় আছে। Admin approve করলে আপনি dashboard access পাবেন।";
      case "banned":
        return userData.rejectionReason || "আপনার একাউন্ট বন্ধ করা হয়েছে। সাহায্যের জন্য admin এর সাথেযোগাযোগ করুন।";
      case "payment_due":
        return userData.rejectionReason || "আপনার পেমেন্ট বকেয়া আছে। পেমেন্ট করে সাবস্ক্রিপশন চলমান রাখুন।";
      default:
        return null;
    }
  };

  const userStatusMessage = getUserStatusMessage();

  const enterDemoMode = () => setIsDemoMode(true);
  const exitDemoMode = () => setIsDemoMode(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        isConfigured: isSupabaseConfigured,
        isAdmin,
        isDemoUser,
        canAccessDashboard,
        userStatusMessage,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        enterDemoMode,
        exitDemoMode,
        isDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
