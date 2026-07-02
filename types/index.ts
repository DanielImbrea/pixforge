import type { Locale } from '@/i18n';

export type PlanTier = 'free' | 'basic' | 'starter' | 'pro';

export type ToolType = 'sharp' | 'ai';

export type ToolCategory =
  | 'upscale'
  | 'background'
  | 'background_replace'
  | 'object_remove'
  | 'portrait_enhance'
  | 'resize'
  | 'compress'
  | 'convert'
  | 'crop'
  | 'faces';

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ToolSeoTranslation {
  title: string;
  metaDescription: string;
  h1: string;
  intro: string;
  benefits: string[];
  faq: FaqItem[];
  keywords: string[];
  howItWorks?: string;
  bestFor?: string[];
  useCases?: string[];
  aiExplanation?: string[];
}

export interface ToolSEOConfig {
  translations: Record<Locale, ToolSeoTranslation>;
}

export interface ToolLimits {
  maxUploadMB: Record<PlanTier, number>;
  acceptedFormats: string[];
  maxDimensionPx?: number;
}

export type SharpOperation = 'resize' | 'compress' | 'convert' | 'crop';

export interface ToolProcessorConfig {
  sharpOperation?: SharpOperation;
  sharpDefaults?: Record<string, unknown>;
  aiProvider?: 'mock' | 'replicate';
  aiModelId?: string;
  aiWebhookPath?: string;
}

export interface ToolDefinition {
  id: string;
  slug: Record<Locale, string>;
  name: Record<Locale, string>;
  category: ToolCategory;
  type: ToolType;
  creditsCost: number;
  enabledOnPlans: PlanTier[];
  processorConfig: ToolProcessorConfig;
  limits: ToolLimits;
  seo: ToolSEOConfig;
  icon: string;
  enabled: boolean;
  order: number;
  badge?: 'new' | 'popular' | 'pro';
}

export type JobStatus = 'pending' | 'processing' | 'done' | 'failed';

export interface ImageJobRow {
  id: string;
  user_id: string;
  tool_id: string;
  input_asset_id: string;
  output_asset_id: string | null;
  preview_asset_id: string | null;
  status: JobStatus;
  params: Record<string, unknown>;
  units_cost: number;
  credits_charged: boolean;
  error_message: string | null;
  provider_job_id: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: PlanTier;
  role: 'user' | 'admin';
  stripe_customer_id: string | null;
  locale: Locale;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface StorageFileRow {
  id: string;
  user_id: string;
  bucket: 'uploads' | 'outputs' | 'previews';
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  width_px: number | null;
  height_px: number | null;
  created_at: string;
  expires_at: string | null;
}

export interface ImageAssetRow {
  id: string;
  user_id: string;
  storage_file_id: string;
  asset_type: 'input' | 'output' | 'preview';
  is_watermarked: boolean;
  created_at: string;
}

export interface ToolUsageRow {
  id: string;
  user_id: string;
  period_start: string;
  process_count: number;
  unit_count: number;
  created_at: string;
  updated_at: string;
}
