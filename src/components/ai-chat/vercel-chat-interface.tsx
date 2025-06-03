"use client";

import { useChat } from '@ai-sdk/react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Bot, 
  User, 
  Send, 
  Loader2, 
  Brain, 
  DollarSign,
  Receipt,
  Search,
  Settings,
  TrendingUp,
  StopCircle,
  Tag,
  Trash2,
  ChevronDown,
  ChevronRight,
  Code,
  MessageSquare,
  Plus
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { formatDistanceToNow } from 'date-fns';
import { 
  selectedThreadIdAtom, 
  selectedThreadAtom, 
  messagesAtom,
  createThreadAtom,
  currentMessagesAtom
} from '@/store/threads';

export function VercelChatInterface() {
  const [selectedThreadId, setSelectedThreadId] = useAtom(selectedThreadIdAtom);
  const selectedThread = useAtomValue(selectedThreadAtom);
  const [messagesResult] = useAtom(messagesAtom);
  const threadMessages = useAtomValue(currentMessagesAtom);
  const [createThreadMutation] = useAtom(createThreadAtom);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { 
    messages, 
    input, 
    handleInputChange, 
    handleSubmit: originalHandleSubmit, 
    isLoading,
    status,
    stop,
    error,
    setMessages
  } = useChat({
    api: '/api/chat',
    body: {
      threadId: selectedThreadId,
    },
    onFinish: (message) => {
      // Refresh messages from the database after AI response
      if (selectedThreadId) {
        messagesResult.refetch?.();
      }
    },
  });

  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());

  // Sync thread messages with chat messages
  useEffect(() => {
    if (threadMessages.length > 0) {
      const formattedMessages = threadMessages.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
        createdAt: new Date(msg.createdAt),
      }));
      setMessages(formattedMessages);
    } else if (selectedThreadId) {
      // If we have a selected thread but no messages, clear the chat
      setMessages([]);
    }
  }, [threadMessages, selectedThreadId, setMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!input.trim()) return;

    // If no thread is selected, create one first
    if (!selectedThreadId) {
      try {
        const result = await createThreadMutation.mutateAsync(undefined);
        if (result.success) {
          setSelectedThreadId(result.thread.id);
          // Wait a bit for the state to update, then submit
          setTimeout(() => {
            originalHandleSubmit(e);
          }, 100);
        }
      } catch (error) {
        console.error('Failed to create thread:', error);
        return;
      }
    } else {
      originalHandleSubmit(e);
    }
  };

  const toggleToolExpansion = (toolCallId: string) => {
    const newExpanded = new Set(expandedTools);
    if (newExpanded.has(toolCallId)) {
      newExpanded.delete(toolCallId);
    } else {
      newExpanded.add(toolCallId);
    }
    setExpandedTools(newExpanded);
  };

  const formatMessageTime = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header */}
      <div className="flex-shrink-0 p-4 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <div className="flex flex-col">
              <h1 className="font-semibold">
                {selectedThread ? selectedThread.title : 'AI Expense Assistant'}
              </h1>
              {selectedThread && (
                <span className="text-xs text-muted-foreground">
                  Created {formatMessageTime(new Date(selectedThread.createdAt))}
                </span>
              )}
            </div>
            <Badge variant="secondary" className="text-xs">Hono + Vercel AI SDK</Badge>
          </div>
          <div className="flex items-center gap-2">
            {status === 'streaming' && (
              <Badge variant="outline" className="animate-pulse">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Streaming
              </Badge>
            )}
            {messages.length > 0 && (
              <Badge variant="secondary">
                {messages.length} message{messages.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea ref={scrollAreaRef} className="h-full">
          <div className="p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Bot className="h-12 w-12 mb-4 text-muted-foreground" />
                {selectedThreadId ? (
                  <>
                    <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
                    <p className="text-muted-foreground max-w-md">
                      Ask me anything about your expenses, budgeting, or financial planning. 
                      Try: "Add $25 for groceries" or "Show my expense summary"
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-medium mb-2">Select or create a thread</h3>
                    <p className="text-muted-foreground max-w-md">
                      Choose a thread from the sidebar or create a new one to start chatting.
                    </p>
                  </>
                )}
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="space-y-2">
                  {/* User message */}
                  {message.role === "user" && (
                    <div className="flex justify-end">
                      <div className="max-w-[70%] bg-primary text-primary-foreground rounded-2xl px-4 py-2">
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {formatMessageTime(message.createdAt || new Date())}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Tool invocations */}
                  {message.role === "assistant" && message.toolInvocations && message.toolInvocations.length > 0 && (
                    <div className="flex justify-start">
                      <div className="max-w-[70%] space-y-2">
                        {message.toolInvocations.map((toolInvocation) => {
                          const getToolIcon = (toolName: string) => {
                            switch (toolName) {
                              case 'create_expense': return <DollarSign className="h-3 w-3" />;
                              case 'get_expense_summary': return <Receipt className="h-3 w-3" />;
                              case 'search_expenses': return <Search className="h-3 w-3" />;
                              case 'get_expense_insights': return <TrendingUp className="h-3 w-3" />;
                              case 'create_tag': return <Tag className="h-3 w-3" />;
                              case 'delete_expense': return <Trash2 className="h-3 w-3" />;
                              default: return <Settings className="h-3 w-3" />;
                            }
                          };

                          const formatToolName = (toolName: string) => {
                            return toolName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                          };

                          return (
                            <div key={toolInvocation.toolCallId} className="bg-muted/50 rounded-lg border p-3">
                              <div className="flex items-center gap-2 mb-2">
                                {getToolIcon(toolInvocation.toolName)}
                                <span className="text-sm font-medium">{formatToolName(toolInvocation.toolName)}</span>
                                
                                {toolInvocation.state === 'call' && (
                                  <Badge variant="secondary" className="ml-auto text-xs">
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Executing
                                  </Badge>
                                )}
                                
                                {toolInvocation.state === 'result' && (
                                  <Badge className="ml-auto text-xs bg-green-600">
                                    ✓ Completed
                                  </Badge>
                                )}
                              </div>
                              
                              {/* Parameters */}
                              {toolInvocation.args && Object.keys(toolInvocation.args).length > 0 && (
                                <div className="text-xs text-muted-foreground mb-2">
                                  <span className="font-medium">Parameters:</span> {Object.entries(toolInvocation.args).map(([key, value]) => 
                                    `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`
                                  ).join(', ')}
                                </div>
                              )}
                              
                              {/* Collapsible details */}
                              {toolInvocation.state === 'result' && toolInvocation.result && (
                                <Collapsible>
                                  <CollapsibleTrigger className="flex items-center gap-2 text-xs hover:bg-background/50 p-2 rounded w-full text-left">
                                    <Code className="h-3 w-3" />
                                    <span>View Technical Details</span>
                                    <ChevronRight className="h-3 w-3 ml-auto ui-state-open:rotate-90 transition-transform" />
                                  </CollapsibleTrigger>
                                  <CollapsibleContent className="mt-2">
                                    <div className="p-2 bg-background/80 rounded border text-xs">
                                      <pre className="whitespace-pre-wrap overflow-x-auto text-xs">
                                        {JSON.stringify(toolInvocation.result, null, 2)}
                                      </pre>
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* AI response from tool results */}
                  {message.role === "assistant" && message.toolInvocations && message.toolInvocations.length > 0 && (
                    (() => {
                      const toolMessages = message.toolInvocations
                        .filter(tool => tool.state === 'result')
                        .map(tool => {
                          if (tool.state === 'result' && 'result' in tool) {
                            const result = tool.result as any;
                            return result?.message || null;
                          }
                          return null;
                        })
                        .filter(Boolean);

                      if (toolMessages.length === 0) return null;

                      return (
                        <div className="flex justify-start">
                          <div className="max-w-[70%] bg-muted rounded-2xl px-4 py-2">
                            <div className="text-sm space-y-1">
                              {toolMessages.map((msg, index) => (
                                <p key={index}>{msg}</p>
                              ))}
                            </div>
                            <p className="text-xs opacity-70 mt-1">
                              {formatMessageTime(message.createdAt || new Date())}
                            </p>
                          </div>
                        </div>
                      );
                    })()
                  )}

                  {/* Regular AI message */}
                  {message.role === "assistant" && message.content && (
                    <div className="flex justify-start">
                      <div className="max-w-[70%] bg-muted rounded-2xl px-4 py-2">
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {formatMessageTime(message.createdAt || new Date())}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            
            {/* Loading state */}
            {status === 'streaming' && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="flex justify-start">
                <div className="max-w-[70%] bg-red-50 border border-red-200 rounded-2xl px-4 py-2">
                  <p className="text-sm text-red-800">
                    <strong>Error:</strong> {error.message}
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      
      {/* Fixed Input Area */}
      <div className="flex-shrink-0 p-4 border-t bg-background/95 backdrop-blur">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder={
              selectedThreadId 
                ? "Type your message..." 
                : "Select or create a thread to start chatting..."
            }
            disabled={!selectedThreadId || status !== 'ready'}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={!input.trim() || !selectedThreadId || status !== 'ready'}
            size="icon"
          >
            {status === 'streaming' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
        
        {/* Quick action buttons */}
        <div className="flex gap-1 mt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleInputChange({ target: { value: "Show me my expense summary" } } as any)}
            disabled={!selectedThreadId || status !== 'ready'}
            className="h-7 px-2 text-xs"
          >
            <Receipt className="h-3 w-3 mr-1" />
            Summary
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleInputChange({ target: { value: "Add $15 for lunch" } } as any)}
            disabled={!selectedThreadId || status !== 'ready'}
            className="h-7 px-2 text-xs"
          >
            <DollarSign className="h-3 w-3 mr-1" />
            Add Expense
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleInputChange({ target: { value: "Find expenses over $20" } } as any)}
            disabled={!selectedThreadId || status !== 'ready'}
            className="h-7 px-2 text-xs"
          >
            <Search className="h-3 w-3 mr-1" />
            Search
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleInputChange({ target: { value: "Give me insights for this month" } } as any)}
            disabled={!selectedThreadId || status !== 'ready'}
            className="h-7 px-2 text-xs"
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            Insights
          </Button>
        </div>
        
        {!selectedThreadId && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Select a thread from the sidebar or create a new one to start chatting
          </p>
        )}
      </div>
    </div>
  );
} 