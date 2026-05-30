<script lang="ts">
  import type { Snippet } from "svelte";
  import { setContext } from "svelte";

  export interface CommandItemData {
    key: string;
    label: string;
    description?: string;
  }

  export interface CommandContext {
    readonly activeIndex: number;
    onSelect: (item: CommandItemData) => void;
  }

  export interface CommandProps {
    activeIndex?: number;
    onselect?: (item: CommandItemData) => void;
    children?: Snippet;
  }

  let { activeIndex = $bindable(0), onselect, children }: CommandProps = $props();

  let rootEl: HTMLDivElement | undefined = $state();

  function handleSelect(item: CommandItemData) {
    onselect?.(item);
  }

  function itemElements(): HTMLElement[] {
    if (!rootEl) return [];
    return Array.from(rootEl.querySelectorAll<HTMLElement>("[data-command-index]"));
  }

  function navigate(direction: number) {
    const items = itemElements();
    if (items.length === 0) return;
    const indices = items.map((el) => Number(el.dataset.commandIndex));
    const currentIdx = indices.indexOf(activeIndex);
    const nextIdx = (currentIdx + direction + indices.length) % indices.length;
    activeIndex = indices[nextIdx];
  }

  setContext<CommandContext>("command", {
    get activeIndex() {
      return activeIndex;
    },
    onSelect: handleSelect,
  });

  $effect(() => {
    function onKeydown(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        navigate(1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        navigate(-1);
      }
    }

    document.addEventListener("keydown", onKeydown);
    return () => document.removeEventListener("keydown", onKeydown);
  });
</script>

<div data-slot="root" bind:this={rootEl}>
  {@render children?.()}
</div>
