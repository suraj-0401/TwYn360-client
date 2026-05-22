import { env } from "@/config/env";
import { getHealth, type HealthData } from "@/services/health.service";
import type { ApiSuccessResponse } from "@/types/api";

export interface SystemStatus {
  apiUrl: string;
  health: HealthData;
}

export async function getSystemStatus(): Promise<SystemStatus> {
  const healthResponse: ApiSuccessResponse<HealthData> = await getHealth();

  return {
    apiUrl: env.NEXT_PUBLIC_API_URL,
    health: healthResponse.data,
  };
}

export function getApiBaseUrl(): string {
  return env.NEXT_PUBLIC_API_URL;
}
