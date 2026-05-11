<script module lang="ts">
  export const title = "Checkbox";
</script>

<script lang="ts">
  import { Checkbox, Label } from "../../src";
  import DemoPage from "../DemoPage.svelte";
  import SectionLabel from "../SectionLabel.svelte";

  const propDefs = [
    {
      name: "error",
      type: "boolean",
      default: "false",
      description: "Highlights the border in the error colour.",
    },
    {
      name: "checked",
      type: "boolean",
      description: "Controlled checked state.",
    },
    {
      name: "defaultChecked",
      type: "boolean",
      description: "Uncontrolled initial checked state.",
    },
    {
      name: "disabled",
      type: "boolean",
      default: "false",
      description: "Disables interaction and reduces opacity.",
    },
    {
      name: "...props",
      type: 'Omit<ComponentProps<"input">, "type">',
      description: "All native checkbox input attributes.",
    },
  ];

  const usage = `import { Checkbox, Label } from "@my-memos/ui";

<label style={{ display: "flex", alignItems: "center", gap: 8 }}>
  <Checkbox defaultChecked />
  <Label>Accept terms</Label>
</label>`;

  const groupItems = ["Notifications", "Weekly digest", "Marketing emails"];
</script>

<DemoPage {propDefs} {usage}>
  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>States</SectionLabel>
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
        <Checkbox />
        <Label>Unchecked</Label>
      </label>
      <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
        <Checkbox defaultChecked />
        <Label>Checked</Label>
      </label>
      <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
        <Checkbox error />
        <Label>Error</Label>
      </label>
      <label style="display: flex; align-items: center; gap: 8px; cursor: not-allowed;">
        <Checkbox disabled />
        <Label>Disabled</Label>
      </label>
      <label style="display: flex; align-items: center; gap: 8px; cursor: not-allowed;">
        <Checkbox disabled defaultChecked />
        <Label>Disabled checked</Label>
      </label>
    </div>
  </section>

  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Group</SectionLabel>
    <div style="display: flex; flex-direction: column; gap: 8px;">
      {#each groupItems as item (item)}
        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
          <Checkbox />
          <Label>{item}</Label>
        </label>
      {/each}
    </div>
  </section>
</DemoPage>