"use client";

import { useChat } from '@ai-sdk/react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Bot, 
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
  Code,
  ChevronRight
} from "lucide-react";

export function VercelChatInterface() {
  const { 
    messages, 
    input, 
    handleInputChange, 
    handleSubmit, 
    status,
    stop,
    error 
  } = useChat({
    api: '/api/chat',
  });

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto relative">
      {/* Header - sticky below navbar */}
      <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h1 className="font-semibold">AI Expense Assistant</h1>
          <Badge variant="secondary" className="text-xs">Hono + Vercel AI SDK</Badge>
        </div>
        {status === 'streaming' && (
          <Badge variant="outline" className="animate-pulse">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Streaming
          </Badge>
        )}
      </div>

      {/* Messages - scrollable area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4 pb-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-12">
                <Bot className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Start a conversation with your AI expense assistant!</p>
                <p className="text-xs mt-1 opacity-75">Try: &quot;Add $25 for groceries&quot; or &quot;Show my expense summary&quot;</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div key={message.id} className="space-y-2">
                {/* User message */}
                {message.role === "user" && (
                  <div className="flex justify-end">
                    <div className="max-w-[70%] bg-primary text-primary-foreground rounded-2xl px-4 py-2">
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.createdAt || Date.now()).toLocaleTimeString()}
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
                          const result = tool.result as { message?: string };
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
                            {new Date(message.createdAt || Date.now()).toLocaleTimeString()}
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
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.createdAt || Date.now()).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
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
      
      {/* Input area - sticky to bottom */}
      <div className="sticky bottom-0 z-10 border-t p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="relative">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Textarea
                value={input}
                onChange={handleInputChange}
                placeholder="Type your message here..."
                disabled={status !== 'ready'}
                className="pr-4 pl-4 pt-4 pb-14 rounded-2xl border-2 focus:border-primary resize-none min-h-[100px]"
                rows={3}
              />
              
              {/* Integrated action buttons */}
              <div className="absolute bottom-4 left-4 flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleInputChange({ target: { value: "Show me my expense summary" } } as React.ChangeEvent<HTMLTextAreaElement>)}
                  disabled={status !== 'ready'}
                  className="h-7 px-2 text-xs rounded-lg hover:bg-muted"
                >
                  <Receipt className="h-3 w-3 mr-1" />
                  Summary
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleInputChange({ target: { value: "Add $15 for lunch" } } as React.ChangeEvent<HTMLTextAreaElement>)}
                  disabled={status !== 'ready'}
                  className="h-7 px-2 text-xs rounded-lg hover:bg-muted"
                >
                  <DollarSign className="h-3 w-3 mr-1" />
                  Add Expense
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleInputChange({ target: { value: "Find expenses over $20" } } as React.ChangeEvent<HTMLTextAreaElement>)}
                  disabled={status !== 'ready'}
                  className="h-7 px-2 text-xs rounded-lg hover:bg-muted"
                >
                  <Search className="h-3 w-3 mr-1" />
                  Search
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleInputChange({ target: { value: "Give me insights for this month" } } as React.ChangeEvent<HTMLTextAreaElement>)}
                  disabled={status !== 'ready'}
                  className="h-7 px-2 text-xs rounded-lg hover:bg-muted"
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Insights
                </Button>
              </div>
            </div>
            
            {status === 'streaming' ? (
              <Button
                type="button"
                onClick={stop}
                size="icon"
                variant="destructive"
                className="rounded-2xl"
              >
                <StopCircle className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={!input.trim() || status !== 'ready'}
                size="icon"
                className="rounded-2xl"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </form>
        </div>
        
        {/* Status */}
        <div className="mt-3 text-xs text-muted-foreground text-center">
          {status === 'streaming' && 'AI is processing your request...'}
          {status === 'submitted' && 'Message sent, waiting for response...'}
        </div>
      </div>
    </div>
  );
} 