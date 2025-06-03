"use client";

import { ThreadsSidebar } from '@/components/chat/ThreadsSidebar';
import { VercelChatInterface } from '@/components/ai-chat/vercel-chat-interface';

export default function AIChatPage() {
  return (
    <div className="h-[calc(100vh-1rem)] flex">
      <ThreadsSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <VercelChatInterface />
      </div>
    </div>
  );
} 