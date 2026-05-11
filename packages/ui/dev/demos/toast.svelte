<script module lang="ts">
  export const title = "Toast";
</script>

<script lang="ts">
  import { Toast } from "../../src";
  import DemoPage from "../DemoPage.svelte";
  import SectionLabel from "../SectionLabel.svelte";

  const propDefs = [
    {
      name: "title",
      type: "string",
      description: "Main notification message. Required.",
    },
    {
      name: "description",
      type: "string",
      default: "—",
      description: "Optional supporting text shown below the title.",
    },
    {
      name: "variant",
      type: '"default" | "success" | "warning" | "error"',
      default: '"default"',
      description: "Visual style of the notification.",
    },
    {
      name: "...props",
      type: 'ComponentProps<"div">',
      description: "All native div attributes.",
    },
  ];

  const usage = `import { Toast } from "@my-memos/ui";

<Toast title="Saved" description="Your memo has been saved." />
<Toast variant="success" title="Published" />
<Toast variant="warning" title="Heads up" description="Changes are pending review." />
<Toast variant="error" title="Error" description="Something went wrong. Try again." />`;
</script>

<DemoPage {propDefs} {usage}>
  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Variants</SectionLabel>
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <Toast title="Notification" description="This is a default notification." />
      <Toast variant="success" title="Saved" description="Your memo has been saved." />
      <Toast variant="warning" title="Heads up" description="Changes are pending review." />
      <Toast variant="error" title="Error" description="Something went wrong. Try again." />
    </div>
  </section>

  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Title only</SectionLabel>
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <Toast title="Copied to clipboard" />
      <Toast variant="success" title="Published" />
      <Toast variant="error" title="Upload failed" />
    </div>
  </section>
</DemoPage>