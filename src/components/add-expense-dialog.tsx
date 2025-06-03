"use client";

import { useState, useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  tagsAtom,
  tagsLoadingAtom,
  fetchTagsAtom,
  createExpenseAtom,
} from "@/store/expenses";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DatePicker } from "@/components/ui/date-picker";
import { Plus, DollarSign, Tag, AlertCircle, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AddExpenseDialogProps {
  children: React.ReactNode;
}

export function AddExpenseDialog({ children }: AddExpenseDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Jotai atoms
  const tags = useAtomValue(tagsAtom);
  const tagsLoading = useAtomValue(tagsLoadingAtom);
  const fetchTags = useSetAtom(fetchTagsAtom);
  const createExpense = useSetAtom(createExpenseAtom);

  // Fetch tags when dialog opens
  useEffect(() => {
    if (open) {
      fetchTags();
    }
  }, [open, fetchTags]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setIsCreating(true);
    try {
      await createExpense({
        title: title.trim(),
        amount: amountNum,
        tagIds: selectedTagIds,
        createdAt: selectedDate.toISOString(),
      });

      // Reset form
      setTitle("");
      setAmount("");
      setSelectedDate(new Date());
      setSelectedTagIds([]);
      setError("");
      setOpen(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to create expense");
    } finally {
      setIsCreating(false);
    }
  };

  const handleTagToggle = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const selectedTags = tags?.filter((tag) =>
    selectedTagIds.includes(tag.id)
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Expense
          </DialogTitle>
          <DialogDescription>
            Create a new expense and optionally assign tags to categorize it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter expense title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isCreating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isCreating}
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
              disabled={isCreating}
            />
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-1">
              <Tag className="h-4 w-4" />
              Tags (Optional)
            </Label>
            
            {selectedTags && selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedTags.map((tag) => (
                  <Badge key={tag.id} variant="secondary" className="text-xs">
                    {tag.tagName}
                  </Badge>
                ))}
              </div>
            )}

            {tagsLoading ? (
              <div className="text-sm text-muted-foreground">Loading tags...</div>
            ) : tags && tags.length > 0 ? (
              <div className="max-h-32 overflow-y-auto space-y-2 border rounded-md p-3">
                {tags.map((tag) => (
                  <div key={tag.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tag-${tag.id}`}
                      checked={selectedTagIds.includes(tag.id)}
                      onCheckedChange={() => handleTagToggle(tag.id)}
                      disabled={isCreating}
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
              <div className="text-sm text-muted-foreground">
                No tags available. Create some tags first to categorize your expenses.
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating}
              className="flex items-center gap-2"
            >
              {isCreating ? (
                "Creating..."
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Expense
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 