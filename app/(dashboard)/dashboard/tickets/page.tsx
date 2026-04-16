"use client";

import { useEffect, useState } from "react";
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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Ticket,
  Wrench,
  MessageSquare,
  HelpCircle,
  MoreHorizontal,
} from "lucide-react";
import type { Ticket as TicketType, Tenant, Property, TicketCategory, TicketStatus } from "@/types";

interface TicketFormData {
  tenantId: string;
  subject: string;
  description: string;
  category: TicketCategory;
  status: TicketStatus;
}

const initialFormData: TicketFormData = {
  tenantId: "",
  subject: "",
  description: "",
  category: "maintenance",
  status: "open",
};

const categoryOptions: { value: TicketCategory; label: string; icon: React.ElementType }[] = [
  { value: "maintenance", label: "Maintenance", icon: Wrench },
  { value: "complaint", label: "Complaint", icon: MessageSquare },
  { value: "inquiry", label: "Inquiry", icon: HelpCircle },
  { value: "other", label: "Other", icon: MoreHorizontal },
];

const statusOptions: { value: TicketStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in-progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export default function TicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<TicketFormData>(initialFormData);

  const fetchData = async () => {
    if (!user || !db) return;

    try {
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

      // Fetch tickets
      const ticketsQuery = query(
        collection(db, "tickets"),
        where("ownerId", "==", user.uid)
      );
      const ticketsSnapshot = await getDocs(ticketsQuery);
      const ticketsData = ticketsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as TicketType[];
      setTickets(ticketsData.sort((a, b) => 
        b.createdAt.toMillis() - a.createdAt.toMillis()
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

  const handleOpenDialog = (ticket?: TicketType) => {
    if (ticket) {
      setSelectedTicket(ticket);
      setFormData({
        tenantId: ticket.tenantId,
        subject: ticket.subject,
        description: ticket.description,
        category: ticket.category,
        status: ticket.status,
      });
    } else {
      setSelectedTicket(null);
      setFormData(initialFormData);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;

    if (!formData.tenantId) {
      toast.error("Please select a tenant");
      return;
    }

    setIsSubmitting(true);

    try {
      const tenant = tenants.find((t) => t.id === formData.tenantId);
      if (!tenant) throw new Error("Tenant not found");

      const ticketData = {
        tenantId: formData.tenantId,
        tenantName: tenant.name,
        propertyId: tenant.propertyId,
        ownerId: user.uid,
        subject: formData.subject,
        description: formData.description,
        category: formData.category,
        status: formData.status,
        updatedAt: serverTimestamp(),
      };

      if (selectedTicket) {
        await updateDoc(doc(db, "tickets", selectedTicket.id), ticketData);
        toast.success("Ticket updated successfully");
      } else {
        await addDoc(collection(db, "tickets"), {
          ...ticketData,
          createdAt: serverTimestamp(),
        });
        toast.success("Ticket created successfully");
      }

      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Failed to save ticket:", error);
      toast.error("Failed to save ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTicket || !db) return;

    try {
      await deleteDoc(doc(db, "tickets", selectedTicket.id));
      toast.success("Ticket deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedTicket(null);
      fetchData();
    } catch (error) {
      console.error("Failed to delete ticket:", error);
      toast.error("Failed to delete ticket");
    }
  };

  const getPropertyName = (propertyId: string) => {
    return properties.find((p) => p.id === propertyId)?.name || "Unknown";
  };

  const getTenantUnit = (tenantId: string) => {
    const tenant = tenants.find((t) => t.id === tenantId);
    return tenant?.unitNumber || "Unknown";
  };

  const getStatusBadge = (status: TicketStatus) => {
    const variants: Record<TicketStatus, "default" | "secondary" | "destructive" | "outline"> = {
      open: "destructive",
      "in-progress": "default",
      resolved: "secondary",
      closed: "outline",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getCategoryIcon = (category: TicketCategory) => {
    const option = categoryOptions.find((c) => c.value === category);
    return option?.icon || MoreHorizontal;
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Support Tickets</h2>
          <p className="text-muted-foreground">Track and manage tenant requests</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} disabled={tenants.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              Create Ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedTicket ? "Edit Ticket" : "Create New Ticket"}
              </DialogTitle>
              <DialogDescription>
                {selectedTicket
                  ? "Update the ticket details below."
                  : "Create a new support ticket for a tenant."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="tenant">Tenant</FieldLabel>
                  <Select
                    value={formData.tenantId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, tenantId: value })
                    }
                    disabled={!!selectedTicket}
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

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="category">Category</FieldLabel>
                    <Select
                      value={formData.category}
                      onValueChange={(value: TicketCategory) =>
                        setFormData({ ...formData, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  {selectedTicket && (
                    <Field>
                      <FieldLabel htmlFor="status">Status</FieldLabel>
                      <Select
                        value={formData.status}
                        onValueChange={(value: TicketStatus) =>
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
                  )}
                </div>

                <Field>
                  <FieldLabel htmlFor="subject">Subject</FieldLabel>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    placeholder="Brief description of the issue"
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="description">Description</FieldLabel>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Detailed description of the request..."
                    rows={4}
                    required
                  />
                </Field>

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
                    {selectedTicket ? "Update" : "Create Ticket"}
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
              icon={Ticket}
              title="Add tenants first"
              description="You need tenants before you can create support tickets."
            />
          </CardContent>
        </Card>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <Empty
              icon={Ticket}
              title="No tickets yet"
              description="All support requests will appear here."
            />
            <div className="mt-4 flex justify-center">
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Create Ticket
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Tickets</CardTitle>
            <CardDescription>
              {tickets.filter((t) => t.status === "open" || t.status === "in-progress").length} open,{" "}
              {tickets.length} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Tenant / Property</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => {
                  const CategoryIcon = getCategoryIcon(ticket.category);
                  return (
                    <TableRow key={ticket.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                            <CategoryIcon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{ticket.subject}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                              {ticket.description}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{ticket.tenantName}</p>
                          <p className="text-sm text-muted-foreground">
                            {getPropertyName(ticket.propertyId)} - Unit {getTenantUnit(ticket.tenantId)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{ticket.category}</TableCell>
                      <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {ticket.createdAt.toDate().toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(ticket)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ticket</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this ticket? This action cannot be undone.
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
    </div>
  );
}
