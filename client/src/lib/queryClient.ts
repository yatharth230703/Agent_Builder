import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { supabase } from "./supabase";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Get Supabase token with a retry mechanism
  let { data: { session } } = await supabase.auth.getSession();
  
  // If no session, try refreshing once
  if (!session) {
    console.log('No session found, attempting to refresh...');
    await supabase.auth.refreshSession();
    const refreshResult = await supabase.auth.getSession();
    session = refreshResult.data.session;
  }
  
  const token = session?.access_token;
  
  console.log('API Request to:', url);
  console.log('API Request - Session exists:', !!session);
  console.log('API Request - Token exists:', !!token);
  console.log('API Request - User:', session?.user?.email);
  if (token) {
    console.log('API Request - Token preview:', token.substring(0, 20) + '...');
  } else {
    console.error('NO TOKEN AVAILABLE - This will cause 401 error');
  }
  
  const res = await fetch(url, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get Supabase token instead of localStorage token
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    const res = await fetch(queryKey[0] as string, {
      headers: {
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      },
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
