export class SamSegmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SamSegmentError';
  }
}
