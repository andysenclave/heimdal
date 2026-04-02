import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useCodexVersions, useCreateCodexVersion, useDeleteCodexVersion } from '@api/hooks/useCodexVersions';
import {
  useSubmitForReview,
  useApproveVersion,
  useRejectVersion,
  useRollbackVersion,
} from '@api/hooks/useCodexVersionActions';
import {
  useCodexScreens,
  useCreateCodexScreen,
  useDeleteCodexScreen,
  useReorderCodexScreens,
} from '@api/hooks/useCodexScreens';
import { useCodexLocales, useCreateCodexLocale } from '@api/hooks/useCodexLocales';
import { useCodexRegions, useConfirmRegion, useIgnoreRegion } from '@api/hooks/useCodexRegions';
import { useCodexContent, useUpdateCodexContent } from '@api/hooks/useCodexContent';
import { useUploadScreenshot, useAnalyzeScreen } from '@api/hooks/useCodexScreenActions';
import { setNestedValue } from '@lib/set-nested-value';

export function useCodexPage(appId: string | null) {
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [activeScreenId, setActiveScreenId] = useState<string | null>(null);
  const [activeLocale, setActiveLocale] = useState('en');
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: versionsData } = useCodexVersions(appId);
  const { data: localesData } = useCodexLocales(appId);

  const versions = versionsData?.data ?? [];
  const locales = localesData ?? [];
  const resolvedVersionId = activeVersionId ?? versions[0]?.id ?? null;
  const activeVersion = versions.find((v) => v.id === resolvedVersionId);
  const isDraft = activeVersion?.status === 'DRAFT';
  const hasPublished = versions.some((v) => v.status === 'PUBLISHED');

  const { data: screensData } = useCodexScreens(resolvedVersionId);
  const { data: regionsData } = useCodexRegions(activeScreenId);
  const { data: contentData } = useCodexContent(activeScreenId, activeLocale);

  const screens = screensData ?? [];
  const regions = regionsData ?? [];
  const activeScreen = screens.find((s) => s.id === activeScreenId) ?? null;
  const selectedRegion = regions.find((r) => r.id === selectedRegionId) ?? null;

  // ── Auto-select first version on load ────────────────────────────────────────
  useEffect(() => {
    if (!activeVersionId && versions.length > 0) {
      setActiveVersionId(versions[0].id);
    }
  }, [versions, activeVersionId]);

  // ── Mutations ────────────────────────────────────────────────────────────────
  const { mutate: createVersion, isPending: isCreatingVersion } = useCreateCodexVersion(appId ?? '');
  const { mutate: deleteVersion } = useDeleteCodexVersion(appId ?? '');
  const { mutate: submitReview } = useSubmitForReview(appId ?? '');
  const { mutate: approveVersion } = useApproveVersion(appId ?? '');
  const { mutate: rejectVersion } = useRejectVersion(appId ?? '');
  const { mutate: rollbackVersion } = useRollbackVersion(appId ?? '');
  const { mutate: createScreen } = useCreateCodexScreen(resolvedVersionId ?? '');
  const { mutate: deleteScreen } = useDeleteCodexScreen(resolvedVersionId ?? '');
  const { mutate: reorderScreens } = useReorderCodexScreens(resolvedVersionId ?? '');
  const { mutate: confirmRegion } = useConfirmRegion(activeScreenId ?? '');
  const { mutate: ignoreRegion } = useIgnoreRegion(activeScreenId ?? '');
  const { mutate: createLocale } = useCreateCodexLocale(appId ?? '');
  const { mutate: updateContent } = useUpdateCodexContent(activeScreenId ?? '');
  const { mutate: upload, isPending: isUploading } = useUploadScreenshot(activeScreenId, resolvedVersionId);
  const { mutate: analyze, isPending: isAnalyzing } = useAnalyzeScreen(activeScreenId, resolvedVersionId, activeLocale);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleVersionChange = useCallback((id: string) => {
    setActiveVersionId(id);
    setActiveScreenId(null);
    setSelectedRegionId(null);
  }, []);

  const handleScreenSelect = useCallback((id: string) => {
    setActiveScreenId(id);
    setSelectedRegionId(null);
  }, []);

  const handleAddScreen = useCallback((name: string, slug: string) => {
    createScreen({ name, slug }, {
      onSuccess: (newScreen) => {
        setActiveScreenId(newScreen.id);
        setSelectedRegionId(null);
      },
    });
  }, [createScreen]);

  const handleDeleteScreen = useCallback((id: string, name: string) => {
    deleteScreen(id, {
      onSuccess: () => {
        const remaining = screens.filter((s) => s.id !== id);
        setActiveScreenId(remaining.length > 0 ? remaining[0].id : null);
        setSelectedRegionId(null);
      },
    });
  }, [deleteScreen, screens]);

  const handleReorderScreens = useCallback((ids: string[]) => {
    reorderScreens(ids);
  }, [reorderScreens]);

  const handleCreateVersion = useCallback((onSuccess?: (id: string) => void) => {
    createVersion({ cloneFromLatest: true }, {
      onSuccess: (newVersion) => {
        setActiveVersionId(newVersion.id);
        setActiveScreenId(null);
        setSelectedRegionId(null);
        onSuccess?.(newVersion.id);
      },
    });
  }, [createVersion]);

  const handleDeleteVersion = useCallback((id: string) => {
    deleteVersion(id, {
      onSuccess: () => {
        const remaining = versions.filter((v) => v.id !== id);
        setActiveVersionId(remaining.length > 0 ? remaining[0].id : null);
        setActiveScreenId(null);
        setSelectedRegionId(null);
      },
    });
  }, [deleteVersion, versions]);

  const handleSubmitReview = useCallback((notes?: string) => {
    if (!resolvedVersionId) return;
    submitReview({ versionId: resolvedVersionId, notes });
  }, [submitReview, resolvedVersionId]);

  const handleApprove = useCallback(() => {
    if (!resolvedVersionId) return;
    approveVersion(resolvedVersionId);
  }, [approveVersion, resolvedVersionId]);

  const handleReject = useCallback((feedback: string) => {
    if (!resolvedVersionId) return;
    rejectVersion({ versionId: resolvedVersionId, feedback });
  }, [rejectVersion, resolvedVersionId]);

  const handleRollback = useCallback((versionId: string) => {
    rollbackVersion(versionId);
  }, [rollbackVersion]);

  const handleValueChange = useCallback((regionId: string, newValue: string) => {
    const region = regions.find((r) => r.id === regionId);
    if (!region || !contentData?.contentTree) return;

    const updatedTree = JSON.parse(JSON.stringify(contentData.contentTree)) as Record<string, unknown>;
    setNestedValue(updatedTree, region.contentKey, newValue);

    updateContent(
      { locale: activeLocale, contentTree: updatedTree },
      { onSuccess: () => toast.success('Content updated') },
    );
  }, [regions, contentData, activeLocale, updateContent]);

  return {
    // State
    activeVersionId: resolvedVersionId,
    activeScreenId,
    activeLocale,
    selectedRegionId,
    setSelectedRegionId,
    setActiveLocale,

    // Data
    versions,
    locales,
    screens,
    regions,
    contentData,
    activeVersion,
    activeScreen,
    selectedRegion,

    // Derived
    isDraft,
    hasPublished,
    isCreatingVersion,
    isUploading,
    isAnalyzing,

    // Handlers
    handleVersionChange,
    handleScreenSelect,
    handleAddScreen,
    handleDeleteScreen,
    handleReorderScreens,
    handleCreateVersion,
    handleDeleteVersion,
    handleSubmitReview,
    handleApprove,
    handleReject,
    handleRollback,
    handleValueChange,
    handleUpload: upload,
    handleAnalyze: analyze,
    handleConfirmRegion: confirmRegion,
    handleIgnoreRegion: ignoreRegion,
    handleCreateLocale: createLocale,
  };
}
