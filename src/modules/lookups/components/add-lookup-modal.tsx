"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LoadingButton } from "@/components/feedback/loaders/loading-button";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createLookupCollectionValue } from "@/modules/lookups/utils/lookup-collection-mutations";
import { collectionValuesQueryKey } from "../hooks/use-collection-values";
import { lookupQueryKey } from "../hooks/lookup-query-key";

type AddLookupModalProps = {
  typeCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adminKey?: string;
  onCreated?: (code: string) => void;
};

export function AddLookupModal({
  typeCode,
  open,
  onOpenChange,
  adminKey,
  onCreated,
}: AddLookupModalProps) {
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: async () => {
      const payload = { code: code.trim(), label: label.trim() };
      return createLookupCollectionValue(typeCode, payload, adminKey);
    },
    onSuccess: async () => {
      const createdCode = code.trim();
      await queryClient.invalidateQueries({
        queryKey: collectionValuesQueryKey(typeCode),
      });
      await queryClient.invalidateQueries({
        queryKey: lookupQueryKey(typeCode),
      });
      setCode("");
      setLabel("");
      setError(null);
      onOpenChange(false);
      onCreated?.(createdCode);
      toast.success("Option added");
    },
    onError: (err: Error) => {
      setError(err.message);
      toast.error(err.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add lookup value</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="lookup-code">Code</Label>
            <Input
              id="lookup-code"
              placeholder="microbiome"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="lookup-label">Label</Label>
            <Input
              id="lookup-label"
              placeholder="Microbiome"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <LoadingButton
            disabled={!code.trim() || !label.trim()}
            loading={mutation.isPending}
            loadingText="Adding..."
            onClick={() => mutation.mutate()}
          >
            Add
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
