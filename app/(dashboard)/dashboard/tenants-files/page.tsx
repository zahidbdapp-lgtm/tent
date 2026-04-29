"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/auth-context";
import { databaseTenantsToTypescript } from "@/lib/supabase/tenantConverter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Empty } from "@/components/ui/empty";
import {
  FileText,
  Download,
  ExternalLink,
  MapPin,
  Phone,
  Image as ImageIcon,
  ChevronDown,
} from "lucide-react";
import type { Tenant } from "@/types";
import { demoTenants } from "@/lib/demo-data";

interface TenantFile {
  tenantId: string;
  tenantName: string;
  phone: string;
  unitNumber: string;
  monthlyRent: number;
  advanceAmount: number;
  nidFrontUrl: string | null;
  nidBackUrl: string | null;
  photoUrl: string | null;
}

export default function TenantsFilesPage() {
  const { userData, isDemoUser, isAdmin } = useAuth();
  const [tenantFiles, setTenantFiles] = useState<TenantFile[]>([]);
  const [loading, setLoading] = useState(true);

   useEffect(() => {
      if (!userData) return;

     const fetchFiles = async () => {
       try {
         if (isDemoUser && !isAdmin) {
           // For demo users, use demo data (fast)
           const demoTenantFiles = demoTenants.map((tenant) => ({
             tenantId: tenant.id,
             tenantName: tenant.name,
             phone: tenant.phone,
             unitNumber: tenant.unitNumber,
             monthlyRent: tenant.monthlyRent || 0,
             advanceAmount: tenant.advanceAmount || 0,
             nidFrontUrl: tenant.nidFrontUrl || null,
             nidBackUrl: tenant.nidBackUrl || null,
             photoUrl: tenant.photoUrl || null,
           }));
           setTenantFiles(demoTenantFiles);
           setLoading(false);
           return;
         }

          // Fetch only essential columns (faster)
          const { data: tenants, error } = await supabase
            .from("tenants")
            .select("id,name,phone,unit_number,monthly_rent,advance_amount,nid_front_url,nid_back_url,photo_url")
            .eq("owner_id", userData.id);

         if (error) throw error;

         // Convert to TypeScript format
         const typedTenants = databaseTenantsToTypescript(tenants as any || []);

         // Create tenant file objects with all details
         const tenantFilesList = typedTenants
           ?.map((tenant) => ({
             tenantId: tenant.id,
             tenantName: tenant.name,
             phone: tenant.phone,
             unitNumber: tenant.unitNumber,
             monthlyRent: tenant.monthlyRent || 0,
             advanceAmount: tenant.advanceAmount || 0,
             nidFrontUrl: tenant.nidFrontUrl || null,
             nidBackUrl: tenant.nidBackUrl || null,
             photoUrl: tenant.photoUrl || null,
           }))
           .sort((a, b) => a.tenantName.localeCompare(b.tenantName)) || [];

         setTenantFiles(tenantFilesList);
       } catch (error) {
         console.error("Failed to fetch files:", error);
       } finally {
         setLoading(false);
       }
     };

     fetchFiles();
   }, [userData, isDemoUser, isAdmin]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">ভাড়াটিয়া ডকুমেন্টস</h1>
        <p className="text-muted-foreground mt-2">
          প্রতিটি ভাড়াটিয়ার তথ্য এবং ডকুমেন্ট দেখুন
        </p>
      </div>

      {tenantFiles.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12">
            <Empty>
              <FileText className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 font-semibold">কোনো ভাড়াটিয়া নেই</h3>
              <p className="text-sm text-muted-foreground">
                ভাড়াটিয়াদের তথ্য যোগ করুন এবং ডকুমেন্ট আপলোড করুন
              </p>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tenantFiles.map((tenant) => (
            <TenantCard key={tenant.tenantId} tenant={tenant} />
          ))}
        </div>
       )}
     </div>
   );
}

function TenantCard({ tenant }: { tenant: TenantFile }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasAnyFiles = tenant.nidFrontUrl || tenant.nidBackUrl || tenant.photoUrl;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader 
        className="cursor-pointer bg-gradient-to-r from-primary/10 to-primary/5 pb-3"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{tenant.tenantName}</CardTitle>
              <Badge variant="outline" className="text-xs">
                Unit {tenant.unitNumber}
              </Badge>
            </div>
            <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {tenant.phone}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={hasAnyFiles ? "default" : "secondary"} className="text-xs">
              {hasAnyFiles ? "ডকুমেন্ট" : "নেই"}
            </Badge>
            <ChevronDown 
              className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </div>
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="pt-6 space-y-4">
          {/* Tenant Details */}
          <div className="grid grid-cols-2 gap-3 pb-4 border-b">
            <div className="bg-muted/50 p-3 rounded">
              <p className="text-xs text-muted-foreground font-medium">মাসিক ভাড়া</p>
              <p className="text-lg font-semibold mt-1">
                {tenant.monthlyRent.toLocaleString()} Tk
              </p>
            </div>
            <div className="bg-muted/50 p-3 rounded">
              <p className="text-xs text-muted-foreground font-medium">অগ্রিম টাকা</p>
              <p className="text-lg font-semibold mt-1">
                {tenant.advanceAmount.toLocaleString()} Tk
              </p>
            </div>
          </div>

          {/* Files Section */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2 text-sm">
              <ImageIcon className="h-4 w-4" />
              ডকুমেন্ট ও ছবি
            </h3>

            {hasAnyFiles ? (
              <div className="space-y-2">
                {tenant.nidFrontUrl && (
                  <FileRow
                    label="NID (Front সাইড)"
                    url={tenant.nidFrontUrl}
                  />
                )}
                {tenant.nidBackUrl && (
                  <FileRow
                    label="NID (Back সাইড)"
                    url={tenant.nidBackUrl}
                  />
                )}
                {tenant.photoUrl && (
                  <FileRow
                    label="ছবি"
                    url={tenant.photoUrl}
                  />
                )}
              </div>
            ) : (
              <div className="text-center py-4 bg-muted/30 rounded border border-dashed text-sm text-muted-foreground">
                কোনো ডকুমেন্ট নেই
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function FileRow({ label, url }: { label: string; url: string }) {
  const handleView = () => {
    window.open(url, "_blank");
  };

  return (
    <div className="flex items-center justify-between p-3 bg-muted/40 rounded border">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">{label}</span>
      </div>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleView}
          className="gap-1 h-8"
        >
          <ExternalLink className="h-3 w-3" />
          দেখুন
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleView}
          className="gap-1 h-8"
        >
          <Download className="h-3 w-3" />
          ডাউনলোড
        </Button>
      </div>
    </div>
  );
}
