"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { Empty } from "@/components/ui/empty";
import { toast } from "sonner";
import { Megaphone, AlertTriangle, Info, AlertCircle, CheckCircle2, Mail } from "lucide-react";
import type { Notice, NoticePriority } from "@/types";

interface AdminNoticeRecipient {
  id: string;
  is_read: boolean;
  read_at: string | null;
  notice_id: string;
  notices: Notice;
}

const priorityOptions: Record<NoticePriority, { label: string; icon: React.ElementType; variant: "default" | "secondary" | "destructive" }> = {
  low: { label: "কম", icon: Info, variant: "secondary" },
  medium: { label: "মাঝারি", icon: AlertTriangle, variant: "default" },
  high: { label: "জরুরি", icon: AlertCircle, variant: "destructive" },
};

export default function NoticesPage() {
  const { userData } = useAuth();
  const [adminNotices, setAdminNotices] = useState<AdminNoticeRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userData) return;
    fetchNotices();
  }, [userData]);

  const fetchNotices = async () => {
    try {
      const response = await fetch("/api/user-notices");
      if (!response.ok) throw new Error("Failed to fetch notices");
      const data = await response.json();
      setAdminNotices(data.notices || []);
      setUnreadCount((data.notices || []).filter((n: AdminNoticeRecipient) => !n.is_read).length);
    } catch (error) {
      console.error("Failed to fetch notices:", error);
      toast.error("নোটিস লোড করতে ব্যর্থ");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (recipientId: string, isRead: boolean) => {
    try {
      const response = await fetch(`/api/user-notices/${recipientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: !isRead }),
      });
      if (!response.ok) throw new Error("Failed to update notice status");
      await fetchNotices();
      toast.success(!isRead ? "নোটিস পড়া হয়েছে" : "নোটিস অপড়া করা হয়েছে");
    } catch (error) {
      console.error("Failed to update notice status:", error);
      toast.error("স্ট্যাটাস আপডেট ব্যর্থ");
    }
  };

  const getPriorityBadge = (priority: NoticePriority) => {
    const config = priorityOptions[priority];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
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

  const unreadNotices = adminNotices.filter((n) => !n.is_read);
  const readNotices = adminNotices.filter((n) => n.is_read);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold">আমার নোটিস</h2>
        <p className="text-muted-foreground">প্রশাসক থেকে গুরুত্বপূর্ণ বিজ্ঞপ্তি</p>
      </div>

      {adminNotices.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <Empty
              icon={Megaphone}
              title="কোনো নোটিস নেই"
              description="এখন পর্যন্ত কোনো নোটিস পাওয়া যায়নি"
            />
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="unread" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="unread" className="relative">
              অপড়া ({unreadNotices.length})
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="read">
              পড়া ({readNotices.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="unread" className="space-y-4">
            {unreadNotices.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-muted-foreground">
                    <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>কোনো অপড়া নোটিস নেই</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              unreadNotices.map((recipient) => (
                <Card key={recipient.id} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{recipient.notices.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {new Date(recipient.notices.createdAt).toLocaleDateString("bn-BD", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2 flex-col items-end">
                        {getPriorityBadge(recipient.notices.priority)}
                        {isExpired(recipient.notices.expiresAt) && (
                          <Badge variant="outline" className="text-red-600">
                            মেয়াদ শেষ
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4 whitespace-pre-wrap">{recipient.notices.content}</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAsRead(recipient.id, recipient.is_read)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        পড়া হয়েছে চিহ্নিত করুন
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="read" className="space-y-4">
            {readNotices.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-muted-foreground">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>কোনো পড়া নোটিস নেই</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              readNotices.map((recipient) => (
                <Card key={recipient.id} className="opacity-75">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{recipient.notices.title}</CardTitle>
                        <CardDescription className="mt-1">
                          পড়া হয়েছে:{" "}
                          {new Date(recipient.read_at || "").toLocaleDateString("bn-BD", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2 flex-col items-end">
                        {getPriorityBadge(recipient.notices.priority)}
                        {isExpired(recipient.notices.expiresAt) && (
                          <Badge variant="outline" className="text-red-600">
                            মেয়াদ শেষ
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4 whitespace-pre-wrap">{recipient.notices.content}</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAsRead(recipient.id, recipient.is_read)}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        অপড়া হিসাবে চিহ্নিত করুন
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
