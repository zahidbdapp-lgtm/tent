"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/auth-context";
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
  Users,
  Calendar,
} from "lucide-react";
import type { Tenant } from "@/types";
import { demoTenants } from "@/lib/demo-data";

interface FileInfo {
  name: string;
  type: string;
  url: string;
  tenantId: string;
  tenantName: string;
  unitNumber: string;
}

export default function TenantsFilesPage() {
  const { userData, isDemoUser, isAdmin } = useAuth();
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);

   useEffect(() => {
      if (!userData) return;

     const fetchFiles = async () => {
       try {
         if (isDemoUser && !isAdmin) {
           // For demo users, use demo data
           const demoFiles: FileInfo[] = [];
           demoTenants.forEach((tenant) => {
             if (tenant.nidFrontUrl) {
               demoFiles.push({
                 name: `${tenant.name} - NID Front`,
                 type: "NID (Front)",
                 url: tenant.nidFrontUrl,
                 tenantId: tenant.id,
                 tenantName: tenant.name,
                 unitNumber: tenant.unitNumber,
               });
             }
             if (tenant.nidBackUrl) {
               demoFiles.push({
                 name: `${tenant.name} - NID Back`,
                 type: "NID (Back)",
                 url: tenant.nidBackUrl,
                 tenantId: tenant.id,
                 tenantName: tenant.name,
                 unitNumber: tenant.unitNumber,
               });
             }
             if (tenant.photoUrl) {
               demoFiles.push({
                 name: `${tenant.name} - Photo`,
                 type: "Photo",
                 url: tenant.photoUrl,
                 tenantId: tenant.id,
                 tenantName: tenant.name,
                 unitNumber: tenant.unitNumber,
               });
             }
           });
           setFiles(demoFiles);
           setLoading(false);
           return;
         }

         // Fetch tenants for this owner from Supabase
         const { data: tenants, error } = await supabase
           .from("tenants")
           .select("*")
           .eq("ownerId", userData.id);

         if (error) throw error;

         // Collect all files from all tenants
         const allFiles: FileInfo[] = [];
         tenants?.forEach((tenant) => {
           if (tenant.nidFrontUrl) {
             allFiles.push({
               name: `${tenant.name} - NID (Front)`,
               type: "NID Front",
               url: tenant.nidFrontUrl,
               tenantId: tenant.id,
               tenantName: tenant.name,
               unitNumber: tenant.unitNumber,
             });
           }
           if (tenant.nidBackUrl) {
             allFiles.push({
               name: `${tenant.name} - NID (Back)`,
               type: "NID Back",
               url: tenant.nidBackUrl,
               tenantId: tenant.id,
               tenantName: tenant.name,
               unitNumber: tenant.unitNumber,
             });
           }
           if (tenant.photoUrl) {
             allFiles.push({
               name: `${tenant.name} - Photo`,
               type: "Photo",
               url: tenant.photoUrl,
               tenantId: tenant.id,
               tenantName: tenant.name,
               unitNumber: tenant.unitNumber,
             });
           }
         });

         setFiles(allFiles.sort((a, b) => a.tenantName.localeCompare(b.tenantName)));
       } catch (error) {
         console.error("Failed to fetch files:", error);
       } finally {
         setLoading(false);
       }
     };

     fetchFiles();
   }, [user, isDemoUser, isAdmin]);

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
          সব ভাড়াটিয়াদের আপলোড করা ডকুমেন্ট এবং ছবি দেখুন ও ডাউনলোড করুন
        </p>
      </div>

      {files.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12">
            <Empty>
              <FileText className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 font-semibold">কোনো ডকুমেন্ট নেই</h3>
              <p className="text-sm text-muted-foreground">
                ভাড়াটিয়াদের তথ্য যোগ করার সময় ডকুমেন্ট আপলোড করুন
              </p>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Files by Category */}
          <div className="space-y-6">
            {/* NID Front Files */}
            {files.filter((f) => f.type === "NID Front").length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">NID (Front সাইড)</h2>
                <div className="grid gap-3">
                  {files
                    .filter((f) => f.type === "NID Front")
                    .map((file) => (
                      <FileCard key={`${file.tenantId}-nid-front`} file={file} />
                    ))}
                </div>
              </div>
            )}

            {/* NID Back Files */}
            {files.filter((f) => f.type === "NID Back").length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">NID (Back সাইড)</h2>
                <div className="grid gap-3">
                  {files
                    .filter((f) => f.type === "NID Back")
                    .map((file) => (
                      <FileCard key={`${file.tenantId}-nid-back`} file={file} />
                    ))}
                </div>
              </div>
            )}

            {/* Photos */}
            {files.filter((f) => f.type === "Photo").length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">ছবি</h2>
                <div className="grid gap-3">
                  {files
                    .filter((f) => f.type === "Photo")
                    .map((file) => (
                      <FileCard key={`${file.tenantId}-photo`} file={file} />
                    ))}
                </div>
              </div>
             )}
           </div>
         </div>
       )}
     </div>
   );
}

function FileCard({ file }: { file: FileInfo }) {
  const handleDownload = () => {
    if (file.url) {
      window.open(file.url, "_blank");
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-lg h-fit">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{file.tenantName}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="secondary">{file.type}</Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    Unit {file.unitNumber}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {file.url ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDownload}
                  title="View"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  ডাউনলোড
                </Button>
              </>
            ) : (
              <Badge variant="secondary">আপলোড নেই</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
