export type ReplicateUserErrorKey =
  | 'errorAiUnavailable'
  | 'errorAiModelConfig'
  | 'errorAiBilling'
  | 'errorAiAuth';

export interface MappedReplicateError {
  userMessage: string;
  errorKey: ReplicateUserErrorKey;
  logMessage: string;
  logContext: Record<string, unknown>;
  errorDetail?: string;
}

function parseReplicateApiDetail(apiBody?: string): string | undefined {
  if (!apiBody) return undefined;
  try {
    const parsed = JSON.parse(apiBody) as { detail?: string; title?: string };
    const detail = parsed.detail || parsed.title;
    return detail?.slice(0, 300);
  } catch {
    return apiBody.slice(0, 300);
  }
}

const USER_MESSAGES: Record<ReplicateUserErrorKey, string> = {
  errorAiUnavailable:
    'The AI service is temporarily unavailable. Please try again in a few minutes.',
  errorAiModelConfig:
    'This AI tool is not configured correctly on the server. Please try again later or contact support.',
  errorAiBilling:
    'The AI service could not run this job. Please contact support if this continues.',
  errorAiAuth:
    'The AI service could not be reached. Please try again later.',
};

export function getReplicateUserMessage(key: ReplicateUserErrorKey): string {
  return USER_MESSAGES[key];
}

const BLUR_FACES_NO_FACES = 'No faces were detected.';
const BLUR_FACES_DETECTION_FAILED = 'Face detection failed.';
const BLUR_FACES_UNAVAILABLE =
  'The AI service is temporarily unavailable. Please try again in a few minutes.';

/** Map raw Replicate prediction errors to user-safe blur-faces messages. */
export function mapBlurFacesUserError(raw: string | null | undefined): string {
  if (!raw) return BLUR_FACES_UNAVAILABLE;
  const lower = raw.toLowerCase();
  if (
    lower.includes('no face') ||
    lower.includes('no faces') ||
    lower.includes('face not found') ||
    lower.includes('0 face')
  ) {
    return BLUR_FACES_NO_FACES;
  }
  if (
    lower.includes('detect') ||
    lower.includes('recognition') ||
    lower.includes('landmark') ||
    lower.includes('face match')
  ) {
    return BLUR_FACES_DETECTION_FAILED;
  }
  return BLUR_FACES_UNAVAILABLE;
}

export function mapReplicateError(
  err: unknown,
  context: {
    jobId?: string;
    toolCategory?: string;
    model?: string;
    version?: string;
    httpStatus?: number;
    apiBody?: string;
  } = {}
): MappedReplicateError {
  const message = err instanceof Error ? err.message : String(err);
  const status =
    context.httpStatus ??
    (() => {
      const match = message.match(/\((\d{3})\)/);
      return match ? Number(match[1]) : undefined;
    })();

  const apiBody = context.apiBody ?? (message.includes('{') ? message : undefined);
  const errorDetail = parseReplicateApiDetail(apiBody);
  const logContext = {
    jobId: context.jobId,
    toolCategory: context.toolCategory,
    model: context.model,
    version: context.version,
    httpStatus: status,
    apiBody: apiBody?.slice(0, 500),
    internalMessage: message,
  };

  if (
    message.includes('REPLICATE_API_TOKEN is required') ||
    message.includes('Invalid Replicate model slug')
  ) {
    return {
      userMessage: USER_MESSAGES.errorAiAuth,
      errorKey: 'errorAiAuth',
      logMessage: '[replicate] missing or invalid configuration',
      logContext,
      errorDetail,
    };
  }

  if (status === 401 || status === 403) {
    return {
      userMessage: USER_MESSAGES.errorAiAuth,
      errorKey: 'errorAiAuth',
      logMessage: `[replicate] auth error status=${status}`,
      logContext,
      errorDetail,
    };
  }

  if (status === 402) {
    return {
      userMessage: USER_MESSAGES.errorAiBilling,
      errorKey: 'errorAiBilling',
      logMessage: `[replicate] billing/payment required status=${status}`,
      logContext,
      errorDetail,
    };
  }

  if (
    status === 404 ||
    status === 422 ||
    message.includes('not found') ||
    message.includes('background-removal') ||
    message.includes('no published version') ||
    apiBody?.toLowerCase().includes('version')
  ) {
    return {
      userMessage: USER_MESSAGES.errorAiModelConfig,
      errorKey: 'errorAiModelConfig',
      logMessage: `[replicate] model/version/input error status=${status ?? 'unknown'}`,
      logContext,
      errorDetail,
    };
  }

  if (status && status >= 500) {
    return {
      userMessage: USER_MESSAGES.errorAiUnavailable,
      errorKey: 'errorAiUnavailable',
      logMessage: `[replicate] upstream error status=${status}`,
      logContext,
      errorDetail,
    };
  }

  return {
    userMessage: USER_MESSAGES.errorAiUnavailable,
    errorKey: 'errorAiUnavailable',
    logMessage: `[replicate] job submission failed`,
    logContext,
    errorDetail,
  };
}
