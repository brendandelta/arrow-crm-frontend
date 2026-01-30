"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UniversalDocumentUploader } from "@/components/documents/UniversalDocumentUploader";
import type { DocumentDetail } from "@/lib/documents-api";

interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (doc: DocumentDetail) => void;
}

export function UploadDocumentDialog({
  open,
  onOpenChange,
  onSuccess,
}: UploadDocumentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        <UniversalDocumentUploader
          requireLink
          onSuccess={(doc) => {
            onSuccess(doc);
            onOpenChange(false);
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
