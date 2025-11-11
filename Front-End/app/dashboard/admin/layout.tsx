"use client";

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { DashboardFooter } from "@/components/dashboard/DashboardFooter";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { useAdminGuard } from "@/lib/hooks/useAdminGuard";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { isAuthorized, isLoading } = useAdminGuard();

  // Initialiser les notifications temps réel même côté admin
  useNotifications();

  if (isLoading || !isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background lg:flex">
      <AdminSidebar />
      <div className="flex min-h-screen flex-1 flex-col lg:ml-64">
        <main className="flex-1">{children}</main>
        <DashboardFooter />
      </div>
    </div>
  );
}

