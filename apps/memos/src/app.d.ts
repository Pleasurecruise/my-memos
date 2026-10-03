import type { User, Session } from "better-auth";
import type { AppEnv } from "#lib/server/types.ts";

declare global {
  namespace App {
    interface Locals {
      user: User | null;
      session: Session | null;
    }
  }

  namespace Cloudflare {
    interface Env extends AppEnv {}
  }
}

export {};
