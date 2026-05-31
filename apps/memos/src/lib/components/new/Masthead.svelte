<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import {
    applyTheme,
    Avatar,
    Button,
    Popover,
    PopoverContent,
    PopoverTrigger,
    Tooltip,
  } from "@my-memos/ui";
  import {
    Home,
    Archive,
    NotebookText,
    MessageSquare,
    Sun,
    Moon,
    LogIn,
    LogOut,
    Globe,
    UserRound,
  } from "@lucide/svelte";
  import { signIn, signOut } from "$lib/auth-client";
  import { showToast } from "$lib/stores/toast.svelte";
  import { updateQuery } from "$lib/utils";
  import type { Memo, TagCount } from "$lib/types";

  interface Props {
    memos?: Memo[];
    tags?: TagCount[];
    viewAsPublic?: boolean;
  }

  const THEME_KEY = "my-memos:theme";
  const NAV_ITEMS = [
    { href: "/", label: "Home", Icon: Home, requiresAuth: false },
    { href: "/archive", label: "Archive", Icon: Archive, requiresAuth: true },
    { href: "/note", label: "Note", Icon: NotebookText, requiresAuth: true },
    { href: "/chat", label: "Chat", Icon: MessageSquare, requiresAuth: true },
  ] as const;

  let { memos = [], tags = [], viewAsPublic = false }: Props = $props();

  let isDark = $state(false);

  const todayKey = $derived(new Date().toISOString().slice(0, 10));
  const todayCount = $derived(memos.filter((m) => m.createdAt.slice(0, 10) === todayKey).length);

  onMount(() => {
    const saved = localStorage.getItem(THEME_KEY);
    isDark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(isDark);
  });

  $effect(() => {
    applyTheme(isDark);
    localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
  });

  function handleNav(href: string, requiresAuth: boolean) {
    if (requiresAuth && !page.data.user) {
      showToast("error", "请先登录", "需要登录才能访问该页面");
      return;
    }
    goto(href);
  }
</script>

<header class="flex flex-col sm:flex-row sm:items-end gap-5 pb-4 border-b border-border mb-4">
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
      <span class="font-serif text-sm text-muted-foreground pb-0.5 hidden sm:inline"
        >私のノート</span
      >
      {#if memos.length > 0}
        <span class="font-mono text-xs text-muted-foreground pt-0.5 hidden sm:inline">
          <strong class="text-foreground font-semibold">{memos.length}</strong> entries
          {#if todayCount > 0}
            &nbsp;·&nbsp;<strong class="text-foreground font-semibold">{todayCount}</strong> today
          {/if}
        </span>
      {/if}
    </div>
  </div>

  <div class="flex items-center justify-between sm:flex-1 sm:justify-end gap-2 sm:gap-4">
    <!-- nav -->
    <nav class="flex gap-1 sm:pr-3 sm:mr-1 sm:border-r sm:border-border">
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
          <span class="hidden sm:inline">{label}</span>
        </button>
      {/each}
    </nav>

    <!-- theme + avatar -->
    <div class="flex items-center gap-2 shrink-0">
      {#if page.data.user}
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
          onclick={() => (isDark = !isDark)}
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
              <Avatar size="lg" fallback="?" />
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
