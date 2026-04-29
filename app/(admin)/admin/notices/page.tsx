"use client";

import { useEffect, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Megaphone, AlertTriangle, Info, AlertCircle } from "lucide-react";
import type { Notice, NoticePriority, User } from "@/types";

interface AdminNoticeFormData {
  title: string;
  content: string;
  priority: NoticePriority;
  expiresAt: string;
  recipientType: "all_users" | "specific_users";
  recipientUserIds: string[];
}

const initialFormData: AdminNoticeFormData = {
  title: "",
  content: "",
  priority: "medium",
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  recipientType: "all_users",
  recipientUserIds: [],
};

const priorityOptions: { value: NoticePriority; label: string; icon: React.ElementType }[] = [
  { value: "low", label: "কম", icon: Info },
  { value: "medium", label: "মাঝারি", icon: AlertTriangle },
  { value: "high", label: "জরুরি", icon: AlertCircle },
];

export default function AdminNoticesPage() {
  const { userData, isAdmin } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<AdminNoticeFormData>(initialFormData);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Check if user is admin
      if (!isAdmin) {
        setLoading(false);
        return;
      }

      // Fetch all users
      const usersResponse = await fetch("/api/admin-users");
      if (!usersResponse.ok) throw new Error("Failed to fetch users");
      const usersData = await usersResponse.json();
      setUsers(usersData as User[]);

      // Fetch admin notices
      const noticesResponse = await fetch("/api/admin-notices");
      if (!noticesResponse.ok) throw new Error("Failed to fetch notices");
      const noticesData = await noticesResponse.json();
      setNotices((noticesData || []) as Notice[]);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("ডেটা লোড করতে ব্যর্থ");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (notice?: Notice) => {
    if (notice) {
      setSelectedNotice(notice);
      setFormData({
        title: notice.title,
        content: notice.content,
        priority: notice.priority,
        expiresAt: notice.expiresAt ? notice.expiresAt.split("T")[0] : "",
        recipientType: notice.recipientType === "specific_users" ? "specific_users" : "all_users",
        recipientUserIds: notice.recipientUserIds || [],
      });
    } else {
      setSelectedNotice(null);
      setFormData(initialFormData);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;

    setIsSubmitting(true);

    try {
      const payload = {
        title: formData.title,
        content: formData.content,
        priority: formData.priority,
        expiresAt: formData.expiresAt,
        recipientType: formData.recipientType,
        recipientUserIds: formData.recipientType === "specific_users" ? formData.recipientUserIds : [],
      };

      if (selectedNotice) {
        // Update
        const response = await fetch(`/api/admin-notices/${selectedNotice.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.details || data.error || "Failed to update notice");
        }
        toast.success("নোটিস আপডেট হয়েছে");
      } else {
        // Create
        const response = await fetch("/api/admin-notices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.details || data.error || "Failed to create notice");
        }
        toast.success("নোটিস তৈরি হয়েছে");
      }

      setIsDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Failed to save notice:", error);
      const errorMessage = error?.message || "নোটিস সংরক্ষণ ব্যর্থ";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedNotice) return;

    try {
      const response = await fetch(`/api/admin-notices/${selectedNotice.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete notice");
      toast.success("নোটিস মুছে ফেলা হয়েছে");
      setIsDeleteDialogOpen(false);
      setSelectedNotice(null);
      fetchData();
    } catch (error) {
      console.error("Failed to delete notice:", error);
      toast.error("নোটিস মুছতে ব্যর্থ");
    }
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
        {priority === "low" ? "কম" : priority === "medium" ? "মাঝারি" : "জরুরি"}
      </Badge>
    );
  };

  const getRecipientText = (notice: Notice) => {
    if (notice.recipientType === "all_users") {
      return "সব ব্যবহারকারী";
    } else {
      return `${notice.recipientUserIds?.length || 0} নির্দিষ্ট ব্যবহারকারী`;
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const toggleUser = (userId: string) => {
    setFormData((prev) => ({
      ...prev,
      recipientUserIds: prev.recipientUserIds.includes(userId)
        ? prev.recipientUserIds.filter((id) => id !== userId)
        : [...prev.recipientUserIds, userId],
    }));
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
          <h2 className="text-2xl font-bold">নোটিস ব্যবস্থাপনা</h2>
          <p className="text-muted-foreground">সব ব্যবহারকারীদের কাছে নোটিস পাঠান</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              নতুন নোটিস
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {selectedNotice ? "নোটিস সম্পাদনা করুন" : "নতুন নোটিস তৈরি করুন"}
              </DialogTitle>
              <DialogDescription>
                {selectedNotice ? "নোটিসের তথ্য আপডেট করুন" : "নতুন নোটিস তৈরি করুন এবং ব্যবহারকারীদের কাছে পাঠান"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                {/* Title */}
                <Field>
                  <FieldLabel htmlFor="title">শিরোনাম</FieldLabel>
                  <Input
                    id="title"
                    type="text"
                    placeholder="নোটিস শিরোনাম"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </Field>

                {/* Content */}
                <Field>
                  <FieldLabel htmlFor="content">বিষয়বস্তু</FieldLabel>
                  <Textarea
                    id="content"
                    placeholder="নোটিস বিস্তারিত বিষয়বস্তু"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={6}
                    required
                  />
                </Field>

                {/* Priority and Expiry */}
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="priority">অগ্রাধিকার</FieldLabel>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) =>
                        setFormData({ ...formData, priority: value as NoticePriority })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="অগ্রাধিকার নির্বাচন করুন" />
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
                    <FieldLabel htmlFor="expiresAt">মেয়াদ শেষ হয়ে যাবে</FieldLabel>
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

                {/* Recipient Type */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">প্রাপকদের জন্য নির্বাচন করুন</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="recipientType"
                        value="all_users"
                        checked={formData.recipientType === "all_users"}
                        onChange={() =>
                          setFormData({ ...formData, recipientType: "all_users", recipientUserIds: [] })
                        }
                      />
                      <span className="text-sm">সব ব্যবহারকারীদের কাছে পাঠান</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="recipientType"
                        value="specific_users"
                        checked={formData.recipientType === "specific_users"}
                        onChange={() =>
                          setFormData({ ...formData, recipientType: "specific_users" })
                        }
                      />
                      <span className="text-sm">নির্দিষ্ট ব্যবহারকারীদের কাছে পাঠান</span>
                    </label>
                  </div>
                </div>

                {/* Specific Users Selection */}
                {formData.recipientType === "specific_users" && (
                  <div>
                    <FieldLabel>ব্যবহারকারী নির্বাচন করুন</FieldLabel>
                    <div className="border rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto">
                      {users.map((user) => (
                        <label key={user.id} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={formData.recipientUserIds.includes(user.id)}
                            onCheckedChange={() => toggleUser(user.id)}
                          />
                          <span className="text-sm">
                            {user.displayName} ({user.email})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

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
                    {selectedNotice ? "আপডেট করুন" : "পাঠান"}
                  </Button>
                </div>
              </FieldGroup>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Notices Table */}
      {notices.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <Empty
              icon={Megaphone}
              title="কোনো নোটিস নেই"
              description="নতুন নোটিস তৈরি করে শুরু করুন"
            />
            <div className="mt-4 flex justify-center">
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                নতুন নোটিস
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>সব নোটিস</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>শিরোনাম</TableHead>
                    <TableHead>অগ্রাধিকার</TableHead>
                    <TableHead>প্রাপক</TableHead>
                    <TableHead>মেয়াদ শেষ</TableHead>
                    <TableHead>তৈরি</TableHead>
                    <TableHead className="text-right">অ্যাকশন</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notices.map((notice) => (
                    <TableRow key={notice.id} className={isExpired(notice.expiresAt) ? "opacity-50" : ""}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{notice.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {notice.content}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{getPriorityBadge(notice.priority)}</TableCell>
                      <TableCell className="text-sm">{getRecipientText(notice)}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(notice.expiresAt).toLocaleDateString("bn-BD")}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(notice.createdAt).toLocaleDateString("bn-BD")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(notice)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedNotice(notice);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            {selectedNotice?.id === notice.id && (
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>নোটিস মুছবেন?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    এই নোটিসটি মুছে ফেলা হবে এবং এটি আর দেখা যাবে না।
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>বাতিল</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleDelete}>
                                    মুছুন
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            )}
                          </AlertDialog>
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
    </div>
  );
}
