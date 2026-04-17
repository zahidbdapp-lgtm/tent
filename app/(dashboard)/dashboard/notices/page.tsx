"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
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
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Empty } from "@/components/ui/empty";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Megaphone, AlertTriangle, Info, AlertCircle } from "lucide-react";
import type { Notice, Property, NoticePriority } from "@/types";

interface NoticeFormData {
  propertyId: string;
  title: string;
  content: string;
  priority: NoticePriority;
  expiresAt: string;
}

const initialFormData: NoticeFormData = {
  propertyId: "",
  title: "",
  content: "",
  priority: "medium",
  expiresAt: "",
};

const priorityOptions: { value: NoticePriority; label: string; icon: React.ElementType }[] = [
  { value: "low", label: "Low", icon: Info },
  { value: "medium", label: "Medium", icon: AlertTriangle },
  { value: "high", label: "High", icon: AlertCircle },
];

export default function NoticesPage() {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<NoticeFormData>(initialFormData);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from("properties")
        .select("*")
        .eq("ownerId", user.uid);

      if (propertiesError) throw propertiesError;
      setProperties(propertiesData || []);

      // Fetch notices
      const { data: noticesData, error: noticesError } = await supabase
        .from("notices")
        .select("*")
        .eq("ownerId", user.uid);

      if (noticesError) throw noticesError;
      setNotices((noticesData || []).sort((a, b) =>
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

  const handleOpenDialog = (notice?: Notice) => {
    if (notice) {
      setSelectedNotice(notice);
      setFormData({
        propertyId: notice.propertyId,
        title: notice.title,
        content: notice.content,
        priority: notice.priority,
        expiresAt: notice.expiresAt.split("T")[0],
      });
    } else {
      setSelectedNotice(null);
      setFormData(initialFormData);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.propertyId) {
      toast.error("Please select a property");
      return;
    }

    setIsSubmitting(true);

    try {
      const now = new Date().toISOString();
      const noticeData = {
        propertyId: formData.propertyId,
        ownerId: user.uid,
        title: formData.title,
        content: formData.content,
        priority: formData.priority,
        expiresAt: formData.expiresAt,
      };

      if (selectedNotice) {
        const { error } = await supabase
          .from("notices")
          .update(noticeData)
          .eq("id", selectedNotice.id);
        if (error) throw error;
        toast.success("Notice updated successfully");
      } else {
        const { error } = await supabase
          .from("notices")
          .insert({ ...noticeData, createdAt: now });
        if (error) throw error;
        toast.success("Notice created successfully");
      }

      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Failed to save notice:", error);
      toast.error("Failed to save notice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedNotice) return;

    try {
      const { error } = await supabase
        .from("notices")
        .delete()
        .eq("id", selectedNotice.id);
      if (error) throw error;
      toast.success("Notice deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedNotice(null);
      fetchData();
    } catch (error) {
      console.error("Failed to delete notice:", error);
      toast.error("Failed to delete notice");
    }
  };

  const getPropertyName = (propertyId: string) => {
    return properties.find((p) => p.id === propertyId)?.name || "Unknown";
  };

  const getPriorityBadge = (priority: NoticePriority) => {
    const config: Record<NoticePriority, { variant: "default" | "secondary" | "destructive"; icon: React.ElementType }> = {
      low: { variant: "secondary", icon: Info },
      medium: { variant: "default", icon: AlertTriangle },
      high: { variant: "destructive", icon: AlertCircle },
    };
    const { variant, icon: Icon } = config[priority];
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {priority}
      </Badge>
    );
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
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
          <h2 className="text-2xl font-bold">Notice Board</h2>
          <p className="text-muted-foreground">Post announcements for your properties</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} disabled={properties.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              Post Notice
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedNotice ? "Edit Notice" : "Post New Notice"}
              </DialogTitle>
              <DialogDescription>
                {selectedNotice
                  ? "Update the notice details below."
                  : "Create a new announcement for your property."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="property">Property</FieldLabel>
                  <Select
                    value={formData.propertyId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, propertyId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select property" />
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
                  <FieldLabel htmlFor="title">Title</FieldLabel>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Notice title"
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="content">Content</FieldLabel>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    placeholder="Write your announcement here..."
                    rows={4}
                    required
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="priority">Priority</FieldLabel>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: NoticePriority) =>
                        setFormData({ ...formData, priority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="expiresAt">Expires On</FieldLabel>
                    <Input
                      id="expiresAt"
                      type="date"
                      value={formData.expiresAt}
                      onChange={(e) =>
                        setFormData({ ...formData, expiresAt: e.target.value })
                      }
                      required
                    />
                  </Field>
                </div>

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
                    {selectedNotice ? "Update" : "Post Notice"}
                  </Button>
                </div>
              </FieldGroup>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {properties.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <Empty
              icon={Megaphone}
              title="Add a property first"
              description="You need to add a property before you can post notices."
            />
          </CardContent>
        </Card>
      ) : notices.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <Empty
              icon={Megaphone}
              title="No notices yet"
              description="Get started by posting your first announcement."
            />
            <div className="mt-4 flex justify-center">
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Post Notice
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {notices.map((notice) => (
            <Card
              key={notice.id}
              className={isExpired(notice.expiresAt) ? "opacity-60" : ""}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{notice.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {getPropertyName(notice.propertyId)}
                    </CardDescription>
                  </div>
                  {getPriorityBadge(notice.priority)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-4">
                  {notice.content}
                </p>
                 <div className="flex items-center justify-between text-xs text-muted-foreground">
                   <span>
                     {isExpired(notice.expiresAt)
                       ? "Expired"
                       : `Expires ${new Date(notice.expiresAt).toLocaleDateString()}`}
                   </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleOpenDialog(notice)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setSelectedNotice(notice);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedNotice?.title}"? This action
              cannot be undone.
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
