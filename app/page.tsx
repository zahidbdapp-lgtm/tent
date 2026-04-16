"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Building2,
  Users,
  Receipt,
  Bell,
  Shield,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Zap,
  Clock,
  Check,
} from "lucide-react";
import { isFirebaseConfigured } from "@/lib/firebase";
import { PRICING_PLANS } from "@/types";

const features = [
  {
    icon: Building2,
    title: "Property Management",
    titleBn: "প্রপার্টি ম্যানেজমেন্ট",
    description: "একাধিক প্রপার্টি, ইউনিট ও ভাড়াটিয়াদের তথ্য একসাথে ম্যানেজ করুন।",
  },
  {
    icon: Users,
    title: "Tenant Portal",
    titleBn: "ভাড়াটিয়া পোর্টাল",
    description: "ভাড়াটিয়াদের যোগাযোগ, ডকুমেন্ট ও পেমেন্ট হিস্ট্রি সংরক্ষণ করুন।",
  },
  {
    icon: Receipt,
    title: "Invoice Tracking",
    titleBn: "বিল ট্র্যাকিং",
    description: "অটোমেটিক ভাড়া হিসাব ও পেমেন্ট স্ট্যাটাস আপডেট সহ বিল তৈরি করুন।",
  },
  {
    icon: Bell,
    title: "SMS & Email Reminders",
    titleBn: "SMS ও Email রিমাইন্ডার",
    description: "ভাড়া বাকি থাকলে অটো রিমাইন্ডার ও SMS পাঠান।",
  },
];

const benefits = [
  "একই জায়গায় সব প্রপার্টি ম্যানেজমেন্ট",
  "অটোমেটিক ভাড়া রিমাইন্ডার",
  "Agreement ও NID ডকুমেন্ট সংরক্ষণ",
  "Real-time পেমেন্ট ট্র্যাকিং",
  "খরচ হিসাব ও রিপোর্ট",
  "PDF রিসিট জেনারেশন",
];

const paymentMethods = [
  {
    name: "bKash",
    number: "Send Money",
    color: "bg-[#E2136E]",
  },
  {
    name: "Nagad",
    number: "Send Money",
    color: "bg-[#F6921E]",
  },
  {
    name: "Rocket",
    number: "Send Money",
    color: "bg-[#8B2F89]",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Firebase Setup Banner */}
      {!isFirebaseConfigured && (
        <div className="bg-amber-500 text-amber-950 py-3 px-4">
          <div className="container mx-auto flex items-center justify-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Firebase not configured.</span>
            <span>Click Settings (gear icon) &gt; Vars to add your Firebase environment variables.</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">PropManager</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>শুরু করুন</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm text-primary">
            <Shield className="h-4 w-4" />
            বাংলাদেশের জন্য তৈরি
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-balance">
            আপনার বাড়িভাড়া ব্যবসা <br className="hidden sm:block" />
            <span className="text-primary">সহজে ম্যানেজ করুন</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed text-pretty">
            PropManager দিয়ে প্রপার্টি, ভাড়াটিয়া ও ভাড়া আদায় সব এক জায়গায়। 
            সময় বাঁচান, হিসাব রাখুন, টেনশন কমান।
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/demo">
              <Button size="lg" className="gap-2 text-base">
                <Zap className="h-5 w-5" />
                ফ্রি Demo দেখুন
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="lg" className="text-base">
                একাউন্ট তৈরি করুন
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            কোনো ক্রেডিট কার্ড লাগবে না - ফ্রি Demo দিয়ে শুরু করুন
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/50 py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold">সব ফিচার এক জায়গায়</h2>
            <p className="mt-2 text-muted-foreground">
              আপনার প্রপার্টি ম্যানেজমেন্ট সহজ করতে যা যা দরকার
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">{feature.titleBn}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 md:py-20" id="pricing">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold">সাশ্রয়ী মূল্যে শুরু করুন</h2>
            <p className="mt-2 text-muted-foreground">
              আপনার প্রয়োজন অনুযায়ী প্যাকেজ বেছে নিন
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
            {/* Monthly Plan */}
            <Card className="relative">
              <CardHeader>
                <CardTitle className="text-lg">{PRICING_PLANS.monthly.nameBn}</CardTitle>
                <CardDescription>মাসে মাসে পেমেন্ট করুন</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-bold">৳{PRICING_PLANS.monthly.price}</span>
                  <span className="text-muted-foreground">/মাস</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success" />
                    সব ফিচার আনলিমিটেড
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success" />
                    আনলিমিটেড প্রপার্টি
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success" />
                    Email সাপোর্ট
                  </li>
                </ul>
                <Link href="/register" className="block">
                  <Button variant="outline" className="w-full">
                    শুরু করুন
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Yearly Plan - Most Popular */}
            <Card className="relative border-primary shadow-lg">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                  সবচেয়ে জনপ্রিয়
                </span>
              </div>
              <CardHeader>
                <CardTitle className="text-lg">{PRICING_PLANS.yearly.nameBn}</CardTitle>
                <CardDescription>বছরে একবার পেমেন্ট করুন</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-2">
                  <span className="text-4xl font-bold">৳{PRICING_PLANS.yearly.price}</span>
                  <span className="text-muted-foreground">/বছর</span>
                </div>
                <p className="text-sm text-success mb-6">
                  {PRICING_PLANS.yearly.discount} সাশ্রয় - মাত্র ৳{Math.round(PRICING_PLANS.yearly.price / 12)}/মাস
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success" />
                    সব ফিচার আনলিমিটেড
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success" />
                    আনলিমিটেড প্রপার্টি
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success" />
                    Priority সাপোর্ট
                  </li>
                </ul>
                <Link href="/register" className="block">
                  <Button className="w-full">
                    শুরু করুন
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* 2 Year Plan */}
            <Card className="relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-success text-success-foreground text-xs font-medium px-3 py-1 rounded-full">
                  সেরা দাম
                </span>
              </div>
              <CardHeader>
                <CardTitle className="text-lg">{PRICING_PLANS["2year"].nameBn}</CardTitle>
                <CardDescription>২ বছরের জন্য পেমেন্ট করুন</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-2">
                  <span className="text-4xl font-bold">৳{PRICING_PLANS["2year"].price}</span>
                  <span className="text-muted-foreground">/২ বছর</span>
                </div>
                <p className="text-sm text-success mb-6">
                  {PRICING_PLANS["2year"].discount} সাশ্রয় - মাত্র ৳{Math.round(PRICING_PLANS["2year"].price / 24)}/মাস
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success" />
                    সব ফিচার আনলিমিটেড
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success" />
                    আনলিমিটেড প্রপার্টি
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success" />
                    VIP সাপোর্ট
                  </li>
                </ul>
                <Link href="/register" className="block">
                  <Button variant="outline" className="w-full">
                    শুরু করুন
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Payment Methods Section */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-4">
              <Smartphone className="h-6 w-6 text-primary" />
              <h2 className="text-2xl md:text-3xl font-bold">সহজ পেমেন্ট মেথড</h2>
            </div>
            <p className="text-muted-foreground">
              bKash, Nagad বা Rocket এ Send Money করে সাবস্ক্রাইব করুন
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3 max-w-2xl mx-auto">
            {paymentMethods.map((method) => (
              <Card key={method.name} className="text-center">
                <CardContent className="pt-6">
                  <div className={`${method.color} w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center`}>
                    <span className="text-white font-bold text-lg">{method.name[0]}</span>
                  </div>
                  <h3 className="font-semibold">{method.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{method.number}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6">
            পেমেন্ট করার পর Transaction ID দিয়ে সাবস্ক্রিপশন একটিভেট করুন
          </p>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">কেন PropManager?</h2>
              <p className="mt-4 text-muted-foreground">
                বাড়ি ভাড়া দেওয়া মালিকদের জন্য বিশেষভাবে তৈরি। সহজ, দ্রুত ও নির্ভরযোগ্য।
              </p>
              <ul className="mt-8 grid gap-3">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex gap-4">
                <Link href="/demo">
                  <Button size="lg">ফ্রি Demo দেখুন</Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-video rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border">
                <div className="text-center p-8">
                  <Building2 className="h-16 w-16 text-primary mx-auto mb-4" />
                  <p className="text-lg font-medium">আপনার সব প্রপার্টি, এক জায়গায়</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Dashboard demo দেখতে উপরের বাটনে ক্লিক করুন
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground">
            আজই শুরু করুন
          </h2>
          <p className="mt-4 text-primary-foreground/80 max-w-xl mx-auto">
            হাজারো বাড়িওয়ালা PropManager ব্যবহার করছেন তাদের প্রপার্টি ম্যানেজমেন্টে। 
            আপনিও যোগ দিন।
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/demo">
              <Button size="lg" variant="secondary" className="gap-2">
                <Clock className="h-5 w-5" />
                ফ্রি Demo দেখুন
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="gap-2 bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                একাউন্ট তৈরি করুন
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="font-semibold">PropManager</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} PropManager. সর্বস্বত্ব সংরক্ষিত।
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
