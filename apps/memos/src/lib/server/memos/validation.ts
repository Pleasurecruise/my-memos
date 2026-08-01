import { z } from "zod";

const MAX_D1_LIKE_PATTERN_BYTES = 50;
const LIKE_WILDCARD_BYTES = 2;

export const MAX_MEMO_SEARCH_BYTES = MAX_D1_LIKE_PATTERN_BYTES - LIKE_WILDCARD_BYTES;

export function isMemoSearchWithinLimit(value: string): boolean {
  return new TextEncoder().encode(value).byteLength <= MAX_MEMO_SEARCH_BYTES;
}

export function isValidMemoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

export const memoSearchSchema = z
  .string()
  .trim()
  .refine(isMemoSearchWithinLimit, `Search must be at most ${MAX_MEMO_SEARCH_BYTES} UTF-8 bytes.`);

export const memoDateSchema = z
  .string()
  .refine(isValidMemoDate, "Date must be a valid YYYY-MM-DD value.");
