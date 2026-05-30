<script module lang="ts">
  export const title = "Context Menu";
</script>

<script lang="ts">
  import { Copy, Pencil, Scissors, Trash2 } from "@lucide/svelte";
  import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuShortcut,
    ContextMenuTrigger,
  } from "../../src";
  import DemoPage from "../DemoPage.svelte";
  import SectionLabel from "../SectionLabel.svelte";

  let lastAction = $state("");

  const propDefs = [
    { name: "open", type: "boolean", description: "Controlled open state of the menu." },
    {
      name: "x / y",
      type: "number",
      description: "Mouse coordinates, set automatically on right-click.",
    },
    {
      name: "destructive",
      type: "boolean",
      default: "false",
      description: "Renders the item in error color.",
    },
  ];

  const usage = `import {
  ContextMenu, ContextMenuContent, ContextMenuTrigger,
  ContextMenuItem, ContextMenuSeparator, ContextMenuShortcut,
} from "@my-memos/ui";

<ContextMenu>
  <ContextMenuTrigger class="...">Right-click me</ContextMenuTrigger>

  <ContextMenuContent>
    <ContextMenuItem onclick={() => rename()}>
      <Pencil size={14} />
      Rename
      <ContextMenuShortcut>F2</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuItem onclick={() => copy()}>
      <Copy size={14} />
      Copy
      <ContextMenuShortcut>⌘C</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem destructive onclick={() => remove()}>
      <Trash2 size={14} />
      Delete
    </ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`;
</script>

<DemoPage {propDefs} {usage}>
  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Right-click a card below</SectionLabel>
    <div style="display: flex; gap: 16px;">
      <ContextMenu>
        <ContextMenuTrigger class="ctx-demo-card" style="width: 280px;">
          <p style="font-weight: 600; margin: 0 0 4px; font-size: 14.5px;">memo-2026-05-29</p>
          <p style="margin: 0; font-size: 12.5px; color: var(--color-muted-foreground);">
            Right-click this card to see the context menu. The menu will appear at your cursor.
          </p>
          <div style="margin-top: 12px; display: flex; gap: 4px;">
            <span class="ctx-tag">#svelte</span>
            <span class="ctx-tag">#design</span>
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuItem onclick={() => (lastAction = "Edit")}>
            <Pencil size={14} />
            Edit
            <ContextMenuShortcut>⌘E</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem onclick={() => (lastAction = "Copy")}>
            <Copy size={14} />
            Copy
            <ContextMenuShortcut>⌘C</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem onclick={() => (lastAction = "Cut")}>
            <Scissors size={14} />
            Cut
            <ContextMenuShortcut>⌘X</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem destructive onclick={() => (lastAction = "Delete")}>
            <Trash2 size={14} />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <ContextMenu>
        <ContextMenuTrigger class="ctx-demo-card" style="width: 220px;">
          <p style="font-weight: 600; margin: 0 0 4px; font-size: 14.5px;">image.png</p>
          <p style="margin: 0; font-size: 12.5px; color: var(--color-muted-foreground);">
            2.4 MB &middot; Modified 3 days ago
          </p>
        </ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuItem onclick={() => (lastAction = "Open")}>Open</ContextMenuItem>
          <ContextMenuItem onclick={() => (lastAction = "Download")}>Download</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem destructive onclick={() => (lastAction = "Delete file")}>
            <Trash2 size={14} />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  </section>

  {#if lastAction}
    <p class="demo-mono">
      Last action:
      <span style="color: var(--color-accent);">{lastAction}</span>
    </p>
  {/if}
</DemoPage>

<style>
  :global(.ctx-demo-card) {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 16px;
    background: var(--color-background);
    cursor: context-menu;
    user-select: none;
  }
  :global(.ctx-demo-card:hover) {
    border-color: var(--color-accent);
    background: var(--color-muted);
  }
  .ctx-tag {
    font-size: 11px;
    padding: 1px 8px;
    border-radius: var(--radius-full);
    border: 1px solid color-mix(in srgb, var(--color-accent) 25%, transparent);
    color: var(--color-accent);
  }
  .demo-mono {
    font-size: 12px;
    color: var(--color-muted-foreground);
    font-family: var(--font-mono);
    margin: 0;
  }
</style>
