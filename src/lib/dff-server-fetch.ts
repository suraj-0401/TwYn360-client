import { env } from "@/config/env";
import { PLATFORM_PERSONA } from "@/config/persona";
import type { ApiSuccessResponse } from "@/types/api";

function apiBaseUrl(): string {
  return env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
}

export async function fetchDffApi<T>(path: string): Promise<T> {
  const url = `${apiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "x-persona": PLATFORM_PERSONA.DOCTOR,
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `DFF request failed (${response.status}) ${path}${text ? `: ${text.slice(0, 200)}` : ""}`,
    );
  }

  const body = (await response.json()) as ApiSuccessResponse<T>;
  if (!body.success) {
    throw new Error(body.message ?? "DFF API returned success=false");
  }

  return body.data;
}
