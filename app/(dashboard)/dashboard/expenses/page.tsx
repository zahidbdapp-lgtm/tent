"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/auth-context";
import { databasePropertiesToTypescript } from "@/lib/supabase/propertyConverter";
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
  DollarSign,
  TrendingUp,
  AlertCircle,
  Wrench,
  Zap,
  Droplet,
  Hammer,
  Calculator,
} from "lucide-react";
import type { Expense, Property, ExpenseCategory } from "@/types";

interface ExpenseFormData {
  propertyId: string;
  unitNumber: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
}

const initialFormData: ExpenseFormData = {
  propertyId: "",
  unitNumber: "",
  category: "maintenance",
  description: "",
  amount: 0,
  date: new Date().toISOString().split("T")[0],
};

const categoryOptions: { value: ExpenseCategory; label: string; icon: React.ElementType }[] = [
  { value: "service", label: "Service Charge", icon: DollarSign },
  { value: "maintenance", label: "Maintenance", icon: Wrench },
  { value: "utility", label: "Utility", icon: Zap },
  { value: "tax", label: "Tax", icon: Calculator },
  { value: "other", label: "Other", icon: AlertCircle },
];

export default function ExpensesPage() {
  const { userData } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ExpenseFormData>(initialFormData);
  const [filterMonth, setFilterMonth] = useState<string>(new Date().toISOString().slice(0, 7));

  const fetchData = async () => {
    if (!userData) return;

    try {
      // Fetch properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from("properties")
        .select("*")
        .eq("owner_id", userData.id);

      if (propertiesError) throw propertiesError;
      setProperties(databasePropertiesToTypescript(propertiesData as any || []));

      // Fetch expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from("expenses")
        .select("*")
        .eq("owner_id", userData.id)
        .order("date", { ascending: false });

      if (expensesError) throw expensesError;
      setExpenses((expensesData || []).map((exp: any) => ({
        id: exp.id,
        ownerId: exp.owner_id,
        propertyId: exp.property_id,
        propertyName: exp.property_name,
        unitNumber: exp.unit_number || "",
        category: exp.category,
        description: exp.description,
        amount: exp.amount,
        date: exp.date,
        createdAt: exp.created_at,
        updatedAt: exp.updated_at,
      })));
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userData]);

  const handleOpenDialog = (expense?: Expense) => {
    if (expense) {
      setSelectedExpense(expense);
      setFormData({
        propertyId: expense.propertyId || "",
        unitNumber: expense.unitNumber || "",
        category: expense.category,
        description: expense.description,
        amount: expense.amount,
        date: expense.date,
      });
    } else {
      setSelectedExpense(null);
      setFormData(initialFormData);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;

    if (!formData.propertyId) {
      toast.error("Please select a property");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    if (formData.amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsSubmitting(true);

    try {
      const property = properties.find((p) => p.id === formData.propertyId);
      const now = new Date().toISOString();

      const expenseData = {
        owner_id: userData.id,
        property_id: formData.propertyId,
        property_name: property?.name || "",
        unit_number: formData.unitNumber || null,
        category: formData.category,
        description: formData.description,
        amount: formData.amount,
        date: formData.date,
        updated_at: now,
      };

      if (selectedExpense) {
        // Update
        const { error } = await supabase
          .from("expenses")
          .update(expenseData)
          .eq("id", selectedExpense.id);
        if (error) throw error;
        toast.success("Expense updated successfully");
      } else {
        // Create
        const { error } = await supabase
          .from("expenses")
          .insert({
            ...expenseData,
            created_at: now,
          });
        if (error) throw error;
        toast.success("Expense added successfully");
      }

      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Failed to save expense:", error);
      toast.error("Failed to save expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedExpense) return;

    try {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", selectedExpense.id);
      if (error) throw error;
      toast.success("Expense deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedExpense(null);
      fetchData();
    } catch (error) {
      console.error("Failed to delete expense:", error);
      toast.error("Failed to delete expense");
    }
  };

  const getCategoryIcon = (category: ExpenseCategory) => {
    const option = categoryOptions.find((o) => o.value === category);
    return option ? <option.icon className="h-4 w-4" /> : null;
  };

  const getCategoryLabel = (category: ExpenseCategory) => {
    const option = categoryOptions.find((o) => o.value === category);
    return option?.label || category;
  };

  const calculateStats = () => {
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);

    const monthlyExpenses = expenses
      .filter((exp) => exp.date.startsWith(currentMonth))
      .reduce((sum, exp) => sum + exp.amount, 0);

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const expensesByCategory = categoryOptions.map((cat) => ({
      category: cat.value,
      label: cat.label,
      amount: expenses.filter((exp) => exp.category === cat.value).reduce((sum, exp) => sum + exp.amount, 0),
    }));

    return {
      monthlyExpenses,
      totalExpenses,
      expensesByCategory,
    };
  };

  const filteredExpenses = expenses.filter((exp) => exp.date.startsWith(filterMonth));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Statistics */}
      {expenses.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">এই মাসের খরচ</CardTitle>
              <TrendingUp className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">৳{stats.monthlyExpenses.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{filterMonth.split("-")[0]}বছর {filterMonth.split("-")[1]}মাসে</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">সামগ্রীক খরচ</CardTitle>
              <DollarSign className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">৳{stats.totalExpenses.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{expenses.length} মোট খরচ</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">খরচ ব্যবস্থাপনা</h2>
          <p className="text-muted-foreground">প্রপার্টির খরচ ট্র্যাক করুন এবং পরিচালনা করুন</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} disabled={properties.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              খরচ যোগ করুন
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {selectedExpense ? "খরচ সম্পাদনা করুন" : "নতুন খরচ যোগ করুন"}
              </DialogTitle>
              <DialogDescription>
                {selectedExpense
                  ? "খরচের তথ্য আপডেট করুন"
                  : "নতুন খরচের তথ্য প্রবেশ করান"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                {/* Property Selection */}
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-3">সম্পত্তি নির্বাচন</h3>
                  <Field>
                    <FieldLabel htmlFor="property">প্রপার্টি</FieldLabel>
                    <Select
                      value={formData.propertyId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, propertyId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="প্রপার্টি নির্বাচন করুন" />
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
                </div>

                {/* Unit Information */}
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-3">ইউনিট তথ্য</h3>
                  <Field>
                    <FieldLabel htmlFor="unitNumber">ইউনিট নম্বর (ঐচ্ছিক)</FieldLabel>
                    <Input
                      id="unitNumber"
                      type="text"
                      placeholder="যেমন: A-101"
                      value={formData.unitNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, unitNumber: e.target.value })
                      }
                    />
                  </Field>
                </div>

                {/* Expense Details */}
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-3">খরচ বিস্তারিত</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="category">খরচের ধরন</FieldLabel>
                      <Select
                        value={formData.category}
                        onValueChange={(value) =>
                          setFormData({ ...formData, category: value as ExpenseCategory })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="ধরন নির্বাচন করুন" />
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

                    <Field>
                      <FieldLabel htmlFor="date">তারিখ</FieldLabel>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) =>
                          setFormData({ ...formData, date: e.target.value })
                        }
                        required
                      />
                    </Field>
                  </div>
                </div>

                {/* Description and Amount */}
                <div className="mb-4">
                  <Field>
                    <FieldLabel htmlFor="description">বর্ণনা</FieldLabel>
                    <Input
                      id="description"
                      type="text"
                      placeholder="যেমন: মাসিক সার্ভিস চার্জ, পাম্প মেরামত"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      required
                    />
                  </Field>

                  <Field className="mt-3">
                    <FieldLabel htmlFor="amount">খরচ (৳)</FieldLabel>
                    <Input
                      id="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder=""
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          amount: parseFloat(e.target.value) || 0,
                        })
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
                    বাতিল
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Spinner className="mr-2" />}
                    {selectedExpense ? "আপডেট করুন" : "খরচ যোগ করুন"}
                  </Button>
                </div>
              </FieldGroup>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Month Filter */}
      <div className="flex items-center gap-2">
        <label htmlFor="monthFilter" className="text-sm font-medium">
          মাস নির্বাচন করুন:
        </label>
        <Input
          id="monthFilter"
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="w-40"
        />
      </div>

      {/* Expenses Table */}
      {properties.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <Empty
              icon={AlertCircle}
              title="প্রথমে প্রপার্টি যোগ করুন"
              description="খরচ যোগ করার আগে কমপক্ষে একটি প্রপার্টি তৈরি করুন।"
            />
          </CardContent>
        </Card>
      ) : filteredExpenses.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <Empty
              icon={DollarSign}
              title="এই মাসে কোন খরচ নেই"
              description="নতুন খরচ যোগ করতে শুরু করুন।"
            />
            <div className="mt-4 flex justify-center">
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                খরচ যোগ করুন
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>খরচ তালিকা</CardTitle>
            <CardDescription>
              {filteredExpenses.length} টি খরচ - মোট: ৳{filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>তারিখ</TableHead>
                    <TableHead>প্রপার্টি / ইউনিট</TableHead>
                    <TableHead>বর্ণনা</TableHead>
                    <TableHead>ধরন</TableHead>
                    <TableHead className="text-right">খরচ</TableHead>
                    <TableHead className="text-right">পদক্ষেপ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {new Date(expense.date).toLocaleDateString("bn-BD")}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{expense.propertyName}</p>
                          {expense.unitNumber && (
                            <p className="text-sm text-muted-foreground">ইউনিট {expense.unitNumber}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{expense.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          {getCategoryIcon(expense.category)}
                          {getCategoryLabel(expense.category)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ৳{expense.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(expense)}
                            title="Edit Expense"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedExpense(expense);
                              setIsDeleteDialogOpen(true);
                            }}
                            title="Delete Expense"
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>খরচ মুছুন</AlertDialogTitle>
            <AlertDialogDescription>
              আপনি কি নিশ্চিত যে আপনি এই খরচটি মুছতে চান? এই পদক্ষেপ অপরিবর্তনীয়।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              মুছুন
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
