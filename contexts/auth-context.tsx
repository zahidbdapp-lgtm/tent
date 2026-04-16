"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase";
import { User } from "@/types";

// Admin credentials (hardcoded as per requirement)
const ADMIN_EMAIL = "zahid.bdapp2026";
const ADMIN_PASSWORD = "za@#11708022";

interface AuthContextType {
  user: FirebaseUser | null;
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
  signInWithGoogle: () => Promise<{ needsPaymentInfo?: boolean }>;
  signOut: () => Promise<void>;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Check for Google redirect result on mount
  useEffect(() => {
    if (!isFirebaseConfigured || !auth || !db) {
      setLoading(false);
      return;
    }

    // Check for redirect result (in case popup was blocked and redirect was used)
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          // User signed in via redirect, create user doc if needed
          const userDoc = await getDoc(doc(db, "users", result.user.uid));
          if (!userDoc.exists()) {
            await setDoc(doc(db, "users", result.user.uid), {
              email: result.user.email,
              displayName: result.user.displayName || "User",
              phone: result.user.phoneNumber || "",
              role: "landlord",
              subscriptionStatus: "demo",
              subscriptionPlan: null,
              subscriptionExpiry: null,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        }
      } catch (error) {
        console.error("Redirect result error:", error);
      }
    };

    checkRedirectResult();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser && db) {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          setUserData({ id: userDoc.id, ...userDoc.data() } as User);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<{ isAdminLogin?: boolean }> => {
    if (!auth) throw new Error("Firebase not configured");
    
    // Check if admin login
    const isAdminLogin = email === ADMIN_EMAIL && password === ADMIN_PASSWORD;
    
    await signInWithEmailAndPassword(auth, email, password);
    
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
    if (!auth || !db) throw new Error("Firebase not configured");
    
    try {
      const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
      
      await updateProfile(newUser, { displayName });
      
      // All new users start as "payment_pending" until admin approves
      await setDoc(doc(db, "users", newUser.uid), {
        email,
        displayName,
        phone,
        role: "landlord",
        subscriptionStatus: "payment_pending", // Payment pending until admin approves
        subscriptionPlan: paymentInfo.plan,
        subscriptionStartDate: null,
        subscriptionExpiry: null,
        paymentMethod: paymentInfo.paymentMethod,
        paymentNumber: paymentInfo.paymentNumber,
        paymentTransactionId: paymentInfo.transactionId,
        paymentAmount: paymentInfo.amount,
        paymentDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Create a payment request for admin to verify
      await addDoc(collection(db, "paymentRequests"), {
        userId: newUser.uid,
        userEmail: email,
        userName: displayName,
        plan: paymentInfo.plan,
        amount: paymentInfo.amount,
        paymentMethod: paymentInfo.paymentMethod,
        transactionId: paymentInfo.transactionId,
        screenshotUrl: "", // User can upload screenshot later if needed
        status: "pending",
        createdAt: serverTimestamp(),
        processedAt: null,
        processedBy: null,
        rejectionReason: null,
      });
    } catch (error) {
      console.error("SignUp error:", error);
      throw error;
    }
  };

  const signInWithGoogle = async (): Promise<{ needsPaymentInfo?: boolean }> => {
    if (!auth || !db) throw new Error("Firebase not configured");
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    try {
      // Try popup first
      const { user: googleUser } = await signInWithPopup(auth, provider);
      
      // Check if user document exists
      const userDoc = await getDoc(doc(db, "users", googleUser.uid));
      if (!userDoc.exists()) {
        // New Google user - they need to provide payment info
        // Create a temporary user doc with pending_payment_info status
        await setDoc(doc(db, "users", googleUser.uid), {
          email: googleUser.email,
          displayName: googleUser.displayName || "User",
          phone: googleUser.phoneNumber || "",
          role: "landlord",
          subscriptionStatus: "payment_pending",
          subscriptionPlan: null,
          subscriptionStartDate: null,
          subscriptionExpiry: null,
          paymentMethod: null,
          paymentNumber: null,
          paymentTransactionId: null,
          paymentAmount: null,
          paymentDate: null,
          needsPaymentInfo: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return { needsPaymentInfo: true };
      }
      return { needsPaymentInfo: false };
    } catch (error: unknown) {
      // If popup is blocked or fails, fallback to redirect
      const firebaseError = error as { code?: string };
      if (
        firebaseError.code === "auth/popup-blocked" ||
        firebaseError.code === "auth/popup-closed-by-user" ||
        firebaseError.code === "auth/cancelled-popup-request"
      ) {
        // Use redirect as fallback
        await signInWithRedirect(auth, provider);
      } else {
        throw error;
      }
      return {};
    }
  };

  const signOut = async () => {
    if (!auth) throw new Error("Firebase not configured");
    await firebaseSignOut(auth);
    setUserData(null);
  };

  const isAdmin = userData?.role === "admin";
  const isDemoUser = userData?.subscriptionStatus === "demo";
  
  // Check if user can access dashboard - only active users (+ admins)
  const canAccessDashboard = isAdmin || (userData?.subscriptionStatus === "active" && !isDemoMode) || isDemoMode;
  
  // Get user status message
  const getUserStatusMessage = (): string | null => {
    if (isDemoMode) return null;
    if (!userData) return null;
    
    switch (userData.subscriptionStatus) {
      case "demo":
        return "আপনি Demo মোডে আছেন। সম্পূর্ণ access এর জন্য কোন package কিনুন।";
      case "payment_pending":
        return "আপনার পেমেন্ট যাচাইকরণের অপেক্ষায় আছে। Admin approve করলে আপনি dashboard access পাবেন।";
      case "banned":
        return "আপনার একাউন্ট বন্ধ করা হয়েছে। সাহায্যের জন্য admin এর সাথে যোগাযোগ করুন।";
      case "payment_due":
        return "আপনার পেমেন্ট বকেয়া আছে। পেমেন্ট করে সাবস্ক্রিপশন চালু রাখুন।";
      default:
        return null;
    }
  };
  
  const userStatusMessage = getUserStatusMessage();
  
  // Demo mode functions
  const enterDemoMode = () => {
    setIsDemoMode(true);
  };
  
  const exitDemoMode = () => {
    setIsDemoMode(false);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        userData, 
        loading, 
        isConfigured: isFirebaseConfigured, 
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
