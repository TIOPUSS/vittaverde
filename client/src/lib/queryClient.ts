import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  method: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {
    'X-Requested-With': 'XMLHttpRequest',
  };
  
  if (data) {
    headers['Content-Type'] = 'application/json';
  }

  // For Replit compatibility, send user ID in header if available in localStorage
  const storedUser = localStorage.getItem('vittaverde_user');
  const isLoggedIn = localStorage.getItem('vittaverde_logged_in') === 'true';
  
  if (storedUser && isLoggedIn) {
    try {
      const user = JSON.parse(storedUser);
      if (user && user.id) {
        headers['X-User-Id'] = user.id;
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }

  const res = await fetch(url, {
    method,
    headers,
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
    const headers: Record<string, string> = {};
    
    // For Replit compatibility, send user ID in header if available in localStorage
    const storedUser = localStorage.getItem('vittaverde_user');
    const isLoggedIn = localStorage.getItem('vittaverde_logged_in') === 'true';
    
    if (storedUser && isLoggedIn) {
      try {
        const user = JSON.parse(storedUser);
        if (user && user.id) {
          headers['X-User-Id'] = user.id;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }

    const res = await fetch(queryKey.join("/") as string, {
      headers,
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
      staleTime: 0, // Changed from Infinity to 0 - always fetch fresh data
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
