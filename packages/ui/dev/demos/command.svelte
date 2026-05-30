<script module lang="ts">
  export const title = "Command";
</script>

<script lang="ts">
  import { Hash, Heading1, List, Code2, Quote, Minus } from "@lucide/svelte";
  import {
    Command,
    CommandList,
    CommandItem,
    CommandGroup,
    CommandSeparator,
    CommandEmpty,
    Input,
  } from "../../src";
  import type { CommandItemData } from "../../src";
  import DemoPage from "../DemoPage.svelte";
  import SectionLabel from "../SectionLabel.svelte";

  const tagItems = [
    { key: "svelte", label: "svelte", icon: Hash },
    { key: "cloudflare", label: "cloudflare", icon: Hash },
    { key: "design", label: "design", icon: Hash },
    { key: "typescript", label: "typescript", icon: Hash },
    { key: "devtools", label: "devtools", icon: Hash },
  ];

  const slashItems = [
    { key: "h1", label: "Heading 1", description: "Large section heading", icon: Heading1 },
    { key: "h2", label: "Heading 2", description: "Medium section heading", icon: Heading1 },
    { key: "bullet", label: "Bullet list", description: "Create a simple bullet list", icon: List },
    {
      key: "code",
      label: "Code block",
      description: "Code snippet with syntax highlighting",
      icon: Code2,
    },
    { key: "quote", label: "Block quote", description: "Capture a quotation", icon: Quote },
    { key: "divider", label: "Divider", description: "Visual separator line", icon: Minus },
  ];

  let lastAction = $state("");
  let filterText = $state("");
  let activeIndex = $state(0);

  const filtered = $derived(
    filterText
      ? slashItems.filter(
          (item) =>
            item.label.toLowerCase().includes(filterText.toLowerCase()) ||
            item.description?.toLowerCase().includes(filterText.toLowerCase()),
        )
      : slashItems,
  );

  const propDefs = [
    {
      name: "activeIndex",
      type: "number",
      default: "0",
      description: "Controlled active index. Supports bind:activeIndex.",
    },
    {
      name: "onselect",
      type: "(item: CommandItemData) => void",
      description: "Fired when an item is selected.",
    },
    {
      name: "children",
      type: "Snippet",
      description: "Composable sub-components: CommandList, CommandItem, CommandGroup, etc.",
    },
  ];

  const usage = `import { Command, CommandList, CommandItem } from "@my-memos/ui";
import type { CommandItemData } from "@my-memos/ui";

const items: CommandItemData[] = [
  { key: "h1", label: "Heading 1", description: "Large heading" },
  { key: "h2", label: "Heading 2", description: "Medium heading" },
];

<Command onselect={(item) => console.log(item.key)}>
  <CommandList>
    {#each items as item, i (item.key)}
      <CommandItem {item} index={i}>
        {item.label}
      </CommandItem>
    {/each}
  </CommandList>
</Command>`;
</script>

<DemoPage {propDefs} {usage}>
  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Tags (simple list)</SectionLabel>
    <p class="demo-desc">A simple command menu with tag items.</p>
    <div class="demo-row">
      <Command bind:activeIndex onselect={(item) => (lastAction = `Selected: ${item.key}`)}>
        <CommandList class="border border-border rounded-md" style="width: 280px;">
          {#each tagItems as item, i (item.key)}
            <CommandItem {item} index={i}>
              <Hash size={14} class="text-muted-foreground" />
              <span>{item.label}</span>
            </CommandItem>
          {/each}
        </CommandList>
      </Command>
    </div>
  </section>

  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Slash commands (with filter)</SectionLabel>
    <p class="demo-desc">
      Mimics a <code>/</code> slash command palette with filter input.
    </p>
    <div class="demo-row" style="flex-direction: column; gap: 8px;">
      <Input
        placeholder="Type to filter..."
        value={filterText}
        oninput={(e) => (filterText = (e.target as HTMLInputElement).value)}
        style="width: 320px;"
      />
      <Command bind:activeIndex onselect={(item) => (lastAction = `Selected: ${item.key}`)}>
        <CommandList class="border border-border rounded-md" style="width: 320px;">
          {#if filtered.length === 0}
            <CommandEmpty>No results found.</CommandEmpty>
          {:else}
            {#each filtered as item, i (item.key)}
              <CommandItem {item} index={i}>
                {#if item.icon}
                  <item.icon size={14} class="text-muted-foreground" />
                {/if}
                <div class="flex flex-col">
                  <span>{item.label}</span>
                  {#if item.description}
                    <span class="text-xs text-muted-foreground">{item.description}</span>
                  {/if}
                </div>
              </CommandItem>
            {/each}
          {/if}
        </CommandList>
      </Command>
    </div>
  </section>

  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Grouped items</SectionLabel>
    <p class="demo-desc">Command items organized in groups with separators.</p>
    <div class="demo-row">
      <Command bind:activeIndex onselect={(item) => (lastAction = `Selected: ${item.key}`)}>
        <CommandList class="border border-border rounded-md" style="width: 320px;">
          <CommandGroup heading="Blocks">
            {#each slashItems.slice(0, 3) as item, i (item.key)}
              <CommandItem {item} index={i}>
                {#if item.icon}
                  <item.icon size={14} class="text-muted-foreground" />
                {/if}
                <span>{item.label}</span>
              </CommandItem>
            {/each}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="More">
            {#each slashItems.slice(3) as item, i (item.key)}
              <CommandItem {item} index={i + 3}>
                {#if item.icon}
                  <item.icon size={14} class="text-muted-foreground" />
                {/if}
                <span>{item.label}</span>
              </CommandItem>
            {/each}
          </CommandGroup>
        </CommandList>
      </Command>
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
  .demo-desc {
    font-size: 12.5px;
    color: var(--color-muted-foreground);
    margin: 0;
  }
  .demo-desc code {
    font-family: var(--font-mono);
    font-size: inherit;
    color: var(--color-foreground);
  }
  .demo-row {
    display: flex;
    gap: 16px;
  }
  .demo-mono {
    font-size: 12px;
    color: var(--color-muted-foreground);
    font-family: var(--font-mono);
    margin: 0;
  }
</style>
