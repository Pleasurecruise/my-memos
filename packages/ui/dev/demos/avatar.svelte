<script module lang="ts">
  export const title = "Avatar";
</script>

<script lang="ts">
  import { Avatar } from "../../src";
  import DemoPage from "../DemoPage.svelte";
  import SectionLabel from "../SectionLabel.svelte";

  const propDefs = [
    {
      name: "src",
      type: "string",
      description: "Image URL. When provided the image is displayed.",
    },
    {
      name: "alt",
      type: "string",
      description: "Alt text for the image.",
    },
    {
      name: "fallback",
      type: "string",
      description: "Text used when no image is available. First two characters are shown.",
    },
    {
      name: "size",
      type: '"sm" | "md" | "lg" | "xl"',
      default: '"md"',
      description: "Diameter preset.",
    },
    {
      name: "...props",
      type: 'ComponentProps<"div">',
      description: "All native div attributes.",
    },
  ];

  const usage = `import { Avatar } from "@my-memos/ui";

<Avatar src="/avatar.png" alt="Jane Smith" />
<Avatar fallback="JS" size="lg" />
<Avatar fallback="?" />`;
</script>

<DemoPage {propDefs} {usage}>
  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Sizes</SectionLabel>
    <div style="display: flex; gap: 12px; align-items: center;">
      <Avatar fallback="JS" size="sm" />
      <Avatar fallback="JS" size="md" />
      <Avatar fallback="JS" size="lg" />
      <Avatar fallback="JS" size="xl" />
    </div>
  </section>

  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Fallback variants</SectionLabel>
    <div style="display: flex; gap: 12px; align-items: center;">
      <Avatar fallback="AB" />
      <Avatar fallback="XY" />
      <Avatar fallback="?" />
      <Avatar />
    </div>
  </section>

  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>With image</SectionLabel>
    <div style="display: flex; gap: 12px; align-items: center;">
      <Avatar src="https://i.pravatar.cc/150?img=1" alt="User" size="sm" />
      <Avatar src="https://i.pravatar.cc/150?img=2" alt="User" size="md" />
      <Avatar src="https://i.pravatar.cc/150?img=3" alt="User" size="lg" />
    </div>
  </section>
</DemoPage>
