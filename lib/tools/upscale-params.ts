export type UpscaleScaleInput = 'smart' | 2 | 4;

export interface UpscaleParams {
  scale: UpscaleScaleInput;
}

export const DEFAULT_UPSCALE_PARAMS: UpscaleParams = {
  scale: 'smart',
};
