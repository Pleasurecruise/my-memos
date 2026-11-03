<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import {
    Avatar,
    Button,
    DatePicker,
    Popover,
    PopoverContent,
    PopoverTrigger,
    Separator,
    Tooltip,
    cn,
  } from "@my-memos/ui";
  import { format } from "date-fns";
  import { updateQuery } from "#lib/utils/index.ts";
  import { signIn, signOut } from "#lib/services/auth.ts";
  import {
    Home,
    Heart,
    Archive,
    MessageSquare,
    Globe,
    Sun,
    Moon,
    CalendarDays,
    X,
    LogIn,
    LogOut,
    UserRound,
  } from "@lucide/svelte";
  import type { TagCount } from "#lib/types.ts";
  import { showToast } from "#lib/state/toast.svelte.ts";

  const NAV_ITEMS = [
    { href: "/", label: "Home", icon: Home, requiresAuth: false },
    { href: "/favorites", label: "Favorites", icon: Heart, requiresAuth: true },
    { href: "/archive", label: "Archive", icon: Archive, requiresAuth: true },
    { href: "/chat", label: "Chat", icon: MessageSquare, requiresAuth: true },
  ] as const;

  interface SidebarProps {
    tags: TagCount[];
    activeTags: string[];
    viewAsPublic: boolean;
    isDark: boolean;
    open: boolean;
    onToggleTheme: (button: HTMLElement) => void;
    onClose: () => void;
    selectedDate: Date | undefined;
    onDateChange: (date: Date | undefined) => void;
  }

  let {
    tags,
    activeTags,
    viewAsPublic,
    isDark,
    open,
    onToggleTheme,
    onClose,
    selectedDate,
    onDateChange,
  }: SidebarProps = $props();

  function handleNav(href: string, requiresAuth: boolean) {
    if (requiresAuth && !page.data.user) {
      showToast("error", "Please sign in", "You need to sign in to access this page");
      return;
    }
    goto(href);
  }

  function handleDateChange(date: Date) {
    if (
      selectedDate &&
      date.getFullYear() === selectedDate.getFullYear() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getDate() === selectedDate.getDate()
    ) {
      onDateChange(undefined);
      updateQuery({ date: null });
    } else {
      onDateChange(date);
      updateQuery({ date: format(date, "yyyy-MM-dd") });
    }
  }

  function toggleTag(tag: string) {
    const next = activeTags.length === 1 && activeTags[0] === tag ? [] : [tag];
    updateQuery({ tags: next });
  }

  function clearDate() {
    onDateChange(undefined);
    updateQuery({ date: null });
  }
</script>

<aside
  class={cn(
    "fixed inset-y-0 left-0 z-40 md:relative md:z-auto",
    "flex flex-col w-60 shrink-0 h-screen border-r border-border bg-background",
    "transition-transform duration-200 ease-in-out",
    !open && "-translate-x-full md:translate-x-0",
  )}
>
  <div class="flex-1 overflow-y-auto flex flex-col min-h-0">
    <div class="px-5 pt-5 pb-4 shrink-0 flex items-center justify-between">
      <span
        class="flex items-center gap-2 text-accent font-serif font-semibold text-lg tracking-tight select-none"
      >
        <img src="/favicon.png" alt="" class="h-4.25 w-4.25 shrink-0 rounded-sm" />
        my memos
      </span>
      <Tooltip content="Close sidebar" side="right">
        <Button
          variant="ghost"
          size="icon"
          onclick={onClose}
          class="h-7 w-7 text-muted-foreground md:hidden"
        >
          <X size={15} />
        </Button>
      </Tooltip>
    </div>

    <nav class="px-3 space-y-0.5 shrink-0">
      {#each NAV_ITEMS as { href, label, icon: Icon, requiresAuth } (href)}
        {@const active = page.url.pathname === href}
        <Button
          variant="ghost"
          size="sm"
          onclick={() => handleNav(href, requiresAuth)}
          class={cn(
            "w-full justify-start gap-2.5 font-normal",
            active ? "bg-accent/10 text-accent hover:bg-accent/10" : "text-muted-foreground",
          )}
        >
          <Icon size={15} />
          {label}
        </Button>
      {/each}
    </nav>

    <Separator class="mx-4 my-4 w-auto" />

    <div class="px-4 shrink-0">
      <div class="flex items-center justify-between mb-3">
        <span
          class="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider"
        >
          <CalendarDays size={12} />
          Filter by date
        </span>
        {#if selectedDate}
          <Tooltip content="Clear date filter" side="right">
            <Button
              variant="ghost"
              size="icon"
              onclick={clearDate}
              class="h-5 w-5 text-muted-foreground"
            >
              <X size={11} />
            </Button>
          </Tooltip>
        {/if}
      </div>
      <DatePicker value={selectedDate} onChange={handleDateChange} />
    </div>

    <Separator class="mx-4 my-4 w-auto" />

    <div class="px-3 flex-1">
      <p class="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Tags
      </p>
      <div class="space-y-0.5">
        {#each tags as { name, count } (name)}
          <Button
            variant="ghost"
            size="sm"
            onclick={() => toggleTag(name)}
            class={cn(
              "w-full justify-between font-normal",
              activeTags.includes(name)
                ? "bg-accent/10 text-accent hover:bg-accent/10"
                : "text-muted-foreground",
            )}
          >
            <span class="flex items-center gap-1.5">
              <span class="text-xs opacity-70">#</span>
              {name}
            </span>
            <span class="text-xs opacity-50">{count}</span>
          </Button>
        {/each}
      </div>
    </div>
  </div>

  <div class="px-3 py-4 shrink-0 border-t border-border flex items-center justify-end gap-1">
    <Tooltip content={isDark ? "Light mode" : "Dark mode"} side="top">
      <button
        type="button"
        onclick={(e) => onToggleTheme(e.currentTarget as HTMLElement)}
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {#if isDark}<Sun size={15} />{:else}<Moon size={15} />{/if}
      </button>
    </Tooltip>

    {#if page.data.user}
      <Tooltip content={viewAsPublic ? "View as private" : "View as public"} side="top">
        <button
          type="button"
          onclick={() => updateQuery({ view: viewAsPublic ? null : "public" })}
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-pressed={viewAsPublic}
          aria-label={viewAsPublic ? "View as private" : "View as public"}
        >
          {#if viewAsPublic}<UserRound size={15} />{:else}<Globe size={15} />{/if}
        </button>
      </Tooltip>
    {/if}

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
          class="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
        >
          <LogIn size={15} />
        </PopoverTrigger>
      {/if}

      <PopoverContent side="top" align="center" class="w-56">
        {#if page.data.user}
          <div class="flex flex-col items-center gap-3 py-1">
            <Avatar
              src={page.data.user.image ?? undefined}
              fallback={page.data.user.name}
              size="lg"
            />
            <div class="text-center">
              <p class="text-sm font-medium text-foreground">{page.data.user.name}</p>
              <p class="text-xs text-muted-foreground truncate max-w-45">
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
              <LogOut size={13} />
              Sign out
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
</aside>
