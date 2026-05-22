"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Factor } from "@/types/factor";

type FactorGovernanceCardProps = {
  factor: Pick<
    Factor,
    | "version"
    | "statusCode"
    | "createdBy"
    | "updatedBy"
    | "createdAt"
    | "updatedAt"
  >;
};

export function FactorGovernanceCard({ factor }: FactorGovernanceCardProps) {
  return (
    <Card className="rounded-[24px] border-white/[0.06] bg-[#111114] text-[#f4f4f5] shadow-none">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Governance</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm text-[#f4f4f5]/80 sm:grid-cols-2">
        <p>
          <span className="text-[#f4f4f5]/50">Version:</span> {factor.version}
        </p>
        <p>
          <span className="text-[#f4f4f5]/50">Status:</span> {factor.statusCode}
        </p>
        <p>
          <span className="text-[#f4f4f5]/50">Created by:</span>{" "}
          {factor.createdBy ?? "—"}
        </p>
        <p>
          <span className="text-[#f4f4f5]/50">Updated by:</span>{" "}
          {factor.updatedBy ?? "—"}
        </p>
        <p>
          <span className="text-[#f4f4f5]/50">Created:</span>{" "}
          {new Date(factor.createdAt).toLocaleString()}
        </p>
        <p>
          <span className="text-[#f4f4f5]/50">Updated:</span>{" "}
          {new Date(factor.updatedAt).toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
}
