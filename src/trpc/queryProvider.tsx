"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, useContext, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import TaskRequestIndicator from "./taskRequestIndicator";

const TaskListScrollContext = createContext<{ current: number | null } | null>(null);

export default function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const taskListScroll = useRef<number | null>(null);

  return (
    <QueryClientProvider client={queryClient}>
      <TaskListScrollContext.Provider value={taskListScroll}>
        {children}
        <TaskRequestIndicator />
      </TaskListScrollContext.Provider>
    </QueryClientProvider>
  );
}

export function useTaskListScrollRestoration() {
  const position = useContext(TaskListScrollContext);

  useLayoutEffect(() => {
    if (!position) return;

    const rememberScroll = () => {
      position.current = window.scrollY;
    };

    // Wait for the route's layout and scroll handling before restoring the list.
    const frame = window.requestAnimationFrame(() => {
      const navigation = window.performance.getEntriesByType?.("navigation")[0];
      const isReload = navigation && "type" in navigation && navigation.type === "reload";
      if (position.current !== null || isReload) {
        window.scrollTo({ top: position.current ?? 0, behavior: "instant" });
        rememberScroll();
      }
      window.addEventListener("scroll", rememberScroll, { passive: true });
    });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", rememberScroll);
    };
  }, [position]);
}
