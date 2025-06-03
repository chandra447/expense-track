import { hc } from "hono/client";
import type { ApiRoutes } from "@/app/api/[[...route]]/route";

const client = hc<ApiRoutes>('/', {
  fetch: (input: RequestInfo | URL, init?: RequestInit) => {
    return fetch(input, {
      ...init,
      credentials: 'include', 
    });
  },
});

export const api = client.api;