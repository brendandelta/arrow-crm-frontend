"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil, X, Save, Loader2, Plus, Trash2 } from "lucide-react";
import { MissingDataDropdown, getDealMissingFields, MissingField } from "./MissingDataDropdown";

interface Owner {
  id: number;
  firstName: string;
  lastName: string;
}

interface DealDetailsData {
  stage: string | null;
  confidence: number | null;
  sharePrice: number | null;
  valuation: number | null;
  source: string | null;
  sourceDetail: string | null;
  expectedClose: string | null;
  deadline: string | null;
  tags: string[] | null;
  notes: string | null;
  driveUrl: string | null;
  dataRoomUrl: string | null;
  deckUrl: string | null;
  notionUrl: string | null;
  owner: Owner | null;
}

interface EditableDealDetailsProps {
  deal: DealDetailsData;
  lpMode: boolean;
  onSave: (data: Partial<DealDetailsData>) => Promise<void>;
}

const STAGES = ["sourcing", "diligence", "negotiation", "documentation", "closing"];
const SOURCES = ["inbound", "outbound", "referral", "broker", "network", "conference"];

function formatCurrency(cents: number | null) {
  if (!cents) return null;
  const dollars = cents / 100;
  if (dollars >= 1_000_000_000) {
    return `$${(dollars / 1_000_000_000).toFixed(2)}B`;
  }
  if (dollars >= 1_000_000) {
    return `$${(dollars / 1_000_000).toFixed(2)}M`;
  }
  return `$${dollars.toFixed(2)}`;
}

function parseCurrencyToCents(value: string): number | null {
  if (!value) return null;
  // Remove $ and commas, handle M/B suffixes
  let clean = value.replace(/[$,]/g, "").trim();
  let multiplier = 1;

  if (clean.toLowerCase().endsWith("b")) {
    multiplier = 1_000_000_000;
    clean = clean.slice(0, -1);
  } else if (clean.toLowerCase().endsWith("m")) {
    multiplier = 1_000_000;
    clean = clean.slice(0, -1);
  } else if (clean.toLowerCase().endsWith("k")) {
    multiplier = 1_000;
    clean = clean.slice(0, -1);
  }

  const num = parseFloat(clean);
  if (isNaN(num)) return null;
  return Math.round(num * multiplier * 100);
}

export function EditableDealDetails({ deal, lpMode, onSave }: EditableDealDetailsProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    stage: deal.stage || "",
    confidence: deal.confidence?.toString() || "",
    sharePrice: deal.sharePrice ? (deal.sharePrice / 100).toString() : "",
    valuation: deal.valuation ? formatCurrency(deal.valuation)?.replace("$", "") || "" : "",
    source: deal.source || "",
    sourceDetail: deal.sourceDetail || "",
    expectedClose: deal.expectedClose?.split("T")[0] || "",
    deadline: deal.deadline?.split("T")[0] || "",
    tags: deal.tags || [],
    notes: deal.notes || "",
    driveUrl: deal.driveUrl || "",
    dataRoomUrl: deal.dataRoomUrl || "",
    deckUrl: deal.deckUrl || "",
    notionUrl: deal.notionUrl || "",
    newTag: "",
  });

  const missingFields = getDealMissingFields(deal);

  const handleEdit = () => {
    setFormData({
      stage: deal.stage || "",
      confidence: deal.confidence?.toString() || "",
      sharePrice: deal.sharePrice ? (deal.sharePrice / 100).toString() : "",
      valuation: deal.valuation ? formatCurrency(deal.valuation)?.replace("$", "") || "" : "",
      source: deal.source || "",
      sourceDetail: deal.sourceDetail || "",
      expectedClose: deal.expectedClose?.split("T")[0] || "",
      deadline: deal.deadline?.split("T")[0] || "",
      tags: deal.tags || [],
      notes: deal.notes || "",
      driveUrl: deal.driveUrl || "",
      dataRoomUrl: deal.dataRoomUrl || "",
      deckUrl: deal.deckUrl || "",
      notionUrl: deal.notionUrl || "",
      newTag: "",
    });
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        stage: formData.stage || null,
        confidence: formData.confidence ? parseInt(formData.confidence) : null,
        sharePrice: formData.sharePrice ? Math.round(parseFloat(formData.sharePrice) * 100) : null,
        valuation: parseCurrencyToCents(formData.valuation),
        source: formData.source || null,
        sourceDetail: formData.sourceDetail || null,
        expectedClose: formData.expectedClose || null,
        deadline: formData.deadline || null,
        tags: formData.tags.length > 0 ? formData.tags : null,
        notes: formData.notes || null,
        driveUrl: formData.driveUrl || null,
        dataRoomUrl: formData.dataRoomUrl || null,
        deckUrl: formData.deckUrl || null,
        notionUrl: formData.notionUrl || null,
      });
      setEditing(false);
    } catch (err) {
      console.error("Failed to save:", err);
    }
    setSaving(false);
  };

  const addTag = () => {
    if (formData.newTag.trim() && !formData.tags.includes(formData.newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, formData.newTag.trim()],
        newTag: "",
      });
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  const handleMissingFieldClick = (fieldKey: string) => {
    handleEdit();
    // Focus on the field after a short delay
    setTimeout(() => {
      const element = document.getElementById(`deal-field-${fieldKey}`);
      if (element) {
        element.focus();
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  if (editing) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Deal Details</CardTitle>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Stage */}
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Stage</label>
              <select
                id="deal-field-stage"
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <option value="">Select stage...</option>
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Confidence */}
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Confidence (%)</label>
              <input
                id="deal-field-confidence"
                type="number"
                min="0"
                max="100"
                value={formData.confidence}
                onChange={(e) => setFormData({ ...formData, confidence: e.target.value })}
                className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                placeholder="0-100"
              />
            </div>

            {/* Share Price */}
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Share Price ($)</label>
              <input
                id="deal-field-sharePrice"
                type="number"
                step="0.01"
                value={formData.sharePrice}
                onChange={(e) => setFormData({ ...formData, sharePrice: e.target.value })}
                className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                placeholder="0.00"
              />
            </div>

            {/* Valuation */}
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Valuation</label>
              <input
                id="deal-field-valuation"
                type="text"
                value={formData.valuation}
                onChange={(e) => setFormData({ ...formData, valuation: e.target.value })}
                className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                placeholder="e.g., 10B, 500M"
              />
            </div>

            {/* Expected Close */}
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Expected Close</label>
              <input
                id="deal-field-expectedClose"
                type="date"
                value={formData.expectedClose}
                onChange={(e) => setFormData({ ...formData, expectedClose: e.target.value })}
                className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Deadline</label>
              <input
                id="deal-field-deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>

            {/* Source */}
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Source</label>
              <select
                id="deal-field-source"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <option value="">Select source...</option>
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Source Detail */}
            {formData.source && (
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Source Detail</label>
                <input
                  type="text"
                  value={formData.sourceDetail}
                  onChange={(e) => setFormData({ ...formData, sourceDetail: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                  placeholder="Additional source details..."
                />
              </div>
            )}

            {/* URLs */}
            <div className="pt-2 border-t">
              <h4 className="text-sm font-medium mb-3">Links</h4>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Google Drive</label>
                  <input
                    id="deal-field-driveUrl"
                    type="url"
                    value={formData.driveUrl}
                    onChange={(e) => setFormData({ ...formData, driveUrl: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                    placeholder="https://drive.google.com/..."
                  />
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Data Room</label>
                  <input
                    id="deal-field-dataRoomUrl"
                    type="url"
                    value={formData.dataRoomUrl}
                    onChange={(e) => setFormData({ ...formData, dataRoomUrl: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Deck</label>
                  <input
                    id="deal-field-deckUrl"
                    type="url"
                    value={formData.deckUrl}
                    onChange={(e) => setFormData({ ...formData, deckUrl: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Notion</label>
                  <input
                    type="url"
                    value={formData.notionUrl}
                    onChange={(e) => setFormData({ ...formData, notionUrl: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                    placeholder="https://notion.so/..."
                  />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="pt-2 border-t">
              <label className="block text-sm text-muted-foreground mb-1">Tags</label>
              <div className="flex flex-wrap gap-1 mb-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs flex items-center gap-1">
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  id="deal-field-tags"
                  type="text"
                  value={formData.newTag}
                  onChange={(e) => setFormData({ ...formData, newTag: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  className="flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                  placeholder="Add tag..."
                />
                <button
                  onClick={addTag}
                  className="px-3 py-2 text-sm border rounded-md hover:bg-slate-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Internal Notes */}
            {!lpMode && (
              <div className="pt-2 border-t">
                <label className="block text-sm text-muted-foreground mb-1">Internal Notes</label>
                <textarea
                  id="deal-field-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 min-h-[100px]"
                  placeholder="Internal notes..."
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Deal Details</CardTitle>
        <div className="flex items-center gap-2">
          <MissingDataDropdown
            missingFields={missingFields}
            onAddClick={handleMissingFieldClick}
          />
          <button
            onClick={handleEdit}
            className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="space-y-3 text-sm">
          {deal.stage && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Stage</dt>
              <dd className="font-medium">{deal.stage.charAt(0).toUpperCase() + deal.stage.slice(1)}</dd>
            </div>
          )}
          {deal.confidence && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Confidence</dt>
              <dd className="font-medium">{deal.confidence}%</dd>
            </div>
          )}
          {deal.sharePrice && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Share Price</dt>
              <dd className="font-medium">${(deal.sharePrice / 100).toFixed(2)}</dd>
            </div>
          )}
          {deal.valuation && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Valuation</dt>
              <dd className="font-medium">{formatCurrency(deal.valuation)}</dd>
            </div>
          )}
          {deal.expectedClose && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Expected Close</dt>
              <dd className="font-medium">
                {new Date(deal.expectedClose).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </dd>
            </div>
          )}
          {deal.deadline && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Deadline</dt>
              <dd className="font-medium">
                {new Date(deal.deadline).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </dd>
            </div>
          )}
          {deal.source && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Source</dt>
              <dd className="font-medium">
                {deal.source.charAt(0).toUpperCase() + deal.source.slice(1)}
                {deal.sourceDetail && ` - ${deal.sourceDetail}`}
              </dd>
            </div>
          )}

          {/* Links */}
          {(deal.driveUrl || deal.dataRoomUrl || deal.deckUrl || deal.notionUrl) && (
            <div className="pt-2 border-t">
              <dt className="text-muted-foreground mb-2">Links</dt>
              <dd className="flex flex-wrap gap-2">
                {deal.driveUrl && (
                  <a
                    href={deal.driveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Drive
                  </a>
                )}
                {deal.dataRoomUrl && (
                  <a
                    href={deal.dataRoomUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Data Room
                  </a>
                )}
                {deal.deckUrl && (
                  <a
                    href={deal.deckUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Deck
                  </a>
                )}
                {deal.notionUrl && (
                  <a
                    href={deal.notionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Notion
                  </a>
                )}
              </dd>
            </div>
          )}

          {deal.tags && deal.tags.length > 0 && (
            <div className="pt-2 border-t">
              <dt className="text-muted-foreground mb-1">Tags</dt>
              <dd className="flex flex-wrap gap-1">
                {deal.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </dd>
            </div>
          )}
        </dl>

        {!lpMode && deal.notes && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm text-muted-foreground mb-2">Internal Notes</h4>
            <p className="text-sm whitespace-pre-wrap">{deal.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
