"use client";

import { useAuth } from "@/hooks/use-auth";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
import {
  expensesAtom,
  tagsAtom,
  expensesLoadingAtom,
  expensesErrorAtom,
  fetchExpensesAtom,
  fetchTagsAtom,
  totalExpensesAtom,
  expensesCountAtom,
  type Expense,
} from "@/store/expenses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DateRangePicker } from "@/components/ui/date-picker";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Tag,
  BarChart3,
  PieChart,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function ReportsPage() {
  const { isSignedIn, isLoaded } = useAuth();

  // Jotai atoms
  const expenses = useAtomValue(expensesAtom);
  const tags = useAtomValue(tagsAtom);
  const isLoading = useAtomValue(expensesLoadingAtom);
  const error = useAtomValue(expensesErrorAtom);
  const totalAmount = useAtomValue(totalExpensesAtom);
  const expensesCount = useAtomValue(expensesCountAtom);
  const fetchExpenses = useSetAtom(fetchExpensesAtom);
  const fetchTags = useSetAtom(fetchTagsAtom);

  // Filter state
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Quick filter functions
  const setThisMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setDateRange({ from: start, to: end });
  };

  const setLastMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    setDateRange({ from: start, to: end });
  };

  const setLast3Months = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const end = new Date();
    setDateRange({ from: start, to: end });
  };

  const setThisYear = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31);
    setDateRange({ from: start, to: end });
  };

  // Fetch data when user is authenticated
  useEffect(() => {
    if (isSignedIn && isLoaded) {
      fetchExpenses();
      fetchTags();
    }
  }, [isSignedIn, isLoaded, fetchExpenses, fetchTags]);

  // Filter expenses based on selected criteria
  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];

    let filtered = expenses;

    // Apply tag filter
    if (selectedTagIds.length > 0) {
      filtered = filtered.filter(expense => {
        if (!expense.expenseTags || expense.expenseTags.length === 0) {
          return false; // Exclude untagged expenses when tags are selected
        }
        const hasMatchingTag = expense.expenseTags.some(tag => selectedTagIds.includes(tag.id));
        return hasMatchingTag;
      });
    }

    // Apply date range filter with better timestamp handling
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
                // These timestamps seem to be corrupted - they're too large
                // Let's try to fix them by assuming they're off by some factor
                if (timestamp > 1700000000000 && timestamp < 1800000000000) {
                  // These look like they might be close to valid timestamps
                  // Try using them as-is first
                  expenseDate = new Date(timestamp);
                  
                  // If still invalid, try dividing by 1000 (maybe they're in microseconds?)
                  if (isNaN(expenseDate.getTime())) {
                    expenseDate = new Date(timestamp / 1000);
                  }
                }
              }
            }
          } else {
            // Handle numeric timestamps
            let timestamp = expense.createdAt;
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
          
          const inRange = expenseDate >= fromDate && expenseDate <= toDate;
          return inRange;
        } catch (error) {
          return false;
        }
      });
    }

    return filtered;
  }, [expenses, selectedTagIds, dateRange]);

  // Calculate analytics based on filtered data
  const analytics = useMemo(() => {
    const expensesToAnalyze = filteredExpenses;
    
    if (!expensesToAnalyze || expensesToAnalyze.length === 0) {
      return {
        monthlyData: [],
        tagData: [],
        averageExpense: 0,
        thisMonthTotal: 0,
        lastMonthTotal: 0,
        monthlyGrowth: 0,
        topExpense: null,
        recentExpenses: [],
        filteredTotal: 0,
        filteredCount: 0,
      };
    }

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // This month's expenses
    const thisMonthExpenses = expensesToAnalyze.filter(expense => {
      if (!expense.createdAt) return false;
      try {
        const expenseDate = new Date(expense.createdAt);
        if (isNaN(expenseDate.getTime())) return false;
        return expenseDate >= thisMonth;
      } catch {
        return false;
      }
    });

    // Last month's expenses
    const lastMonthExpenses = expensesToAnalyze.filter(expense => {
      if (!expense.createdAt) return false;
      try {
        const expenseDate = new Date(expense.createdAt);
        if (isNaN(expenseDate.getTime())) return false;
        return expenseDate >= lastMonth && expenseDate <= lastMonthEnd;
      } catch {
        return false;
      }
    });

    const thisMonthTotal = thisMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const lastMonthTotal = lastMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const monthlyGrowth = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

    // Monthly data - get actual date range from expenses and create 6 months of data
    const monthlyData: Array<{ month: string; total: number; count: number }> = [];
    
    if (expensesToAnalyze.length > 0) {
      // Find the actual date range of expenses
      const expenseDates = expensesToAnalyze
        .map(expense => {
          if (!expense.createdAt) return null;
          try {
            let expenseDate;
            if (typeof expense.createdAt === 'string') {
              expenseDate = new Date(expense.createdAt);
              if (isNaN(expenseDate.getTime())) {
                const timestamp = parseFloat(expense.createdAt);
                if (!isNaN(timestamp) && timestamp > 1700000000000 && timestamp < 1800000000000) {
                  expenseDate = new Date(timestamp);
                }
              }
            } else {
              let timestamp = expense.createdAt;
              if (timestamp > 1700000000000 && timestamp < 1800000000000) {
                expenseDate = new Date(timestamp);
              }
            }
            return expenseDate && !isNaN(expenseDate.getTime()) ? expenseDate : null;
          } catch {
            return null;
          }
        })
        .filter(date => date !== null)
        .sort((a, b) => a!.getTime() - b!.getTime());

      if (expenseDates.length > 0) {
        // Get the earliest and latest expense dates
        const earliestDate = expenseDates[0]!;
        const latestDate = expenseDates[expenseDates.length - 1]!;
        
        // Create monthly buckets from earliest to latest, but limit to reasonable range
        const startMonth = new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1);
        const endMonth = new Date(latestDate.getFullYear(), latestDate.getMonth(), 1);
        
        // Generate up to 12 months of data, starting from the most recent
        const monthsToShow = [];
        let currentMonth = new Date(endMonth);
        
        for (let i = 0; i < 12 && currentMonth >= startMonth; i++) {
          monthsToShow.unshift(new Date(currentMonth));
          currentMonth.setMonth(currentMonth.getMonth() - 1);
        }
        
        // Calculate data for each month
        monthsToShow.forEach(monthDate => {
          const nextMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
          
          const monthExpenses = expensesToAnalyze.filter(expense => {
            if (!expense.createdAt) return false;
            try {
              let expenseDate;
              if (typeof expense.createdAt === 'string') {
                expenseDate = new Date(expense.createdAt);
                if (isNaN(expenseDate.getTime())) {
                  const timestamp = parseFloat(expense.createdAt);
                  if (!isNaN(timestamp) && timestamp > 1700000000000 && timestamp < 1800000000000) {
                    expenseDate = new Date(timestamp);
                  }
                }
              } else {
                let timestamp = expense.createdAt;
                if (timestamp > 1700000000000 && timestamp < 1800000000000) {
                  expenseDate = new Date(timestamp);
                }
              }
              
              if (!expenseDate || isNaN(expenseDate.getTime())) return false;
              return expenseDate >= monthDate && expenseDate < nextMonth;
            } catch {
              return false;
            }
          });

          const total = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
          
          monthlyData.push({
            month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            total: total / 100, // Convert to dollars
            count: monthExpenses.length,
          });
        });
      }
    }

    // Tag analytics
    const tagMap = new Map();
    expensesToAnalyze.forEach(expense => {
      if (expense.expenseTags && expense.expenseTags.length > 0) {
        expense.expenseTags.forEach(tag => {
          const existing = tagMap.get(tag.name) || { name: tag.name, total: 0, count: 0 };
          existing.total += expense.amount;
          existing.count += 1;
          tagMap.set(tag.name, existing);
        });
      } else {
        const existing = tagMap.get('Untagged') || { name: 'Untagged', total: 0, count: 0 };
        existing.total += expense.amount;
        existing.count += 1;
        tagMap.set('Untagged', existing);
      }
    });

    const tagData = Array.from(tagMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Other metrics
    const filteredTotal = expensesToAnalyze.reduce((sum, exp) => sum + exp.amount, 0);
    const averageExpense = expensesToAnalyze.length > 0 ? filteredTotal / expensesToAnalyze.length : 0;
    const topExpense = expensesToAnalyze.reduce((max, exp) => exp.amount > max.amount ? exp : max, expensesToAnalyze[0]);
    const recentExpenses = [...expensesToAnalyze]
      .sort((a, b) => {
        try {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          
          // Handle invalid dates
          if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
          if (isNaN(dateA.getTime())) return 1; // Put invalid dates at the end
          if (isNaN(dateB.getTime())) return -1;
          
          return dateB.getTime() - dateA.getTime();
        } catch {
          return 0;
        }
      })
      .slice(0, 5);

    return {
      monthlyData,
      tagData,
      averageExpense,
      thisMonthTotal,
      lastMonthTotal,
      monthlyGrowth,
      topExpense,
      recentExpenses,
      filteredTotal,
      filteredCount: expensesToAnalyze.length,
    };
  }, [filteredExpenses]);

  const handleTagToggle = (tagId: number) => {
    setSelectedTagIds(prev => {
      const newIds = prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId];
      return newIds;
    });
  };

  const clearFilters = () => {
    setDateRange(undefined);
    setSelectedTagIds([]);
  };

  const hasActiveFilters = selectedTagIds.length > 0 || dateRange;

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
        let timestamp = dateString;
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
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!isSignedIn) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="text-center py-12 border rounded-lg">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">Sign in to view your reports</p>
          <p className="text-sm text-muted-foreground">Get insights into your spending patterns</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground mt-2">
            Insights into your spending patterns and financial trends
          </p>
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
                {hasActiveFilters && (
                  <div className="text-sm text-muted-foreground">
                    {analytics.filteredCount} results
                  </div>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardHeader>
          {filtersExpanded && (
            <CardContent className="space-y-4">
              {/* Quick Filter Buttons */}
              <div className="space-y-2">
                <Label>Quick Filters</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={setThisMonth}
                  >
                    This Month
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={setLastMonth}
                  >
                    Last Month
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={setLast3Months}
                  >
                    Last 3 Months
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={setThisYear}
                  >
                    This Year
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Filter by date range</Label>
                  <DateRangePicker
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                    placeholder="Select date range"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Filter by tags</Label>
                  {tags && tags.length > 0 ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          {selectedTagIds.length === 0 ? (
                            "Select tags..."
                          ) : selectedTagIds.length === 1 ? (
                            tags.find(t => t.id === selectedTagIds[0])?.tagName
                          ) : (
                            `${selectedTagIds.length} tags selected`
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <div className="max-h-64 overflow-y-auto">
                          <div className="p-2 space-y-1">
                            {tags.map((tag) => (
                              <div
                                key={tag.id}
                                className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                                onClick={() => handleTagToggle(tag.id)}
                              >
                                <Checkbox
                                  id={`filter-tag-${tag.id}`}
                                  checked={selectedTagIds.includes(tag.id)}
                                  onChange={() => {}} // Handled by parent onClick
                                />
                                <Label
                                  htmlFor={`filter-tag-${tag.id}`}
                                  className="text-sm font-normal cursor-pointer flex-1"
                                >
                                  {tag.tagName}
                                </Label>
                              </div>
                            ))}
                          </div>
                          {selectedTagIds.length > 0 && (
                            <div className="border-t p-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full"
                                onClick={() => setSelectedTagIds([])}
                              >
                                Clear selection
                              </Button>
                            </div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <div className="text-sm text-muted-foreground border rounded-md p-3">
                      No tags available
                    </div>
                  )}
                </div>
              </div>
              {hasActiveFilters && (
                <div className="text-sm text-muted-foreground">
                  Showing {analytics.filteredCount} expenses • ${formatAmount(analytics.filteredTotal)} total
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Expenses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {hasActiveFilters ? 'Filtered' : 'Total'} Expenses
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${formatAmount(hasActiveFilters ? analytics.filteredTotal : totalAmount)}
              </div>
              <p className="text-xs text-muted-foreground">
                {hasActiveFilters ? analytics.filteredCount : expensesCount} total transactions
              </p>
            </CardContent>
          </Card>

          {/* This Month */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${formatAmount(analytics.thisMonthTotal)}</div>
              <div className="flex items-center text-xs">
                {analytics.monthlyGrowth > 0 ? (
                  <ArrowUpRight className="h-3 w-3 text-red-500 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-green-500 mr-1" />
                )}
                <span className={analytics.monthlyGrowth > 0 ? "text-red-500" : "text-green-500"}>
                  {Math.abs(analytics.monthlyGrowth).toFixed(1)}%
                </span>
                <span className="text-muted-foreground ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>

          {/* Average Expense */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Expense</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${formatAmount(analytics.averageExpense)}</div>
              <p className="text-xs text-muted-foreground">
                per transaction
              </p>
            </CardContent>
          </Card>

          {/* Top Categories */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Category</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.tagData[0]?.name || 'No data'}
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.tagData[0] ? `$${formatAmount(analytics.tagData[0].total)}` : 'No expenses yet'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Monthly Spending Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.monthlyData.length > 0 && analytics.monthlyData.some(m => m.total > 0) ? (
                <div className="space-y-4">
                  {analytics.monthlyData.map((month, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{month.month}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{
                              width: `${Math.min((month.total / Math.max(...analytics.monthlyData.map(m => m.total))) * 100, 100)}%`
                            }}
                          />
                        </div>
                        <span className="text-sm font-mono w-16 text-right">
                          ${month.total.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Top Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.tagData.length > 0 ? (
                <div className="space-y-4">
                  {analytics.tagData.map((tag, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {tag.name}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {tag.count} expenses
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{
                              width: `${(tag.total / analytics.tagData[0].total) * 100}%`
                            }}
                          />
                        </div>
                        <span className="text-sm font-mono w-16 text-right">
                          ${formatAmount(tag.total)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <PieChart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No categories available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Expenses */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.recentExpenses.length > 0 ? (
              <div className="space-y-3">
                {analytics.recentExpenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{expense.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {expense.createdAt ? formatDate(expense.createdAt) : 'No date'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {expense.expenseTags && expense.expenseTags.length > 0 && (
                        <div className="flex gap-1">
                          {expense.expenseTags.slice(0, 2).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag.name}
                            </Badge>
                          ))}
                          {expense.expenseTags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{expense.expenseTags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                      <span className="font-mono font-medium">
                        ${formatAmount(expense.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent expenses</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 