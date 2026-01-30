"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Legacy route redirect.
 * /tasks/by-project now redirects to /tasks with Grouped mode and project grouping selected.
 */
export default function TasksByProjectRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main tasks page with Grouped tab and project grouping
    router.replace("/tasks?tab=grouped&groupBy=project");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-slate-500">Redirecting...</div>
    </div>
  );
}
