import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import QueryProvider from "@/trpc/queryProvider";

export const metadata: Metadata = {
  title: "Artefact",
  description: "Um gerenciador de tarefas simples",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <AppRouterCacheProvider>
          <QueryProvider>{children}</QueryProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
