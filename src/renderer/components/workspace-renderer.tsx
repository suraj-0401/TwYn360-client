"use client";

import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QueryErrorState } from "@/components/feedback/errors/query-error-state";
import { workspaceBySlugQueryKey } from "@/modules/metadata-builder/utils/workspace-builder-actions";
import { getWorkspaceBySlug } from "@/services/workspace.service";
import { workspaceDefinitionQueryKey } from "../hooks/use-workspace-definition";
import { usePrefetchWorkspace } from "../hooks/use-prefetch-workspace";
import { WorkspaceEditProvider } from "../context/workspace-edit-context";
import { useWorkspaceEdit } from "../context/workspace-edit-context";
import { FormDocumentProvider } from "../context/form-document-context";
import { formPageClass, formSectionGapClass } from "../form-styles";
import { DynamicFormSkeleton } from "./dynamic-form-skeleton";
import { SectionRenderer } from "./section-renderer";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AddSectionInsert } from "./add-section-insert";
import { WorkspaceCanvas } from "./workspace-canvas";
import { WorkspaceConfigDrawer } from "./workspace-config-drawer";
import type { FormDefinitionPayload } from "../types";
import { env } from "@/config/env";

export type WorkspaceRendererProps = {
  workspaceSlug: string;
  editable?: boolean;
  values: Record<string, unknown>;
  onFieldChange: (fieldId: string, value: unknown) => void;
  adminKey?: string;
  /** Hide workspace fields (e.g. categoryId rendered via CategoryRecordSelect). */
  excludeFieldKeys?: string[];
  children?: React.ReactNode;
};

type WorkspaceSectionsProps = WorkspaceRendererProps & {
  workspacePayload?: FormDefinitionPayload;
  excludeFieldKeys?: string[];
};

/** Clear drawer selection when leaving edit layout (provider stays mounted). */
function WorkspaceEditModeSync({ editEnabled }: { editEnabled: boolean }) {
  const edit = useWorkspaceEdit();

  useEffect(() => {
    if (!editEnabled) {
      edit?.selectField(null);
      edit?.selectSection(null);
    }
  }, [editEnabled, edit?.selectField, edit?.selectSection]);

  return null;
}

function filterWorkspacePayload(
  payload: FormDefinitionPayload,
  excludeFieldKeys: string[] | undefined,
): FormDefinitionPayload {
  if (!excludeFieldKeys?.length) {
    return payload;
  }
  const exclude = new Set(excludeFieldKeys);
  const fields = Object.fromEntries(
    Object.entries(payload.fields).filter(([key]) => !exclude.has(key)),
  );
  const sections = payload.form.sections.map((section) => ({
    ...section,
    fields: section.fields.filter((fieldId) => !exclude.has(fieldId)),
  }));
  return {
    ...payload,
    fields,
    form: { ...payload.form, sections },
  };
}

function WorkspaceSections({
  workspaceSlug,
  editable,
  values,
  onFieldChange,
  adminKey,
  workspacePayload,
  excludeFieldKeys,
}: WorkspaceSectionsProps & { excludeFieldKeys?: string[] }) {
  const edit = useWorkspaceEdit();

  const data = useMemo(() => {
    const base = edit?.payload ?? workspacePayload;
    if (!base) {
      return undefined;
    }
    return filterWorkspacePayload(base, excludeFieldKeys);
  }, [edit?.payload, workspacePayload, excludeFieldKeys]);

  if (!data) {
    return null;
  }

  const sections = data.form.sections;
  const sectionCount = sections.length;

  return (
    <div className={formSectionGapClass}>
      {sections.map((section, index) => (
        <SectionRenderer
          key={section.id}
          section={section}
          sectionIndex={index}
          sectionCount={sectionCount}
          fields={data.fields}
          values={values}
          onFieldChange={onFieldChange}
          adminKey={adminKey}
          editable={editable}
        />
      ))}
      {editable ? <AddSectionInsert /> : null}
    </div>
  );
}

function FormWorkspaceShell({
  editable,
  sectionsProps,
  children,
}: {
  editable: boolean;
  sectionsProps: WorkspaceSectionsProps;
  children?: React.ReactNode;
}) {
  return (
    <div className={formPageClass}>
      <FormDocumentProvider>
        <TooltipProvider>
          <WorkspaceCanvas>
            <WorkspaceSections {...sectionsProps} editable={editable} />
            {children}
          </WorkspaceCanvas>
          {editable ? <WorkspaceConfigDrawer /> : null}
        </TooltipProvider>
      </FormDocumentProvider>
    </div>
  );
}

export function WorkspaceRenderer({
  workspaceSlug,
  editable = false,
  values,
  onFieldChange,
  adminKey,
  excludeFieldKeys,
  children,
}: WorkspaceRendererProps) {
  const queryClient = useQueryClient();
  const canEditLayout = Boolean(adminKey ?? env.NEXT_PUBLIC_ADMIN_API_KEY);

  usePrefetchWorkspace(workspaceSlug);

  const workspaceQuery = useQuery({
    queryKey: workspaceBySlugQueryKey(workspaceSlug),
    queryFn: async () => {
      const res = await getWorkspaceBySlug(workspaceSlug);
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (workspaceQuery.data?.payload) {
      queryClient.setQueryData(
        workspaceDefinitionQueryKey(workspaceSlug),
        workspaceQuery.data.payload,
      );
    }
  }, [queryClient, workspaceSlug, workspaceQuery.data]);

  const sectionsProps: WorkspaceSectionsProps = {
    workspaceSlug,
    editable,
    values,
    onFieldChange,
    adminKey,
    excludeFieldKeys,
    workspacePayload: workspaceQuery.data?.payload,
  };

  const showInitialSkeleton =
    workspaceQuery.isLoading && !workspaceQuery.data;

  if (showInitialSkeleton) {
    return (
      <FormWorkspaceShell editable={editable} sectionsProps={sectionsProps}>
        <DynamicFormSkeleton />
      </FormWorkspaceShell>
    );
  }

  if (workspaceQuery.isError && !workspaceQuery.data) {
    return (
      <QueryErrorState
        error={workspaceQuery.error}
        title="Failed to load workspace"
        onRetry={() => workspaceQuery.refetch()}
        isRetrying={workspaceQuery.isFetching}
      />
    );
  }

  const shell = (
    <FormWorkspaceShell editable={editable} sectionsProps={sectionsProps}>
      {!editable ? <div className="pb-12 pt-2">{children}</div> : children}
    </FormWorkspaceShell>
  );

  if (canEditLayout && workspaceQuery.data) {
    return (
      <WorkspaceEditProvider
        workspace={workspaceQuery.data}
        editEnabled={editable}
      >
        <WorkspaceEditModeSync editEnabled={editable} />
        {shell}
      </WorkspaceEditProvider>
    );
  }

  return shell;
}
