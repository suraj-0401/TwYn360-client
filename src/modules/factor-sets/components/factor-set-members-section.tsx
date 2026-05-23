"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import {
  addFactorSetMember,
  removeFactorSetMember,
  reorderFactorSetMembers,
} from "@/services/factor-set.service";
import { FactorPicker } from "./factor-picker";
import {
  FactorSetMemberList,
  type FactorSetMemberRow,
} from "./factor-set-member-list";
import type { FactorListItem } from "@/types/factor";
import type { FactorSetMember, FactorSummary } from "@/types/factor-set";

function factorListItemToSummary(factor: FactorListItem): FactorSummary {
  return {
    id: factor.id,
    name: factor.name,
    slug: factor.slug,
    displayName: factor.displayName,
    categoryCode: factor.categoryCode,
    dataTypeCode: factor.dataTypeCode,
    statusCode: factor.statusCode,
    unitCode: factor.unitCode,
  };
}

function membersToRows(members: FactorSetMember[]): FactorSetMemberRow[] {
  return [...members]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((member) => ({
      factorId: member.factorId,
      factor: member.factor,
    }));
}

function reorderIds(rows: FactorSetMemberRow[], factorId: string, delta: -1 | 1) {
  const ids = rows.map((row) => row.factorId);
  const index = ids.indexOf(factorId);
  if (index < 0) {
    return ids;
  }
  const target = index + delta;
  if (target < 0 || target >= ids.length) {
    return ids;
  }
  const next = [...ids];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

type DraftFactorSetMembersSectionProps = {
  mode: "draft";
  members: FactorSummary[];
  onMembersChange: (members: FactorSummary[]) => void;
};

type PersistedFactorSetMembersSectionProps = {
  mode: "persisted";
  factorSetId: string;
  members: FactorSetMember[];
  readOnly?: boolean;
};

export type FactorSetMembersSectionProps =
  | DraftFactorSetMembersSectionProps
  | PersistedFactorSetMembersSectionProps;

export function FactorSetMembersSection(props: FactorSetMembersSectionProps) {
  if (props.mode === "draft") {
    return <DraftMembersSection {...props} />;
  }

  return <PersistedMembersSection {...props} />;
}

function DraftMembersSection({
  members,
  onMembersChange,
}: DraftFactorSetMembersSectionProps) {
  const rows: FactorSetMemberRow[] = members.map((factor) => ({
    factorId: factor.id,
    factor,
  }));

  const excludeFactorIds = useMemo(
    () => members.map((member) => member.id),
    [members],
  );

  function handleAdd(factor: FactorListItem) {
    if (members.some((member) => member.id === factor.id)) {
      return;
    }
    onMembersChange([...members, factorListItemToSummary(factor)]);
  }

  function handleRemove(factorId: string) {
    onMembersChange(members.filter((member) => member.id !== factorId));
  }

  function handleMove(factorId: string, delta: -1 | 1) {
    const ids = members.map((member) => member.id);
    const nextIds = reorderIds(
      ids.map((id) => ({
        factorId: id,
        factor: members.find((member) => member.id === id)!,
      })),
      factorId,
      delta,
    );
    onMembersChange(
      nextIds.map(
        (id) => members.find((member) => member.id === id)!,
      ),
    );
  }

  return (
    <MembersSectionLayout
      memberCount={members.length}
      excludeFactorIds={excludeFactorIds}
      onAdd={handleAdd}
      rows={rows}
      onRemove={handleRemove}
      onMoveUp={(factorId) => handleMove(factorId, -1)}
      onMoveDown={(factorId) => handleMove(factorId, 1)}
    />
  );
}

function PersistedMembersSection({
  factorSetId,
  members,
  readOnly = false,
}: PersistedFactorSetMembersSectionProps) {
  const queryClient = useQueryClient();
  const [busyFactorId, setBusyFactorId] = useState<string | null>(null);

  const rows = useMemo(() => membersToRows(members), [members]);
  const excludeFactorIds = useMemo(
    () => rows.map((row) => row.factorId),
    [rows],
  );

  async function refreshFactorSet(factorIds?: string[]) {
    await queryClient.invalidateQueries({
      queryKey: ["factor-set", factorSetId],
    });
    void queryClient.invalidateQueries({ queryKey: ["factor-sets"] });
    for (const factorId of factorIds ?? []) {
      void queryClient.invalidateQueries({
        queryKey: ["factor-factor-sets", factorId],
      });
    }
  }

  async function runMemberMutation(
    factorId: string,
    action: () => Promise<unknown>,
    successMessage: string,
  ) {
    setBusyFactorId(factorId);
    try {
      await action();
      toast.success(successMessage);
      await refreshFactorSet([factorId]);
    } finally {
      setBusyFactorId(null);
    }
  }

  function handleAdd(factor: FactorListItem) {
    void runMemberMutation(
      factor.id,
      () => addFactorSetMember(factorSetId, { factorId: factor.id }),
      "Factor added to set",
    );
  }

  function handleRemove(factorId: string) {
    void runMemberMutation(
      factorId,
      () => removeFactorSetMember(factorSetId, factorId),
      "Factor removed from set",
    );
  }

  function handleReorder(factorId: string, delta: -1 | 1) {
    const orderedFactorIds = reorderIds(rows, factorId, delta);
    void runMemberMutation(
      factorId,
      () =>
        reorderFactorSetMembers(factorSetId, { orderedFactorIds }),
      "Member order updated",
    );
  }

  return (
    <MembersSectionLayout
      memberCount={rows.length}
      excludeFactorIds={excludeFactorIds}
      onAdd={handleAdd}
      rows={rows}
      readOnly={readOnly}
      busyFactorId={busyFactorId}
      onRemove={readOnly ? undefined : handleRemove}
      onMoveUp={readOnly ? undefined : (factorId) => handleReorder(factorId, -1)}
      onMoveDown={
        readOnly ? undefined : (factorId) => handleReorder(factorId, 1)
      }
      pickerDisabled={readOnly}
    />
  );
}

type MembersSectionLayoutProps = {
  memberCount: number;
  excludeFactorIds: string[];
  onAdd: (factor: FactorListItem) => void;
  rows: FactorSetMemberRow[];
  readOnly?: boolean;
  busyFactorId?: string | null;
  pickerDisabled?: boolean;
  onRemove?: (factorId: string) => void;
  onMoveUp?: (factorId: string) => void;
  onMoveDown?: (factorId: string) => void;
};

function MembersSectionLayout({
  memberCount,
  excludeFactorIds,
  onAdd,
  rows,
  readOnly = false,
  busyFactorId = null,
  pickerDisabled = false,
  onRemove,
  onMoveUp,
  onMoveDown,
}: MembersSectionLayoutProps) {
  return (
    <div className="mx-auto w-full max-w-[1000px] space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-sm font-medium">Members</h2>
            <p className="text-xs text-muted-foreground">
              Ordered list of registry factors in this set ({memberCount}{" "}
              total).
            </p>
          </div>
          {readOnly ? (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Archived sets are read-only.
            </p>
          ) : null}
        </div>

        {!readOnly ? (
          <div className="mb-4">
            <FactorPicker
              excludeFactorIds={excludeFactorIds}
              memberCount={memberCount}
              onAdd={onAdd}
              disabled={pickerDisabled}
            />
          </div>
        ) : null}

        <FactorSetMemberList
          members={rows}
          readOnly={readOnly}
          busyFactorId={busyFactorId}
          onRemove={onRemove}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
        />
      </div>
    </div>
  );
}
