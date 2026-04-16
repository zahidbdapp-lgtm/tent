"use client";

import { useEffect, useState, useRef } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Empty } from "@/components/ui/empty";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  FileText,
  Upload,
  ExternalLink,
  Phone,
  MessageSquare,
  Camera,
  CreditCard,
  Calendar,
  Zap,
  Eye,
  ImageIcon,
} from "lucide-react";
import type { Tenant, Property, TenantStatus } from "@/types";
import { demoTenants, demoProperties } from "@/lib/demo-data";
import { getSMSTemplate, openSMSApp, SMS_TEMPLATES, SMSTemplateType, SMSTemplateData } from "@/lib/sms-templates";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

interface TenantFormData {
  propertyId: string;
  unitNumber: string;
  name: string;
  email: string;
  phone: string;
  nid: string;
  monthlyRent: string;
  gasCharge: string;
  waterCharge: string;
  serviceCharge: string;
  electricityBill: string;
  currentBill: string;
  advanceAmount: string;
  advanceMonths: string;
  moveInDate: string;
  status: TenantStatus;
}

const initialFormData: TenantFormData = {
  propertyId: "",
  unitNumber: "",
  name: "",
  email: "",
  phone: "",
  nid: "",
  monthlyRent: "",
  gasCharge: "",
  waterCharge: "",
  serviceCharge: "",
  electricityBill: "",
  currentBill: "",
  advanceAmount: "",
  advanceMonths: "",
  moveInDate: "",
  status: "active",
};

const statusOptions: { value: TenantStatus; label: string }[] = [
  { value: "active", label: "সক্রিয়" },
  { value: "inactive", label: "নিষ্ক্রিয়" },
  { value: "pending", label: "অপেক্ষমাণ" },
];

export default function TenantsPage() {
  const { user, isDemoUser, isAdmin } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDocsDialogOpen, setIsViewDocsDialogOpen] = useState(false);
  const [isSMSDialogOpen, setIsSMSDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [selectedSMSTemplate, setSelectedSMSTemplate] = useState<SMSTemplateType>("rent_reminder");
  const [customSMSMessage, setCustomSMSMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<TenantFormData>(initialFormData);
  
  // File states
  const [agreementFile, setAgreementFile] = useState<File | null>(null);
  const [nidFrontFile, setNidFrontFile] = useState<File | null>(null);
  const [nidBackFile, setNidBackFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  
  // File previews
  const [nidFrontPreview, setNidFrontPreview] = useState<string | null>(null);
  const [nidBackPreview, setNidBackPreview] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // File warning dialog
  const [fileWarning, setFileWarning] = useState<{
    show: boolean;
    file: File | null;
    type: "nidFront" | "nidBack" | "photo" | null;
  }>({ show: false, file: null, type: null });

  // Document file warning dialog
  const [documentWarning, setDocumentWarning] = useState<{
    show: boolean;
    file: File | null;
  }>({ show: false, file: null });

  const fetchData = async () => {
    if (!user) return;

    try {
      // For demo users, show demo data
      if (isDemoUser && !isAdmin) {
        setProperties(demoProperties);
        setTenants(demoTenants);
        setLoading(false);
        return;
      }

      if (!db) {
        setLoading(false);
        return;
      }

      // Fetch properties
      const propertiesQuery = query(
        collection(db, "properties"),
        where("ownerId", "==", user.uid)
      );
      const propertiesSnapshot = await getDocs(propertiesQuery);
      const propertiesData = propertiesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Property[];
      setProperties(propertiesData);

      // Fetch tenants
      const tenantsQuery = query(
        collection(db, "tenants"),
        where("ownerId", "==", user.uid)
      );
      const tenantsSnapshot = await getDocs(tenantsQuery);
      const tenantsData = tenantsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Tenant[];
      setTenants(tenantsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("ডাটা লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, isDemoUser, isAdmin]);

  const handleOpenDialog = (tenant?: Tenant) => {
    if (tenant) {
      setSelectedTenant(tenant);
      setFormData({
        propertyId: tenant.propertyId,
        unitNumber: tenant.unitNumber,
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        nid: tenant.nid,
        monthlyRent: tenant.monthlyRent?.toString() || "",
        gasCharge: tenant.gasCharge?.toString() || "",
        waterCharge: tenant.waterCharge?.toString() || "",
        serviceCharge: tenant.serviceCharge?.toString() || "",
        electricityBill: tenant.electricityBill?.toString() || "",
        currentBill: tenant.currentBill?.toString() || "",
        advanceAmount: tenant.advanceAmount?.toString() || "",
        advanceMonths: tenant.advanceMonths?.toString() || "",
        moveInDate: tenant.moveInDate?.toDate?.()?.toISOString().split("T")[0] || "",
        status: tenant.status,
      });
      setNidFrontPreview(tenant.nidFrontUrl || null);
      setNidBackPreview(tenant.nidBackUrl || null);
      setPhotoPreview(tenant.photoUrl || null);
    } else {
      setSelectedTenant(null);
      setFormData(initialFormData);
      setNidFrontPreview(null);
      setNidBackPreview(null);
      setPhotoPreview(null);
    }
    setAgreementFile(null);
    setNidFrontFile(null);
    setNidBackFile(null);
    setPhotoFile(null);
    setIsDialogOpen(true);
  };

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    if (!user || !storage) throw new Error("Storage not available");
    const fileName = `${folder}/${user.uid}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, fileName);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "nidFront" | "nidBack" | "photo"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Image files max 100KB
    const maxImageSize = 100 * 1024; // 100KB
    
    if (file.size > maxImageSize) {
      // Show warning dialog
      setFileWarning({
        show: true,
        file: file,
        type: type,
      });
      e.target.value = '';
      return;
    }

    // Validate image type
    if (!file.type.startsWith('image/')) {
      toast.error("শুধুমাত্র ছবি ফাইল আপলোড করুন (JPG, PNG, etc.)");
      e.target.value = '';
      return;
    }

    const preview = URL.createObjectURL(file);

    switch (type) {
      case "nidFront":
        setNidFrontFile(file);
        setNidFrontPreview(preview);
        break;
      case "nidBack":
        setNidBackFile(file);
        setNidBackPreview(preview);
        break;
      case "photo":
        setPhotoFile(file);
        setPhotoPreview(preview);
        break;
    }
  };
  
  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Document files max 100KB for optimization
    const maxDocSize = 100 * 1024; // 100KB
    
    if (file.size > maxDocSize) {
      // Show warning dialog
      setDocumentWarning({
        show: true,
        file: file,
      });
      e.target.value = '';
      return;
    }
    
    // Validate document type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("শুধুমাত্র PDF বা Word ফাইল আপলোড করুন");
      e.target.value = '';
      return;
    }
    
    setAgreementFile(file);
  };

  const handleFileWarningAccept = () => {
    if (!fileWarning.file || !fileWarning.type) return;
    
    // Proceed with upload even though it's large
    const preview = URL.createObjectURL(fileWarning.file);
    
    switch (fileWarning.type) {
      case "nidFront":
        setNidFrontFile(fileWarning.file);
        setNidFrontPreview(preview);
        break;
      case "nidBack":
        setNidBackFile(fileWarning.file);
        setNidBackPreview(preview);
        break;
      case "photo":
        setPhotoFile(fileWarning.file);
        setPhotoPreview(preview);
        break;
    }
    
    setFileWarning({ show: false, file: null, type: null });
    toast.success("ফাইল নির্বাচিত হয়েছে (প্রি-অপ্টিমাইজেশনের জন্য সুপারিশ)");
  };

  const handleFileWarningReject = () => {
    setFileWarning({ show: false, file: null, type: null });
    toast.error("ফাইল বাতিল করা হয়েছে। আরও একটি ছোট ফাইল চেষ্টা করুন।");
  };

  const handleDocumentWarningAccept = () => {
    if (!documentWarning.file) return;
    
    // Validate document type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(documentWarning.file.type)) {
      toast.error("শুধুমাত্র PDF বা Word ফাইল আপলোড করুন");
      setDocumentWarning({ show: false, file: null });
      return;
    }
    
    setAgreementFile(documentWarning.file);
    setDocumentWarning({ show: false, file: null });
    toast.success("ডকুমেন্ট নির্বাচিত হয়েছে (প্রি-অপ্টিমাইজেশনের জন্য সুপারিশ)");
  };

  const handleDocumentWarningReject = () => {
    setDocumentWarning({ show: false, file: null });
    toast.error("ফাইল বাতিল করা হয়েছে। আরও একটি ছোট ফাইল চেষ্টা করুন।");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;

    // Check for demo mode
    if (isDemoUser && !isAdmin) {
      toast.error("Demo mode এ ডাটা সংরক্ষণ করা যায় না। Subscribe করুন।");
      return;
    }

    if (!formData.propertyId) {
      toast.error("প্রপার্টি সিলেক্ট করুন");
      return;
    }

    setIsSubmitting(true);

    try {
      let agreementDocUrl = selectedTenant?.agreementDocUrl || "";
      let nidFrontUrl = selectedTenant?.nidFrontUrl || "";
      let nidBackUrl = selectedTenant?.nidBackUrl || "";
      let photoUrl = selectedTenant?.photoUrl || "";

      // Upload files if selected
      if (agreementFile) {
        agreementDocUrl = await uploadFile(agreementFile, "agreements");
      }
      if (nidFrontFile) {
        nidFrontUrl = await uploadFile(nidFrontFile, "nid-images");
      }
      if (nidBackFile) {
        nidBackUrl = await uploadFile(nidBackFile, "nid-images");
      }
      if (photoFile) {
        photoUrl = await uploadFile(photoFile, "tenant-photos");
      }

      const tenantData = {
        propertyId: formData.propertyId,
        ownerId: user.uid,
        unitNumber: formData.unitNumber,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        nid: formData.nid,
        nidFrontUrl,
        nidBackUrl,
        photoUrl,
        agreementDocUrl,
        monthlyRent: parseFloat(formData.monthlyRent) || 0,
        gasCharge: parseFloat(formData.gasCharge) || 0,
        waterCharge: parseFloat(formData.waterCharge) || 0,
        serviceCharge: parseFloat(formData.serviceCharge) || 0,
        electricityBill: parseFloat(formData.electricityBill) || 0,
        currentBill: parseFloat(formData.currentBill) || 0,
        advanceAmount: parseFloat(formData.advanceAmount) || 0,
        advanceMonths: parseInt(formData.advanceMonths) || 0,
        moveInDate: formData.moveInDate
          ? Timestamp.fromDate(new Date(formData.moveInDate))
          : serverTimestamp(),
        status: formData.status,
        updatedAt: serverTimestamp(),
      };

      if (selectedTenant) {
        await updateDoc(doc(db, "tenants", selectedTenant.id), tenantData);
        toast.success("ভাড়াটিয়া আপডেট হয়েছে");
      } else {
        await addDoc(collection(db, "tenants"), {
          ...tenantData,
          createdAt: serverTimestamp(),
        });
        toast.success("ভাড়াটিয়া যোগ হয়েছে");
      }

      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Failed to save tenant:", error);
      toast.error("সংরক্ষণ করতে সমস্যা হয়েছে");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTenant || !db) return;

    if (isDemoUser && !isAdmin) {
      toast.error("Demo mode এ ডিলিট করা যায় না");
      return;
    }

    try {
      await deleteDoc(doc(db, "tenants", selectedTenant.id));
      toast.success("ভাড়াটিয়া সরানো হয়েছে");
      setIsDeleteDialogOpen(false);
      setSelectedTenant(null);
      fetchData();
    } catch (error) {
      console.error("Failed to delete tenant:", error);
      toast.error("সরাতে সমস্যা হয়েছে");
    }
  };

  const getPropertyName = (propertyId: string) => {
    return properties.find((p) => p.id === propertyId)?.name || "Unknown";
  };

  const getStatusBadge = (status: TenantStatus) => {
    const config: Record<TenantStatus, { variant: "default" | "secondary" | "destructive"; label: string }> = {
      active: { variant: "default", label: "সক্রিয়" },
      inactive: { variant: "destructive", label: "নিষ্ক্রিয়" },
      pending: { variant: "secondary", label: "অপেক্ষমাণ" },
    };
    return <Badge variant={config[status].variant}>{config[status].label}</Badge>;
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleSMS = (phone: string, name: string) => {
    const message = `প্রিয় ${name}, আপনার ভাড়া সংক্রান্ত তথ্য...`;
    window.location.href = `sms:${phone}?body=${encodeURIComponent(message)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Demo Mode Banner */}
      {isDemoUser && !isAdmin && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Demo Mode</h3>
                  <Badge variant="secondary">Sample Data</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  এটি demo data। নিজের ভাড়াটিয়া যোগ করতে subscribe করুন।
                </p>
              </div>
            </div>
            <Link href="/dashboard/subscription">
              <Button size="sm">
                <Zap className="h-4 w-4 mr-2" />
                Upgrade
              </Button>
            </Link>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">ভাড়াটিয়া</h2>
          <p className="text-muted-foreground">আপনার ভাড়াটিয়াদের তথ্য ম্যানেজ করুন</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => handleOpenDialog()} 
              disabled={properties.length === 0 || (isDemoUser && !isAdmin)}
            >
              <Plus className="mr-2 h-4 w-4" />
              ভাড়াটিয়া যোগ করুন
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedTenant ? "ভাড়াটিয়া আপডেট করুন" : "নতুন ভাড়াটিয়া যোগ করুন"}
              </DialogTitle>
              <DialogDescription>
                {selectedTenant
                  ? "ভাড়াটিয়ার তথ্য আপডেট করুন"
                  : "নতুন ভাড়াটিয়ার তথ্য দিন"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                {/* Property & Unit */}
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="property">প্রপার্টি *</FieldLabel>
                    <Select
                      value={formData.propertyId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, propertyId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="প্রপার্টি সিলেক্ট করুন" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="unitNumber">ইউনিট নম্বর *</FieldLabel>
                    <Input
                      id="unitNumber"
                      value={formData.unitNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, unitNumber: e.target.value })
                      }
                      placeholder="যেমন: A-101, ৩য় তলা"
                      required
                    />
                  </Field>
                </div>

                {/* Name */}
                <Field>
                  <FieldLabel htmlFor="name">পুরো নাম *</FieldLabel>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="ভাড়াটিয়ার নাম"
                    required
                  />
                </Field>

                {/* Contact */}
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="email">ইমেইল</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="email@example.com"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="phone">ফোন নম্বর *</FieldLabel>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+880 1XXX-XXXXXX"
                      required
                    />
                  </Field>
                </div>

                {/* NID */}
                <Field>
                  <FieldLabel htmlFor="nid">জাতীয় পরিচয়পত্র নম্বর (NID)</FieldLabel>
                  <Input
                    id="nid"
                    value={formData.nid}
                    onChange={(e) =>
                      setFormData({ ...formData, nid: e.target.value })
                    }
                    placeholder="১৭ ডিজিট NID নম্বর"
                  />
                </Field>

                {/* NID & Photo Uploads */}
                <div className="border-t pt-4 mt-2">
                  <h4 className="font-medium mb-1">NID ও ছবি আপলোড</h4>
                  <p className="text-xs text-muted-foreground mb-3">সর্বোচ্চ 100KB প্রতিটি ছবি</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Field>
                    <FieldLabel>NID সামনে</FieldLabel>
                    <div
                      onClick={() => document.getElementById("nidFront")?.click()}
                      className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      {nidFrontPreview ? (
                        <img
                          src={nidFrontPreview}
                          alt="NID Front"
                          className="h-20 mx-auto rounded object-cover"
                        />
                      ) : (
                        <>
                          <CreditCard className="h-8 w-8 mx-auto text-muted-foreground" />
                          <p className="text-xs text-muted-foreground mt-1">ক্লিক করুন</p>
                        </>
                      )}
                    </div>
                    <input
                      id="nidFront"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "nidFront")}
                      className="hidden"
                    />
                  </Field>

                  <Field>
                    <FieldLabel>NID পেছনে</FieldLabel>
                    <div
                      onClick={() => document.getElementById("nidBack")?.click()}
                      className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      {nidBackPreview ? (
                        <img
                          src={nidBackPreview}
                          alt="NID Back"
                          className="h-20 mx-auto rounded object-cover"
                        />
                      ) : (
                        <>
                          <CreditCard className="h-8 w-8 mx-auto text-muted-foreground" />
                          <p className="text-xs text-muted-foreground mt-1">ক্লিক করুন</p>
                        </>
                      )}
                    </div>
                    <input
                      id="nidBack"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "nidBack")}
                      className="hidden"
                    />
                  </Field>

                  <Field>
                    <FieldLabel>ভাড়াটিয়ার ছবি</FieldLabel>
                    <div
                      onClick={() => document.getElementById("photo")?.click()}
                      className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="Tenant"
                          className="h-20 mx-auto rounded object-cover"
                        />
                      ) : (
                        <>
                          <Camera className="h-8 w-8 mx-auto text-muted-foreground" />
                          <p className="text-xs text-muted-foreground mt-1">ক্লিক করুন</p>
                        </>
                      )}
                    </div>
                    <input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "photo")}
                      className="hidden"
                    />
                  </Field>
                </div>

                {/* Rent Details */}
                <div className="border-t pt-4 mt-2">
                  <h4 className="font-medium mb-3">ভাড়া বিবরণ</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="monthlyRent">মাসিক ভাড়া (৳)</FieldLabel>
                      <Input
                        id="monthlyRent"
                        type="number"
                        min="0"
                        value={formData.monthlyRent}
                        onChange={(e) =>
                          setFormData({ ...formData, monthlyRent: e.target.value })
                        }
                        placeholder="যেমন: 15000"
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="gasCharge">গ্যাস বিল (৳)</FieldLabel>
                      <Input
                        id="gasCharge"
                        type="number"
                        min="0"
                        value={formData.gasCharge}
                        onChange={(e) =>
                          setFormData({ ...formData, gasCharge: e.target.value })
                        }
                        placeholder="যেমন: 1500"
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="waterCharge">পানি বিল (৳)</FieldLabel>
                      <Input
                        id="waterCharge"
                        type="number"
                        min="0"
                        value={formData.waterCharge}
                        onChange={(e) =>
                          setFormData({ ...formData, waterCharge: e.target.value })
                        }
                        placeholder="যেমন: 500"
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="serviceCharge">সার্ভিস চার্জ (৳)</FieldLabel>
                      <Input
                        id="serviceCharge"
                        type="number"
                        min="0"
                        value={formData.serviceCharge}
                        onChange={(e) =>
                          setFormData({ ...formData, serviceCharge: e.target.value })
                        }
                        placeholder="যেমন: 2000"
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="electricityBill">বিদ্যুৎ বিল (৳)</FieldLabel>
                      <Input
                        id="electricityBill"
                        type="number"
                        min="0"
                        value={formData.electricityBill}
                        onChange={(e) =>
                          setFormData({ ...formData, electricityBill: e.target.value })
                        }
                        placeholder="যেমন: 1500"
                      />
                    </Field>
                  </div>
                </div>

                {/* Current Bill & Advance */}
                <div className="grid grid-cols-3 gap-4">
                  <Field>
                    <FieldLabel htmlFor="currentBill">বর্তমান বকেয়া (৳)</FieldLabel>
                    <Input
                      id="currentBill"
                      type="number"
                      min="0"
                      value={formData.currentBill}
                      onChange={(e) =>
                        setFormData({ ...formData, currentBill: e.target.value })
                      }
                      placeholder="বকেয়া থাকলে"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="advanceAmount">অগ্রিম জমা (৳)</FieldLabel>
                    <Input
                      id="advanceAmount"
                      type="number"
                      min="0"
                      value={formData.advanceAmount}
                      onChange={(e) =>
                        setFormData({ ...formData, advanceAmount: e.target.value })
                      }
                      placeholder="যেমন: 30000"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="advanceMonths">অগ্রিম (মাস)</FieldLabel>
                    <Input
                      id="advanceMonths"
                      type="number"
                      min="0"
                      value={formData.advanceMonths}
                      onChange={(e) =>
                        setFormData({ ...formData, advanceMonths: e.target.value })
                      }
                      placeholder="যেমন: 2"
                    />
                  </Field>
                </div>

                {/* Move-in Date & Status */}
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="moveInDate">ভাড়া শুরুর তারিখ</FieldLabel>
                    <Input
                      id="moveInDate"
                      type="date"
                      value={formData.moveInDate}
                      onChange={(e) =>
                        setFormData({ ...formData, moveInDate: e.target.value })
                      }
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="status">স্ট্যাটাস</FieldLabel>
                    <Select
                      value={formData.status}
                      onValueChange={(value: TenantStatus) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                {/* Agreement Document */}
                <Field>
                  <FieldLabel htmlFor="agreement">চুক্তিপত্র (PDF/Doc) - সর্বোচ্চ 3MB</FieldLabel>
                  <div className="flex items-center gap-2">
                    <Input
                      id="agreement"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleDocumentChange}
                      className="flex-1"
                    />
                    {selectedTenant?.agreementDocUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        asChild
                      >
                        <a
                          href={selectedTenant.agreementDocUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                  {agreementFile && (
                    <p className="text-sm text-muted-foreground mt-1">
                      সিলেক্টেড: {agreementFile.name} ({(agreementFile.size / 1024).toFixed(1)}KB)
                    </p>
                  )}
                </Field>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    বাতিল
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Spinner className="mr-2" />}
                    {selectedTenant ? "আপডেট করুন" : "যোগ করুন"}
                  </Button>
                </div>
              </FieldGroup>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {properties.length === 0 && !isDemoUser ? (
        <Card>
          <CardContent className="py-12">
            <Empty
              icon={Users}
              title="প্রথমে প্রপার্টি যোগ করুন"
              description="ভা���়াটিয়া যোগ করার আগে প্রপার্টি যোগ করুন"
            />
          </CardContent>
        </Card>
      ) : tenants.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <Empty
              icon={Users}
              title="কোনো ভাড়াটিয়া নেই"
              description="প্রথম ভাড়াটিয়া যোগ করে শুরু করুন"
            />
            {!isDemoUser && (
              <div className="mt-4 flex justify-center">
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  ভাড়াটিয়া যোগ করুন
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>সব ভাড়াটিয়া</CardTitle>
            <CardDescription>
              {tenants.length}জন ভাড়াটিয়া আপনার প্রপার্টিতে
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ভাড়াটিয়া</TableHead>
                  <TableHead>প্রপার্টি / ইউনিট</TableHead>
                  <TableHead>ভাড়া</TableHead>
                  <TableHead>বকেয়া</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {tenant.photoUrl ? (
                          <img
                            src={tenant.photoUrl}
                            alt={tenant.name}
                            className="h-9 w-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{tenant.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {tenant.phone}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {getPropertyName(tenant.propertyId)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ইউনিট {tenant.unitNumber}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      ৳{tenant.monthlyRent?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell>
                      {(tenant.currentBill || 0) > 0 ? (
                        <span className="text-destructive font-medium">
                          ৳{tenant.currentBill?.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-success">পরিশোধিত</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCall(tenant.phone)}
                          title="কল করুন"
                        >
                          <Phone className="h-4 w-4 text-success" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSMS(tenant.phone, tenant.name)}
                          title="SMS পাঠান"
                        >
                          <MessageSquare className="h-4 w-4 text-primary" />
                        </Button>
                        {/* View Documents Button */}
                        {(tenant.nidFrontUrl || tenant.nidBackUrl || tenant.photoUrl || tenant.agreementDocUrl) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedTenant(tenant);
                              setIsViewDocsDialogOpen(true);
                            }}
                            title="ডকুমেন্ট দেখুন"
                          >
                            <Eye className="h-4 w-4 text-blue-500" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(tenant)}
                          title="এডিট"
                          disabled={isDemoUser && !isAdmin}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedTenant(tenant);
                            setIsDeleteDialogOpen(true);
                          }}
                          title="মুছুন"
                          disabled={isDemoUser && !isAdmin}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* File Warning Dialog */}
      <AlertDialog open={fileWarning.show} onOpenChange={(open) => {
        if (!open) {
          setFileWarning({ show: false, file: null, type: null });
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>বড় ফাইল সতর্কতা</AlertDialogTitle>
            <AlertDialogDescription>
              আপনার ফাইল {fileWarning.file ? `${Math.round(fileWarning.file.size / 1024)}KB` : '?'} এর বিশাল, যা সর্বোচ্চ 100KB এর চেয়ে বেশি। 
              <br/>
              <br/>
              এটি আপলোড করতে আরও সময় লাগবে এবং লোডিং ধীর হতে পারে। 
              <br/>
              আপনি কি এগিয়ে যেতে চান?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleFileWarningReject}>
              অন্য ফাইল বেছে নিন
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleFileWarningAccept}>
              এই ফাইল ব্যবহার করুন
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Document File Warning Dialog */}
      <AlertDialog open={documentWarning.show} onOpenChange={(open) => {
        if (!open) {
          setDocumentWarning({ show: false, file: null });
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>বড় ডকুমেন্ট সতর্কতা</AlertDialogTitle>
            <AlertDialogDescription>
              আপনার ডকুমেন্ট {documentWarning.file ? `${Math.round(documentWarning.file.size / 1024)}KB` : '?'} এর বিশাল, যা সর্বোচ্চ 100KB এর চেয়ে বেশি। 
              <br/>
              <br/>
              এটি আপলোড করতে আরও সময় লাগবে এবং লোডিং ধীর হতে পারে। 
              <br/>
              আপনি কি এগিয়ে যেতে চান?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDocumentWarningReject}>
              অন্য ফাইল বেছে নিন
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDocumentWarningAccept}>
              এই ফাইল ব্যবহার করুন
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ভাড়াটিয়া মুছে ফেলুন</AlertDialogTitle>
            <AlertDialogDescription>
              আপনি কি নিশ্চিত &quot;{selectedTenant?.name}&quot; কে মুছে ফেলতে চান? এটি
              পূর্বাবস্থায় ফেরানো যাবে না।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              মুছে ফেলুন
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Documents Dialog */}
      <Dialog open={isViewDocsDialogOpen} onOpenChange={setIsViewDocsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTenant?.name} - ডকুমেন্টস
            </DialogTitle>
            <DialogDescription>
              আপলোড করা NID, ছবি এবং চুক্তিপত্র দেখুন
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Tenant Photo */}
            {selectedTenant?.photoUrl && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  ভাড়াটিয়ার ছবি
                </h4>
                <div className="relative inline-block">
                  <img
                    src={selectedTenant.photoUrl}
                    alt="Tenant Photo"
                    className="max-h-48 rounded-lg border"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2"
                    asChild
                  >
                    <a href={selectedTenant.photoUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      বড় করে দেখুন
                    </a>
                  </Button>
                </div>
              </div>
            )}

            {/* NID Images */}
            <div className="grid grid-cols-2 gap-4">
              {selectedTenant?.nidFrontUrl && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    NID সামনে
                  </h4>
                  <div className="relative">
                    <img
                      src={selectedTenant.nidFrontUrl}
                      alt="NID Front"
                      className="w-full rounded-lg border"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      asChild
                    >
                      <a href={selectedTenant.nidFrontUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </div>
              )}
              
              {selectedTenant?.nidBackUrl && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    NID পেছনে
                  </h4>
                  <div className="relative">
                    <img
                      src={selectedTenant.nidBackUrl}
                      alt="NID Back"
                      className="w-full rounded-lg border"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      asChild
                    >
                      <a href={selectedTenant.nidBackUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Agreement Document */}
            {selectedTenant?.agreementDocUrl && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  চুক্তিপত্র
                </h4>
                <div className="p-4 border rounded-lg bg-muted/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Agreement Document</p>
                      <p className="text-sm text-muted-foreground">PDF/Word Document</p>
                    </div>
                  </div>
                  <Button asChild>
                    <a href={selectedTenant.agreementDocUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      ডাউনলোড/দেখুন
                    </a>
                  </Button>
                </div>
              </div>
            )}

            {/* No documents message */}
            {!selectedTenant?.photoUrl && !selectedTenant?.nidFrontUrl && !selectedTenant?.nidBackUrl && !selectedTenant?.agreementDocUrl && (
              <div className="text-center py-8 text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>কোনো ডকুমেন্ট আপলোড করা হয়নি</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
