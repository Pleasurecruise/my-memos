<script module lang="ts">
  export const title = "Spinner";
</script>

<script lang="ts">
  import { Spinner, Button } from "../../src";
  import DemoPage from "../DemoPage.svelte";
  import SectionLabel from "../SectionLabel.svelte";

  const propDefs = [
    {
      name: "size",
      type: '"sm" | "md" | "lg"',
      default: '"md"',
      description: "Diameter of the spinner.",
    },
    {
      name: "...props",
      type: 'ComponentProps<"span">',
      description: "All native span attributes.",
    },
  ];

  const usage = `import { Spinner } from "@my-memos/ui";

<Spinner />
<Spinner size="lg" class="text-accent" />`;
</script>

<DemoPage {propDefs} {usage}>
  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Sizes</SectionLabel>
    <div style="display: flex; gap: 16px; align-items: center;">
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
    </div>
  </section>

  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Colours</SectionLabel>
    <div style="display: flex; gap: 16px; align-items: center;">
      <Spinner />
      <Spinner class="text-accent" />
      <Spinner class="text-success" />
      <Spinner class="text-error" />
    </div>
  </section>

  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Inside a button</SectionLabel>
    <div style="display: flex; gap: 8px; align-items: center;">
      <Button disabled>
        <Spinner size="sm" class="text-accent-foreground" />
        Loading…
      </Button>
      <Button variant="outline" disabled>
        <Spinner size="sm" />
        Saving
      </Button>
    </div>
  </section>
</DemoPage>