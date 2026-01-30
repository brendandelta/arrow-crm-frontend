"use client";

import { useState, useEffect } from "react";
import { Building2, FolderKanban, CheckSquare, ChevronDown, Check, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  type AttachmentType,
  type DealOption,
  type ProjectOption,
  fetchDeals,
  fetchProjects,
  getAttachmentLabel,
} from "@/lib/tasks-api";

const ATTACHMENT_ICONS: Record<AttachmentType, React.ElementType> = {
  general: CheckSquare,
  deal: Building2,
  project: FolderKanban,
};

const ATTACHMENT_COLORS: Record<AttachmentType, string> = {
  general: "text-slate-500",
  deal: "text-blue-600",
  project: "text-purple-600",
};

interface AttachmentValue {
  type: AttachmentType;
  dealId?: number;
  projectId?: number;
  // For polymorphic pattern
  taskableType?: string;
  taskableId?: number;
}

interface AttachmentSelectorProps {
  value: AttachmentValue;
  onChange: (value: AttachmentValue) => void;
  deals?: DealOption[];
  projects?: ProjectOption[];
  disabled?: boolean;
  size?: "sm" | "default";
  variant?: "default" | "ghost" | "minimal";
  usePolymorphicForProjects?: boolean; // Use taskableType/taskableId for projects
}

export function AttachmentSelector({
  value,
  onChange,
  deals: providedDeals,
  projects: providedProjects,
  disabled = false,
  size = "default",
  variant = "default",
  usePolymorphicForProjects = false,
}: AttachmentSelectorProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"type" | "deal" | "project">("type");
  const [deals, setDeals] = useState<DealOption[]>(providedDeals || []);
  const [projects, setProjects] = useState<ProjectOption[]>(providedProjects || []);
  const [loading, setLoading] = useState(false);

  // Load deals and projects when needed
  useEffect(() => {
    if (open && step === "deal" && deals.length === 0 && !providedDeals) {
      setLoading(true);
      fetchDeals()
        .then(setDeals)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [open, step, deals.length, providedDeals]);

  useEffect(() => {
    if (open && step === "project" && projects.length === 0 && !providedProjects) {
      setLoading(true);
      fetchProjects()
        .then(setProjects)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [open, step, projects.length, providedProjects]);

  // Reset step when popover closes
  useEffect(() => {
    if (!open) {
      setStep("type");
    }
  }, [open]);

  const Icon = ATTACHMENT_ICONS[value.type];
  const iconColor = ATTACHMENT_COLORS[value.type];

  // Get display name
  const getDisplayName = () => {
    if (value.type === "deal" && value.dealId) {
      const deal = deals.find((d) => d.id === value.dealId);
      return deal?.name || "Deal";
    }
    if (value.type === "project" && (value.projectId || value.taskableId)) {
      const projectId = value.projectId || value.taskableId;
      const project = projects.find((p) => p.id === projectId);
      return project?.name || "Project";
    }
    return getAttachmentLabel(value.type);
  };

  const handleTypeSelect = (type: AttachmentType) => {
    if (type === "general") {
      onChange({ type: "general" });
      setOpen(false);
    } else if (type === "deal") {
      setStep("deal");
    } else if (type === "project") {
      setStep("project");
    }
  };

  const handleDealSelect = (dealId: number) => {
    onChange({ type: "deal", dealId });
    setOpen(false);
  };

  const handleProjectSelect = (projectId: number) => {
    if (usePolymorphicForProjects) {
      onChange({ type: "project", taskableType: "Project", taskableId: projectId });
    } else {
      onChange({ type: "project", projectId });
    }
    setOpen(false);
  };

  const buttonClasses = cn(
    "justify-start font-normal",
    size === "sm" ? "h-8 text-sm" : "h-9",
    variant === "ghost" && "hover:bg-slate-100",
    variant === "minimal" && "border-0 shadow-none hover:bg-slate-50 px-2"
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={variant === "default" ? "outline" : "ghost"}
          disabled={disabled}
          className={buttonClasses}
        >
          <Icon className={cn("h-4 w-4 mr-2", iconColor)} />
          <span className="truncate">{getDisplayName()}</span>
          <ChevronDown className="h-3.5 w-3.5 ml-auto text-slate-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        {step === "type" && (
          <div className="p-1">
            <button
              onClick={() => handleTypeSelect("general")}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-slate-100 transition-colors",
                value.type === "general" && "bg-slate-50"
              )}
            >
              <CheckSquare className="h-4 w-4 text-slate-500" />
              <span className="flex-1 text-left">Get Shit Done</span>
              {value.type === "general" && <Check className="h-4 w-4 text-cyan-600" />}
            </button>
            <button
              onClick={() => handleTypeSelect("deal")}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-slate-100 transition-colors",
                value.type === "deal" && "bg-slate-50"
              )}
            >
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="flex-1 text-left">Attach to Deal</span>
              <ChevronDown className="h-4 w-4 text-slate-400 -rotate-90" />
            </button>
            <button
              onClick={() => handleTypeSelect("project")}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-slate-100 transition-colors",
                value.type === "project" && "bg-slate-50"
              )}
            >
              <FolderKanban className="h-4 w-4 text-purple-600" />
              <span className="flex-1 text-left">Attach to Project</span>
              <ChevronDown className="h-4 w-4 text-slate-400 -rotate-90" />
            </button>
          </div>
        )}

        {step === "deal" && (
          <Command>
            <div className="flex items-center border-b px-3">
              <button
                onClick={() => setStep("type")}
                className="text-xs text-slate-500 hover:text-slate-700 mr-2"
              >
                Back
              </button>
              <CommandInput placeholder="Search deals..." className="h-9" />
            </div>
            <CommandList>
              {loading ? (
                <div className="py-6 text-center">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-slate-400" />
                </div>
              ) : (
                <>
                  <CommandEmpty>No deals found.</CommandEmpty>
                  <CommandGroup>
                    {deals.map((deal) => (
                      <CommandItem
                        key={deal.id}
                        value={deal.name}
                        onSelect={() => handleDealSelect(deal.id)}
                        className="flex items-center gap-2"
                      >
                        <Building2 className="h-4 w-4 text-blue-600" />
                        <div className="flex-1 truncate">
                          <div className="font-medium truncate">{deal.name}</div>
                          {deal.company && (
                            <div className="text-xs text-slate-500 truncate">{deal.company}</div>
                          )}
                        </div>
                        {value.dealId === deal.id && (
                          <Check className="h-4 w-4 text-cyan-600" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        )}

        {step === "project" && (
          <Command>
            <div className="flex items-center border-b px-3">
              <button
                onClick={() => setStep("type")}
                className="text-xs text-slate-500 hover:text-slate-700 mr-2"
              >
                Back
              </button>
              <CommandInput placeholder="Search projects..." className="h-9" />
            </div>
            <CommandList>
              {loading ? (
                <div className="py-6 text-center">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-slate-400" />
                </div>
              ) : (
                <>
                  <CommandEmpty>No projects found.</CommandEmpty>
                  <CommandGroup>
                    {projects.map((project) => {
                      const isSelected = value.projectId === project.id || value.taskableId === project.id;
                      return (
                        <CommandItem
                          key={project.id}
                          value={project.name}
                          onSelect={() => handleProjectSelect(project.id)}
                          className="flex items-center gap-2"
                        >
                          <FolderKanban className="h-4 w-4 text-purple-600" />
                          <div className="flex-1 truncate">
                            <div className="font-medium truncate">{project.name}</div>
                            {project.status && (
                              <div className="text-xs text-slate-500 capitalize">{project.status}</div>
                            )}
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-cyan-600" />}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  );
}

// Compact badge for display
interface AttachmentBadgeProps {
  type: AttachmentType;
  name?: string | null;
  onClick?: () => void;
  size?: "sm" | "default";
}

export function AttachmentBadge({ type, name, onClick, size = "default" }: AttachmentBadgeProps) {
  const Icon = ATTACHMENT_ICONS[type];
  const iconColor = ATTACHMENT_COLORS[type];
  const displayName = name || getAttachmentLabel(type);

  // Don't show badge for general tasks
  if (type === "general") return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors",
        size === "sm" ? "px-1.5 py-0.5 text-xs" : "px-2 py-0.5 text-xs"
      )}
    >
      <Icon className={cn(iconColor, size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
      <span className="text-slate-600 truncate max-w-[100px]">{displayName}</span>
    </button>
  );
}
