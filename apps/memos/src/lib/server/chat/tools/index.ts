import { drizzle } from "drizzle-orm/d1";
import { createVisualTools } from "./visual";
import { createMemoReadTools } from "./memos-read";
import { createMemoWriteTools } from "./memos-write";
import { createWebSearchTool } from "./web-search";
import { createDefuddleTool } from "./defuddle";
import { createContext7Tool } from "./context7";

type Env = NonNullable<App.Platform>["env"];

export function createChatTools(env: Env) {
  const { DB, MEMOS_BUCKET, MEMOS_CACHE } = env;
  const db = drizzle(DB);

  return {
    ...createVisualTools(),
    ...createMemoReadTools({ d1: DB, db, bucket: MEMOS_BUCKET, cache: MEMOS_CACHE }),
    ...createMemoWriteTools({ d1: DB, bucket: MEMOS_BUCKET, cache: MEMOS_CACHE }),
    ...createWebSearchTool(env.TAVILY_API_KEY),
    ...createDefuddleTool(),
    ...createContext7Tool(),
  };
}
