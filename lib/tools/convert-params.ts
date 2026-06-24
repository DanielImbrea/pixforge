export interface ConvertParams {
  targetFormat: 'auto' | 'avif' | 'webp' | 'png' | 'jpeg';
  qualityIntent: 'fast' | 'balanced' | 'max';
  backgroundFill: 'white' | 'black' | 'blur' | 'auto';
}

export const DEFAULT_CONVERT_PARAMS: ConvertParams = {
  targetFormat: 'auto',
  qualityIntent: 'balanced',
  backgroundFill: 'white',
};
