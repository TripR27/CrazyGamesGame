export type SaveErrorReason = 'corrupt' | 'too-new';

export class SaveError extends Error {
  readonly reason: SaveErrorReason;

  constructor(reason: SaveErrorReason, message: string) {
    super(message);
    this.name = 'SaveError';
    this.reason = reason;
  }
}
