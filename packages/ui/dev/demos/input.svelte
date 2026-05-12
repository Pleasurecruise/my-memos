<script module lang="ts">
  export const title = "Input";
</script>

<script lang="ts">
  import { Input } from "../../src";
  import DemoPage from "../DemoPage.svelte";
  import SectionLabel from "../SectionLabel.svelte";

  const propDefs = [
    {
      name: "error",
      type: "boolean",
      default: "false",
      description: "Applies error ring and border color.",
    },
    {
      name: "disabled",
      type: "boolean",
      default: "false",
      description: "Disables the field and reduces opacity.",
    },
    {
      name: "...props",
      type: 'ComponentProps<"input">',
      description: "All native input attributes (type, placeholder, onChange, …).",
    },
  ];

  const usage = `import { Input } from "@my-memos/ui";

<Input placeholder="Default" />
<Input error placeholder="Error state" />
<Input disabled placeholder="Disabled" />`;
</script>

<DemoPage {propDefs} {usage}>
  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>States</SectionLabel>
    <div style="display: flex; flex-direction: column; gap: 8px; max-width: 320px;">
      <Input placeholder="Default" />
      <Input error placeholder="Error state" />
      <Input disabled placeholder="Disabled" />
    </div>
  </section>

  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>With label</SectionLabel>
    <div style="display: flex; flex-direction: column; max-width: 320px;">
      <label
        for="demo-email"
        style="font-family: var(--font-sans); font-size: 13px; font-weight: 500; color: var(--color-foreground); margin-bottom: 4px;"
      >
        Email
      </label>
      <Input id="demo-email" type="email" placeholder="you@example.com" />
      <label
        for="demo-password"
        style="font-family: var(--font-sans); font-size: 13px; font-weight: 500; color: var(--color-foreground); margin-top: 16px; margin-bottom: 4px;"
      >
        Password
      </label>
      <Input id="demo-password" type="password" placeholder="••••••••" error />
      <p
        style="font-family: var(--font-sans); font-size: 12px; color: var(--color-error); margin-top: 4px;"
      >
        Password must be at least 8 characters.
      </p>
    </div>
  </section>
</DemoPage>
