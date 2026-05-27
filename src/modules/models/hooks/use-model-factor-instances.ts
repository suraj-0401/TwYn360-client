"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatApiError } from "@/lib/api-error";
import { toast } from "@/lib/toast";
import {
  getModelFactorInstance,
  listModelFactorInstances,
  updateModelFactorInstance,
} from "@/services/model-factor-instance.service";
import type {
  ResolvedModelFactorInstance,
  UpdateModelFactorInstancePayload,
} from "@/types/model-factor-instance";

export function useModelFactorInstances(modelId: string) {
  return useQuery({
    queryKey: ["model-factor-instances", modelId],
    queryFn: async () =>
      (await listModelFactorInstances(modelId, { resolved: true }))
        .data as ResolvedModelFactorInstance[],
    staleTime: 30_000,
  });
}

export function useModelFactorInstanceConfigure(modelId: string) {
  const queryClient = useQueryClient();

  async function loadInstance(instanceId: string) {
    const response = await getModelFactorInstance(modelId, instanceId, {
      resolved: true,
    });
    return response.data as ResolvedModelFactorInstance;
  }

  async function saveOverrides(
    instanceId: string,
    payload: UpdateModelFactorInstancePayload,
  ) {
    try {
      await updateModelFactorInstance(modelId, instanceId, payload);
      toast.success("Factor configuration saved");
      await queryClient.invalidateQueries({
        queryKey: ["model-factor-instances", modelId],
      });
      void queryClient.invalidateQueries({ queryKey: ["models", modelId] });
    } catch (err) {
      toast.error(formatApiError(err).message);
      throw err;
    }
  }

  return { loadInstance, saveOverrides };
}
