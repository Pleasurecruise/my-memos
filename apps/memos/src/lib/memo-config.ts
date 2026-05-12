import { Globe, Lock } from "lucide-svelte";
import type { MemoVisibility } from "$lib/types/memos";

export const VISIBILITY_CONFIG: Record<MemoVisibility, { label: string; icon: typeof Globe }> = {
  public: { label: "Public", icon: Globe },
  private: { label: "Private", icon: Lock },
};
