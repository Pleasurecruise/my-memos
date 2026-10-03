<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import {
    applyTheme,
    Avatar,
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Popover,
    PopoverContent,
    PopoverTrigger,
    Tooltip,
  } from "@my-memos/ui";
  import {
    Home,
    Heart,
    Archive,
    MessageSquare,
    Sun,
    Moon,
    LogIn,
    LogOut,
    Globe,
    UserRound,
    Copy,
    RefreshCw,
    Shield,
    X,
  } from "@lucide/svelte";
  import { signIn, signOut } from "#lib/services/auth.ts";
  import { showToast } from "#lib/state/toast.svelte.ts";
  import { updateQuery } from "#lib/utils/index.ts";
  import { apiGenerateApiKey, apiGetApiKeyStatus } from "#lib/services/api-key.ts";
  import type { MemoStats, TagCount } from "#lib/types.ts";

  interface Props {
    memoStats?: MemoStats;
    tags?: TagCount[];
    viewAsPublic?: boolean;
  }

  const THEME_KEY = "my-memos:theme";
  const NAV_ITEMS = [
    { href: "/", label: "Home", Icon: Home, requiresAuth: false },
    { href: "/favorites", label: "Favorites", Icon: Heart, requiresAuth: true },
    { href: "/archive", label: "Archive", Icon: Archive, requiresAuth: true },
    { href: "/chat", label: "Chat", Icon: MessageSquare, requiresAuth: true },
  ] as const;

  let { memoStats, tags = [], viewAsPublic = false }: Props = $props();

  let isDark = $state(false);
  let themeBtnEl = $state<HTMLButtonElement | null>(null);
  let apiKeyConfigured = $state(false);
  let apiKeyLoading = $state(true);
  let apiKeyDialogOpen = $state(false);
  let apiKeyConfirmOpen = $state(false);
  let generatedApiKey = $state("");
  let apiKeyCopied = $state(false);
  let apiKeyActionLabel = $state("Generate API key");

  onMount(() => {
    const saved = localStorage.getItem(THEME_KEY);
    isDark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(isDark);

    if (page.data.user) {
      apiGetApiKeyStatus()
        .then((status) => {
          apiKeyConfigured = status.configured;
          if (status.configured) apiKeyActionLabel = "Regenerate API key";
        })
        .catch(() => showToast("error", "Could not load API key status"))
        .finally(() => {
          apiKeyLoading = false;
        });
    }
  });

  $effect(() => {
    localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
  });

  $effect(() => {
    if (apiKeyDialogOpen) return;
    generatedApiKey = "";
    apiKeyCopied = false;
  });

  function toggleTheme() {
    const next = !isDark;
    applyTheme(next, themeBtnEl);
    isDark = next;
  }

  function handleNav(href: string, requiresAuth: boolean) {
    if (requiresAuth && !page.data.user) {
      showToast("error", "Please sign in", "You need to sign in to access this page");
      return;
    }
    goto(href);
  }

  function requestApiKeyGeneration() {
    if (apiKeyConfigured) {
      apiKeyConfirmOpen = true;
      return;
    }
    generateApiKey("POST");
  }

  function generateApiKey(method: "POST" | "PUT") {
    if (apiKeyLoading) return;
    apiKeyLoading = true;
    apiGenerateApiKey(method)
      .then((result) => {
        generatedApiKey = result.apiKey;
        apiKeyConfigured = true;
        apiKeyActionLabel = "Regenerate API key";
        apiKeyCopied = false;
        apiKeyConfirmOpen = false;
        apiKeyDialogOpen = true;
      })
      .catch(() => showToast("error", "Could not generate API key"))
      .finally(() => {
        apiKeyLoading = false;
      });
  }

  function copyApiKey() {
    navigator.clipboard
      .writeText(generatedApiKey)
      .then(() => {
        apiKeyCopied = true;
        showToast("success", "API key copied");
      })
      .catch(() => showToast("error", "Could not copy API key"));
  }
</script>

<header
  class="flex flex-col gap-4 lg:flex-row lg:items-end lg:gap-5 pb-4 border-b border-border mb-4"
>
  <!-- wordmark -->
  <div class="flex flex-col gap-1.5 shrink-0">
    <p class="font-mono text-[10px] tracking-[0.18em] uppercase text-muted-foreground">
      {new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })}
    </p>
    <div class="flex items-baseline gap-3">
      <span
        class="font-serif font-semibold tracking-tight leading-none text-foreground relative masthead-wordmark"
      >
        my memos
        <span class="absolute left-0 -bottom-1.75 h-0.75 w-13 rounded-sm bg-accent"></span>
      </span>
      <span class="font-serif text-sm text-muted-foreground pb-0.5 hidden lg:inline"
        >私のノート</span
      >
      {#if memoStats && memoStats.total > 0}
        <span class="font-mono text-xs text-muted-foreground pt-0.5 hidden lg:inline">
          <strong class="text-foreground font-semibold">{memoStats.total}</strong> entries
          {#if memoStats.today > 0}
            &nbsp;·&nbsp;<strong class="text-foreground font-semibold">{memoStats.today}</strong> today
          {/if}
        </span>
      {/if}
    </div>
  </div>

  <div class="flex items-center justify-between gap-2 lg:flex-1 lg:justify-end lg:gap-4">
    <!-- nav -->
    <nav class="flex gap-1 lg:pr-3 lg:mr-1 lg:border-r lg:border-border">
      {#each NAV_ITEMS as { href, label, Icon, requiresAuth } (href)}
        {@const active = page.url.pathname === href}
        <button
          type="button"
          onclick={() => handleNav(href, requiresAuth)}
          class="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors
            {active
            ? 'text-accent bg-accent/10'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
        >
          <Icon size={13} />
          <span class="hidden lg:inline">{label}</span>
        </button>
      {/each}
    </nav>

    <!-- theme + avatar -->
    <div class="flex items-center gap-2 shrink-0">
      {#if page.data.user}
        <Tooltip content={apiKeyActionLabel} side="top">
          <button
            type="button"
            onclick={requestApiKeyGeneration}
            disabled={apiKeyLoading}
            class="flex items-center justify-center h-8 w-8 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            aria-label={apiKeyActionLabel}
          >
            {#if apiKeyConfigured}
              <span class:animate-spin={apiKeyLoading}>
                <RefreshCw size={15} />
              </span>
            {:else}
              <Shield size={15} />
            {/if}
          </button>
        </Tooltip>

        <Tooltip content={viewAsPublic ? "View as private" : "View as public"} side="top">
          <button
            type="button"
            onclick={() => updateQuery({ view: viewAsPublic ? null : "public" })}
            class="flex items-center justify-center h-8 w-8 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-pressed={viewAsPublic}
            aria-label={viewAsPublic ? "View as private" : "View as public"}
          >
            {#if viewAsPublic}<UserRound size={15} />{:else}<Globe size={15} />{/if}
          </button>
        </Tooltip>
      {/if}

      <!-- theme -->
      <Tooltip content={isDark ? "Light mode" : "Dark mode"} side="top">
        <button
          type="button"
          bind:this={themeBtnEl}
          onclick={toggleTheme}
          class="flex items-center justify-center h-8 w-8 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {#if isDark}<Sun size={15} />{:else}<Moon size={15} />{/if}
        </button>
      </Tooltip>

      <!-- avatar / auth -->
      <Popover>
        {#if page.data.user}
          <PopoverTrigger
            class="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent shrink-0"
          >
            <Avatar
              src={page.data.user.image ?? undefined}
              fallback={page.data.user.name}
              size="sm"
            />
          </PopoverTrigger>
        {:else}
          <PopoverTrigger
            class="flex h-8 w-8 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <LogIn size={15} />
          </PopoverTrigger>
        {/if}
        <PopoverContent side="bottom" align="end" class="w-52">
          {#if page.data.user}
            <div class="flex flex-col items-center gap-3 py-1">
              <Avatar
                src={page.data.user.image ?? undefined}
                fallback={page.data.user.name}
                size="lg"
              />
              <div class="text-center">
                <p class="text-sm font-medium">{page.data.user.name}</p>
                <p class="text-xs text-muted-foreground truncate max-w-44">
                  {page.data.user.email}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                class="w-full gap-2 text-muted-foreground"
                onclick={async () => {
                  await signOut();
                  await goto("/");
                }}
              >
                <LogOut size={13} />Sign out
              </Button>
            </div>
          {:else}
            <div class="flex flex-col items-center gap-3 py-1">
              <Avatar size="lg" fallback="Guest" />
              <p class="text-sm text-muted-foreground">Not signed in</p>
              <Button
                size="sm"
                class="w-full gap-2"
                onclick={() =>
                  signIn.social({ provider: "google", callbackURL: page.url.pathname })}
              >
                <svg viewBox="0 0 24 24" class="h-4 w-4" aria-hidden="true">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign in with Google
              </Button>
            </div>
          {/if}
        </PopoverContent>
      </Popover>
    </div>
  </div>
</header>

<Dialog bind:open={apiKeyConfirmOpen}>
  <DialogContent aria-label="Confirm API key regeneration">
    <DialogHeader>
      <DialogTitle>Regenerate API key?</DialogTitle>
      <DialogDescription class="mt-1.5">
        The current my-memos key will be replaced immediately.
      </DialogDescription>
    </DialogHeader>

    <DialogFooter class="mt-5 gap-2">
      <Button variant="outline" onclick={() => (apiKeyConfirmOpen = false)}>Cancel</Button>
      <Button onclick={() => generateApiKey("PUT")} disabled={apiKeyLoading}>Regenerate</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

<Dialog bind:open={apiKeyDialogOpen}>
  <DialogContent aria-label="API key">
    <DialogHeader>
      <div class="flex items-start justify-between gap-4">
        <div>
          <DialogTitle>API key generated</DialogTitle>
          <DialogDescription class="mt-1.5">
            Copy this key now. It cannot be viewed again after this dialog closes.
          </DialogDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          class="h-7 w-7 shrink-0 text-muted-foreground"
          onclick={() => (apiKeyDialogOpen = false)}
          aria-label="Close"
        >
          <X size={14} />
        </Button>
      </div>
    </DialogHeader>

    <div class="mt-5 flex items-center gap-2 rounded-md border border-border bg-muted p-2">
      <code class="min-w-0 flex-1 break-all px-1 font-mono text-xs text-foreground"
        >{generatedApiKey}</code
      >
      <Button variant="outline" size="sm" class="shrink-0 gap-1.5" onclick={copyApiKey}>
        <Copy size={13} />
        {#if apiKeyCopied}Copied{:else}Copy{/if}
      </Button>
    </div>

    <DialogFooter class="mt-5">
      <Button onclick={() => (apiKeyDialogOpen = false)}>Done</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

<style>
  .masthead-wordmark {
    font-size: 36px;
  }

  @media (max-width: 639px) {
    .masthead-wordmark {
      font-size: 26px;
    }
  }
</style>
