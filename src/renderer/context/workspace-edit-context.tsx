"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  mergeFieldSettingsPatch,
  type FieldSettingsPatch,
} from "@/renderer/field-settings.registry";
import {
  mergeSectionSettingsPatch,
  type SectionSettingsPatch,
} from "@/renderer/section-metadata.registry";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getWorkspaceBySlug } from "@/services/workspace.service";
import { useConfirm } from "@/components/feedback";
import { env } from "@/config/env";
import {
  entityTypeSlugForWorkspace,
  ENTITY_TYPE,
  isEntityRecordWorkspaceSlug,
  isProtectedEntityFieldKey,
} from "@/config/platform";
import { isProtectedFactorSetFieldKey } from "@/config/factor-set";
import { toast } from "@/lib/toast";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import {
  applyWorkspaceMutation,
  workspaceBySlugQueryKey,
} from "@/modules/metadata-builder/utils/workspace-builder-actions";
import { workspaceDefinitionQueryKey } from "@/renderer/hooks/use-workspace-definition";
import { applyOptimisticFieldPatch } from "@/renderer/utils/optimistic-workspace-patch";
import {
  applyOptimisticFieldAdd,
  applyOptimisticFieldRemove,
  applyOptimisticFieldReorder,
  fieldKeyFromLabel,
} from "@/renderer/utils/optimistic-workspace-fields";
import {
  applyOptimisticSectionAdd,
  applyOptimisticSectionRemove,
  applyOptimisticSectionPatch,
  applyOptimisticSectionReorder,
} from "@/renderer/utils/optimistic-workspace-sections";
import {
  addPrimitiveField,
  addSection,
  deleteField,
  deleteSection,
  duplicateSection,
  publishWorkspace,
  reorderFields,
  reorderSections,
  updateField,
  updateSection,
} from "@/services/workspace.service";
import type { ApiSuccessResponse } from "@/types/api";
import type { WorkspaceDetail, WorkspaceFieldRecord, WorkspaceSectionRecord } from "@/types/workspace";
import {
  allocateUniqueFieldKeyInSection,
  rendererFieldIdMatchesKey,
  toRendererFieldId,
} from "@/renderer/utils/field-keys";

export type WorkspaceEditContextValue = {
  /** When false, layout chrome is hidden but workspace data stays cached. */
  editEnabled: boolean;
  workspaceSlug: string;
  workspaceId: string;
  payload: WorkspaceDetail["payload"];
  sections: WorkspaceSectionRecord[];
  adminKey?: string;
  selectedSectionId: string | null;
  selectedFieldId: string | null;
  selectSection: (sectionId: string | null) => void;
  selectField: (fieldId: string | null, sectionId?: string) => void;
  selectedSection: WorkspaceSectionRecord | null;
  selectedField: WorkspaceFieldRecord | null;
  saveWorkspace: (
    request: Promise<ApiSuccessResponse<WorkspaceDetail>>,
    options?: { successMessage?: string; silent?: boolean },
  ) => Promise<WorkspaceDetail | null>;
  debouncedUpdateSection: (sectionId: string, patch: SectionSettingsPatch) => void;
  duplicateSection: (sectionId: string) => void;
  debouncedUpdateField: (fieldId: string, patch: FieldSettingsPatch) => void;
  addSectionAt: (displayOrder: number) => void;
  addSectionAfter: (afterIndex: number) => void;
  addPrimitiveToSection: (sectionId: string, fieldType: string, label: string) => void;
  moveSection: (sectionId: string, direction: -1 | 1) => void;
  moveField: (sectionId: string, fieldId: string, direction: -1 | 1) => void;
  removeField: (fieldId: string) => Promise<void>;
  removeSection: (sectionId: string) => void;
  publishLayout: () => void;
  confirm: ReturnType<typeof useConfirm>["confirm"];
  sectionRecordByKey: (sectionKey: string) => WorkspaceSectionRecord | undefined;
  fieldRecordByKey: (
    sectionKey: string,
    fieldKey: string,
  ) => WorkspaceFieldRecord | undefined;
};

const WorkspaceEditContext = createContext<WorkspaceEditContextValue | null>(null);

export function useWorkspaceEdit(): WorkspaceEditContextValue | null {
  return useContext(WorkspaceEditContext);
}

type WorkspaceEditProviderProps = {
  workspace: WorkspaceDetail;
  editEnabled?: boolean;
  children: ReactNode;
};

export function WorkspaceEditProvider({
  workspace: initialWorkspace,
  editEnabled = true,
  children,
}: WorkspaceEditProviderProps) {
  const workspaceSlug = initialWorkspace.slug;
  const workspaceId = initialWorkspace.id;
  const adminKey = env.NEXT_PUBLIC_ADMIN_API_KEY;
  const { confirm } = useConfirm();
  const queryClient = useQueryClient();

  const { data: workspace = initialWorkspace } = useQuery({
    queryKey: workspaceBySlugQueryKey(workspaceSlug),
    queryFn: async () => {
      const res = await getWorkspaceBySlug(workspaceSlug);
      return res.data;
    },
    initialData: initialWorkspace,
    staleTime: 30_000,
  });

  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const sectionMutationInFlight = useRef(new Set<string>());

  const saveWorkspace = useCallback(
    (
      request: Promise<ApiSuccessResponse<WorkspaceDetail>>,
      options?: {
        successMessage?: string;
        silent?: boolean;
        optimistic?: (current: WorkspaceDetail) => WorkspaceDetail;
      },
    ) =>
      applyWorkspaceMutation(
        queryClient,
        workspaceId,
        workspaceSlug,
        request,
        options,
      ),
    [queryClient, workspaceId, workspaceSlug],
  );

  const pendingSectionPatches = useRef(new Map<string, SectionSettingsPatch>());

  const syncSectionCache = useCallback(
    (sectionId: string) => {
      const merged = pendingSectionPatches.current.get(sectionId);
      if (!merged) {
        return;
      }
      queryClient.setQueryData(
        workspaceBySlugQueryKey(workspaceSlug),
        (current: WorkspaceDetail | undefined) => {
          if (!current) {
            return current;
          }
          return applyOptimisticSectionPatch(current, sectionId, merged);
        },
      );
      queryClient.setQueryData(
        workspaceDefinitionQueryKey(workspaceSlug),
        (current) => {
          const detail = queryClient.getQueryData<WorkspaceDetail>(
            workspaceBySlugQueryKey(workspaceSlug),
          );
          return detail?.payload ?? current;
        },
      );
    },
    [queryClient, workspaceSlug],
  );

  const flushPendingSectionPatches = useDebouncedCallback(() => {
    const entries = [...pendingSectionPatches.current.entries()];
    pendingSectionPatches.current.clear();
    for (const [sectionId, patch] of entries) {
      queryClient.setQueryData(
        workspaceBySlugQueryKey(workspaceSlug),
        (current: WorkspaceDetail | undefined) => {
          if (!current) {
            return current;
          }
          return applyOptimisticSectionPatch(current, sectionId, patch);
        },
      );
      queryClient.setQueryData(
        workspaceDefinitionQueryKey(workspaceSlug),
        (current) => {
          const detail = queryClient.getQueryData<WorkspaceDetail>(
            workspaceBySlugQueryKey(workspaceSlug),
          );
          return detail?.payload ?? current;
        },
      );
      void saveWorkspace(updateSection(sectionId, patch, adminKey), { silent: true });
    }
  }, 400);

  const debouncedUpdateSection = useCallback(
    (sectionId: string, patch: SectionSettingsPatch) => {
      const prev = pendingSectionPatches.current.get(sectionId) ?? {};
      pendingSectionPatches.current.set(
        sectionId,
        mergeSectionSettingsPatch(prev, patch),
      );
      syncSectionCache(sectionId);
      flushPendingSectionPatches();
    },
    [flushPendingSectionPatches, syncSectionCache],
  );

  const pendingFieldPatches = useRef(new Map<string, FieldSettingsPatch>());

  const syncFieldCache = useCallback(
    (fieldId: string) => {
      const merged = pendingFieldPatches.current.get(fieldId);
      if (!merged) {
        return;
      }
      queryClient.setQueryData(
        workspaceBySlugQueryKey(workspaceSlug),
        (current: WorkspaceDetail | undefined) => {
          if (!current) {
            return current;
          }
          return applyOptimisticFieldPatch(current, fieldId, merged);
        },
      );
      queryClient.setQueryData(
        workspaceDefinitionQueryKey(workspaceSlug),
        (current) => {
          const detail = queryClient.getQueryData<WorkspaceDetail>(
            workspaceBySlugQueryKey(workspaceSlug),
          );
          return detail?.payload ?? current;
        },
      );
    },
    [queryClient, workspaceSlug],
  );

  const flushPendingFieldPatches = useDebouncedCallback(() => {
    const entries = [...pendingFieldPatches.current.entries()];
    pendingFieldPatches.current.clear();
    for (const [fieldId, patch] of entries) {
      queryClient.setQueryData(
        workspaceBySlugQueryKey(workspaceSlug),
        (current: WorkspaceDetail | undefined) => {
          if (!current) {
            return current;
          }
          return applyOptimisticFieldPatch(current, fieldId, patch);
        },
      );
      queryClient.setQueryData(
        workspaceDefinitionQueryKey(workspaceSlug),
        (current) => {
          const detail = queryClient.getQueryData<WorkspaceDetail>(
            workspaceBySlugQueryKey(workspaceSlug),
          );
          return detail?.payload ?? current;
        },
      );
      void saveWorkspace(updateField(fieldId, patch, adminKey), { silent: true });
    }
  }, 400);

  const debouncedUpdateField = useCallback(
    (fieldId: string, patch: FieldSettingsPatch) => {
      const prev = pendingFieldPatches.current.get(fieldId) ?? {};
      pendingFieldPatches.current.set(
        fieldId,
        mergeFieldSettingsPatch(prev, patch),
      );
      syncFieldCache(fieldId);
      flushPendingFieldPatches();
    },
    [flushPendingFieldPatches, syncFieldCache],
  );

  const sections = workspace.sections;
  const payload = workspace.payload;

  const selectedSection = useMemo(
    () => sections.find((s) => s.id === selectedSectionId) ?? null,
    [sections, payload, selectedSectionId],
  );

  const selectedField = useMemo(() => {
    if (!selectedFieldId) {
      return null;
    }
    for (const section of sections) {
      const field = section.fields.find((f) => f.id === selectedFieldId);
      if (field) {
        return field;
      }
    }
    return null;
  }, [sections, selectedFieldId]);

  const sectionRecordByKey = useCallback(
    (sectionKey: string) => sections.find((s) => s.key === sectionKey),
    [sections],
  );

  const fieldRecordByKey = useCallback(
    (sectionKey: string, rendererFieldId: string) => {
      const section = sections.find((s) => s.key === sectionKey);
      if (!section) {
        return undefined;
      }
      const normalizedId = toRendererFieldId(rendererFieldId);
      return (
        section.fields.find(
          (f) => toRendererFieldId(f.fieldKey) === normalizedId,
        ) ??
        section.fields.find((f) =>
          rendererFieldIdMatchesKey(rendererFieldId, f.fieldKey),
        )
      );
    },
    [sections],
  );

  const value = useMemo(
    (): WorkspaceEditContextValue => ({
      editEnabled,
      workspaceSlug,
      workspaceId,
      payload,
      sections,
      adminKey,
      selectedSectionId,
      selectedFieldId,
      selectSection: setSelectedSectionId,
      selectField: (fieldId, sectionId) => {
        setSelectedFieldId(fieldId);
        if (sectionId) {
          setSelectedSectionId(sectionId);
        }
      },
      selectedSection,
      selectedField,
      saveWorkspace,
      debouncedUpdateSection,
      debouncedUpdateField,
      addSectionAt: (_displayOrder?: number) => {
        const title = `Section ${sections.length + 1}`;
        void saveWorkspace(addSection(workspaceId, { title }, adminKey), {
          silent: true,
          optimistic: (current) => applyOptimisticSectionAdd(current, title),
        });
      },
      addSectionAfter: (afterIndex) => {
        const title = `Section ${sections.length + 1}`;
        void saveWorkspace(
          addSection(workspaceId, { title, insertAfterIndex: afterIndex }, adminKey),
          {
            silent: true,
            optimistic: (current) =>
              applyOptimisticSectionAdd(current, title, afterIndex),
          },
        );
      },
      addPrimitiveToSection: (sectionId, fieldType, label) => {
        const section = sections.find((s) => s.id === sectionId);
        const preferredKey = fieldKeyFromLabel(label) || "field";
        const fieldKey = section
          ? allocateUniqueFieldKeyInSection(
              section.fields.map((f) => f.fieldKey),
              preferredKey,
            )
          : toRendererFieldId(preferredKey);
        const addInput = { fieldKey, fieldType, label };

        void (async () => {
          if (fieldType === "lookup") {
            const cached = queryClient.getQueryData<WorkspaceDetail>(
              workspaceBySlugQueryKey(workspaceSlug),
            );
            const preview = cached
              ? applyOptimisticFieldAdd(cached, sectionId, addInput)
              : null;
            if (preview) {
              setSelectedFieldId(preview.tempFieldId);
              setSelectedSectionId(sectionId);
            }
          }

          const detail = await saveWorkspace(
            addPrimitiveField(sectionId, addInput, adminKey),
            {
              silent: true,
              optimistic: (current) =>
                applyOptimisticFieldAdd(current, sectionId, addInput)?.workspace ??
                current,
            },
          );
          if (!detail || fieldType !== "lookup") {
            return;
          }
          const section = detail.sections.find((s) => s.id === sectionId);
          const created = section?.fields.find((f) =>
            rendererFieldIdMatchesKey(fieldKey, f.fieldKey),
          );
          if (created) {
            setSelectedFieldId(created.id);
            setSelectedSectionId(sectionId);
          }
        })();
      },
      moveSection: (sectionId, direction) => {
        const ids = sections.map((s) => s.id);
        const index = ids.indexOf(sectionId);
        const target = index + direction;
        if (index < 0 || target < 0 || target >= ids.length) {
          return;
        }
        [ids[index], ids[target]] = [ids[target], ids[index]];
        void saveWorkspace(reorderSections(workspaceId, ids, adminKey), {
          silent: true,
          optimistic: (current) => applyOptimisticSectionReorder(current, ids),
        });
      },
      moveField: (sectionId, fieldId, direction) => {
        const section = sections.find((s) => s.id === sectionId);
        if (!section) {
          return;
        }
        const ids = section.fields.map((f) => f.id);
        const index = ids.indexOf(fieldId);
        const target = index + direction;
        if (index < 0 || target < 0 || target >= ids.length) {
          return;
        }
        [ids[index], ids[target]] = [ids[target], ids[index]];
        void saveWorkspace(reorderFields(sectionId, ids, adminKey), {
          silent: true,
          optimistic: (current) =>
            applyOptimisticFieldReorder(current, sectionId, ids),
        });
      },
      removeField: async (fieldId) => {
        const field = sections
          .flatMap((section) => section.fields)
          .find((f) => f.id === fieldId);
        if (
          field &&
          (isProtectedEntityFieldKey(workspaceSlug, field.fieldKey) ||
            isProtectedFactorSetFieldKey(workspaceSlug, field.fieldKey))
        ) {
          toast.error(
            "This field is required for record validation and cannot be removed.",
          );
          return;
        }
        const ok = await confirm({
          title: "Remove field?",
          variant: "destructive",
          confirmLabel: "Remove",
        });
        if (!ok) {
          return;
        }
        setSelectedFieldId((prev) => (prev === fieldId ? null : prev));
        void saveWorkspace(deleteField(fieldId, adminKey), {
          silent: true,
          optimistic: (current) => applyOptimisticFieldRemove(current, fieldId),
        });
      },
      removeSection: (sectionId) => {
        setSelectedSectionId((prev) => (prev === sectionId ? null : prev));
        setSelectedFieldId(null);
        void saveWorkspace(deleteSection(sectionId, adminKey), {
          silent: true,
          optimistic: (current) => applyOptimisticSectionRemove(current, sectionId),
        });
      },
      duplicateSection: (sectionId) => {
        if (sectionMutationInFlight.current.has(sectionId)) {
          return;
        }
        sectionMutationInFlight.current.add(sectionId);
        void saveWorkspace(duplicateSection(sectionId, adminKey), {
          successMessage: "Section duplicated",
        }).finally(() => {
          sectionMutationInFlight.current.delete(sectionId);
        });
      },
      publishLayout: () => {
        const entityWorkspace = isEntityRecordWorkspaceSlug(workspaceSlug);
        void saveWorkspace(publishWorkspace(workspaceId, adminKey), {
          successMessage: entityWorkspace
            ? "Layout and validation schema published"
            : "Layout published",
        }).then(() => {
          if (!entityWorkspace) {
            return;
          }
          const entityType = entityTypeSlugForWorkspace(workspaceSlug);
          if (!entityType) {
            return;
          }
          void queryClient.invalidateQueries({
            queryKey:
              entityType === ENTITY_TYPE.CATEGORY ? ["categories"] : ["drugs"],
          });
          if (entityType === ENTITY_TYPE.CATEGORY) {
            void queryClient.invalidateQueries({ queryKey: ["category-options"] });
          }
        });
      },
      confirm,
      sectionRecordByKey,
      fieldRecordByKey,
    }),
    [
      editEnabled,
      workspaceSlug,
      workspaceId,
      payload,
      sections,
      adminKey,
      selectedSectionId,
      selectedFieldId,
      selectedSection,
      selectedField,
      saveWorkspace,
      debouncedUpdateSection,
      debouncedUpdateField,
      confirm,
      sectionRecordByKey,
      fieldRecordByKey,
      queryClient,
      workspaceSlug,
    ],
  );

  return (
    <WorkspaceEditContext.Provider value={value}>
      {children}
    </WorkspaceEditContext.Provider>
  );
}