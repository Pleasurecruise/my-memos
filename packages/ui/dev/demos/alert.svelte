<script module lang="ts">
  export const title = "Alert";
</script>

<script lang="ts">
  import { Alert, AlertTitle, AlertDescription } from "../../src";
  import DemoPage from "../DemoPage.svelte";
  import SectionLabel from "../SectionLabel.svelte";

  const propDefs = [
    {
      name: "variant",
      type: '"default" | "success" | "warning" | "error"',
      default: '"default"',
      description: "Visual style and semantic color of the alert.",
    },
    {
      name: "...props",
      type: 'ComponentProps<"div">',
      description: "All native div attributes.",
    },
  ];

  const usage = `import { Alert, AlertTitle, AlertDescription } from "@my-memos/ui";

<Alert variant="success">
  <AlertTitle>Saved</AlertTitle>
  <AlertDescription>Your changes have been saved.</AlertDescription>
</Alert>`;
</script>

<DemoPage {propDefs} {usage}>
  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Variants</SectionLabel>
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <Alert>
        <AlertTitle>Note</AlertTitle>
        <AlertDescription>This is a default informational alert.</AlertDescription>
      </Alert>
      <Alert variant="success">
        <AlertTitle>Saved</AlertTitle>
        <AlertDescription>Your changes have been saved successfully.</AlertDescription>
      </Alert>
      <Alert variant="warning">
        <AlertTitle>Heads up</AlertTitle>
        <AlertDescription>This action may affect existing records.</AlertDescription>
      </Alert>
      <Alert variant="error">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Something went wrong. Please try again.</AlertDescription>
      </Alert>
    </div>
  </section>

  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Title only</SectionLabel>
    <Alert variant="warning">
      <AlertTitle>Your session will expire in 5 minutes.</AlertTitle>
    </Alert>
  </section>
</DemoPage>