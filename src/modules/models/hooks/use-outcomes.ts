"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatApiError } from "@/lib/api-error";
import { toast } from "@/lib/toast";
import {
  createOutcome,
  deleteOutcome,
  getOutcome,
  listOutcomes,
  updateOutcome,
} from "@/services/outcome.service";
import type { OutcomeDefinitionDto } from "@/types/formula";

type CreateOutcomePayload = {
  slug: string;
  displayName: string;
  description?: string;
  unitCode?: string;
};

type UpdateOutcomePayload = {
  displayName?: string;
  description?: string | null;
  unitCode?: string | null;
  expectedVersion?: number;
};

export function useOutcomes(modelId: string) {
  return useQuery({
    queryKey: ["model-outcomes", modelId],
    queryFn: async () => (await listOutcomes(modelId)).data,
    staleTime: 30_000,
  });
}

export function useOutcome(modelId: string, outcomeId: string | null) {
  return useQuery({
    queryKey: ["model-outcome", modelId, outcomeId],
    queryFn: async () => (await getOutcome(modelId, outcomeId!)).data,
    enabled: Boolean(outcomeId),
    staleTime: 10_000,
  });
}

export function useOutcomeMutations(modelId: string) {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["model-outcomes", modelId] });
    await queryClient.invalidateQueries({ queryKey: ["model-outcome", modelId] });
    await queryClient.invalidateQueries({ queryKey: ["formula-by-target", modelId] });
  };

  const createMutation = useMutation({
    mutationFn: async (payload: CreateOutcomePayload) =>
      (await createOutcome(modelId, payload)).data,
    onSuccess: async () => {
      toast.success("Outcome created");
      await invalidate();
    },
    onError: (err) => {
      toast.error(formatApiError(err).message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      outcomeId,
      payload,
    }: {
      outcomeId: string;
      payload: UpdateOutcomePayload;
    }) => (await updateOutcome(modelId, outcomeId, payload)).data,
    onSuccess: async () => {
      toast.success("Outcome updated");
      await invalidate();
    },
    onError: (err) => {
      toast.error(formatApiError(err).message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (outcomeId: string) => {
      await deleteOutcome(modelId, outcomeId);
    },
    onSuccess: async () => {
      toast.success("Outcome deleted");
      await invalidate();
    },
    onError: (err) => {
      toast.error(formatApiError(err).message);
    },
  });

  return { createMutation, updateMutation, deleteMutation, invalidate };
}

export type { OutcomeDefinitionDto, CreateOutcomePayload, UpdateOutcomePayload };
