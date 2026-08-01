import type { z } from "zod";

export type DomainErrorCode =
  | "invalid_input"
  | "not_found"
  | "timeout"
  | "upstream_failure"
  | "internal_failure";

export interface DomainOperation {
  name: string;
  description: string;
  schema: z.ZodType;
  mutation?: boolean;
  execute(input: unknown, signal: AbortSignal): Promise<unknown>;
}

export type DomainOperationDefinition<TSchema extends z.ZodType> = Omit<
  DomainOperation,
  "schema" | "execute"
> & {
  schema: TSchema;
  execute(input: z.output<TSchema>, signal: AbortSignal): Promise<unknown>;
};

export type McpPrincipal = "user" | "api-key";
