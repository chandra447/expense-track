"use client";

import { useState, useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  tagsAtom,
  tagsLoadingAtom,
  fetchTagsAtom,
  updateExpenseAtom,
  type Expense,
} from "@/store/expenses";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DatePicker } from "@/components/ui/date-picker";
import { DollarSign, Tag, AlertCircle, Loader2, Calendar } from "lucide-react";

interface EditExpenseDialogProps {
  children: React.ReactNode;
  expense: Expense;
}

export function EditExpenseDialog({ children, expense }: EditExpenseDialogProps) {
  // Jotai atoms
  const tags = useAtomValue(tagsAtom);
  const tagsLoading = useAtomValue(tagsLoadingAtom);
  const fetchTags = useSetAtom(fetchTagsAtom);
  const updateExpense = useSetAtom(updateExpenseAtom);

  // Local state
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(expense.title);
  const [amount, setAmount] = useState((expense.amount / 100).toString());
  const [selectedDate, setSelectedDate] = useState<Date>(
    expense.createdAt ? new Date(expense.createdAt) : new Date()
  );
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(
    expense.expenseTags?.map(tag => tag.id) || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fetch tags when dialog opens
  useEffect(() => {
    if (open) {
      fetchTags();
    }
  }, [open, fetchTags]);

  // Reset form when expense changes or dialog opens
  useEffect(() => {
    if (open) {
      setTitle(expense.title);
      setAmount((expense.amount / 100).toString());
      setSelectedDate(expense.createdAt ? new Date(expense.createdAt) : new Date());
      setSelectedTagIds(expense.expenseTags?.map(tag => tag.id) || []);
      setError("");
    }
  }, [open, expense]);

  const handleTagToggle = (tagId: number) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Amount must be a positive number");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateExpense({
        id: expense.id,
        title: title.trim(),
        amount: amountNum,
        tagIds: selectedTagIds,
        createdAt: selectedDate.toISOString(),
      });

      // Close dialog on success
      setOpen(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to update expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Edit Expense
          </DialogTitle>
          <DialogDescription>
            Update your expense details and tags.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter expense title"
              disabled={isSubmitting}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Date
            </Label>
            <DatePicker
              date={selectedDate}
              onDateChange={(date) => setSelectedDate(date || new Date())}
              placeholder="Select expense date"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags (optional)
            </Label>
            
            {tagsLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : tags && tags.length > 0 ? (
              <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
                {tags.map((tag) => (
                  <div key={tag.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tag-${tag.id}`}
                      checked={selectedTagIds.includes(tag.id)}
                      onCheckedChange={() => handleTagToggle(tag.id)}
                      disabled={isSubmitting}
                    />
                    <Label 
                      htmlFor={`tag-${tag.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {tag.tagName}
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No tags available</p>
                <p className="text-xs">Create some tags first to organize your expenses</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Expense"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 