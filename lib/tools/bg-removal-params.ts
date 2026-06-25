export type BgSubjectModeInput = 'auto' | 'product' | 'portrait' | 'object';
export type BgEdgeQuality = 'standard' | 'high' | 'studio';

export interface BgRemovalParams {
  subjectMode: BgSubjectModeInput;
  edgeQuality: BgEdgeQuality;
  shadowRecovery: boolean;
}

export const DEFAULT_BG_REMOVAL_PARAMS: BgRemovalParams = {
  subjectMode: 'auto',
  edgeQuality: 'high',
  shadowRecovery: false,
};
