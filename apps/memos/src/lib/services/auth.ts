import { invalidateAll } from "$app/navigation";
import { createAuthClient } from "better-auth/svelte";

export const authClient = createAuthClient();

export const { signIn } = authClient;

export async function signOut() {
  const response = await authClient.signOut();
  await invalidateAll();
  return response;
}
