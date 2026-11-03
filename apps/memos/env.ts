import { defineEnv, string, url } from "void/env";

export default defineEnv({
  BETTER_AUTH_URL: url().default("https://memos.you-find.me"),
  BETTER_AUTH_SECRET: string(),
  YOU_FIND_ME_CLIENT_SECRET: string(),
  CF_ACCOUNT_ID: string().default("fb71c4eceaf623ae1b19b8b37d7a38cf"),
  CF_AIG_TOKEN: string(),
  TAVILY_API_KEY: string(),
});
