"use client";

import { useState } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Trash2, 
  Plus, 
  MessageSquare, 
  Edit2, 
  Check, 
  X,
  Loader2,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import {
  threadsAtom,
  selectedThreadIdAtom,
  createThreadAtom,
  deleteThreadAtom,
  updateThreadTitleAtom,
  selectThreadAtom,
  threadsCountAtom,
} from '@/store/threads';

interface ThreadsSidebarProps {
  className?: string;
}

export function ThreadsSidebar({ className }: ThreadsSidebarProps) {
  const [threadsResult] = useAtom(threadsAtom);
  const [selectedThreadId, setSelectedThreadId] = useAtom(selectedThreadIdAtom);
  const threadsCount = useAtomValue(threadsCountAtom);
  
  const [createThreadMutation] = useAtom(createThreadAtom);
  const [deleteThreadMutation] = useAtom(deleteThreadAtom);
  const [updateThreadTitleMutation] = useAtom(updateThreadTitleAtom);
  const selectThread = useSetAtom(selectThreadAtom);

  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const threads = threadsResult.data?.success ? threadsResult.data.threads : [];
  const isLoading = threadsResult.isPending;
  const error = threadsResult.error;

  const handleCreateThread = async () => {
    try {
      const result = await createThreadMutation.mutateAsync(undefined);
      if (result.success) {
        setSelectedThreadId(result.thread.id);
      }
    } catch (error) {
      console.error('Failed to create thread:', error);
    }
  };

  const handleSelectThread = (threadId: string) => {
    selectThread(threadId);
  };

  const handleEditThread = (threadId: string, currentTitle: string) => {
    setEditingThreadId(threadId);
    setEditingTitle(currentTitle);
  };

  const handleSaveEdit = async () => {
    if (editingThreadId && editingTitle.trim()) {
      try {
        await updateThreadTitleMutation.mutateAsync({ 
          threadId: editingThreadId, 
          title: editingTitle.trim() 
        });
        setEditingThreadId(null);
        setEditingTitle('');
      } catch (error) {
        console.error('Failed to rename thread:', error);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingThreadId(null);
    setEditingTitle('');
  };

  const handleDeleteThread = async (threadId: string) => {
    if (confirm('Are you sure you want to delete this chat thread? This action cannot be undone.')) {
      try {
        await deleteThreadMutation.mutateAsync(threadId);
        if (selectedThreadId === threadId) {
          setSelectedThreadId(null);
        }
      } catch (error) {
        console.error('Failed to delete thread:', error);
      }
    }
  };

  const formatMessageTime = (createdAt: string) => {
    return formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  };

  return (
    <div className={cn("w-80 border-r bg-muted/30 flex flex-col h-full", className)}>
      {/* Fixed Header */}
      <div className="flex-shrink-0 p-4 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Chat Threads</h2>
          <Badge variant="secondary">{threadsCount}</Badge>
        </div>
        <Button
          onClick={handleCreateThread}
          className="w-full"
          disabled={createThreadMutation.isPending || isLoading}
        >
          {createThreadMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          New Chat
        </Button>
      </div>

      {/* Scrollable Threads List */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : error ? (
              <div className="p-4 text-center text-destructive">
                <p>Failed to load threads</p>
                <p className="text-sm text-muted-foreground">{error.message}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => threadsResult.refetch()}
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            ) : threads.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No chat threads yet</p>
                <p className="text-sm">Create your first chat to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
                {threads.map((thread) => (
                  <Card
                    key={thread.id}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-accent/50",
                      selectedThreadId === thread.id && "bg-accent border-primary"
                    )}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div 
                          className="flex-1 min-w-0 mr-2"
                          onClick={() => handleSelectThread(thread.id)}
                        >
                          {editingThreadId === thread.id ? (
                            <div className="flex items-center gap-1">
                              <Input
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                className="h-6 text-sm"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEdit();
                                  if (e.key === 'Escape') handleCancelEdit();
                                }}
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveEdit();
                                }}
                                disabled={updateThreadTitleMutation.isPending}
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelEdit();
                                }}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <h3 className="font-medium text-sm truncate">
                                {thread.title}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatMessageTime(thread.updatedAt)}
                              </p>
                            </>
                          )}
                        </div>
                        
                        {editingThreadId !== thread.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="w-3 h-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleEditThread(thread.id, thread.title)}
                              >
                                <Edit2 className="w-3 h-3 mr-2" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteThread(thread.id)}
                                className="text-destructive"
                                disabled={deleteThreadMutation.isPending}
                              >
                                <Trash2 className="w-3 h-3 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
} 