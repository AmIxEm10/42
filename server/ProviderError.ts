export class ProviderError extends Error {
  constructor(public readonly code: string, public readonly httpStatus = 502, public readonly retryAfterMs = 0) {
    super(code);
    this.name = 'ProviderError';
  }
}
