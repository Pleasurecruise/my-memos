<script module lang="ts">
  export const title = "Code";
</script>

<script lang="ts">
  import { Code, Pre } from "../../src";
  import DemoPage from "../DemoPage.svelte";
  import SectionLabel from "../SectionLabel.svelte";

  const usage = `import { Code, Pre } from "@my-memos/ui";

// Inline
<p>Run <Code>pnpm install</Code> to get started.</p>

// Block
<Pre><code>{"const x = 1;\nconsole.log(x);"}</code></Pre>`;
</script>

<DemoPage {usage}>
  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Inline</SectionLabel>
    <p
      style="font-family: var(--font-sans); font-size: 14px; color: var(--color-foreground); line-height: 1.7;"
    >
      Run <Code>pnpm install</Code> to install dependencies, then <Code>pnpm dev</Code> to start the development
      server.
    </p>
  </section>

  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Block</SectionLabel>
    <Pre>
      <code
        >{`import { Button } from "@my-memos/ui";

export default function App() {
  return <Button variant="default">Save</Button>;
}`}</code
      >
    </Pre>
  </section>
</DemoPage>
