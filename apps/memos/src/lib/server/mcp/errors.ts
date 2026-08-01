import type { DomainErrorCode } from "./types";

export class DomainError extends Error {
  constructor(
    readonly code: DomainErrorCode,
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export function normalizeDomainError(error: unknown): DomainError {
  if (error instanceof DomainError) return error;
  const message = error instanceof Error ? error.message : String(error);
  if (/not found/i.test(message)) return new DomainError("not_found", message, error);
  if (/abort|timeout/i.test(message))
    return new DomainError("timeout", "Operation cancelled or timed out.", error);
  return new DomainError("internal_failure", "The operation failed.", error);
}
