"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  User,
  Building,
  Landmark,
  FileText,
  CheckSquare,
  Calendar,
  Plus,
  Search,
  ArrowRight,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchResult {
  id: number;
  type: "deal" | "person" | "organization" | "entity" | "document" | "task";
  title: string;
  subtitle?: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  deal: <Briefcase className="h-4 w-4" />,
  person: <User className="h-4 w-4" />,
  organization: <Building className="h-4 w-4" />,
  entity: <Landmark className="h-4 w-4" />,
  document: <FileText className="h-4 w-4" />,
  task: <CheckSquare className="h-4 w-4" />,
};

const typeLabels: Record<string, string> = {
  deal: "Deal",
  person: "Person",
  organization: "Organization",
  entity: "Internal Entity",
  document: "Document",
  task: "Task",
};

const typeRoutes: Record<string, string> = {
  deal: "/deals",
  person: "/people",
  organization: "/organizations",
  entity: "/internal-entities",
  document: "/documents",
  task: "/tasks",
};

const quickActions = [
  {
    id: "create-deal",
    label: "Create Deal",
    icon: <Briefcase className="h-4 w-4" />,
    href: "/deals?action=create",
    shortcut: "D",
  },
  {
    id: "create-task",
    label: "Create Task",
    icon: <CheckSquare className="h-4 w-4" />,
    href: "/tasks?action=create",
    shortcut: "T",
  },
  {
    id: "log-activity",
    label: "Log Activity",
    icon: <Calendar className="h-4 w-4" />,
    href: "/events?action=create",
    shortcut: "A",
  },
  {
    id: "upload-document",
    label: "Upload Document",
    icon: <FileText className="h-4 w-4" />,
    href: "/documents?action=upload",
    shortcut: "U",
  },
];

const navigationItems = [
  { id: "nav-dashboard", label: "Dashboard", href: "/dashboard", icon: <Search className="h-4 w-4" /> },
  { id: "nav-deals", label: "Deals", href: "/deals", icon: <Briefcase className="h-4 w-4" /> },
  { id: "nav-people", label: "People", href: "/people", icon: <User className="h-4 w-4" /> },
  { id: "nav-organizations", label: "Organizations", href: "/organizations", icon: <Building className="h-4 w-4" /> },
  { id: "nav-entities", label: "Internal Entities", href: "/internal-entities", icon: <Landmark className="h-4 w-4" /> },
  { id: "nav-tasks", label: "Tasks", href: "/tasks", icon: <CheckSquare className="h-4 w-4" /> },
  { id: "nav-events", label: "Events", href: "/events", icon: <Calendar className="h-4 w-4" /> },
  { id: "nav-documents", label: "Documents", href: "/documents", icon: <FileText className="h-4 w-4" /> },
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Search handler
  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // Search across multiple endpoints in parallel
      const [dealsRes, peopleRes, orgsRes] = await Promise.allSettled([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/deals?q=${encodeURIComponent(searchQuery)}&limit=5`),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/people?q=${encodeURIComponent(searchQuery)}&limit=5`),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/organizations?q=${encodeURIComponent(searchQuery)}&limit=5`),
      ]);

      const searchResults: SearchResult[] = [];

      // Parse deals
      if (dealsRes.status === "fulfilled" && dealsRes.value.ok) {
        const deals = await dealsRes.value.json();
        const dealsList = Array.isArray(deals) ? deals : deals.deals || [];
        dealsList.slice(0, 5).forEach((deal: any) => {
          searchResults.push({
            id: deal.id,
            type: "deal",
            title: deal.name,
            subtitle: deal.company || deal.stage,
          });
        });
      }

      // Parse people
      if (peopleRes.status === "fulfilled" && peopleRes.value.ok) {
        const people = await peopleRes.value.json();
        const peopleList = Array.isArray(people) ? people : people.people || [];
        peopleList.slice(0, 5).forEach((person: any) => {
          searchResults.push({
            id: person.id,
            type: "person",
            title: `${person.firstName} ${person.lastName}`,
            subtitle: person.org || person.title,
          });
        });
      }

      // Parse organizations
      if (orgsRes.status === "fulfilled" && orgsRes.value.ok) {
        const orgs = await orgsRes.value.json();
        const orgsList = Array.isArray(orgs) ? orgs : orgs.organizations || [];
        orgsList.slice(0, 5).forEach((org: any) => {
          searchResults.push({
            id: org.id,
            type: "organization",
            title: org.name,
            subtitle: org.kind || org.sector,
          });
        });
      }

      setResults(searchResults);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 200);

    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  // Handle selection
  const handleSelect = (href: string) => {
    onOpenChange(false);
    setQuery("");
    router.push(href);
  };

  // Handle result selection
  const handleResultSelect = (result: SearchResult) => {
    const route = typeRoutes[result.type];
    handleSelect(`${route}?id=${result.id}`);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search deals, people, organizations..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {loading ? "Searching..." : "No results found."}
        </CommandEmpty>

        {/* Search Results */}
        {results.length > 0 && (
          <CommandGroup heading="Search Results">
            {results.map((result) => (
              <CommandItem
                key={`${result.type}-${result.id}`}
                onSelect={() => handleResultSelect(result)}
                className="flex items-center gap-3"
              >
                <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  {typeIcons[result.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {result.title}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {typeLabels[result.type]}
                    {result.subtitle && ` · ${result.subtitle}`}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Quick Actions */}
        {!query && (
          <>
            <CommandGroup heading="Quick Actions">
              {quickActions.map((action) => (
                <CommandItem
                  key={action.id}
                  onSelect={() => handleSelect(action.href)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                      {action.icon}
                    </div>
                    <span className="text-sm">{action.label}</span>
                  </div>
                  <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 flex">
                    <span className="text-xs">⌘</span>
                    {action.shortcut}
                  </kbd>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            {/* Navigation */}
            <CommandGroup heading="Go to">
              {navigationItems.map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={() => handleSelect(item.href)}
                  className="flex items-center gap-3"
                >
                  <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <span className="text-sm">{item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

// Hook for keyboard shortcut
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { open, setOpen };
}
