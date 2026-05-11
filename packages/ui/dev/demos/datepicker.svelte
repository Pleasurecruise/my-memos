<script module lang="ts">
  export const title = "DatePicker";
</script>

<script lang="ts">
  import { DatePicker } from "../../src";
  import DemoPage from "../DemoPage.svelte";
  import SectionLabel from "../SectionLabel.svelte";

  let selected = $state<Date | undefined>(new Date());

  const propDefs = [
    {
      name: "value",
      type: "Date",
      default: "—",
      description: "Currently selected date.",
    },
    {
      name: "onChange",
      type: "(date: Date) => void",
      default: "—",
      description: "Called when the user clicks a day cell.",
    },
    {
      name: "class",
      type: "string",
      default: "—",
      description: "Extra CSS classes applied to the root element.",
    },
  ];

  const usage = `import { DatePicker } from "@my-memos/ui";

<script lang="ts">
  let date = $state<Date | undefined>(new Date());
<${"/"}script>

<DatePicker value={date} onChange={(d) => (date = d)} />`;
</script>

<DemoPage {propDefs} {usage}>
  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Controlled</SectionLabel>
    <div style="display: flex; gap: 48px; align-items: flex-start; flex-wrap: wrap;">
      <DatePicker value={selected} onChange={(d) => (selected = d)} />
      <div
        style="display: flex; flex-direction: column; gap: 6px; padding-top: 4px; font-family: var(--font-mono); font-size: 12px; color: var(--color-muted-foreground);"
      >
        <span style="text-transform: uppercase; letter-spacing: 0.08em; font-size: 11px;">
          Selected
        </span>
        <span style="color: var(--color-foreground);">
          {#if selected}
            {selected.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          {:else}
            None
          {/if}
        </span>
      </div>
    </div>
  </section>

  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Uncontrolled (no selection)</SectionLabel>
    <DatePicker />
  </section>
</DemoPage>
