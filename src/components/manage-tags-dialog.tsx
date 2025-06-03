"use client";

import { useEffect, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  tagsAtom,
  tagsLoadingAtom,
  tagsErrorAtom,
  tagsCountAtom,
  fetchTagsAtom,
  deleteTagAtom,
  updateTagAtom,
} from "@/store/expenses";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tag, AlertCircle, Settings, Edit, Trash2, Check, X } from "lucide-react";

interface ManageTagsDialogProps {
  children: React.ReactNode;
}

export function ManageTagsDialog({ children }: ManageTagsDialogProps) {
  // Jotai atoms
  const tags = useAtomValue(tagsAtom);
  const isLoading = useAtomValue(tagsLoadingAtom);
  const error = useAtomValue(tagsErrorAtom);
  const tagsCount = useAtomValue(tagsCountAtom);
  const fetchTags = useSetAtom(fetchTagsAtom);
  const deleteTag = useSetAtom(deleteTagAtom);
  const updateTag = useSetAtom(updateTagAtom);

  // Local state for inline editing
  const [editingTagId, setEditingTagId] = useState<number | null>(null);
  const [editingTagName, setEditingTagName] = useState("");
  const [editError, setEditError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Local state for delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<{ id: number; tagName: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch tags when component mounts
  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleEditStart = (tag: { id: number; tagName: string }) => {
    setEditingTagId(tag.id);
    setEditingTagName(tag.tagName);
    setEditError("");
  };

  const handleEditCancel = () => {
    setEditingTagId(null);
    setEditingTagName("");
    setEditError("");
  };

  const handleEditSave = async (tagId: number, originalName: string) => {
    setEditError("");

    const trimmedTagName = editingTagName.trim();
    if (!trimmedTagName) {
      setEditError("Tag name is required");
      return;
    }

    if (trimmedTagName.length > 30) {
      setEditError("Tag name is too long (max 30 characters)");
      return;
    }

    if (trimmedTagName === originalName) {
      setEditError("Tag name hasn't changed");
      return;
    }

    setIsUpdating(true);
    try {
      await updateTag({
        id: tagId,
        tagName: trimmedTagName,
      });

      // Reset editing state
      setEditingTagId(null);
      setEditingTagName("");
      setEditError("");
    } catch (error) {
      setEditError(error instanceof Error ? error.message : "Failed to update tag");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = (tag: { id: number; tagName: string }) => {
    setTagToDelete(tag);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!tagToDelete) return;

    setIsDeleting(true);
    try {
      await deleteTag(tagToDelete.id);
      setDeleteDialogOpen(false);
      setTagToDelete(null);
    } catch (error) {
      console.error("Failed to delete tag:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Manage Tags
            </DialogTitle>
            <DialogDescription>
              View, edit, and delete your expense tags. Click the edit icon to rename a tag inline.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            ) : tags && tags.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Your Tags ({tagsCount})</h4>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {tags.map((tag) => (
                    <div
                      key={tag.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                    >
                      {editingTagId === tag.id ? (
                        // Inline edit form
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              value={editingTagName}
                              onChange={(e) => setEditingTagName(e.target.value)}
                              disabled={isUpdating}
                              maxLength={30}
                              className="flex-1"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleEditSave(tag.id, tag.tagName);
                                } else if (e.key === "Escape") {
                                  handleEditCancel();
                                }
                              }}
                            />
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditSave(tag.id, tag.tagName)}
                                disabled={isUpdating}
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleEditCancel}
                                disabled={isUpdating}
                                className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          {editError && (
                            <p className="text-xs text-destructive">{editError}</p>
                          )}
                          <div className="text-xs text-muted-foreground">
                            {editingTagName.length}/30 characters • Press Enter to save, Escape to cancel
                          </div>
                        </div>
                      ) : (
                        // Display mode
                        <>
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{tag.tagName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditStart(tag)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(tag)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">
                  Click the edit icon to rename a tag or the trash icon to delete it.
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Tag className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No tags created yet. Create your first tag to start organizing your expenses.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tag</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the tag "{tagToDelete?.tagName}"? 
              This will remove it from all expenses that use this tag. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Tag"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 