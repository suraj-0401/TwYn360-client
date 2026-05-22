import { apiClient } from "@/lib/axios";
import type { ApiSuccessResponse } from "@/types/api";

export interface DatabaseHealth {
  status: "up" | "down";
  latencyMs?: number;
  error?: string;
}

export interface HealthData {
  service: string;
  status: string;
  environment: string;
  database: DatabaseHealth;
}

export async function getHealth(): Promise<ApiSuccessResponse<HealthData>> {
  const { data } =
    await apiClient.get<ApiSuccessResponse<HealthData>>("/health");

  return data;
}
