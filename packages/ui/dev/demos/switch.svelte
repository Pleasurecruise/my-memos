<script module lang="ts">
  export const title = "Switch";
</script>

<script lang="ts">
  import { Switch, Label } from "../../src";
  import DemoPage from "../DemoPage.svelte";
  import SectionLabel from "../SectionLabel.svelte";

  const propDefs = [
    {
      name: "checked",
      type: "boolean",
      description: "Controlled on/off state.",
    },
    {
      name: "defaultChecked",
      type: "boolean",
      description: "Uncontrolled initial state.",
    },
    {
      name: "disabled",
      type: "boolean",
      default: "false",
      description: "Prevents toggling and reduces opacity.",
    },
    {
      name: "...props",
      type: 'Omit<ComponentProps<"input">, "type">',
      description: "All native checkbox input attributes.",
    },
  ];

  const usage = `import { Switch, Label } from "@my-memos/ui";

<label style={{ display: "flex", alignItems: "center", gap: 8 }}>
  <Switch defaultChecked />
  <Label>Enable notifications</Label>
</label>`;

  const settingsItems = [
    { label: "Email notifications", on: true },
    { label: "Push notifications", on: false },
    { label: "Weekly digest", on: true },
  ];
</script>

<DemoPage {propDefs} {usage}>
  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>States</SectionLabel>
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
        <Switch />
        <Label>Off</Label>
      </label>
      <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
        <Switch defaultChecked />
        <Label>On</Label>
      </label>
      <label style="display: flex; align-items: center; gap: 8px; cursor: not-allowed;">
        <Switch disabled />
        <Label>Disabled off</Label>
      </label>
      <label style="display: flex; align-items: center; gap: 8px; cursor: not-allowed;">
        <Switch disabled defaultChecked />
        <Label>Disabled on</Label>
      </label>
    </div>
  </section>

  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Settings list</SectionLabel>
    <div
      style="display: flex; flex-direction: column; gap: 0; max-width: 320px; border: 1px solid var(--color-border); border-radius: 8px; overflow: hidden;"
    >
      {#each settingsItems as { label, on }, i (label)}
        <label
          style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; cursor: pointer;{i <
          2
            ? ' border-bottom: 1px solid var(--color-border);'
            : ''}"
        >
          <span style="font-size: 13px; color: var(--color-foreground);">{label}</span>
          <Switch defaultChecked={on} />
        </label>
      {/each}
    </div>
  </section>
</DemoPage>
