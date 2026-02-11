export class MicroserviceRequestError extends Error {
  constructor(
    public readonly endpoint: string,
    public readonly cause: Error,
  ) {
    super(`Request to ${endpoint} failed: ${cause.message}`);
    this.name = 'MicroserviceRequestError';
  }
}

export class ContractValidationError extends Error {
  constructor(
    public readonly endpoint: string,
    public readonly cause: Error,
  ) {
    super(
      `Response from ${endpoint} does not match contract: ${cause.message}`,
    );
    this.name = 'ContractValidationError';
  }
}
