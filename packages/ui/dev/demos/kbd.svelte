<script module lang="ts">
  export const title = "Kbd";
</script>

<script lang="ts">
  import { Kbd } from "../../src";
  import DemoPage from "../DemoPage.svelte";
  import SectionLabel from "../SectionLabel.svelte";

  const usage = `import { Kbd } from "@my-memos/ui";

<Kbd>⌘</Kbd>
<Kbd>K</Kbd>`;

  const combinations = [
    { label: "Save", keys: ["⌘", "S"] },
    { label: "Find", keys: ["⌘", "K"] },
    { label: "Undo", keys: ["⌘", "Z"] },
    { label: "Redo", keys: ["⌘", "⇧", "Z"] },
  ];
</script>

<DemoPage {usage}>
  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Keys</SectionLabel>
    <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
      <Kbd>⌘</Kbd>
      <Kbd>⇧</Kbd>
      <Kbd>⌥</Kbd>
      <Kbd>⌃</Kbd>
      <Kbd>↩</Kbd>
      <Kbd>⎋</Kbd>
      <Kbd>Tab</Kbd>
      <Kbd>Del</Kbd>
    </div>
  </section>

  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Combinations</SectionLabel>
    <div style="display: flex; flex-direction: column; gap: 10px;">
      {#each combinations as { label, keys } (label)}
        <div style="display: flex; align-items: center; gap: 12px;">
          <span
            style="font-family: var(--font-sans); font-size: 13px; color: var(--color-muted-foreground); width: 48px;"
          >
            {label}
          </span>
          <div style="display: flex; gap: 4px;">
            {#each keys as k (k)}
              <Kbd>{k}</Kbd>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </section>
</DemoPage>
