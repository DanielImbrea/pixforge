import { createAdminClient } from '@/lib/supabase/admin';
import { PLAN_LIMITS } from '@/lib/billing/plans';
import type { ToolDefinition, ToolUsageRow, UserRow } from '@/types';

export class QuotaExceededError extends Error {
  readonly needed: number;
  readonly remaining: number;
  readonly plan: string;

  constructor(plan: string, needed: number, remaining: number) {
    super(`Not enough credits: need ${needed}, ${remaining} remaining on ${plan}.`);
    this.name = 'QuotaExceededError';
    this.plan = plan;
    this.needed = needed;
    this.remaining = remaining;
  }
}

export class PlanRestrictedError extends Error {
  constructor(toolId: string, plan: string) {
    super(`Tool ${toolId} is not available on plan ${plan}`);
    this.name = 'PlanRestrictedError';
  }
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function currentMonthStart(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

export function canDownloadHd(user: UserRow): boolean {
  return PLAN_LIMITS[user.plan].hdDownloads;
}

export function maxUploadMbForTool(user: UserRow, tool: ToolDefinition): number {
  const toolLimit = tool.limits.maxUploadMB[user.plan];
  const planLimit = PLAN_LIMITS[user.plan].maxUploadMB;
  return Math.min(toolLimit, planLimit);
}

export function getCreditsLimit(plan: UserRow['plan']): number {
  return PLAN_LIMITS[plan].creditsPerPeriod;
}

export function getCreditsUsed(usage: ToolUsageRow | null | undefined): number {
  return usage?.unit_count ?? 0;
}

export function getRemainingCredits(plan: UserRow['plan'], usage: ToolUsageRow | null | undefined): number {
  return Math.max(0, getCreditsLimit(plan) - getCreditsUsed(usage));
}

async function getOrCreateUsage(userId: string, periodStart: string): Promise<ToolUsageRow> {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from('tool_usage')
    .select('*')
    .eq('user_id', userId)
    .eq('period_start', periodStart)
    .maybeSingle();

  if (existing) return existing as ToolUsageRow;

  const { data: created, error } = await supabase
    .from('tool_usage')
    .insert({ user_id: userId, period_start: periodStart, process_count: 0, unit_count: 0 })
    .select('*')
    .single();

  if (error || !created) {
    throw new Error(`Failed to initialize usage row: ${error?.message}`);
  }

  return created as ToolUsageRow;
}

export async function checkQuota(user: UserRow, tool: ToolDefinition): Promise<void> {
  if (!tool.enabledOnPlans.includes(user.plan)) {
    throw new PlanRestrictedError(tool.id, user.plan);
  }

  const planConfig = PLAN_LIMITS[user.plan];
  const periodStart = planConfig.periodType === 'daily' ? todayDateString() : currentMonthStart();
  const usage = await getOrCreateUsage(user.id, periodStart);
  const remaining = getRemainingCredits(user.plan, usage);

  if (tool.creditsCost > remaining) {
    throw new QuotaExceededError(user.plan, tool.creditsCost, remaining);
  }
}

export async function incrementUsage(user: UserRow, unitsCost: number): Promise<void> {
  const supabase = createAdminClient();
  const planConfig = PLAN_LIMITS[user.plan];
  const periodStart = planConfig.periodType === 'daily' ? todayDateString() : currentMonthStart();
  const usage = await getOrCreateUsage(user.id, periodStart);

  await supabase
    .from('tool_usage')
    .update({
      process_count: usage.process_count + 1,
      unit_count: usage.unit_count + unitsCost,
    })
    .eq('id', usage.id);
}
