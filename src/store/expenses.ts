import { atom } from 'jotai';
import { api } from '@/lib/api';

// Types
export interface ExpenseTag {
  id: number;
  name: string;
}

export interface Expense {
  id: number;
  title: string;
  amount: number;
  expenseTags: ExpenseTag[];
  createdAt?: string;
}

export interface Tag {
  id: number;
  tagName: string;
  userId: string;
  createdAt: string;
}

export interface ExpensesResponse {
  success: boolean;
  expenses: Expense[];
  count: number;
}

export interface TagsResponse {
  success: boolean;
  tags: Tag[];
  count: number;
}

// Base atoms for storing data
export const expensesAtom = atom<Expense[]>([]);
export const tagsAtom = atom<Tag[]>([]);
export const expensesLoadingAtom = atom<boolean>(false);
export const tagsLoadingAtom = atom<boolean>(false);
export const expensesErrorAtom = atom<string | null>(null);
export const tagsErrorAtom = atom<string | null>(null);

// Computed atoms for statistics
export const totalExpensesAtom = atom((get) => {
  const expenses = get(expensesAtom);
  return expenses.reduce((total, expense) => total + expense.amount, 0);
});

export const expensesCountAtom = atom((get) => {
  const expenses = get(expensesAtom);
  return expenses.length;
});

export const tagsCountAtom = atom((get) => {
  const tags = get(tagsAtom);
  return tags.length;
});

// Action atoms for fetching data
export const fetchExpensesAtom = atom(
  null,
  async (get, set) => {
    set(expensesLoadingAtom, true);
    set(expensesErrorAtom, null);
    
    try {
      const res = await api.expenses.$get();
      if (!res.ok) {
        throw new Error('Failed to fetch expenses');
      }
      const data: ExpensesResponse = await res.json();
      set(expensesAtom, data.expenses);
    } catch (error) {
      set(expensesErrorAtom, error instanceof Error ? error.message : 'Unknown error');
    } finally {
      set(expensesLoadingAtom, false);
    }
  }
);

export const fetchTagsAtom = atom(
  null,
  async (get, set) => {
    set(tagsLoadingAtom, true);
    set(tagsErrorAtom, null);
    
    try {
      const res = await api.tags.$get();
      if (!res.ok) {
        throw new Error('Failed to fetch tags');
      }
      const data: TagsResponse = await res.json();
      set(tagsAtom, data.tags);
    } catch (error) {
      set(tagsErrorAtom, error instanceof Error ? error.message : 'Unknown error');
    } finally {
      set(tagsLoadingAtom, false);
    }
  }
);

// Action atoms for creating data
export const createExpenseAtom = atom(
  null,
  async (get, set, expense: { title: string; amount: number; tagIds: number[]; createdAt?: string }) => {
    try {
      const res = await api.expenses.$post({
        json: expense,
      });
      if (!res.ok) {
        throw new Error('Failed to create expense');
      }
      const data = await res.json();
      
      // Refresh expenses after creation
      set(fetchExpensesAtom);
      return data;
    } catch (error) {
      throw error;
    }
  }
);

export const createTagAtom = atom(
  null,
  async (get, set, tag: { tagName: string }) => {
    try {
      const res = await api.tags.$post({
        json: tag,
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error((errorData as any).error || 'Failed to create tag');
      }
      const data = await res.json();
      
      // Refresh tags after creation
      set(fetchTagsAtom);
      return data;
    } catch (error) {
      throw error;
    }
  }
);

export const updateTagAtom = atom(
  null,
  async (get, set, { id, tagName }: { id: number; tagName: string }) => {
    try {
      const res = await api.tags[':id'].$put({
        param: { id: id.toString() },
        json: { tagName },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error((errorData as any).error || 'Failed to update tag');
      }
      const data = await res.json();
      
      // Refresh tags and expenses after update (in case tag names are shown in expenses)
      set(fetchTagsAtom);
      set(fetchExpensesAtom);
      return data;
    } catch (error) {
      throw error;
    }
  }
);

export const deleteTagAtom = atom(
  null,
  async (get, set, tagId: number) => {
    try {
      const res = await api.tags[':id'].$delete({
        param: { id: tagId.toString() },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error((errorData as any).error || 'Failed to delete tag');
      }
      const data = await res.json();
      
      // Refresh tags and expenses after deletion (expenses may have had this tag)
      set(fetchTagsAtom);
      set(fetchExpensesAtom);
      return data;
    } catch (error) {
      throw error;
    }
  }
);

export const updateExpenseAtom = atom(
  null,
  async (get, set, { id, title, amount, tagIds, createdAt }: { id: number; title: string; amount: number; tagIds: number[]; createdAt?: string }) => {
    try {
      const res = await (api.expenses as any)[':id'].$put({
        param: { id: id.toString() },
        json: { title, amount, tagIds, createdAt },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error((errorData as any).error || 'Failed to update expense');
      }
      const data = await res.json();
      
      // Refresh expenses after update
      set(fetchExpensesAtom);
      return data;
    } catch (error) {
      throw error;
    }
  }
);

export const deleteExpenseAtom = atom(
  null,
  async (get, set, expenseId: number) => {
    try {
      const res = await (api.expenses as any)[':id'].$delete({
        param: { id: expenseId.toString() },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error((errorData as any).error || 'Failed to delete expense');
      }
      const data = await res.json();
      
      // Refresh expenses after deletion
      set(fetchExpensesAtom);
      return data;
    } catch (error) {
      throw error;
    }
  }
);

// Combined loading state
export const isLoadingAtom = atom((get) => {
  return get(expensesLoadingAtom) || get(tagsLoadingAtom);
});

// Combined error state
export const hasErrorAtom = atom((get) => {
  return get(expensesErrorAtom) !== null || get(tagsErrorAtom) !== null;
}); 