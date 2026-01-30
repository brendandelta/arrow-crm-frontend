"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Legacy route redirect.
 * /tasks/by-deal now redirects to /tasks with Grouped mode and deal grouping selected.
 */
export default function TasksByDealRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main tasks page with Grouped tab and deal grouping
    router.replace("/tasks?tab=grouped&groupBy=deal");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-slate-500">Redirecting...</div>
    </div>
  );
}
