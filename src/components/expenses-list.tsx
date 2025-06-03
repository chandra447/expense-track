"use client";

import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect, useMemo } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { DateRange } from "react-day-picker";
import { useRouter } from "next/navigation";
import {
  expensesAtom,
  expensesLoadingAtom,
  expensesErrorAtom,
  totalExpensesAtom,
  expensesCountAtom,
  fetchExpensesAtom,
  deleteExpenseAtom,
  type Expense,
} from "@/store/expenses";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-picker";
import { 
  DollarSign, 
  Tag, 
  AlertCircle, 
  Plus, 
  Settings,
  Edit, 
  Trash2, 
  Calendar,
  Filter,
  X,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { AddExpenseDialog } from "@/components/add-expense-dialog";
import { AddTagDialog } from "@/components/add-tag-dialog";
import { ManageTagsDialog } from "@/components/manage-tags-dialog";
import { EditExpenseDialog } from "@/components/edit-expense-dialog";

interface GroupedExpenses {
  [monthYear: string]: {
    expenses: Expense[];
    total: number;
  };
}

export function ExpensesList() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  // Jotai atoms
  const expenses = useAtomValue(expensesAtom);
  const isLoading = useAtomValue(expensesLoadingAtom);
  const error = useAtomValue(expensesErrorAtom);
  const totalAmount = useAtomValue(totalExpensesAtom);
  const expensesCount = useAtomValue(expensesCountAtom);
  const fetchExpenses = useSetAtom(fetchExpensesAtom);
  const deleteExpense = useSetAtom(deleteExpenseAtom);

  // Filter state
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [titleFilter, setTitleFilter] = useState("");
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch expenses when user is authenticated
  useEffect(() => {
    if (isSignedIn && isLoaded) {
      fetchExpenses();
    }
  }, [isSignedIn, isLoaded, fetchExpenses]);

  // Filter and group expenses
  const { filteredExpenses, groupedExpenses, filteredTotal } = useMemo(() => {
    if (!expenses) return { filteredExpenses: [], groupedExpenses: {}, filteredTotal: 0 };

    let filtered = expenses;

    // Apply title filter
    if (titleFilter.trim()) {
      filtered = filtered.filter(expense => 
        expense.title.toLowerCase().includes(titleFilter.toLowerCase())
      );
    }

    // Apply date range filter
    if (dateRange?.from) {
      filtered = filtered.filter(expense => {
        if (!expense.createdAt) return false;
        
        try {
          let expenseDate;
          
          if (typeof expense.createdAt === 'string') {
            // Try parsing as ISO string first
            expenseDate = new Date(expense.createdAt);
            
            // If that fails, try parsing as a number
            if (isNaN(expenseDate.getTime())) {
              const timestamp = parseFloat(expense.createdAt);
              if (!isNaN(timestamp)) {
                if (timestamp > 1700000000000 && timestamp < 1800000000000) {
                  expenseDate = new Date(timestamp);
                } else if (timestamp > 1000000000) {
                  expenseDate = new Date(timestamp * 1000);
                }
              }
            }
          } else {
            // Handle numeric timestamps
            const timestamp = expense.createdAt;
            if (timestamp > 1700000000000 && timestamp < 1800000000000) {
              expenseDate = new Date(timestamp);
            } else if (timestamp > 1000000000) {
              expenseDate = new Date(timestamp * 1000);
            }
          }
          
          // Check if we got a valid date
          if (!expenseDate || isNaN(expenseDate.getTime())) {
            return false;
          }
          
          const fromDate = new Date(dateRange.from!);
          const toDate = dateRange.to ? new Date(dateRange.to) : fromDate;
          
          // Set time to start/end of day for proper comparison
          fromDate.setHours(0, 0, 0, 0);
          toDate.setHours(23, 59, 59, 999);
          expenseDate.setHours(12, 0, 0, 0);
          
          return expenseDate >= fromDate && expenseDate <= toDate;
        } catch (error) {
          return false;
        }
      });
    }

    // Group by month
    const grouped: GroupedExpenses = {};
    filtered.forEach(expense => {
      if (!expense.createdAt) return;
      
      try {
        let date;
        
        if (typeof expense.createdAt === 'string') {
          // Try parsing as ISO string first
          date = new Date(expense.createdAt);
          
          // If that fails, try parsing as a number
          if (isNaN(date.getTime())) {
            const timestamp = parseFloat(expense.createdAt);
            if (!isNaN(timestamp)) {
              if (timestamp > 1700000000000 && timestamp < 1800000000000) {
                date = new Date(timestamp);
              } else if (timestamp > 1000000000) {
                date = new Date(timestamp * 1000);
              }
            }
          }
        } else {
          // Handle numeric timestamps
          const timestamp = expense.createdAt;
          if (timestamp > 1700000000000 && timestamp < 1800000000000) {
            date = new Date(timestamp);
          } else if (timestamp > 1000000000) {
            date = new Date(timestamp * 1000);
          }
        }
        
        if (!date || isNaN(date.getTime())) {
          return; // Skip expenses with invalid dates
        }
        
        const monthYear = date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long' 
        });
        
        if (!grouped[monthYear]) {
          grouped[monthYear] = { expenses: [], total: 0 };
        }
        
        grouped[monthYear].expenses.push(expense);
        grouped[monthYear].total += expense.amount;
      } catch (error) {
        // Skip expenses with invalid dates
        return;
      }
    });

    // Sort expenses within each group by date (newest first)
    Object.values(grouped).forEach(group => {
      group.expenses.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        
        try {
          // Parse dates using the same robust logic
          const parseDate = (dateString: string | number) => {
            let date;
            if (typeof dateString === 'string') {
              date = new Date(dateString);
              if (isNaN(date.getTime())) {
                const timestamp = parseFloat(dateString);
                if (!isNaN(timestamp)) {
                  if (timestamp > 1700000000000 && timestamp < 1800000000000) {
                    date = new Date(timestamp);
                  } else if (timestamp > 1000000000) {
                    date = new Date(timestamp * 1000);
                  }
                }
              }
            } else {
              const timestamp = dateString;
              if (timestamp > 1700000000000 && timestamp < 1800000000000) {
                date = new Date(timestamp);
              } else if (timestamp > 1000000000) {
                date = new Date(timestamp * 1000);
              }
            }
            return date && !isNaN(date.getTime()) ? date : null;
          };
          
          const dateA = parseDate(a.createdAt);
          const dateB = parseDate(b.createdAt);
          
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          
          return dateB.getTime() - dateA.getTime();
        } catch (error) {
          return 0;
        }
      });
    });

    const total = filtered.reduce((sum, expense) => sum + expense.amount, 0);

    return { 
      filteredExpenses: filtered, 
      groupedExpenses: grouped, 
      filteredTotal: total 
    };
  }, [expenses, titleFilter, dateRange]);

  const handleDeleteClick = (expense: Expense) => {
    setExpenseToDelete(expense);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!expenseToDelete) return;

    setIsDeleting(true);
    try {
      await deleteExpense(expenseToDelete.id);
      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
    } catch (error) {
      console.error("Failed to delete expense:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const clearFilters = () => {
    setDateRange(undefined);
    setTitleFilter("");
  };

  const formatAmount = (amount: number) => {
    return (amount / 100).toFixed(2);
  };

  const formatDate = (dateString: string) => {
    try {
      let date;
      
      if (typeof dateString === 'string') {
        // Try parsing as ISO string first
        date = new Date(dateString);
        
        // If that fails, try parsing as a number
        if (isNaN(date.getTime())) {
          const timestamp = parseFloat(dateString);
          if (!isNaN(timestamp)) {
            // Handle corrupted timestamps that are too large
            if (timestamp > 1700000000000 && timestamp < 1800000000000) {
              date = new Date(timestamp);
            } else if (timestamp > 1000000000) {
              date = new Date(timestamp * 1000);
            }
          }
        }
      } else {
        // Handle numeric timestamps
        const timestamp = dateString;
        if (timestamp > 1700000000000 && timestamp < 1800000000000) {
          date = new Date(timestamp);
        } else if (timestamp > 1000000000) {
          date = new Date(timestamp * 1000);
        }
      }
      
      if (!date || isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Show loading state while auth is loading
  if (!isLoaded) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!isSignedIn) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <div className="text-muted-foreground">
          <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">Sign in to view your expenses</p>
          <p className="text-sm mb-4">Track and manage your expenses securely</p>
          <Button onClick={() => router.push('/auth')}>
            Sign In to Continue
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">Expenses</h2>
            <p className="text-muted-foreground">
              {expensesCount} total expenses • ${formatAmount(totalAmount)} total
            </p>
          </div>
          <div className="flex gap-2">
            <ManageTagsDialog>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Manage Tags
              </Button>
            </ManageTagsDialog>
            <AddTagDialog>
              <Button variant="outline">
                <Tag className="h-4 w-4 mr-2" />
                Add Tag
              </Button>
            </AddTagDialog>
            <AddExpenseDialog>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </AddExpenseDialog>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                className="flex items-center gap-2 text-lg font-semibold p-0 h-auto hover:bg-transparent"
                onClick={() => setFiltersExpanded(!filtersExpanded)}
              >
                <Filter className="h-5 w-5" />
                Filters
                {filtersExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              <div className="flex items-center gap-2">
                {(titleFilter || dateRange) && (
                  <div className="text-sm text-muted-foreground">
                    {filteredExpenses.length} results
                  </div>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={clearFilters}
                  disabled={!titleFilter && !dateRange}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardHeader>
          {filtersExpanded && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title-filter">Search by title</Label>
                  <Input
                    id="title-filter"
                    placeholder="Enter expense title..."
                    value={titleFilter}
                    onChange={(e) => setTitleFilter(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Filter by date range</Label>
                  <DateRangePicker
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                    placeholder="Select date range"
                    className="w-full"
                  />
                </div>
              </div>
              {(titleFilter || dateRange) && (
                <div className="text-sm text-muted-foreground">
                  Showing {filteredExpenses.length} expenses • ${formatAmount(filteredTotal)} total
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Expenses List */}
        {!expenses || expenses.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <p className="text-lg font-medium">No expenses found</p>
              <p className="text-sm mb-4 text-muted-foreground">Start by adding your first expense!</p>
              <div className="flex gap-2 justify-center">
                <AddTagDialog>
                  <Button variant="outline">
                    <Tag className="h-4 w-4 mr-2" />
                    Create Tags First
                  </Button>
                </AddTagDialog>
                <AddExpenseDialog>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Expense
                  </Button>
                </AddExpenseDialog>
              </div>
            </CardContent>
          </Card>
        ) : filteredExpenses.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Filter className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <p className="text-lg font-medium">No expenses match your filters</p>
              <p className="text-sm mb-4 text-muted-foreground">Try adjusting your search criteria</p>
              <Button variant="outline" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedExpenses)
              .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
              .map(([monthYear, group]) => (
                <Card key={monthYear}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {monthYear}
                      </div>
                      <div className="text-lg font-mono">
                        ${formatAmount(group.total)}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Tags</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.expenses.map((expense) => (
                          <TableRow key={expense.id}>
                            <TableCell className="font-medium">{expense.title}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {expense.createdAt ? formatDate(expense.createdAt) : 'N/A'}
                            </TableCell>
                            <TableCell className="font-mono text-right">
                              ${formatAmount(expense.amount)}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {expense.expenseTags && expense.expenseTags.length > 0 ? (
                                  expense.expenseTags.map((tag, index) => (
                                    <Badge
                                      key={`${expense.id}-${tag.id}-${index}`}
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {tag.name}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-muted-foreground text-sm italic">
                                    No tags
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <EditExpenseDialog expense={expense}>
                                  <Button variant="ghost" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </EditExpenseDialog>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDeleteClick(expense)}
                                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{expenseToDelete?.title}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Expense"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 