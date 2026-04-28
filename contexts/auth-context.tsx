"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { User, SubscriptionPlan, PaymentMethod } from "@/types";
import { databaseUserToTypescriptUser, typescriptUserToDatabaseUser } from "@/lib/supabase/userConverter";

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
    paymentInfo?: {
      paymentMethod: string;
      paymentNumber: string;
      transactionId: string;
      amount: number;
      plan: string;
    }
  ) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUpWithGoogle: (displayName: string, phone: string) => Promise<void>;
  completeGoogleSignUp: (paymentInfo: { paymentMethod: string; paymentNumber: string; transactionId: string; amount: number; plan: string }) => Promise<void>;
  completeEmailSignUp: (email: string, password: string, displayName: string, phone: string, paymentInfo: { paymentMethod: string; paymentNumber: string; transactionId: string; amount: number; plan: string }) => Promise<void>;
  pendingGoogleUser: { displayName: string; phone: string } | null;
  setPendingGoogleUser: (user: { displayName: string; phone: string } | null) => void;
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
  const [pendingGoogleUser, setPendingGoogleUser] = useState<{ displayName: string; phone: string } | null>(null);

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
        id: data?.id,
        email: data?.email,
        role: data?.role,
        subscriptionStatus: data?.subscription_status
      });
      return databaseUserToTypescriptUser(data);
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
    try {
      console.log("[createUserProfile] Creating profile for user:", uid);
      
      // Convert camelCase to snake_case for database
      const dbProfile = typescriptUserToDatabaseUser(profile);
      
      const { data, error } = await supabase
        .from("users")
        .insert({
          id: uid,
          ...dbProfile,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("[createUserProfile] ❌ Error creating user profile:", error);
        throw error;
      }
      
      console.log("[createUserProfile] ✅ Profile created successfully");
      return data;
    } catch (err) {
      console.error("[createUserProfile] ❌ Caught error:", err);
      throw err;
    }
  };

  // Update user profile
  const updateUserProfile = async (uid: string, updates: Partial<User>) => {
    try {
      console.log("[updateUserProfile] Updating profile for user:", uid);
      
      // Convert camelCase to snake_case for database
      const dbUpdates = typescriptUserToDatabaseUser(updates);
      
      const { data, error } = await supabase
        .from("users")
        .update({ 
          ...dbUpdates,
          updated_at: new Date().toISOString() 
        })
        .eq("id", uid)
        .select()
        .single();

      if (error) {
        console.error("[updateUserProfile] ❌ Error updating user profile:", error);
        throw error;
      }
      
      console.log("[updateUserProfile] ✅ Profile updated successfully");
      return data;
    } catch (err) {
      console.error("[updateUserProfile] ❌ Caught error:", err);
      throw err;
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
    if (error) {
      console.error("[signIn] Auth error:", error);
      throw error;
    }

    // Check if admin (by email - case insensitive)
    const isAdminLogin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    console.log("[signIn] User authenticated:", { email, isAdminLogin, userId: data.user?.id });

    // If admin login, ensure admin profile exists in database
    if (isAdminLogin && data.user) {
      try {
        console.log("[signIn] Setting up admin profile for user:", data.user.id);
        
        // Try to fetch existing profile
        const { data: existingProfile, error: selectError } = await supabase
          .from("users")
          .select("id, role")
          .eq("id", data.user.id)
          .single();

        if (selectError && selectError.code !== "PGRST116") {
          // PGRST116 means no row found, which is expected for first login
          console.error("[signIn] Error checking profile:", selectError);
        }

        if (!existingProfile) {
          console.log("[signIn] No profile found, creating admin profile...");
          
          // Create admin profile
          const { data: insertedProfile, error: insertError } = await supabase
            .from("users")
            .insert([{
              id: data.user.id,
              email: ADMIN_EMAIL,
              display_name: "Admin",
              phone: "",
              role: "admin",
              subscription_status: "active",
              subscription_plan: "yearly",
              subscription_start_date: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }])
            .select()
            .single();

          if (insertError) {
            console.error("[signIn] ❌ Failed to create admin profile:", insertError);
            throw insertError;
          }
          
          console.log("[signIn] ✅ Admin profile created successfully");
          setUserData(databaseUserToTypescriptUser(insertedProfile));
        } else {
          console.log("[signIn] Profile exists, ensuring admin role...");
          
          // Ensure existing profile has admin role
          const { data: updatedProfile, error: updateError } = await supabase
            .from("users")
            .update({
              role: "admin",
              subscription_status: "active",
              updated_at: new Date().toISOString(),
            })
            .eq("id", data.user.id)
            .select()
            .single();

          if (updateError) {
            console.error("[signIn] Error updating admin role:", updateError);
            throw updateError;
          }
          
          console.log("[signIn] ✅ Admin profile updated");
          setUserData(databaseUserToTypescriptUser(updatedProfile));
        }
      } catch (err) {
        console.error("[signIn] ❌ Admin profile setup failed:", err);
        // Don't throw - let the user stay logged in even if profile setup fails
        // The profile can be created/fixed later
        const profile = await fetchUserProfile(data.user.id);
        setUserData(profile);
      }
    } else {
      // For non-admin users, fetch their profile
      try {
        const profile = await fetchUserProfile(data.user.id);
        setUserData(profile);
      } catch (err) {
        console.error("[signIn] Error fetching user profile:", err);
      }
    }

    return { isAdminLogin };
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    phone: string,
    paymentInfo?: {
      paymentMethod: string;
      paymentNumber: string;
      transactionId: string;
      amount: number;
      plan: string;
    }
  ) => {
    try {
      console.log("[signUp] Starting registration for:", email);
      
      // Step 1: Sign up with Supabase Auth
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

      if (error) {
        console.error("[signUp] ❌ Auth signup failed:", error);
        throw error;
      }
      if (!newUser) throw new Error("Registration failed - no user returned");
      
      console.log("[signUp] ✅ Auth signup successful, user ID:", newUser.id);

      // Step 1.5: Sign in the user to establish session (needed for RLS)
      try {
        console.log("[signUp] Signing in user to establish session...");
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          console.warn("[signUp] Warning: Could not auto sign-in after signup:", signInError.message);
          // Don't throw - we'll try to proceed anyway
        } else {
          console.log("[signUp] ✅ User session established");
        }
      } catch (signInErr) {
        console.warn("[signUp] Warning: Sign-in attempt failed:", signInErr);
        // Continue anyway - RLS policy will handle it
      }

      // Step 2: Create user profile in 'users' table
      try {
        const profileData: Partial<User> = {
          email,
          displayName,
          phone,
          role: "landlord",
          subscriptionStatus: paymentInfo ? "payment_pending" : "demo",
          subscriptionPlan: paymentInfo ? (paymentInfo.plan as SubscriptionPlan) : null,
          subscriptionStartDate: null,
          subscriptionExpiry: null,
        };

        // Add payment info if provided
        if (paymentInfo) {
          profileData.paymentMethod = paymentInfo.paymentMethod as PaymentMethod;
          profileData.paymentNumber = paymentInfo.paymentNumber;
          profileData.paymentTransactionId = paymentInfo.transactionId;
          profileData.paymentAmount = paymentInfo.amount;
          profileData.paymentDate = new Date().toISOString();
        }

        const createdProfile = await createUserProfile(newUser.id, profileData);
        console.log("[signUp] ✅ User profile created");
      } catch (profileError) {
        console.error("[signUp] ❌ Failed to create user profile:", profileError);
        throw new Error(`Profile creation failed: ${(profileError as any).message}`);
      }

      // Step 3: Create a payment request for admin to verify (if payment info provided)
      if (paymentInfo) {
        try {
          const paymentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
          
          const { error: paymentError } = await supabase
            .from("payment_requests")
            .insert({
              user_id: newUser.id,
              user_email: email,
              user_name: displayName,
              plan: paymentInfo.plan,
              amount: paymentInfo.amount,
              payment_method: paymentInfo.paymentMethod,
              transaction_id: paymentInfo.transactionId,
              payment_number: paymentInfo.paymentNumber,
              payment_date: paymentDate,
              screenshot_url: "",
              status: "pending",
              created_at: new Date().toISOString(),
            });

          if (paymentError) {
            console.warn("[signUp] Warning: Failed to create payment request:", paymentError);
            // Don't throw - this shouldn't block signup
          } else {
            console.log("[signUp] ✅ Payment request created");
          }
        } catch (paymentError) {
          console.warn("[signUp] Warning: Payment request error:", paymentError);
          // Don't throw - this shouldn't block signup
        }
      }
      
      console.log("[signUp] ✅ Registration complete!");
      setUser(newUser);
      const profile = await fetchUserProfile(newUser.id);
      setUserData(profile);
    } catch (err) {
      console.error("[signUp] ❌ Registration failed:", err);
      throw err;
    }
  };

  const signInWithGoogle = async (): Promise<void> => {
    try {
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/oauth-callback` : 'http://localhost:3000/api/oauth-callback';
      console.log("[signInWithGoogle] Starting Google OAuth flow");
      console.log("[signInWithGoogle] Using redirect URL:", redirectUrl);
      console.log("[signInWithGoogle] Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      });
      
      if (error) {
        console.error("[signInWithGoogle] ❌ OAuth error:", error);
        console.error("[signInWithGoogle] Error message:", error.message);
        console.error("[signInWithGoogle] Error status:", error.status);
        throw new Error(`Google OAuth failed: ${error.message}`);
      }
      
      console.log("[signInWithGoogle] ✅ OAuth flow initiated, awaiting redirect...");
      // If no error, the OAuth flow should redirect the page
    } catch (err) {
      console.error("[signInWithGoogle] ❌ Error:", err);
      throw err;
    }
  };

  const signUpWithGoogle = async (displayName: string, phone: string): Promise<void> => {
    try {
      console.log("[signUpWithGoogle] Starting with name:", displayName, "phone:", phone);
      // Store pending user info in localStorage for retrieval after OAuth
      localStorage.setItem("pendingGoogleSignup", JSON.stringify({ displayName, phone }));
      // Mark that we're in signup flow (helps payment page know not to redirect)
      localStorage.setItem("isGoogleSignupFlow", "true");
      setPendingGoogleUser({ displayName, phone });
      
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/oauth-callback?type=signup` : 'http://localhost:3000/api/oauth-callback?type=signup';
      console.log("[signUpWithGoogle] ✅ Pending data stored in localStorage");
      console.log("[signUpWithGoogle] Using redirect URL:", redirectUrl);
      console.log("[signUpWithGoogle] About to call signInWithOAuth...");
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      if (error) {
        console.error("[signUpWithGoogle] ❌ OAuth error:", error);
        console.error("[signUpWithGoogle] Error message:", error.message);
        console.error("[signUpWithGoogle] Error code:", error.code);
        console.error("[signUpWithGoogle] Is provider not configured?", 
          error.message.toLowerCase().includes('provider') || 
          error.message.toLowerCase().includes('configuration'));
        throw new Error(`Google signup failed: ${error.message}`);
      }
      // If no error, the OAuth flow should redirect the page
      console.log("[signUpWithGoogle] ✅ OAuth flow initiated successfully, awaiting redirect...");
      // If we're still here after 3 seconds, something might be wrong
      setTimeout(() => {
        console.warn("[signUpWithGoogle] ⚠️ Still on same page after 3 seconds - redirect might have been blocked");
      }, 3000);
    } catch (err) {
      console.error("[signUpWithGoogle] ❌ Error:", err);
      console.error("[signUpWithGoogle] Is Supabase configured?", !!supabase);
      console.error("[signUpWithGoogle] Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
      // Clear the pending data on error
      localStorage.removeItem("pendingGoogleSignup");
      localStorage.removeItem("isGoogleSignupFlow");
      setPendingGoogleUser(null);
      throw err;
    }
  };

  const completeGoogleSignUp = async (paymentInfo: { paymentMethod: string; paymentNumber: string; transactionId: string; amount: number; plan: string }): Promise<void> => {
    try {
      console.log("[completeGoogleSignUp] Completing signup");
      
      if (!user) throw new Error("No authenticated user");
      if (!pendingGoogleUser) throw new Error("No pending user info");
      
      const { displayName, phone } = pendingGoogleUser;
      const email = user.email;
      
      if (!email) throw new Error("No email from Google");
      
      await createUserProfile(user.id, {
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

      const paymentDate = new Date().toISOString().split('T')[0];
      console.log("[completeGoogleSignUp] 📝 Inserting payment request with data:", {
        user_id: user.id,
        user_email: email,
        user_name: displayName,
        plan: paymentInfo.plan,
        amount: paymentInfo.amount,
        payment_method: paymentInfo.paymentMethod,
        transaction_id: paymentInfo.transactionId,
        payment_number: paymentInfo.paymentNumber,
        payment_date: paymentDate,
      });

      const { data: paymentData, error: paymentError } = await supabase
        .from("payment_requests")
        .insert({
          user_id: user.id,
          user_email: email,
          user_name: displayName,
          plan: paymentInfo.plan,
          amount: paymentInfo.amount,
          payment_method: paymentInfo.paymentMethod,
          transaction_id: paymentInfo.transactionId,
          payment_number: paymentInfo.paymentNumber,
          payment_date: paymentDate,
          screenshot_url: "",
          status: "pending",
          created_at: new Date().toISOString(),
        });

      if (paymentError) {
        console.error("[completeGoogleSignUp] ❌ Payment request insert error:", {
          message: paymentError.message,
          code: paymentError.code,
          details: paymentError.details,
          hint: paymentError.hint,
        });

        // Try to send email notification to admin instead
        try {
          console.log("[completeGoogleSignUp] 📧 Attempting to send payment notification email...");
          const emailResponse = await fetch("/api/send-payment-notification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userEmail: email,
              userName: displayName,
              plan: paymentInfo.plan,
              amount: paymentInfo.amount,
              paymentMethod: paymentInfo.paymentMethod,
              transactionId: paymentInfo.transactionId,
              paymentNumber: paymentInfo.paymentNumber,
              paymentDate: paymentDate,
            }),
          });

          if (emailResponse.ok) {
            console.log("[completeGoogleSignUp] ✅ Payment notification email sent to admin");
          } else {
            console.warn("[completeGoogleSignUp] ⚠️ Email send failed:", await emailResponse.text());
          }
        } catch (emailErr) {
          console.warn("[completeGoogleSignUp] ⚠️ Email notification error:", emailErr);
        }
      } else {
        console.log("[completeGoogleSignUp] ✅ Payment request created successfully:", paymentData);
      }

      // Try to fetch profile but don't block on failure
      try {
        const profile = await fetchUserProfile(user.id);
        setUserData(profile);
      } catch (profileErr) {
        console.warn("[completeGoogleSignUp] Could not fetch profile immediately:", profileErr);
      }
      
      setPendingGoogleUser(null);
      
      console.log("[completeGoogleSignUp] ✅ Complete");
    } catch (err) {
      console.error("[completeGoogleSignUp] Error:", err);
      throw err;
    }
  };

  const completeEmailSignUp = async (
    email: string,
    password: string,
    displayName: string,
    phone: string,
    paymentInfo: { paymentMethod: string; paymentNumber: string; transactionId: string; amount: number; plan: string }
  ): Promise<void> => {
    try {
      console.log("[completeEmailSignUp] Starting email signup with payment");
      
      // Step 1: Sign up with Supabase Auth
      const { data: { user: newUser }, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error("[completeEmailSignUp] ❌ Auth signup failed:", error);
        throw error;
      }
      if (!newUser) throw new Error("Registration failed - no user returned");
      
      console.log("[completeEmailSignUp] ✅ Auth signup successful, user ID:", newUser.id);
      console.log("[completeEmailSignUp] ⚠️ Email confirmation may be required. User email confirmed:", newUser.email_confirmed_at);

      // Step 2: Try to sign in to establish session
      // Note: This may fail if email confirmation is required
      let sessionEstablished = false;
      try {
        console.log("[completeEmailSignUp] 🔑 Attempting to establish session...");
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        });

        if (signInError) {
          console.warn("[completeEmailSignUp] ⚠️ Sign-in failed (likely requires email confirmation):", signInError.message);
          // Continue anyway - we'll create profile and user can confirm email later
        } else if (signInData?.session) {
          console.log("[completeEmailSignUp] ✅ Session established. Session user ID:", signInData.session.user.id);
          sessionEstablished = true;
        }
      } catch (signInErr) {
        console.warn("[completeEmailSignUp] ⚠️ Sign-in error:", signInErr);
        // Continue anyway - profile creation doesn't strictly require a session
      }

      // Step 3: Create user profile with payment info
      try {
        console.log("[completeEmailSignUp] 📝 Creating user profile via API...");
        
        const createProfileResponse = await fetch("/api/create-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: newUser.id,
            email,
            displayName,
            phone,
            paymentMethod: paymentInfo.paymentMethod,
            paymentNumber: paymentInfo.paymentNumber,
            transactionId: paymentInfo.transactionId,
            amount: paymentInfo.amount,
            plan: paymentInfo.plan,
          }),
        });

        if (!createProfileResponse.ok) {
          const errorData = await createProfileResponse.json();
          console.error("[completeEmailSignUp] ❌ Profile creation API error:", errorData);
          
          // Try alternative method - direct insert if API fails
          try {
            const profileData = {
              id: newUser.id,
              email,
              display_name: displayName,
              phone,
              role: "landlord",
              subscription_status: "payment_pending",
              subscription_plan: paymentInfo.plan,
              subscription_start_date: null,
              subscription_expiry: null,
              payment_method: paymentInfo.paymentMethod,
              payment_number: paymentInfo.paymentNumber,
              payment_transaction_id: paymentInfo.transactionId,
              payment_amount: paymentInfo.amount,
              payment_date: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            const { data: directInsert, error: directError } = await supabase
              .from("users")
              .insert([profileData])
              .select()
              .single();

            if (directError) {
              console.warn("[completeEmailSignUp] ⚠️ Direct insert also failed:", directError.message);
              // RLS policy likely blocking - continue anyway
            } else {
              console.log("[completeEmailSignUp] ✅ Profile created via direct insert");
            }
          } catch (directErr) {
            console.warn("[completeEmailSignUp] ⚠️ Direct insert exception:", directErr);
          }
        } else {
          const profileRes = await createProfileResponse.json();
          console.log("[completeEmailSignUp] ✅ User profile created via API");
        }
      } catch (profileError) {
        console.error("[completeEmailSignUp] ❌ Exception creating profile:", profileError);
        // Don't block signup - user can complete this after confirming email
      }

      // Step 4: Create payment request for admin verification (non-blocking)
      try {
        const paymentDate = new Date().toISOString().split('T')[0];
        console.log("[completeEmailSignUp] 📝 Inserting payment request with data:", {
          user_id: newUser.id,
          user_email: email,
          user_name: displayName,
          plan: paymentInfo.plan,
          amount: paymentInfo.amount,
          payment_method: paymentInfo.paymentMethod,
          transaction_id: paymentInfo.transactionId,
          payment_number: paymentInfo.paymentNumber,
          payment_date: paymentDate,
        });

        const { data, error: paymentError } = await supabase
          .from("payment_requests")
          .insert({
            user_id: newUser.id,
            user_email: email,
            user_name: displayName,
            plan: paymentInfo.plan,
            amount: paymentInfo.amount,
            payment_method: paymentInfo.paymentMethod,
            transaction_id: paymentInfo.transactionId,
            payment_number: paymentInfo.paymentNumber,
            payment_date: paymentDate,
            screenshot_url: "",
            status: "pending",
            created_at: new Date().toISOString(),
          });

        if (paymentError) {
          console.error("[completeEmailSignUp] ❌ Payment request insert error:", {
            message: paymentError.message,
            code: paymentError.code,
            details: paymentError.details,
            hint: paymentError.hint,
          });
          
          // Try to send email notification to admin instead
          try {
            console.log("[completeEmailSignUp] 📧 Attempting to send payment notification email to admin...");
            const emailResponse = await fetch("/api/send-payment-notification", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userEmail: email,
                userName: displayName,
                plan: paymentInfo.plan,
                amount: paymentInfo.amount,
                paymentMethod: paymentInfo.paymentMethod,
                transactionId: paymentInfo.transactionId,
                paymentNumber: paymentInfo.paymentNumber,
                paymentDate: paymentDate,
              }),
            });
            
            if (emailResponse.ok) {
              console.log("[completeEmailSignUp] ✅ Payment notification email sent to admin");
            } else {
              console.warn("[completeEmailSignUp] ⚠️ Email send failed:", await emailResponse.text());
            }
          } catch (emailErr) {
            console.warn("[completeEmailSignUp] ⚠️ Email notification error:", emailErr);
          }
        } else {
          console.log("[completeEmailSignUp] ✅ Payment request created successfully:", data);
        }
      } catch (paymentError) {
        console.error("[completeEmailSignUp] ❌ Payment request exception:", paymentError);
      }

      // Step 5: Update local state
      setUser(newUser);
      
      // Try to fetch profile but don't block on failure
      try {
        const profile = await fetchUserProfile(newUser.id);
        setUserData(profile);
      } catch (profileFetchErr) {
        console.warn("[completeEmailSignUp] Could not fetch profile immediately, will be loaded on next auth state check:", profileFetchErr);
        // Don't throw - user will be able to see their profile on next page load
      }
      
      console.log("[completeEmailSignUp] ✅ Complete");
    } catch (err) {
      console.error("[completeEmailSignUp] Error:", err);
      throw err;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUserData(null);
    setPendingGoogleUser(null);
    setIsDemoMode(false);
  };

  const isAdmin = (userData?.role === "admin") || (user?.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) || false;
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
        signUpWithGoogle,
        completeGoogleSignUp,
        completeEmailSignUp,
        pendingGoogleUser,
        setPendingGoogleUser,
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
