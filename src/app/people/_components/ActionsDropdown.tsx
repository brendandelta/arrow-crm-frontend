"use client";

import { useState, useEffect, useRef } from "react";
import {
  Mail,
  Copy,
  ChevronDown,
  Flame,
  Trash2,
  FileSpreadsheet,
  Phone,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

export interface ActionsPerson {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  org: string | null;
  title: string | null;
  warmth: number;
  source: string | null;
}

interface ActionsDropdownProps {
  selectedPeople: ActionsPerson[];
  onClearSelection: () => void;
  onBulkUpdate: (updates: Partial<ActionsPerson>) => void;
}

export function ActionsDropdown({ selectedPeople, onClearSelection, onBulkUpdate }: ActionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  const emails = selectedPeople.filter(p => p.email).map(p => p.email!);
  const phones = selectedPeople.filter(p => p.phone).map(p => p.phone!);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveSubmenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEmailAll = () => {
    if (emails.length > 0) {
      window.location.href = `mailto:${emails.join(",")}`;
      addToast({
        title: "Opening email client",
        description: `Composing email to ${emails.length} recipient${emails.length > 1 ? "s" : ""}`,
        type: "success",
        duration: 3000,
      });
      setIsOpen(false);
    }
  };

  const handleCopyEmails = async () => {
    if (emails.length > 0) {
      await navigator.clipboard.writeText(emails.join("; "));
      addToast({
        title: "Emails copied",
        description: `${emails.length} email addresses copied to clipboard`,
        type: "success",
        duration: 3000,
      });
      setIsOpen(false);
    }
  };

  const handleCopyPhones = async () => {
    if (phones.length > 0) {
      await navigator.clipboard.writeText(phones.join("\n"));
      addToast({
        title: "Phone numbers copied",
        description: `${phones.length} phone numbers copied to clipboard`,
        type: "success",
        duration: 3000,
      });
      setIsOpen(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ["First Name", "Last Name", "Email", "Phone", "Organization", "Title", "Warmth", "Source"];
    const rows = selectedPeople.map(p => [
      p.firstName,
      p.lastName,
      p.email || "",
      p.phone || "",
      p.org || "",
      p.title || "",
      ["Cold", "Warm", "Hot", "Champion"][p.warmth],
      p.source || ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `people-export-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    addToast({
      title: "Export complete",
      description: `${selectedPeople.length} contacts exported to CSV`,
      type: "success",
      duration: 3000,
    });
    setIsOpen(false);
  };

  const handleBulkWarmthChange = async (warmth: number) => {
    try {
      const ids = selectedPeople.map(p => p.id);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/people/bulk_update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, updates: { warmth } }),
      });

      if (response.ok) {
        onBulkUpdate({ warmth });
        addToast({
          title: "Warmth updated",
          description: `Updated warmth for ${selectedPeople.length} contacts`,
          type: "success",
          duration: 3000,
        });
      } else {
        throw new Error("Failed to update");
      }
    } catch (error) {
      addToast({
        title: "Update failed",
        description: "Could not update warmth. Please try again.",
        type: "error",
        duration: 5000,
      });
    }
    setIsOpen(false);
    setActiveSubmenu(null);
  };

  const handleBulkDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedPeople.length} contact${selectedPeople.length > 1 ? "s" : ""}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const ids = selectedPeople.map(p => p.id);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/people/bulk_delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });

      if (response.ok) {
        addToast({
          title: "Contacts deleted",
          description: `${selectedPeople.length} contact${selectedPeople.length > 1 ? "s" : ""} deleted`,
          type: "success",
          duration: 3000,
        });
        onClearSelection();
        window.location.reload();
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      addToast({
        title: "Delete failed",
        description: "Could not delete contacts. Please try again.",
        type: "error",
        duration: 5000,
      });
    }
    setIsOpen(false);
  };

  interface MenuItem {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    sublabel?: string;
    onClick?: () => void;
    disabled?: boolean;
    hasSubmenu?: boolean;
    submenuId?: string;
    danger?: boolean;
  }

  interface MenuSection {
    label: string;
    items: MenuItem[];
  }

  const menuSections: MenuSection[] = [
    {
      label: "Communicate",
      items: [
        {
          icon: Mail,
          label: "Send Email",
          sublabel: emails.length > 0 ? `${emails.length} with email` : "No emails",
          onClick: handleEmailAll,
          disabled: emails.length === 0,
        },
        {
          icon: Copy,
          label: "Copy Email Addresses",
          sublabel: emails.length > 0 ? `${emails.length} addresses` : "No emails",
          onClick: handleCopyEmails,
          disabled: emails.length === 0,
        },
        {
          icon: Phone,
          label: "Copy Phone Numbers",
          sublabel: phones.length > 0 ? `${phones.length} numbers` : "No phones",
          onClick: handleCopyPhones,
          disabled: phones.length === 0,
        },
      ],
    },
    {
      label: "Update",
      items: [
        {
          icon: Flame,
          label: "Change Warmth",
          hasSubmenu: true,
          submenuId: "warmth",
        },
      ],
    },
    {
      label: "Export",
      items: [
        {
          icon: FileSpreadsheet,
          label: "Export to CSV",
          sublabel: `${selectedPeople.length} contacts`,
          onClick: handleExportCSV,
        },
      ],
    },
    {
      label: "Danger Zone",
      items: [
        {
          icon: Trash2,
          label: "Delete Selected",
          sublabel: `${selectedPeople.length} contact${selectedPeople.length > 1 ? "s" : ""}`,
          onClick: handleBulkDelete,
          danger: true,
        },
      ],
    },
  ];

  const warmthOptions = [
    { value: 0, label: "Cold", color: "bg-slate-100 text-slate-700" },
    { value: 1, label: "Warm", color: "bg-yellow-100 text-yellow-700" },
    { value: 2, label: "Hot", color: "bg-orange-100 text-orange-700" },
    { value: 3, label: "Champion", color: "bg-green-100 text-green-700" },
  ];

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-blue-50 rounded-lg transition-colors border-2 border-blue-400/60 hover:border-blue-500/80"
      >
        <span>Actions</span>
        <span className="text-slate-400">({selectedPeople.length})</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg border border-slate-200 overflow-hidden z-[100] shadow-lg"
        >
          {/* Selection info */}
          <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {selectedPeople.length} selected
            </span>
            <button
              onClick={() => {
                onClearSelection();
                setIsOpen(false);
              }}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {menuSections.map((section, sectionIndex) => (
              <div key={section.label}>
                {sectionIndex > 0 && <div className="my-1 h-px bg-slate-100" />}
                {section.items.map((item) => (
                  <div key={item.label}>
                    <button
                      onClick={() => {
                        if (item.hasSubmenu) {
                          setActiveSubmenu(activeSubmenu === item.submenuId ? null : item.submenuId || null);
                        } else if (item.onClick && !item.disabled) {
                          item.onClick();
                        }
                      }}
                      disabled={item.disabled}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                        item.disabled
                          ? "opacity-40 cursor-not-allowed"
                          : item.danger
                          ? "hover:bg-red-50"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <item.icon className={`h-4 w-4 flex-shrink-0 ${item.danger ? "text-red-500" : "text-slate-400"}`} />
                      <span className={`text-sm ${item.danger ? "text-red-600" : "text-slate-700"}`}>
                        {item.label}
                      </span>
                      {item.hasSubmenu && (
                        <ChevronDown
                          className={`h-3.5 w-3.5 text-slate-300 ml-auto transition-transform ${
                            activeSubmenu === item.submenuId ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </button>

                    {/* Warmth Submenu */}
                    {item.submenuId === "warmth" && activeSubmenu === "warmth" && (
                      <div className="px-3 pb-2">
                        <div className="grid grid-cols-2 gap-1.5">
                          {warmthOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => handleBulkWarmthChange(option.value)}
                              className="px-2.5 py-1.5 text-xs font-medium rounded border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 transition-colors"
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
