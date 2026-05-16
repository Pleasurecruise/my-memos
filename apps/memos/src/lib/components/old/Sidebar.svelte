<script lang="ts">
  import { goto, invalidateAll } from "$app/navigation";
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
  import { updateQuery } from "$lib/utils";
  import { signIn, signOut } from "$lib/auth-client";
  import {
    Home,
    Archive,
    MessageSquare,
    Sun,
    Moon,
    CalendarDays,
    X,
    LogIn,
    LogOut,
  } from "@lucide/svelte";
  import type { TagCount } from "$lib/types";
  import { showToast } from "$lib/stores/toast.svelte";

  const NAV_ITEMS = [
    { href: "/", label: "Home", icon: Home, requiresAuth: false },
    { href: "/archive", label: "Archive", icon: Archive, requiresAuth: true },
    { href: "/chat", label: "Chat", icon: MessageSquare, requiresAuth: true },
  ] as const;

  interface SidebarProps {
    tags: TagCount[];
    activeTags: string[];
    isDark: boolean;
    open: boolean;
    onToggleTheme: () => void;
    onClose: () => void;
    selectedDate: Date | undefined;
    onDateChange: (date: Date | undefined) => void;
  }

  let {
    tags,
    activeTags,
    isDark,
    open,
    onToggleTheme,
    onClose,
    selectedDate,
    onDateChange,
  }: SidebarProps = $props();

  function handleNav(href: string, requiresAuth: boolean) {
    if (requiresAuth && !page.data.user) {
      showToast("error", "请先登录", "需要登录才能访问该页面");
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

  <div class="px-3 py-4 shrink-0 border-t border-border flex items-center gap-1">
    <Button
      variant="ghost"
      size="sm"
      onclick={onToggleTheme}
      class="flex-1 justify-start gap-2.5 font-normal text-muted-foreground"
    >
      {#if isDark}
        <Sun size={14} />
        Light mode
      {:else}
        <Moon size={14} />
        Dark mode
      {/if}
    </Button>

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
            <Avatar size="lg" fallback="?" />
            <p class="text-sm text-muted-foreground">Not signed in</p>
            <Button
              size="sm"
              class="w-full gap-2"
              onclick={() => signIn.social({ provider: "google", callbackURL: page.url.pathname })}
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
</aside>
