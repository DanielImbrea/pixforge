export type PortraitEnhanceStyle = 'natural' | 'glamour' | 'restore';

export interface PortraitEnhanceParams {
  enhanceStyle: PortraitEnhanceStyle;
}

export const DEFAULT_PORTRAIT_ENHANCE_PARAMS: PortraitEnhanceParams = {
  enhanceStyle: 'natural',
};
