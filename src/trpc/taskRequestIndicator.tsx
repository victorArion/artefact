"use client";

import { CircularProgress, Paper, Typography } from "@mui/material";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

export default function TaskRequestIndicator() {
  const isFetching = useIsFetching() > 0;
  const isMutating = useIsMutating() > 0;
  const isActive = isFetching || isMutating;
  const [isVisible, setIsVisible] = useState(false);
  const visibleSince = useRef<number | null>(null);

  useEffect(() => {
    let hideTimeout: number | undefined;

    if (isActive) {
      if (visibleSince.current === null) visibleSince.current = Date.now();
      setIsVisible(true);
    } else if (visibleSince.current !== null) {
      const visibleFor = Date.now() - visibleSince.current;
      hideTimeout = window.setTimeout(() => {
        setIsVisible(false);
        visibleSince.current = null;
      }, Math.max(0, 400 - visibleFor));
    }

    return () => {
      if (hideTimeout !== undefined) window.clearTimeout(hideTimeout);
    };
  }, [isActive]);

  if (!isVisible) return null;

  return (
    <Paper
      role="status"
      aria-label="Carregando tarefas"
      elevation={4}
      sx={{
        position: "fixed",
        right: 2,
        bottom: 2,
        zIndex: (theme) => theme.zIndex.tooltip,
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 2,
        py: 1.25,
        borderRadius: 999,
      }}
    >
      <CircularProgress size={20} aria-hidden="true" />
      <Typography variant="body2">Carregando</Typography>
    </Paper>
  );
}
