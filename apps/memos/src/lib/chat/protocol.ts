import { z } from "zod";
import type { ChatEvent, ChatMessage } from "./types";

const toolBase = {
  type: z.literal("tool"),
  toolCallId: z.string().min(1),
  toolName: z.string().min(1),
  input: z.unknown(),
};

const textPartSchema = z.object({ type: z.literal("text"), text: z.string() });

const partSchema = z.union([
  textPartSchema,
  z.object({ ...toolBase, state: z.literal("input-available") }),
  z.object({ ...toolBase, state: z.literal("output-available"), output: z.unknown() }),
  z.object({ ...toolBase, state: z.literal("output-error"), errorText: z.string() }),
]);

const messageSchema: z.ZodType<ChatMessage> = z.discriminatedUnion("role", [
  z.object({ id: z.string().min(1), role: z.literal("user"), parts: z.array(textPartSchema) }),
  z.object({
    id: z.string().min(1),
    role: z.literal("assistant"),
    steps: z.array(z.object({ parts: z.array(partSchema) })),
  }),
]);

export const chatRequestSchema = z.object({
  messages: z
    .array(messageSchema)
    .nonempty()
    .refine((messages) => messages.at(-1)?.role === "user", "The last message must be user."),
});

const chatEventSchema: z.ZodType<ChatEvent> = z.discriminatedUnion("type", [
  z.object({ type: z.literal("assistant-step") }),
  z.object({ type: z.literal("text-delta"), delta: z.string() }),
  z.object({
    type: z.literal("tool-input"),
    toolCallId: z.string(),
    toolName: z.string(),
    input: z.unknown(),
  }),
  z.object({ type: z.literal("tool-output"), toolCallId: z.string(), output: z.unknown() }),
  z.object({ type: z.literal("tool-error"), toolCallId: z.string(), errorText: z.string() }),
  z.object({ type: z.literal("error"), message: z.string() }),
  z.object({ type: z.literal("finish") }),
]);

export function parseChatEvent(line: string): ChatEvent {
  return chatEventSchema.parse(JSON.parse(line));
}
