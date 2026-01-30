"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Legacy route redirect.
 * /tasks/my now redirects to /tasks with the "my" view selected.
 */
export default function MyTasksRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main tasks page with My Queue view selected
    router.replace("/tasks?view=my");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-slate-500">Redirecting...</div>
    </div>
  );
}
