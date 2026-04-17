"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/auth-context";
import { sendDueRentNotification } from "@/lib/emailjs";
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
  Receipt,
  Mail,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  FileText,
  Send,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import type { Invoice, Tenant, Property, InvoiceStatus } from "@/types";

interface InvoiceFormData {
  tenantId: string;
  month: string;
  rent: number;
  gasCharge: number;
  waterCharge: number;
  serviceCharge: number;
  electricityBill: number;
  dueDate: string;
  paidAmount: number;
  status: InvoiceStatus;
}

const initialFormData: InvoiceFormData = {
  tenantId: "",
  month: new Date().toISOString().slice(0, 7),
  rent: 0,
  gasCharge: 0,
  waterCharge: 0,
  serviceCharge: 0,
  electricityBill: 0,
  dueDate: "",
  paidAmount: 0,
  status: "unpaid",
};

const statusOptions: { value: InvoiceStatus; label: string }[] = [
  { value: "unpaid", label: "Unpaid" },
  { value: "partial", label: "Partial" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
];

export default function InvoicesPage() {
  const { userData } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState<string | null>(null);
  const [formData, setFormData] = useState<InvoiceFormData>(initialFormData);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from("properties")
        .select("*")
        .eq("ownerId", userData.id);

      if (propertiesError) throw propertiesError;
      setProperties(propertiesData || []);

      // Fetch tenants
      const { data: tenantsData, error: tenantsError } = await supabase
        .from("tenants")
        .select("*")
        .eq("ownerId", user.uid)
        .eq("status", "active");

      if (tenantsError) throw tenantsError;
      setTenants(tenantsData || []);

      // Fetch invoices
      const { data: invoicesData, error: invoicesError } = await supabase
        .from("invoices")
        .select("*")
        .eq("ownerId", userData.id);

      if (invoicesError) throw invoicesError;
      setInvoices((invoicesData || []).sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleOpenDialog = (invoice?: Invoice) => {
    if (invoice) {
      setSelectedInvoice(invoice);
      setFormData({
        tenantId: invoice.tenantId,
        month: invoice.month,
        rent: invoice.rent,
        gasCharge: invoice.gasCharge,
        waterCharge: invoice.waterCharge,
        serviceCharge: invoice.serviceCharge,
        electricityBill: invoice.electricityBill,
        dueDate: invoice.dueDate.split("T")[0],
        paidAmount: invoice.paidAmount,
        status: invoice.status,
      });
    } else {
      setSelectedInvoice(null);
      setFormData(initialFormData);
    }
    setIsDialogOpen(true);
  };

  const handleTenantChange = (tenantId: string) => {
    const tenant = tenants.find((t) => t.id === tenantId);
    if (tenant) {
      setFormData({
        ...formData,
        tenantId,
        rent: tenant.monthlyRent,
        gasCharge: tenant.gasCharge,
        waterCharge: tenant.waterCharge,
        serviceCharge: tenant.serviceCharge,
        electricityBill: tenant.electricityBill,
      });
    }
  };

  const calculateTotal = () => {
    return formData.rent + formData.gasCharge + formData.waterCharge + formData.serviceCharge + formData.electricityBill;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.tenantId) {
      toast.error("Please select a tenant");
      return;
    }

    setIsSubmitting(true);

    try {
      const tenant = tenants.find((t) => t.id === formData.tenantId);
      if (!tenant) throw new Error("Tenant not found");

      const totalAmount = calculateTotal();
      const dueAmount = totalAmount - formData.paidAmount;

      let status: InvoiceStatus = formData.status;
      if (formData.paidAmount >= totalAmount) {
        status = "paid";
      } else if (formData.paidAmount > 0) {
        status = "partial";
      } else if (new Date(formData.dueDate) < new Date() && status !== "paid") {
        status = "overdue";
      }

      const now = new Date().toISOString();
      const invoiceData = {
        tenantId: formData.tenantId,
        propertyId: tenant.propertyId,
        ownerId: userData.id,
        tenantName: tenant.name,
        tenantEmail: tenant.email,
        unitNumber: tenant.unitNumber,
        month: formData.month,
        rent: formData.rent,
        gasCharge: formData.gasCharge,
        waterCharge: formData.waterCharge,
        serviceCharge: formData.serviceCharge,
        electricityBill: formData.electricityBill,
        totalAmount,
        paidAmount: formData.paidAmount,
        dueAmount,
        dueDate: formData.dueDate,
        status,
        paymentDate: status === "paid" ? now : null,
        updatedAt: now,
      };

      if (selectedInvoice) {
        const { error } = await supabase
          .from("invoices")
          .update(invoiceData)
          .eq("id", selectedInvoice.id);
        if (error) throw error;
        toast.success("Invoice updated successfully");

        // Auto download receipt if payment is complete
        if (status === "paid" && selectedInvoice.status !== "paid") {
          const property = properties.find((p) => p.id === tenant.propertyId);
          setTimeout(async () => {
            const { downloadReceiptPDF } = await import("@/lib/pdf-receipt");
            await downloadReceiptPDF({
              invoice: { ...selectedInvoice, ...invoiceData, paidAmount: formData.paidAmount, status: "paid" } as Invoice,
              property,
              ownerName: userData?.displayName || undefined,
            });
            toast.success("Receipt auto-generated and downloaded!", { duration: 4000 });
          }, 500);
        }
      } else {
        const { error } = await supabase
          .from("invoices")
          .insert({ ...invoiceData, createdAt: now, emailSent: false, emailSentAt: null });
        if (error) throw error;
        toast.success("Invoice created successfully");
      }

      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Failed to save invoice:", error);
      toast.error("Failed to save invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedInvoice) return;

    try {
      const { error } = await supabase
        .from("invoices")
        .delete()
        .eq("id", selectedInvoice.id);
      if (error) throw error;
      toast.success("Invoice deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedInvoice(null);
      fetchData();
    } catch (error) {
      console.error("Failed to delete invoice:", error);
      toast.error("Failed to delete invoice");
    }
  };

  const handleSendReminder = async (invoice: Invoice) => {
    setIsSendingEmail(invoice.id);

    try {
      const property = properties.find((p) => p.id === invoice.propertyId);
      const success = await sendDueRentNotification(
        invoice.tenantEmail,
        invoice.tenantName,
        invoice.dueAmount,
        new Date(invoice.dueDate).toLocaleDateString(),
        property?.name || "Property",
        invoice.unitNumber
      );

      if (success) {
        const { error } = await supabase
          .from("invoices")
          .update({ emailSent: true, emailSentAt: new Date().toISOString() })
          .eq("id", invoice.id);
        if (error) throw error;
        toast.success("Reminder sent successfully");
        fetchData();
      } else {
        toast.error("Failed to send reminder. Check EmailJS configuration.");
      }
    } catch (error) {
      console.error("Failed to send reminder:", error);
      toast.error("Failed to send reminder");
    } finally {
      setIsSendingEmail(null);
    }
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    const config: Record<InvoiceStatus, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
      paid: { variant: "default", icon: CheckCircle },
      partial: { variant: "secondary", icon: Clock },
      unpaid: { variant: "outline", icon: Clock },
      overdue: { variant: "destructive", icon: AlertCircle },
    };
    const { variant, icon: Icon } = config[status];
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getPropertyName = (propertyId: string) => {
    return properties.find((p) => p.id === propertyId)?.name || "Unknown";
  };

  // Calculate summary statistics
  const calculateStats = () => {
    const totalInvoices = invoices.length;
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const totalDue = invoices.reduce((sum, inv) => sum + inv.dueAmount, 0);
    const paidInvoices = invoices.filter((inv) => inv.status === "paid").length;
    const overdueInvoices = invoices.filter((inv) => inv.status === "overdue").length;

    return {
      totalInvoices,
      totalRevenue,
      totalPaid,
      totalDue,
      paidInvoices,
      overdueInvoices,
    };
  };

  const handleDownloadReceipt = async (invoice: Invoice) => {
    const property = properties.find((p) => p.id === invoice.propertyId);
    const { downloadReceiptPDF } = await import("@/lib/pdf-receipt");
    await downloadReceiptPDF({
      invoice,
      property,
      ownerName: user?.displayName || undefined,
      ownerPhone: undefined,
    });
    toast.success("Receipt downloaded successfully");
  };

  const handleSendReceipt = async (invoice: Invoice) => {
    if (!invoice.tenantEmail) {
      toast.error("Tenant email not available");
      return;
    }

    setIsSendingEmail(invoice.id);

    try {
      const property = properties.find((p) => p.id === invoice.propertyId);
      const { downloadReceiptPDF } = await import("@/lib/pdf-receipt");
      
      // For now, we just download the PDF and show a message
      // In a real app, you would send this via an email API
      await downloadReceiptPDF({
        invoice,
        property,
      ownerName: userData?.displayName || undefined,
      });
      
      toast.success(
        `Receipt downloaded! Please send it manually to ${invoice.tenantEmail}`,
        { duration: 5000 }
      );
    } catch (error) {
      console.error("Failed to generate receipt:", error);
      toast.error("Failed to generate receipt");
    } finally {
      setIsSendingEmail(null);
    }
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
      {/* Summary Statistics */}
      {invoices.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">মোট ইনভয়েস</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{calculateStats().totalInvoices}</div>
              <p className="text-xs text-muted-foreground">সব ইনভয়েস</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">মোট রাজস্ব</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">৳{calculateStats().totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">সব ইনভয়েস এর মূল্য</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">পরিশোধিত</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">৳{calculateStats().totalPaid.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{calculateStats().paidInvoices} পরিশোধিত ইনভয়েস</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">বকেয়া</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">৳{calculateStats().totalDue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{calculateStats().overdueInvoices} মেয়াদ উত্তীর্ণ</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Invoices</h2>
          <p className="text-muted-foreground">Generate and track rent invoices</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} disabled={tenants.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {selectedInvoice ? "Edit Invoice" : "Create New Invoice"}
              </DialogTitle>
              <DialogDescription>
                {selectedInvoice
                  ? "Update the invoice details below."
                  : "Generate a new invoice for a tenant with charges."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                {/* Tenant Selection */}
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-3">Tenant Information</h3>
                  <Field>
                    <FieldLabel htmlFor="tenant">Select Tenant</FieldLabel>
                    <Select
                      value={formData.tenantId}
                      onValueChange={handleTenantChange}
                      disabled={!!selectedInvoice}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select tenant" />
                      </SelectTrigger>
                      <SelectContent>
                        {tenants.map((tenant) => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.name} - Unit {tenant.unitNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                {/* Dates Section */}
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-3">Billing Dates</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="month">Billing Month</FieldLabel>
                      <Input
                        id="month"
                        type="month"
                        value={formData.month}
                        onChange={(e) =>
                          setFormData({ ...formData, month: e.target.value })
                        }
                        required
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="dueDate">Due Date</FieldLabel>
                      <Input
                        id="dueDate"
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) =>
                          setFormData({ ...formData, dueDate: e.target.value })
                        }
                        required
                      />
                    </Field>
                  </div>
                </div>

                {/* Charges Section */}
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-3">Charges & Fees</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="rent">Monthly Rent (৳)</FieldLabel>
                      <Input
                        id="rent"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.rent}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            rent: parseFloat(e.target.value) || 0,
                          })
                        }
                        required
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="gasCharge">Gas Charge (৳)</FieldLabel>
                      <Input
                        id="gasCharge"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.gasCharge}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            gasCharge: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <Field>
                      <FieldLabel htmlFor="waterCharge">Water Charge (৳)</FieldLabel>
                      <Input
                        id="waterCharge"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.waterCharge}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            waterCharge: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="serviceCharge">Service Charge (৳)</FieldLabel>
                      <Input
                        id="serviceCharge"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.serviceCharge}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            serviceCharge: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="electricityBill">Electricity (৳)</FieldLabel>
                      <Input
                        id="electricityBill"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.electricityBill}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            electricityBill: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </Field>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Amount:</span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      ৳{calculateTotal().toLocaleString("en-BD")}
                    </span>
                  </div>
                </div>

                {selectedInvoice && (
                  <>
                    <div className="mb-4 border-t pt-4">
                      <h3 className="text-sm font-semibold mb-3">Payment Information</h3>
                      <Field>
                        <FieldLabel htmlFor="paidAmount">Paid Amount (৳)</FieldLabel>
                        <Input
                          id="paidAmount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.paidAmount}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              paidAmount: parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                      </Field>

                      <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800 mt-3">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Due Amount:</span>
                          <span className="text-lg font-bold text-red-600 dark:text-red-400">
                            ৳{(calculateTotal() - formData.paidAmount).toLocaleString("en-BD")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Spinner className="mr-2" />}
                    {selectedInvoice ? "Update" : "Create Invoice"}
                  </Button>
                </div>
              </FieldGroup>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {tenants.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <Empty
              icon={Receipt}
              title="Add active tenants first"
              description="You need active tenants before you can create invoices."
            />
          </CardContent>
        </Card>
      ) : invoices.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <Empty
              icon={Receipt}
              title="No invoices yet"
              description="Get started by creating your first invoice."
            />
            <div className="mt-4 flex justify-center">
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Create Invoice
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>সমস্ত ইনভয়েস</CardTitle>
            <CardDescription>
              {invoices.length} {invoices.length === 1 ? "invoice" : "invoices"} মোট
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ভাড়াটিয়া / সম্পত্তি</TableHead>
                  <TableHead>মাস</TableHead>
                  <TableHead className="text-right">মোট</TableHead>
                  <TableHead className="text-right">পরিশোধিত</TableHead>
                  <TableHead className="text-right">বকেয়া</TableHead>
                  <TableHead>অবস্থা</TableHead>
                  <TableHead className="text-right">পদক্ষেপ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <p className="font-medium">{invoice.tenantName}</p>
                        <p className="text-sm text-muted-foreground">
                          {getPropertyName(invoice.propertyId)} - Unit {invoice.unitNumber}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{invoice.month}</TableCell>
                    <TableCell className="text-right font-semibold">
                      ৳{invoice.totalAmount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-success font-medium">
                      ৳{invoice.paidAmount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-destructive font-medium">
                      ৳{invoice.dueAmount.toLocaleString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {/* Download Receipt - Always available */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadReceipt(invoice)}
                          className="gap-1"
                          title="Download Receipt PDF"
                        >
                          <Download className="h-4 w-4" />
                          <span className="hidden sm:inline text-xs">ডাউনলোড</span>
                        </Button>

                        {/* Send Receipt via Email - Only for paid invoices */}
                        {invoice.status === "paid" && invoice.tenantEmail && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSendReceipt(invoice)}
                            disabled={isSendingEmail === invoice.id}
                            className="gap-1"
                            title="Send Receipt to Tenant"
                          >
                            {isSendingEmail === invoice.id ? (
                              <Spinner className="h-4 w-4" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                            <span className="hidden sm:inline text-xs">পাঠান</span>
                          </Button>
                        )}

                        {/* Send Reminder - Only for unpaid/overdue */}
                        {invoice.status !== "paid" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSendReminder(invoice)}
                            disabled={isSendingEmail === invoice.id}
                            className="gap-1"
                            title="Send reminder email"
                          >
                            {isSendingEmail === invoice.id ? (
                              <Spinner className="h-4 w-4" />
                            ) : (
                              <Mail className="h-4 w-4" />
                            )}
                            <span className="hidden sm:inline text-xs">রিমাইন্ডার</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(invoice)}
                          title="Edit Invoice"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setIsDeleteDialogOpen(true);
                          }}
                          title="Delete Invoice"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this invoice for {selectedInvoice?.tenantName}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white;
          }
          .no-print {
            display: none;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid #e5e7eb;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f3f4f6;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f9fafb;
          }
        }
      `}</style>
    </div>
  );
}
