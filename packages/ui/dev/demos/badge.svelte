<script module lang="ts">
  export const title = "Badge";
</script>

<script lang="ts">
  import { Badge } from "../../src";
  import DemoPage from "../DemoPage.svelte";
  import SectionLabel from "../SectionLabel.svelte";

  const propDefs = [
    {
      name: "variant",
      type: '"default" | "secondary" | "success" | "warning" | "destructive" | "outline"',
      default: '"default"',
      description: "Visual style of the badge.",
    },
    {
      name: "...props",
      type: 'ComponentProps<"span">',
      description: "All native span attributes.",
    },
  ];

  const usage = `import { Badge } from "@my-memos/ui";

<Badge>Default</Badge>
<Badge variant="success">Published</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="destructive">Error</Badge>`;
</script>

<DemoPage {propDefs} {usage}>
  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Variants</SectionLabel>
    <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  </section>
</DemoPage>
