import { atom } from 'jotai';
import { atomWithQuery, atomWithMutation, queryClientAtom } from 'jotai-tanstack-query';
import { api } from '@/lib/api';

// Types
export interface ChatThread {
  id: string;
  title: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export interface ThreadsResponse {
  success: boolean;
  threads: ChatThread[];
  count: number;
}

export interface MessagesResponse {
  success: boolean;
  messages: ChatMessage[];
  count: number;
}

export interface CreateThreadResponse {
  success: boolean;
  thread: ChatThread;
  message: string;
}

// Base atoms for UI state
export const selectedThreadIdAtom = atom<string | null>(null);

// Query functions
const fetchThreads = async (): Promise<ThreadsResponse> => {
  const res = await api.threads.$get();
  if (!res.ok) {
    throw new Error('Failed to fetch threads');
  }
  return await res.json();
};

const fetchMessages = async (threadId: string): Promise<MessagesResponse> => {
  const res = await api.threads[':threadId'].messages.$get({
    param: { threadId },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch messages');
  }
  return await res.json();
};

const createThread = async (title?: string): Promise<CreateThreadResponse> => {
  const res = await api.threads.$post({
    json: { title },
  });
  if (!res.ok) {
    throw new Error('Failed to create thread');
  }
  return await res.json();
};

const updateThreadTitle = async ({ threadId, title }: { threadId: string; title: string }) => {
  const res = await api.threads[':threadId'].$put({
    param: { threadId },
    json: { title },
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error((errorData as any).error || 'Failed to update thread');
  }
  return await res.json();
};

const deleteThread = async (threadId: string) => {
  const res = await api.threads[':threadId'].$delete({
    param: { threadId },
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error((errorData as any).error || 'Failed to delete thread');
  }
  return await res.json();
};

// Jotai + React Query atoms
export const threadsAtom = atomWithQuery(() => ({
  queryKey: ['threads'],
  queryFn: fetchThreads,
  staleTime: 1000 * 60 * 5, // 5 minutes
}));

export const messagesAtom = atomWithQuery((get) => {
  const selectedThreadId = get(selectedThreadIdAtom);
  return {
    queryKey: selectedThreadId ? ['messages', selectedThreadId] : ['messages', 'empty'],
    queryFn: () => selectedThreadId ? fetchMessages(selectedThreadId) : Promise.resolve({ success: true, messages: [], count: 0 }),
    enabled: !!selectedThreadId,
    staleTime: 1000 * 30, // 30 seconds
  };
});

export const createThreadAtom = atomWithMutation(() => ({
  mutationKey: ['createThread'],
  mutationFn: createThread,
  onSuccess: (data, variables, context) => {
    // The query will be invalidated automatically by React Query
    // No need to return anything from onSuccess
  },
}));

export const updateThreadTitleAtom = atomWithMutation(() => ({
  mutationKey: ['updateThreadTitle'],
  mutationFn: updateThreadTitle,
}));

export const deleteThreadAtom = atomWithMutation(() => ({
  mutationKey: ['deleteThread'],
  mutationFn: deleteThread,
}));

// Computed atoms
export const selectedThreadAtom = atom((get) => {
  const threadsResult = get(threadsAtom);
  const selectedThreadId = get(selectedThreadIdAtom);
  
  if (threadsResult.data?.success && selectedThreadId) {
    return threadsResult.data.threads.find(thread => thread.id === selectedThreadId) || null;
  }
  return null;
});

export const currentMessagesAtom = atom((get) => {
  const messagesResult = get(messagesAtom);
  
  if (messagesResult.data?.success) {
    return messagesResult.data.messages;
  }
  return [];
});

export const threadsCountAtom = atom((get) => {
  const threadsResult = get(threadsAtom);
  
  if (threadsResult.data?.success) {
    return threadsResult.data.threads.length;
  }
  return 0;
});

// Action atom for selecting a thread
export const selectThreadAtom = atom(
  null,
  (get, set, threadId: string | null) => {
    set(selectedThreadIdAtom, threadId);
  }
); 