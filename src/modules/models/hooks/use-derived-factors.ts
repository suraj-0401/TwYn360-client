"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatApiError } from "@/lib/api-error";
import { toast } from "@/lib/toast";
import {
  createDerivedFactor,
  deleteDerivedFactor,
  getDerivedFactor,
  listDerivedFactors,
  updateDerivedFactor,
} from "@/services/derived-factor.service";
import type { DerivedFactorDefinitionDto } from "@/types/formula";

type CreateDerivedFactorPayload = {
  slug: string;
  displayName: string;
  description?: string;
  unitCode?: string;
};

type UpdateDerivedFactorPayload = {
  displayName?: string;
  description?: string | null;
  unitCode?: string | null;
  expectedVersion?: number;
};

export function useDerivedFactors(modelId: string) {
  return useQuery({
    queryKey: ["model-derived-factors", modelId],
    queryFn: async () => (await listDerivedFactors(modelId)).data,
    staleTime: 30_000,
  });
}

export function useDerivedFactor(modelId: string, derivedFactorId: string | null) {
  return useQuery({
    queryKey: ["model-derived-factor", modelId, derivedFactorId],
    queryFn: async () =>
      (await getDerivedFactor(modelId, derivedFactorId!)).data,
    enabled: Boolean(derivedFactorId),
    staleTime: 10_000,
  });
}

export function useDerivedFactorMutations(modelId: string) {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["model-derived-factors", modelId] });
    await queryClient.invalidateQueries({ queryKey: ["model-derived-factor", modelId] });
    await queryClient.invalidateQueries({ queryKey: ["formula-by-target", modelId] });
  };

  const createMutation = useMutation({
    mutationFn: async (payload: CreateDerivedFactorPayload) =>
      (await createDerivedFactor(modelId, payload)).data,
    onSuccess: async () => {
      toast.success("Derived factor created");
      await invalidate();
    },
    onError: (err) => {
      toast.error(formatApiError(err).message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      derivedFactorId,
      payload,
    }: {
      derivedFactorId: string;
      payload: UpdateDerivedFactorPayload;
    }) => (await updateDerivedFactor(modelId, derivedFactorId, payload)).data,
    onSuccess: async () => {
      toast.success("Derived factor updated");
      await invalidate();
    },
    onError: (err) => {
      toast.error(formatApiError(err).message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (derivedFactorId: string) => {
      await deleteDerivedFactor(modelId, derivedFactorId);
    },
    onSuccess: async () => {
      toast.success("Derived factor deleted");
      await invalidate();
    },
    onError: (err) => {
      toast.error(formatApiError(err).message);
    },
  });

  return { createMutation, updateMutation, deleteMutation, invalidate };
}

export type { DerivedFactorDefinitionDto, CreateDerivedFactorPayload, UpdateDerivedFactorPayload };
