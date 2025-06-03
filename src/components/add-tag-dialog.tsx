"use client";

import { useState } from "react";
import { useSetAtom } from "jotai";
import { createTagAtom } from "@/store/expenses";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Tag, AlertCircle } from "lucide-react";

interface AddTagDialogProps {
  children: React.ReactNode;
}

export function AddTagDialog({ children }: AddTagDialogProps) {
  const [open, setOpen] = useState(false);
  const [tagName, setTagName] = useState("");
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Jotai atoms
  const createTag = useSetAtom(createTagAtom);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedTagName = tagName.trim();
    if (!trimmedTagName) {
      setError("Tag name is required");
      return;
    }

    if (trimmedTagName.length > 30) {
      setError("Tag name is too long (max 30 characters)");
      return;
    }

    setIsCreating(true);
    try {
      await createTag({
        tagName: trimmedTagName,
      });

      // Reset form
      setTagName("");
      setError("");
      setOpen(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to create tag");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Create New Tag
          </DialogTitle>
          <DialogDescription>
            Create a new tag to categorize your expenses. Tags help you organize and filter your spending.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tagName">Tag Name</Label>
            <Input
              id="tagName"
              placeholder="Enter tag name..."
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              disabled={isCreating}
              maxLength={30}
            />
            <div className="text-xs text-muted-foreground">
              {tagName.length}/30 characters
            </div>
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
                  Create Tag
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 