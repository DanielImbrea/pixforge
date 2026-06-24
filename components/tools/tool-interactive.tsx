'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { PlanTier, ToolDefinition } from '@/types';
import { Button } from '@/components/ui/button';
import { planHasFeature } from '@/lib/billing/plan-features';
import { BatchUploadZone } from './batch-upload-zone';
import { BatchResultsView, type BatchResultItem } from './batch-results-view';
import { ImagePreview } from './image-preview';
import { ProcessingState } from './processing-state';
import { ResultView } from './result-view';
import { ResizeOptions } from './resize-options';
import { ConvertOptions } from './convert-options';
import { UpscaleOptions } from './upscale-options';
import { DEFAULT_CONVERT_PARAMS } from '@/lib/tools/convert-params';
import { DEFAULT_UPSCALE_PARAMS } from '@/lib/tools/upscale-params';
import { BgRemovalOptions } from './bg-removal-options';
import { DEFAULT_BG_REMOVAL_PARAMS } from '@/lib/tools/bg-removal-params';
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
}

type Stage = 'configure' | 'processing' | 'result' | 'error';

interface ToolInteractiveProps {
  tool: ToolDefinition;
  userPlan: PlanTier | null;
}

export function ToolInteractive({ tool, userPlan }: ToolInteractiveProps) {
  const t = useTranslations('tool');
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const canBatch = Boolean(userPlan && planHasFeature(userPlan, 'batchProcessing'));
  const hasCommercialLicense = Boolean(userPlan && planHasFeature(userPlan, 'commercialLicense'));

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [batchResults, setBatchResults] = useState<BatchResultItem[]>([]);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [resizeParams, setResizeParams] = useState<{ width?: number; height?: number }>({});
  const [upscaleParams, setUpscaleParams] = useState(DEFAULT_UPSCALE_PARAMS);
  const [convertParams, setConvertParams] = useState(DEFAULT_CONVERT_PARAMS);
  const [bgRemovalParams, setBgRemovalParams] = useState(DEFAULT_BG_REMOVAL_PARAMS);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const isResizeTool = tool.category === 'resize';
  const isUpscaleTool = tool.category === 'upscale';
  const isConvertTool = tool.category === 'convert';
  const isBackgroundTool = tool.category === 'background';
  const hasOptions = isResizeTool || isUpscaleTool || isConvertTool || isBackgroundTool;

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
    };
  }, [filePreviewUrl, stopPolling, stopProgressSimulation]);

  useEffect(() => {
    if (stage !== 'processing') return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [stage]);

  const clearSelectedFile = useCallback(() => {
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setSelectedFile(null);
    setFilePreviewUrl(null);
    setValidationErrorKey(null);
  }, [filePreviewUrl]);

  const handleFileSelected = useCallback(
    (file: File) => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
      setSelectedFile(file);
      setFilePreviewUrl(URL.createObjectURL(file));
      setValidationErrorKey(null);
      setErrorMessage(null);
    },
    [filePreviewUrl]
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
    (body: { error?: string }, fallback: string) => {
      const msg = body.error || fallback;
      if (msg.toLowerCase().includes('not enough credits') || msg.toLowerCase().includes('credite')) {
        return t('errorInsufficientCredits');
      }
      return msg;
    },
    [t]
  );

  const processSingleFile = useCallback(
    async (file: File, params: Record<string, unknown>) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('toolId', tool.id);
      if (Object.keys(params).length > 0) {
        formData.append('params', JSON.stringify(params));
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
        throw new Error(body.error || t('errorProcessingFailed'));
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

    const rawParams = buildToolParams(tool, resizeParams, upscaleParams, convertParams, bgRemovalParams);
    const validation = validateToolParams(tool, rawParams);

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
      const result = await processSingleFile(selectedFile, validation.params);
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
      });
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
    selectedFile,
    tool,
    resizeParams,
    upscaleParams,
    convertParams,
    bgRemovalParams,
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

    const rawParams = buildToolParams(tool, resizeParams, upscaleParams, convertParams, bgRemovalParams);
    const validation = validateToolParams(tool, rawParams);

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
          const result = await processSingleFile(file, validation.params);
          results.push({
            fileName: file.name,
            jobId: result.jobId,
            previewUrl: result.previewUrl,
            canDownloadHd: result.canDownloadHd,
            status: 'done',
            inputSizeBytes: result.inputSizeBytes,
            outputSizeBytes: result.outputSizeBytes,
            formatReasonKey: result.formatReasonKey,
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
    startProgressSimulation,
    stopProgressSimulation,
    processSingleFile,
    t,
  ]);

  const handleDownload = useCallback(async (targetJobId?: string) => {
    const id = targetJobId || jobId;
    if (!id) return;

    try {
      await triggerBrowserDownload(
        `/api/assets/${id}/download`,
        buildDownloadFallbackFilename('image/webp', id)
      );
    } catch {
      // Keep the result visible; browser may block popups or network failed.
    }
  }, [jobId]);

  const handleDownloadAll = useCallback(async () => {
    const doneItems = batchResults.filter((item) => item.status === 'done' && item.jobId);
    if (doneItems.length === 0) return;

    try {
      await triggerBrowserDownloadPost(
        '/api/jobs/batch-download',
        {
          items: doneItems.map((item) => ({
            jobId: item.jobId,
            fileName: item.fileName,
          })),
        },
        `pixiqueai-batch-${new Date().toISOString().slice(0, 10)}.zip`
      );
    } catch {
      // Keep results visible if download fails.
    }
  }, [batchResults]);

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
    setErrorMessage(null);
    setValidationErrorKey(null);
    setProgress(0);
    setBatchProgress({ current: 0, total: 0 });
    setIsSubmitting(false);
    setResizeParams({});
    setUpscaleParams(DEFAULT_UPSCALE_PARAMS);
    setConvertParams(DEFAULT_CONVERT_PARAMS);
    setBgRemovalParams(DEFAULT_BG_REMOVAL_PARAMS);
  }, [stopPolling, stopProgressSimulation, clearSelectedFile]);

  const validationMessage = validationErrorKey ? t(validationErrorKey) : null;

  const isCreditsError = errorMessage === t('errorInsufficientCredits');

  const processingLabel =
    batchMode && batchProgress.total > 0
      ? t('batchProcessing', { current: batchProgress.current, total: batchProgress.total })
      : undefined;

  return (
    <ToolLayout
      stage={stage}
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
            ) : (
              <ImagePreview
                file={selectedFile}
                previewUrl={filePreviewUrl}
                acceptedFormats={tool.limits.acceptedFormats}
                onFileSelected={handleFileSelected}
                onClear={clearSelectedFile}
              />
            )
          }
          options={
            <>
              {canBatch && (
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
                  error={isResizeTool && validationErrorKey?.startsWith('validationResize') ? validationMessage : null}
                />
              )}
              {isUpscaleTool && <UpscaleOptions value={upscaleParams} onChange={setUpscaleParams} />}
              {isConvertTool && <ConvertOptions value={convertParams} onChange={setConvertParams} />}
              {isBackgroundTool && (
                <BgRemovalOptions value={bgRemovalParams} onChange={setBgRemovalParams} />
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
            </>
          }
          actions={
            <div className="space-y-2">
              <Button
                variant="primary"
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
                    {t('creditsPerImageHint', { cost: tool.creditsCost })}
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
        />
      }
      result={
        batchMode && batchResults.length > 0 ? (
          <BatchResultsView
            results={batchResults}
            hasCommercialLicense={hasCommercialLicense}
            showCompressionStats={tool.category === 'compress' || tool.category === 'convert'}
            onDownload={(id) => void handleDownload(id)}
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
