export type FaceBlurErrorKey =
  | 'blurFacesErrorNoFacesInImage'
  | 'blurFacesErrorNoFaceInPortrait'
  | 'blurFacesErrorNoMatch'
  | 'blurFacesErrorDetectionFailed';

export class FaceBlurError extends Error {
  constructor(
    message: string,
    readonly userMessage: string,
    readonly errorKey: FaceBlurErrorKey = 'blurFacesErrorDetectionFailed'
  ) {
    super(message);
    this.name = 'FaceBlurError';
  }
}
