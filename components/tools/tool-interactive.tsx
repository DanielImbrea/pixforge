'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { PlanTier, ToolDefinition } from '@/types';
import { Button } from '@/components/ui/button';
import { planHasFeature, getMaxResizeQuality } from '@/lib/billing/plan-features';
import { BatchUploadZone } from './batch-upload-zone';
import { BatchResultsView, type BatchResultItem } from './batch-results-view';
import { ImagePreview } from './image-preview';
import { ProcessingState } from './processing-state';
import { ResultView } from './result-view';
import { ResizeOptions } from './resize-options';
import { ConvertOptions } from './convert-options';
import { UpscaleOptions } from './upscale-options';
import { DEFAULT_COMPRESS_PARAMS } from '@/lib/tools/compress-params';
import { DEFAULT_CONVERT_PARAMS } from '@/lib/tools/convert-params';
import { CompressOptions } from './compress-options';
import { DEFAULT_UPSCALE_PARAMS } from '@/lib/tools/upscale-params';
import { BgRemovalOptions } from './bg-removal-options';
import { BgReplaceOptions } from './bg-replace-options';
import { ObjectRemoveEditor, type ObjectRemoveEditorHandle } from './object-remove-editor';
import { ObjectRemoveOptions } from './object-remove-options';
import { PortraitEnhanceOptions } from './portrait-enhance-options';
import { BlurFacesOptions } from './blur-faces-options';
import { CropEditor } from './crop-editor';
import { DEFAULT_BG_REMOVAL_PARAMS } from '@/lib/tools/bg-removal-params';
import { DEFAULT_BG_REPLACE_PARAMS } from '@/lib/tools/bg-replace-params';
import { DEFAULT_OBJECT_REMOVE_PARAMS } from '@/lib/tools/object-remove-params';
import { DEFAULT_PORTRAIT_ENHANCE_PARAMS } from '@/lib/tools/portrait-enhance-params';
import { DEFAULT_BLUR_FACES_PARAMS } from '@/lib/tools/blur-faces-params';
import { blurFacesInBrowser, FaceBlurError } from '@/lib/image/blur-faces-browser';
import { DEFAULT_CROP_PARAMS, initCropRectForImage, type CropParams } from '@/lib/tools/crop-params';
import {
  buildResizeDownloadFilename,
  clampResizeQuality,
  DEFAULT_RESIZE_PARAMS,
  applyResizePreset,
  getResizePresetById,
  readImageDimensionsFromFile,
  type ResizeParams,
} from '@/lib/tools/resize-params';
import { ToolConfigureLayout, ToolLayout } from './tool-layout';
import { buildToolParams, validateToolParams } from '@/lib/tools/validate-params';
import { buildDownloadFallbackFilename, triggerBrowserDownload, triggerBrowserDownloadPost } from '@/lib/utils/trigger-download';

type JobResultPayload = {
  previewUrl: string;
  canDownloadHd: boolean;
  outputWidth: number | null;
  outputHeight: number | null;
  outputSizeBytes: number | null;
  outputFormatLabel: string | null;
  smartFormatSelected: boolean;
  formatReasonKey: string | null;
  sizeReductionPercent: number | null;
  inputSizeBytes: number | null;
  contentKind: string | null;
  backgroundFillApplied: boolean;
  upscaleReasonKey: string | null;
  upscaleWarningKey: string | null;
  upscaleModelLabel: string | null;
  upscaleEffectiveScale: 2 | 4 | null;
  upscaleSmartMode: boolean;
  bgRemovalReasonKey: string | null;
  bgRemovalModelLabel: string | null;
  bgRemovalSubjectMode: string | null;
  bgRemovalEdgeQuality: string | null;
  bgRemovalSmartMode: boolean;
  bgRemovalShadowRecoveryApplied: boolean;
  bgReplaceBackgroundLabel: string | null;
  bgReplaceUsedAiGeneration: boolean;
  objectRemoveComplete: boolean;
  portraitEnhanceReasonKey: string | null;
  portraitEnhanceWarningKey: string | null;
  portraitEnhanceModelLabel: string | null;
  portraitEnhanceStyle: string | null;
  blurFacesReasonKey: string | null;
  blurFacesModelLabel: string | null;
  compressionLevel: 'fast' | 'balanced' | 'max' | null;
};

function parseJobResultPayload(data: Record<string, unknown>): JobResultPayload {
  return {
    previewUrl: data.previewUrl as string,
    canDownloadHd: Boolean(data.canDownloadHd),
    outputWidth: (data.outputWidth as number | null | undefined) ?? null,
    outputHeight: (data.outputHeight as number | null | undefined) ?? null,
    outputSizeBytes: (data.outputSizeBytes as number | null | undefined) ?? null,
    outputFormatLabel: (data.outputFormatLabel as string | null | undefined) ?? null,
    smartFormatSelected: Boolean(data.smartFormatSelected),
    formatReasonKey: (data.formatReasonKey as string | null | undefined) ?? null,
    sizeReductionPercent:
      typeof data.sizeReductionPercent === 'number' ? data.sizeReductionPercent : null,
    inputSizeBytes: typeof data.inputSizeBytes === 'number' ? data.inputSizeBytes : null,
    contentKind: (data.contentKind as string | null | undefined) ?? null,
    backgroundFillApplied: Boolean(data.backgroundFillApplied),
    upscaleReasonKey: (data.upscaleReasonKey as string | null | undefined) ?? null,
    upscaleWarningKey: (data.upscaleWarningKey as string | null | undefined) ?? null,
    upscaleModelLabel: (data.upscaleModelLabel as string | null | undefined) ?? null,
    upscaleEffectiveScale:
      data.upscaleEffectiveScale === 2 || data.upscaleEffectiveScale === 4
        ? data.upscaleEffectiveScale
        : null,
    upscaleSmartMode: Boolean(data.upscaleSmartMode),
    bgRemovalReasonKey: (data.bgRemovalReasonKey as string | null | undefined) ?? null,
    bgRemovalModelLabel: (data.bgRemovalModelLabel as string | null | undefined) ?? null,
    bgRemovalSubjectMode: (data.bgRemovalSubjectMode as string | null | undefined) ?? null,
    bgRemovalEdgeQuality: (data.bgRemovalEdgeQuality as string | null | undefined) ?? null,
    bgRemovalSmartMode: Boolean(data.bgRemovalSmartMode),
    bgRemovalShadowRecoveryApplied: Boolean(data.bgRemovalShadowRecoveryApplied),
    bgReplaceBackgroundLabel: (data.bgReplaceBackgroundLabel as string | null | undefined) ?? null,
    bgReplaceUsedAiGeneration: Boolean(data.bgReplaceUsedAiGeneration),
    objectRemoveComplete: Boolean(data.objectRemoveComplete),
    portraitEnhanceReasonKey: (data.portraitEnhanceReasonKey as string | null | undefined) ?? null,
    portraitEnhanceWarningKey: (data.portraitEnhanceWarningKey as string | null | undefined) ?? null,
    portraitEnhanceModelLabel: (data.portraitEnhanceModelLabel as string | null | undefined) ?? null,
    portraitEnhanceStyle: (data.portraitEnhanceStyle as string | null | undefined) ?? null,
    blurFacesReasonKey: (data.blurFacesReasonKey as string | null | undefined) ?? null,
    blurFacesModelLabel: (data.blurFacesModelLabel as string | null | undefined) ?? null,
    compressionLevel:
      data.compressionLevel === 'fast' ||
      data.compressionLevel === 'balanced' ||
      data.compressionLevel === 'max'
        ? data.compressionLevel
        : null,
  };
}

function applyJobResultToState(
  result: JobResultPayload,
  setters: {
    setPreviewUrl: (v: string) => void;
    setCanDownloadHd: (v: boolean) => void;
    setOutputWidth: (v: number | null) => void;
    setOutputHeight: (v: number | null) => void;
    setOutputSizeBytes: (v: number | null) => void;
    setOutputFormatLabel: (v: string | null) => void;
    setSmartFormatSelected: (v: boolean) => void;
    setFormatReasonKey: (v: string | null) => void;
    setSizeReductionPercent: (v: number | null) => void;
    setInputSizeBytes: (v: number | null) => void;
    setContentKind: (v: string | null) => void;
    setBackgroundFillApplied: (v: boolean) => void;
    setUpscaleReasonKey: (v: string | null) => void;
    setUpscaleWarningKey: (v: string | null) => void;
    setUpscaleModelLabel: (v: string | null) => void;
    setUpscaleEffectiveScale: (v: 2 | 4 | null) => void;
    setUpscaleSmartMode: (v: boolean) => void;
    setBgRemovalReasonKey: (v: string | null) => void;
    setBgRemovalModelLabel: (v: string | null) => void;
    setBgRemovalSubjectMode: (v: string | null) => void;
    setBgRemovalEdgeQuality: (v: string | null) => void;
    setBgRemovalSmartMode: (v: boolean) => void;
    setBgRemovalShadowRecoveryApplied: (v: boolean) => void;
    setBgReplaceBackgroundLabel: (v: string | null) => void;
    setBgReplaceUsedAiGeneration: (v: boolean) => void;
    setObjectRemoveComplete: (v: boolean) => void;
    setPortraitEnhanceReasonKey: (v: string | null) => void;
    setPortraitEnhanceWarningKey: (v: string | null) => void;
    setPortraitEnhanceModelLabel: (v: string | null) => void;
    setPortraitEnhanceStyle: (v: string | null) => void;
    setBlurFacesReasonKey: (v: string | null) => void;
    setBlurFacesModelLabel: (v: string | null) => void;
    setCompressionLevel: (v: 'fast' | 'balanced' | 'max' | null) => void;
  }
) {
  setters.setPreviewUrl(result.previewUrl);
  setters.setCanDownloadHd(result.canDownloadHd);
  setters.setOutputWidth(result.outputWidth);
  setters.setOutputHeight(result.outputHeight);
  setters.setOutputSizeBytes(result.outputSizeBytes);
  setters.setOutputFormatLabel(result.outputFormatLabel);
  setters.setSmartFormatSelected(result.smartFormatSelected);
  setters.setFormatReasonKey(result.formatReasonKey);
  setters.setSizeReductionPercent(result.sizeReductionPercent);
  setters.setInputSizeBytes(result.inputSizeBytes);
  setters.setContentKind(result.contentKind);
  setters.setBackgroundFillApplied(result.backgroundFillApplied);
  setters.setUpscaleReasonKey(result.upscaleReasonKey);
  setters.setUpscaleWarningKey(result.upscaleWarningKey);
  setters.setUpscaleModelLabel(result.upscaleModelLabel);
  setters.setUpscaleEffectiveScale(result.upscaleEffectiveScale);
  setters.setUpscaleSmartMode(result.upscaleSmartMode);
  setters.setBgRemovalReasonKey(result.bgRemovalReasonKey);
  setters.setBgRemovalModelLabel(result.bgRemovalModelLabel);
  setters.setBgRemovalSubjectMode(result.bgRemovalSubjectMode);
  setters.setBgRemovalEdgeQuality(result.bgRemovalEdgeQuality);
  setters.setBgRemovalSmartMode(result.bgRemovalSmartMode);
  setters.setBgRemovalShadowRecoveryApplied(result.bgRemovalShadowRecoveryApplied);
  setters.setBgReplaceBackgroundLabel(result.bgReplaceBackgroundLabel);
  setters.setBgReplaceUsedAiGeneration(result.bgReplaceUsedAiGeneration);
  setters.setObjectRemoveComplete(result.objectRemoveComplete);
  setters.setPortraitEnhanceReasonKey(result.portraitEnhanceReasonKey);
  setters.setPortraitEnhanceWarningKey(result.portraitEnhanceWarningKey);
  setters.setPortraitEnhanceModelLabel(result.portraitEnhanceModelLabel);
  setters.setPortraitEnhanceStyle(result.portraitEnhanceStyle);
  setters.setBlurFacesReasonKey(result.blurFacesReasonKey);
  setters.setBlurFacesModelLabel(result.blurFacesModelLabel);
  setters.setCompressionLevel(result.compressionLevel);
}

type Stage = 'configure' | 'processing' | 'result' | 'error';

interface ToolInteractiveProps {
  tool: ToolDefinition;
  userPlan: PlanTier | null;
}

export function ToolInteractive({ tool, userPlan }: ToolInteractiveProps) {
  const t = useTranslations('tool');
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || 'en';

  const canBatch = Boolean(userPlan && planHasFeature(userPlan, 'batchProcessing'));
  const hasCommercialLicense = Boolean(userPlan && planHasFeature(userPlan, 'commercialLicense'));
  const maxResizeQuality = getMaxResizeQuality(userPlan);

  const [stage, setStage] = useState<Stage>('configure');
  const [batchMode, setBatchMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrorKey, setValidationErrorKey] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [canDownloadHd, setCanDownloadHd] = useState(false);
  const [outputWidth, setOutputWidth] = useState<number | null>(null);
  const [outputHeight, setOutputHeight] = useState<number | null>(null);
  const [outputSizeBytes, setOutputSizeBytes] = useState<number | null>(null);
  const [outputFormatLabel, setOutputFormatLabel] = useState<string | null>(null);
  const [smartFormatSelected, setSmartFormatSelected] = useState(false);
  const [formatReasonKey, setFormatReasonKey] = useState<string | null>(null);
  const [sizeReductionPercent, setSizeReductionPercent] = useState<number | null>(null);
  const [inputSizeBytes, setInputSizeBytes] = useState<number | null>(null);
  const [contentKind, setContentKind] = useState<string | null>(null);
  const [backgroundFillApplied, setBackgroundFillApplied] = useState(false);
  const [upscaleReasonKey, setUpscaleReasonKey] = useState<string | null>(null);
  const [upscaleWarningKey, setUpscaleWarningKey] = useState<string | null>(null);
  const [upscaleModelLabel, setUpscaleModelLabel] = useState<string | null>(null);
  const [upscaleEffectiveScale, setUpscaleEffectiveScale] = useState<2 | 4 | null>(null);
  const [upscaleSmartMode, setUpscaleSmartMode] = useState(false);
  const [bgRemovalReasonKey, setBgRemovalReasonKey] = useState<string | null>(null);
  const [bgRemovalModelLabel, setBgRemovalModelLabel] = useState<string | null>(null);
  const [bgRemovalSubjectMode, setBgRemovalSubjectMode] = useState<string | null>(null);
  const [bgRemovalEdgeQuality, setBgRemovalEdgeQuality] = useState<string | null>(null);
  const [bgRemovalSmartMode, setBgRemovalSmartMode] = useState(false);
  const [bgRemovalShadowRecoveryApplied, setBgRemovalShadowRecoveryApplied] = useState(false);
  const [bgReplaceBackgroundLabel, setBgReplaceBackgroundLabel] = useState<string | null>(null);
  const [bgReplaceUsedAiGeneration, setBgReplaceUsedAiGeneration] = useState(false);
  const [objectRemoveComplete, setObjectRemoveComplete] = useState(false);
  const [portraitEnhanceReasonKey, setPortraitEnhanceReasonKey] = useState<string | null>(null);
  const [portraitEnhanceWarningKey, setPortraitEnhanceWarningKey] = useState<string | null>(null);
  const [portraitEnhanceModelLabel, setPortraitEnhanceModelLabel] = useState<string | null>(null);
  const [portraitEnhanceStyle, setPortraitEnhanceStyle] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [batchResults, setBatchResults] = useState<BatchResultItem[]>([]);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [resizeParams, setResizeParams] = useState<ResizeParams>(DEFAULT_RESIZE_PARAMS);
  const [originalImageMeta, setOriginalImageMeta] = useState<{
    width: number;
    height: number;
    sizeBytes: number;
  } | null>(null);
  const [upscaleParams, setUpscaleParams] = useState(DEFAULT_UPSCALE_PARAMS);
  const [convertParams, setConvertParams] = useState(DEFAULT_CONVERT_PARAMS);
  const [bgRemovalParams, setBgRemovalParams] = useState(DEFAULT_BG_REMOVAL_PARAMS);
  const [bgReplaceParams, setBgReplaceParams] = useState(DEFAULT_BG_REPLACE_PARAMS);
  const [objectRemoveParams, setObjectRemoveParams] = useState(DEFAULT_OBJECT_REMOVE_PARAMS);
  const [portraitEnhanceParams, setPortraitEnhanceParams] = useState(DEFAULT_PORTRAIT_ENHANCE_PARAMS);
  const [hasObjectRemoveMask, setHasObjectRemoveMask] = useState(false);
  const objectRemoveEditorRef = useRef<ObjectRemoveEditorHandle>(null);
  const [cropParams, setCropParams] = useState<CropParams>(DEFAULT_CROP_PARAMS);
  const [blurFacesParams, setBlurFacesParams] = useState(DEFAULT_BLUR_FACES_PARAMS);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referencePreviewUrl, setReferencePreviewUrl] = useState<string | null>(null);
  const [blurFacesReasonKey, setBlurFacesReasonKey] = useState<string | null>(null);
  const [blurFacesModelLabel, setBlurFacesModelLabel] = useState<string | null>(null);
  const [compressParams, setCompressParams] = useState(DEFAULT_COMPRESS_PARAMS);
  const [compressionLevel, setCompressionLevel] = useState<'fast' | 'balanced' | 'max' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const isResizeTool = tool.category === 'resize';
  const isUpscaleTool = tool.category === 'upscale';
  const isConvertTool = tool.category === 'convert';
  const isCompressTool = tool.category === 'compress';
  const isBackgroundTool = tool.category === 'background';
  const isBgReplaceTool = tool.category === 'background_replace';
  const isObjectRemoveTool = tool.category === 'object_remove';
  const isPortraitEnhanceTool = tool.category === 'portrait_enhance';
  const isCropTool = tool.category === 'crop';
  const isFacesTool = tool.category === 'faces';
  const supportsBatch = canBatch && !isCropTool && !isFacesTool && !isObjectRemoveTool;
  const hasOptions =
    isResizeTool ||
    isUpscaleTool ||
    isConvertTool ||
    isCompressTool ||
    isBackgroundTool ||
    isBgReplaceTool ||
    isObjectRemoveTool ||
    isPortraitEnhanceTool ||
    isCropTool ||
    isFacesTool;

  useEffect(() => {
    if (!isResizeTool) return;
    setResizeParams((current) => {
      const clamped = clampResizeQuality(current.quality, maxResizeQuality);
      return clamped === current.quality ? current : { ...current, quality: clamped };
    });
  }, [isResizeTool, maxResizeQuality]);

  useEffect(() => {
    if (!isResizeTool) return;
    const preset = getResizePresetById(searchParams.get('preset'));
    if (!preset) return;
    setResizeParams((current) => {
      const next = applyResizePreset(current, preset);
      return {
        ...next,
        quality: clampResizeQuality(next.quality, maxResizeQuality),
      };
    });
  }, [isResizeTool, maxResizeQuality, searchParams]);

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearTimeout(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  const stopProgressSimulation = useCallback(() => {
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
  }, []);

  const startProgressSimulation = useCallback(() => {
    stopProgressSimulation();
    setProgress(8);
    progressTimer.current = setInterval(() => {
      setProgress((current) => {
        if (current >= 92) return current;
        const step = current < 40 ? 6 : current < 70 ? 3 : 1;
        return Math.min(92, current + step);
      });
    }, 400);
  }, [stopProgressSimulation]);

  useEffect(() => {
    return () => {
      stopPolling();
      stopProgressSimulation();
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
      if (referencePreviewUrl) URL.revokeObjectURL(referencePreviewUrl);
    };
  }, [filePreviewUrl, referencePreviewUrl, stopPolling, stopProgressSimulation]);

  useEffect(() => {
    if (stage !== 'processing') return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [stage]);

  const clearReferenceFile = useCallback(() => {
    if (referencePreviewUrl) URL.revokeObjectURL(referencePreviewUrl);
    setReferenceFile(null);
    setReferencePreviewUrl(null);
    setBlurFacesParams((current) => ({ ...current, referenceAssetId: undefined }));
  }, [referencePreviewUrl]);

  const handleReferenceFileChange = useCallback(
    (file: File | null) => {
      if (referencePreviewUrl) URL.revokeObjectURL(referencePreviewUrl);
      setReferenceFile(file);
      setReferencePreviewUrl(file ? URL.createObjectURL(file) : null);
      setBlurFacesParams((current) => ({ ...current, referenceAssetId: undefined }));
    },
    [referencePreviewUrl]
  );

  const clearSelectedFile = useCallback(() => {
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setSelectedFile(null);
    setFilePreviewUrl(null);
    setOriginalImageMeta(null);
    setValidationErrorKey(null);
  }, [filePreviewUrl]);

  const handleFileSelected = useCallback(
    (file: File) => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
      setSelectedFile(file);
      setFilePreviewUrl(URL.createObjectURL(file));
      setValidationErrorKey(null);
      setErrorMessage(null);
      setHasObjectRemoveMask(false);
      void readImageDimensionsFromFile(file).then((dimensions) => {
        if (dimensions) {
          setOriginalImageMeta({
            width: dimensions.width,
            height: dimensions.height,
            sizeBytes: file.size,
          });
          if (tool.category === 'crop') {
            setCropParams((current) => {
              const rect = initCropRectForImage(
                dimensions.width,
                dimensions.height,
                current.aspectRatio
              );
              return { ...current, ...rect };
            });
          }
        } else {
          setOriginalImageMeta(null);
        }
      });
    },
    [filePreviewUrl, tool.category]
  );

  const waitForJobDone = useCallback(
    (
      id: string,
      maxAttempts = 90
    ): Promise<JobResultPayload> =>
      new Promise((resolve, reject) => {
        let attempts = 0;

        const poll = async () => {
          attempts += 1;
          if (attempts > maxAttempts) {
            reject(new Error(t('errorProcessingTimeout')));
            return;
          }

          try {
            const res = await fetch(`/api/jobs/${id}`);
            if (!res.ok) throw new Error(t('errorJobStatus'));
            const data = await res.json();

            if (data.status === 'done') {
              resolve(parseJobResultPayload(data as Record<string, unknown>));
              return;
            }

            if (data.status === 'failed') {
              reject(new Error(data.errorMessage || t('errorProcessingFailed')));
              return;
            }

            pollTimer.current = setTimeout(poll, 2000);
          } catch (err) {
            reject(err instanceof Error ? err : new Error(t('errorJobStatus')));
          }
        };

        void poll();
      }),
    [t]
  );

  const parseApiError = useCallback(
    (body: { error?: string; errorKey?: string; errorDetail?: string }, fallback: string) => {
      const blurFaceErrorKeys = [
        'blurFacesErrorNoFacesInImage',
        'blurFacesErrorNoFaceInPortrait',
        'blurFacesErrorNoMatch',
        'blurFacesErrorDetectionFailed',
        'validationBlurFacesReferenceRequired',
      ] as const;
      if (
        body.errorKey &&
        blurFaceErrorKeys.includes(body.errorKey as (typeof blurFaceErrorKeys)[number])
      ) {
        const base = t(body.errorKey as (typeof blurFaceErrorKeys)[number]);
        return body.errorDetail ? `${base} (${body.errorDetail})` : base;
      }
      if (
        body.errorKey &&
        [
          'errorAiUnavailable',
          'errorAiModelConfig',
          'errorAiBilling',
          'errorAiAuth',
        ].includes(body.errorKey)
      ) {
        return t(body.errorKey as 'errorAiUnavailable');
      }
      const msg = body.error || fallback;
      if (msg.toLowerCase().includes('not enough credits') || msg.toLowerCase().includes('credite')) {
        return t('errorInsufficientCredits');
      }
      if (msg.toLowerCase().includes('replicate api error')) {
        return t('errorAiUnavailable');
      }
      return msg;
    },
    [t]
  );

  const processSingleFile = useCallback(
    async (file: File, params: Record<string, unknown>, referencePortrait?: File | null, maskFile?: File | null) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('toolId', tool.id);
      if (Object.keys(params).length > 0) {
        formData.append('params', JSON.stringify(params));
      }
      if (referencePortrait) {
        formData.append('referenceFile', referencePortrait);
      }
      if (maskFile) {
        formData.append('maskFile', maskFile);
      }

      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) {
        const body = await uploadRes.json().catch(() => ({}));
        throw new Error(parseApiError(body, t('errorUploadFailed')));
      }

      const { jobId: createdJobId } = await uploadRes.json();

      const processRes = await fetch(`/api/jobs/${createdJobId}/process`, { method: 'POST' });
      if (!processRes.ok) {
        const body = await processRes.json().catch(() => ({}));
        throw new Error(parseApiError(body, t('errorProcessingFailed')));
      }

      const processData = await processRes.json();

      if (processData.status === 'done') {
        return {
          jobId: createdJobId,
          ...parseJobResultPayload(processData as Record<string, unknown>),
        };
      }

      const done = await waitForJobDone(createdJobId);
      return { jobId: createdJobId, ...done };
    },
    [tool.id, t, waitForJobDone, parseApiError]
  );

  const handleProcess = useCallback(async () => {
    if (isSubmitting) return;
    if (!selectedFile) {
      setValidationErrorKey('validationFileRequired');
      return;
    }

    const rawParams = buildToolParams(
      tool,
      resizeParams,
      upscaleParams,
      convertParams,
      bgRemovalParams,
      compressParams,
      cropParams,
      blurFacesParams,
      bgReplaceParams,
      objectRemoveParams,
      portraitEnhanceParams
    );
    const validation = validateToolParams(tool, rawParams, {
      referenceFilePresent: Boolean(referenceFile),
      maskFilePresent: hasObjectRemoveMask,
    });

    if (!validation.valid) {
      setValidationErrorKey(validation.errorKey || 'validationGeneric');
      return;
    }

    setValidationErrorKey(null);
    setErrorMessage(null);
    setIsSubmitting(true);
    setStage('processing');
    startProgressSimulation();

    try {
      let fileToProcess = selectedFile;
      let jobParams: Record<string, unknown> = { ...validation.params };
      let maskFile: File | null = null;

      if (isObjectRemoveTool) {
        maskFile = (await objectRemoveEditorRef.current?.exportMaskFile()) ?? null;
        if (!maskFile) {
          setValidationErrorKey('validationObjectRemoveMaskRequired');
          setIsSubmitting(false);
          setStage('configure');
          stopProgressSimulation();
          return;
        }
      }

      if (isFacesTool) {
        const { file, blurredFaceCount } = await blurFacesInBrowser(
          selectedFile,
          blurFacesParams,
          blurFacesParams.detectionMode === 'custom' ? referenceFile : null
        );
        fileToProcess = file;
        jobParams = {
          ...validation.params,
          clientProcessed: true,
          blurFacesCount: blurredFaceCount,
        };
      }

      const result = await processSingleFile(
        fileToProcess,
        jobParams,
        isFacesTool && blurFacesParams.detectionMode === 'custom' ? referenceFile : null,
        maskFile
      );
      setJobId(result.jobId);
      stopProgressSimulation();
      setProgress(100);
      applyJobResultToState(result, {
        setPreviewUrl,
        setCanDownloadHd,
        setOutputWidth,
        setOutputHeight,
        setOutputSizeBytes,
        setOutputFormatLabel,
        setSmartFormatSelected,
        setFormatReasonKey,
        setSizeReductionPercent,
        setInputSizeBytes,
        setContentKind,
        setBackgroundFillApplied,
        setUpscaleReasonKey,
        setUpscaleWarningKey,
        setUpscaleModelLabel,
        setUpscaleEffectiveScale,
        setUpscaleSmartMode,
        setBgRemovalReasonKey,
        setBgRemovalModelLabel,
        setBgRemovalSubjectMode,
        setBgRemovalEdgeQuality,
        setBgRemovalSmartMode,
        setBgRemovalShadowRecoveryApplied,
        setBgReplaceBackgroundLabel,
        setBgReplaceUsedAiGeneration,
        setObjectRemoveComplete,
        setPortraitEnhanceReasonKey,
        setPortraitEnhanceWarningKey,
        setPortraitEnhanceModelLabel,
        setPortraitEnhanceStyle,
        setBlurFacesReasonKey,
        setBlurFacesModelLabel,
        setCompressionLevel,
      });
      setStage('result');
    } catch (err) {
      stopProgressSimulation();
      if (err instanceof FaceBlurError) {
        const base = t(err.errorKey);
        setErrorMessage(err.message && err.message !== err.userMessage ? `${base} (${err.message})` : base);
      } else {
        setErrorMessage(err instanceof Error ? err.message : t('errorGeneric'));
      }
      setStage('error');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    selectedFile,
    tool,
    resizeParams,
    upscaleParams,
    convertParams,
    bgRemovalParams,
    bgReplaceParams,
    objectRemoveParams,
    portraitEnhanceParams,
    hasObjectRemoveMask,
    isObjectRemoveTool,
    compressParams,
    cropParams,
    blurFacesParams,
    referenceFile,
    isFacesTool,
    startProgressSimulation,
    stopProgressSimulation,
    processSingleFile,
    t,
  ]);

  const handleBatchProcess = useCallback(async () => {
    if (isSubmitting) return;
    if (batchFiles.length === 0) {
      setValidationErrorKey('validationFileRequired');
      return;
    }

    const rawParams = buildToolParams(
      tool,
      resizeParams,
      upscaleParams,
      convertParams,
      bgRemovalParams,
      compressParams,
      cropParams,
      blurFacesParams,
      bgReplaceParams,
      objectRemoveParams,
      portraitEnhanceParams
    );
    const validation = validateToolParams(tool, rawParams, {
      referenceFilePresent: Boolean(referenceFile),
      maskFilePresent: hasObjectRemoveMask,
    });

    if (!validation.valid) {
      setValidationErrorKey(validation.errorKey || 'validationGeneric');
      return;
    }

    setValidationErrorKey(null);
    setErrorMessage(null);
    setIsSubmitting(true);
    setStage('processing');
    setBatchProgress({ current: 0, total: batchFiles.length });
    startProgressSimulation();

    const results: BatchResultItem[] = [];

    try {
      for (let i = 0; i < batchFiles.length; i++) {
        setBatchProgress({ current: i + 1, total: batchFiles.length });
        setProgress(Math.round(((i + 0.5) / batchFiles.length) * 90));

        const file = batchFiles[i];
        try {
          let fileParams = validation.params;
          if (isCropTool) {
            const dimensions = await readImageDimensionsFromFile(file);
            if (dimensions) {
              const rect = initCropRectForImage(
                dimensions.width,
                dimensions.height,
                cropParams.aspectRatio
              );
              fileParams = {
                ...cropParams,
                ...rect,
              };
            }
          }
          const result = await processSingleFile(
            file,
            fileParams,
            isFacesTool && blurFacesParams.detectionMode === 'custom' ? referenceFile : null
          );
          results.push({
            fileName: file.name,
            jobId: result.jobId,
            previewUrl: result.previewUrl,
            canDownloadHd: result.canDownloadHd,
            status: 'done',
            inputSizeBytes: result.inputSizeBytes,
            outputSizeBytes: result.outputSizeBytes,
            formatReasonKey: result.formatReasonKey,
            outputWidth: result.outputWidth,
            outputHeight: result.outputHeight,
          });
        } catch (err) {
          results.push({
            fileName: file.name,
            jobId: '',
            previewUrl: '',
            canDownloadHd: false,
            status: 'failed',
            errorMessage: err instanceof Error ? err.message : t('errorGeneric'),
          });
        }
      }

      stopProgressSimulation();
      setProgress(100);
      setBatchResults(results);
      setStage('result');
    } catch (err) {
      stopProgressSimulation();
      setErrorMessage(err instanceof Error ? err.message : t('errorGeneric'));
      setStage('error');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    batchFiles,
    tool,
    resizeParams,
    upscaleParams,
    convertParams,
    bgRemovalParams,
    bgReplaceParams,
    objectRemoveParams,
    portraitEnhanceParams,
    hasObjectRemoveMask,
    isObjectRemoveTool,
    compressParams,
    cropParams,
    blurFacesParams,
    referenceFile,
    isCropTool,
    isFacesTool,
    startProgressSimulation,
    stopProgressSimulation,
    processSingleFile,
    t,
  ]);

  const handleDownload = useCallback(
    async (targetJobId?: string, downloadFileName?: string) => {
      const id = targetJobId || jobId;
      if (!id) return;

      const fallback =
        downloadFileName ||
        (isResizeTool && outputWidth && outputHeight && selectedFile
          ? buildResizeDownloadFilename(selectedFile.name, outputWidth, outputHeight)
          : buildDownloadFallbackFilename('image/webp', id));

      try {
        await triggerBrowserDownload(`/api/assets/${id}/download`, fallback);
      } catch {
        // Keep the result visible; browser may block popups or network failed.
      }
    },
    [jobId, isResizeTool, outputWidth, outputHeight, selectedFile]
  );

  const handleDownloadAll = useCallback(async () => {
    const doneItems = batchResults.filter((item) => item.status === 'done' && item.jobId);
    if (doneItems.length === 0) return;

    try {
      await triggerBrowserDownloadPost(
        '/api/jobs/batch-download',
        {
          items: doneItems.map((item) => ({
            jobId: item.jobId,
            fileName:
              isResizeTool && item.outputWidth && item.outputHeight
                ? buildResizeDownloadFilename(item.fileName, item.outputWidth, item.outputHeight)
                : item.fileName,
          })),
        },
        `pixiqueai-batch-${new Date().toISOString().slice(0, 10)}.zip`
      );
    } catch {
      // Keep results visible if download fails.
    }
  }, [batchResults, isResizeTool]);

  const handleUpgradeClick = useCallback(() => {
    window.location.href = `/${locale}/pricing`;
  }, [locale]);

  const handleReset = useCallback(() => {
    stopPolling();
    stopProgressSimulation();
    clearSelectedFile();
    setBatchFiles([]);
    setBatchResults([]);
    setBatchMode(false);
    setStage('configure');
    setJobId(null);
    setPreviewUrl(null);
    setOutputWidth(null);
    setOutputHeight(null);
    setOutputSizeBytes(null);
    setOutputFormatLabel(null);
    setSmartFormatSelected(false);
    setFormatReasonKey(null);
    setSizeReductionPercent(null);
    setInputSizeBytes(null);
    setContentKind(null);
    setBackgroundFillApplied(false);
    setUpscaleReasonKey(null);
    setUpscaleWarningKey(null);
    setUpscaleModelLabel(null);
    setUpscaleEffectiveScale(null);
    setUpscaleSmartMode(false);
    setBgRemovalReasonKey(null);
    setBgRemovalModelLabel(null);
    setBgRemovalSubjectMode(null);
    setBgRemovalEdgeQuality(null);
    setBgRemovalSmartMode(false);
    setBgRemovalShadowRecoveryApplied(false);
    setBgReplaceBackgroundLabel(null);
    setBgReplaceUsedAiGeneration(false);
    setObjectRemoveComplete(false);
    setPortraitEnhanceReasonKey(null);
    setPortraitEnhanceWarningKey(null);
    setPortraitEnhanceModelLabel(null);
    setPortraitEnhanceStyle(null);
    setHasObjectRemoveMask(false);
    setBlurFacesReasonKey(null);
    setBlurFacesModelLabel(null);
    setCompressionLevel(null);
    setErrorMessage(null);
    setValidationErrorKey(null);
    setProgress(0);
    setBatchProgress({ current: 0, total: 0 });
    setIsSubmitting(false);
    setResizeParams(DEFAULT_RESIZE_PARAMS);
    setOriginalImageMeta(null);
    setUpscaleParams(DEFAULT_UPSCALE_PARAMS);
    setConvertParams(DEFAULT_CONVERT_PARAMS);
    setBgRemovalParams(DEFAULT_BG_REMOVAL_PARAMS);
    setBgReplaceParams(DEFAULT_BG_REPLACE_PARAMS);
    setObjectRemoveParams(DEFAULT_OBJECT_REMOVE_PARAMS);
    setPortraitEnhanceParams(DEFAULT_PORTRAIT_ENHANCE_PARAMS);
    setCropParams(DEFAULT_CROP_PARAMS);
    setBlurFacesParams(DEFAULT_BLUR_FACES_PARAMS);
    clearReferenceFile();
    setCompressParams(DEFAULT_COMPRESS_PARAMS);
  }, [stopPolling, stopProgressSimulation, clearSelectedFile, clearReferenceFile]);

  const validationMessage = validationErrorKey ? t(validationErrorKey) : null;

  const isCreditsError = errorMessage === t('errorInsufficientCredits');

  const processingLabel =
    batchMode && batchProgress.total > 0
      ? t('batchProcessing', { current: batchProgress.current, total: batchProgress.total })
      : undefined;

  return (
    <ToolLayout
      stage={stage}
      className={isCropTool || isObjectRemoveTool ? 'max-w-5xl' : undefined}
      configure={
        <ToolConfigureLayout
          preview={
            batchMode ? (
              <div className="space-y-4">
                <BatchUploadZone
                  acceptedFormats={tool.limits.acceptedFormats}
                  onFilesSelected={(files) => {
                    setBatchFiles(files);
                    setValidationErrorKey(null);
                  }}
                />
                {batchFiles.length > 0 && (
                  <ul className="space-y-1 text-xs text-text-secondary">
                    {batchFiles.map((file) => (
                      <li key={`${file.name}-${file.size}`} className="truncate">
                        {file.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : isObjectRemoveTool && selectedFile && filePreviewUrl && originalImageMeta ? (
              <ObjectRemoveEditor
                ref={objectRemoveEditorRef}
                imageUrl={filePreviewUrl}
                imageWidth={originalImageMeta.width}
                imageHeight={originalImageMeta.height}
                brushSize={objectRemoveParams.brushSize}
                selectionTool={objectRemoveParams.selectionTool}
                onBrushSizeChange={(brushSize) =>
                  setObjectRemoveParams((current) => ({ ...current, brushSize }))
                }
                onSelectionToolChange={(selectionTool) =>
                  setObjectRemoveParams((current) => ({ ...current, selectionTool }))
                }
                onMaskChange={setHasObjectRemoveMask}
              />
            ) : isCropTool && selectedFile && filePreviewUrl && originalImageMeta ? (
              <CropEditor
                imageUrl={filePreviewUrl}
                imageWidth={originalImageMeta.width}
                imageHeight={originalImageMeta.height}
                value={cropParams}
                onChange={setCropParams}
              />
            ) : (
              <ImagePreview
                file={selectedFile}
                previewUrl={filePreviewUrl}
                acceptedFormats={tool.limits.acceptedFormats}
                originalDimensions={
                  originalImageMeta
                    ? { width: originalImageMeta.width, height: originalImageMeta.height }
                    : null
                }
                onFileSelected={handleFileSelected}
                onClear={clearSelectedFile}
              />
            )
          }
          options={
            <>
              {supportsBatch && (
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    className={`text-xs px-3 py-1 rounded-full border ${
                      !batchMode
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border-default text-text-tertiary'
                    }`}
                    onClick={() => setBatchMode(false)}
                  >
                    {t('singleMode')}
                  </button>
                  <button
                    type="button"
                    className={`text-xs px-3 py-1 rounded-full border ${
                      batchMode
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border-default text-text-tertiary'
                    }`}
                    onClick={() => setBatchMode(true)}
                  >
                    {t('batchMode')}
                  </button>
                </div>
              )}
              {isResizeTool && (
                <ResizeOptions
                  value={resizeParams}
                  onChange={setResizeParams}
                  originalDimensions={
                    originalImageMeta
                      ? { width: originalImageMeta.width, height: originalImageMeta.height }
                      : null
                  }
                  originalFileSize={originalImageMeta?.sizeBytes ?? null}
                  maxQuality={maxResizeQuality}
                  error={isResizeTool && validationErrorKey?.startsWith('validationResize') ? validationMessage : null}
                />
              )}
              {isUpscaleTool && <UpscaleOptions value={upscaleParams} onChange={setUpscaleParams} />}
              {isConvertTool && (
                <ConvertOptions
                  value={convertParams}
                  onChange={setConvertParams}
                  imageMimeType={selectedFile?.type ?? null}
                />
              )}
              {isCompressTool && (
                <CompressOptions value={compressParams} onChange={setCompressParams} />
              )}
              {isBackgroundTool && (
                <BgRemovalOptions value={bgRemovalParams} onChange={setBgRemovalParams} />
              )}
              {isBgReplaceTool && (
                <BgReplaceOptions value={bgReplaceParams} onChange={setBgReplaceParams} />
              )}
              {isObjectRemoveTool && (
                <ObjectRemoveOptions value={objectRemoveParams} onChange={setObjectRemoveParams} />
              )}
              {isPortraitEnhanceTool && (
                <PortraitEnhanceOptions
                  value={portraitEnhanceParams}
                  onChange={setPortraitEnhanceParams}
                />
              )}
              {isFacesTool && (
                <BlurFacesOptions
                  value={blurFacesParams}
                  onChange={setBlurFacesParams}
                  onReferenceFileChange={handleReferenceFileChange}
                  referencePreviewUrl={referencePreviewUrl}
                />
              )}
              {!hasOptions && (
                <div className="rounded-lg border border-border-default bg-background-secondary p-4">
                  <p className="text-sm font-medium text-text-primary">{t('readyToProcess')}</p>
                  <p className="mt-1 text-xs text-text-tertiary">{t('readyToProcessHint')}</p>
                </div>
              )}
              {validationErrorKey === 'validationFileRequired' && (
                <p className="text-xs text-danger">{validationMessage}</p>
              )}
              {validationErrorKey === 'validationUpscaleInvalid' && (
                <p className="text-xs text-danger">{validationMessage}</p>
              )}
              {validationErrorKey === 'validationBgRemovalInvalid' && (
                <p className="text-xs text-danger">{validationMessage}</p>
              )}
              {validationErrorKey?.startsWith('validationBgReplace') && (
                <p className="text-xs text-danger">{validationMessage}</p>
              )}
              {validationErrorKey?.startsWith('validationObjectRemove') && (
                <p className="text-xs text-danger">{validationMessage}</p>
              )}
              {validationErrorKey === 'validationPortraitEnhanceInvalid' && (
                <p className="text-xs text-danger">{validationMessage}</p>
              )}
              {validationErrorKey?.startsWith('validationCrop') && (
                <p className="text-xs text-danger">{validationMessage}</p>
              )}
              {validationErrorKey?.startsWith('validationBlurFaces') && (
                <p className="text-xs text-danger">{validationMessage}</p>
              )}
              {validationErrorKey === 'validationCompressInvalid' && (
                <p className="text-xs text-danger">{validationMessage}</p>
              )}
            </>
          }
          actions={
            <div className="space-y-2">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                disabled={
                  isSubmitting ||
                  (batchMode ? batchFiles.length === 0 : !selectedFile)
                }
                onClick={() => void (batchMode ? handleBatchProcess() : handleProcess())}
              >
                {isSubmitting
                  ? t('processingButton')
                  : batchMode
                    ? t('batchProcessButton', { count: batchFiles.length || 0 })
                    : t('processButton')}
              </Button>
              {batchMode && batchFiles.length > 0 ? (
                <div className="space-y-1 text-center text-xs text-text-tertiary">
                  <p>
                    {t('batchCreditsTotal', {
                      count: batchFiles.length,
                      total: batchFiles.length * tool.creditsCost,
                    })}
                  </p>
                  <p>{t('creditsPerImageHint', { cost: tool.creditsCost })}</p>
                </div>
              ) : (
                !batchMode &&
                selectedFile && (
                  <p className="text-center text-xs text-text-tertiary">
                    {isUpscaleTool || isBackgroundTool || isFacesTool
                      ? t('creditsAiToolHint', { cost: tool.creditsCost })
                      : t('creditsPerImageHint', { cost: tool.creditsCost })}
                  </p>
                )
              )}
            </div>
          }
        />
      }
      processing={
        <ProcessingState
          progress={progress}
          label={processingLabel}
          isAiTool={tool.type === 'ai'}
          isUpscaleTool={isUpscaleTool}
          isFacesTool={isFacesTool}
        />
      }
      result={
        batchMode && batchResults.length > 0 ? (
          <BatchResultsView
            results={batchResults}
            hasCommercialLicense={hasCommercialLicense}
            showCompressionStats={tool.category === 'compress' || tool.category === 'convert'}
            onDownload={(id) => {
              const item = batchResults.find((entry) => entry.jobId === id);
              const downloadFileName =
                isResizeTool && item?.outputWidth && item?.outputHeight
                  ? buildResizeDownloadFilename(item.fileName, item.outputWidth, item.outputHeight)
                  : undefined;
              void handleDownload(id, downloadFileName);
            }}
            onDownloadAll={() => void handleDownloadAll()}
            onReset={handleReset}
          />
        ) : previewUrl ? (
          <div className="p-6">
            <ResultView
              previewUrl={previewUrl}
              canDownloadHd={canDownloadHd}
              hasCommercialLicense={hasCommercialLicense}
              outputWidth={outputWidth}
              outputHeight={outputHeight}
              outputSizeBytes={outputSizeBytes}
              outputFormatLabel={outputFormatLabel}
              smartFormatSelected={smartFormatSelected}
              formatReasonKey={formatReasonKey}
              sizeReductionPercent={sizeReductionPercent}
              inputSizeBytes={inputSizeBytes}
              contentKind={contentKind}
              backgroundFillApplied={backgroundFillApplied}
              upscaleReasonKey={upscaleReasonKey}
              upscaleWarningKey={upscaleWarningKey}
              upscaleModelLabel={upscaleModelLabel}
              upscaleEffectiveScale={upscaleEffectiveScale}
              upscaleSmartMode={upscaleSmartMode}
              bgRemovalReasonKey={bgRemovalReasonKey}
              bgRemovalModelLabel={bgRemovalModelLabel}
              bgRemovalSubjectMode={bgRemovalSubjectMode}
              bgRemovalEdgeQuality={bgRemovalEdgeQuality}
              bgRemovalSmartMode={bgRemovalSmartMode}
              bgRemovalShadowRecoveryApplied={bgRemovalShadowRecoveryApplied}
              bgReplaceBackgroundLabel={bgReplaceBackgroundLabel}
              bgReplaceUsedAiGeneration={bgReplaceUsedAiGeneration}
              objectRemoveComplete={objectRemoveComplete}
              portraitEnhanceReasonKey={portraitEnhanceReasonKey}
              portraitEnhanceWarningKey={portraitEnhanceWarningKey}
              portraitEnhanceModelLabel={portraitEnhanceModelLabel}
              portraitEnhanceStyle={portraitEnhanceStyle}
              blurFacesReasonKey={blurFacesReasonKey}
              blurFacesModelLabel={blurFacesModelLabel}
              isCompressOnly={isCompressTool}
              compressionLevel={compressionLevel}
              sizeCompareOutputLabel={isResizeTool ? 'result' : 'compressed'}
              beforePreviewUrl={
                isUpscaleTool || isFacesTool || isPortraitEnhanceTool ? filePreviewUrl : null
              }
              inputWidth={originalImageMeta?.width ?? null}
              inputHeight={originalImageMeta?.height ?? null}
              onDownload={() => void handleDownload()}
              onUpgradeClick={handleUpgradeClick}
              onReset={handleReset}
            />
          </div>
        ) : null
      }
      error={
        <div className="flex flex-col items-center gap-3 p-12 text-center">
          <p className="text-sm text-danger">{errorMessage || t('errorGeneric')}</p>
          {isCreditsError && (
            <Button variant="primary" size="sm" onClick={handleUpgradeClick}>
              {t('upgradeForCredits')}
            </Button>
          )}
          <Button variant="ghost" onClick={handleReset}>
            {t('tryAgain')}
          </Button>
        </div>
      }
    />
  );
}
