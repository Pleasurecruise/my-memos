<script module lang="ts">
  export const title = "Button";
</script>

<script lang="ts">
  import { Button } from "../../src";
  import DemoPage from "../DemoPage.svelte";
  import SectionLabel from "../SectionLabel.svelte";

  const propDefs = [
    {
      name: "variant",
      type: '"default" | "secondary" | "outline" | "ghost" | "destructive" | "link"',
      default: '"default"',
      description: "Visual style of the button.",
    },
    {
      name: "size",
      type: '"sm" | "md" | "lg" | "icon"',
      default: '"md"',
      description: "Height and horizontal padding preset.",
    },
    {
      name: "type",
      type: '"button" | "submit" | "reset"',
      default: '"button"',
      description: "HTML button type attribute.",
    },
    {
      name: "disabled",
      type: "boolean",
      default: "false",
      description: "Disables the button and reduces opacity.",
    },
    {
      name: "...props",
      type: 'ComponentProps<"button">',
      description: "All native button attributes.",
    },
  ];

  const usage = `import { Button } from "@my-memos/ui";

<Button>Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline" size="sm">Small outline</Button>
<Button variant="destructive" disabled>Disabled</Button>`;
</script>

<DemoPage {propDefs} {usage}>
  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Variants</SectionLabel>
    <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
      <Button>Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
    </div>
  </section>

  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Sizes</SectionLabel>
    <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  </section>

  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Disabled</SectionLabel>
    <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
      <Button disabled>Default</Button>
      <Button variant="secondary" disabled>Secondary</Button>
      <Button variant="outline" disabled>Outline</Button>
      <Button variant="ghost" disabled>Ghost</Button>
      <Button variant="destructive" disabled>Destructive</Button>
    </div>
  </section>
</DemoPage>
