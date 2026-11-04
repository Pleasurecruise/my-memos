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
    Heart,
    Archive,
    MessageSquare,
    Sun,
    Moon,
    LogIn,
    LogOut,
    Globe,
    UserRound,
  } from "@lucide/svelte";
  import { signIn, signOut } from "#lib/services/auth.ts";
  import { showToast } from "#lib/state/toast.svelte.ts";
  import { updateQuery } from "#lib/utils/index.ts";
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

  onMount(() => {
    const saved = localStorage.getItem(THEME_KEY);
    isDark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(isDark);
  });

  $effect(() => {
    localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
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
                onclick={() => signOut()}
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
                  signIn.social({ provider: "you-find-me", callbackURL: page.url.pathname })}
              >
                Sign in with you-find.me
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
