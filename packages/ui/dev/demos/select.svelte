<script module lang="ts">
  export const title = "Select";
</script>

<script lang="ts">
  import { Select, Label } from "../../src";
  import DemoPage from "../DemoPage.svelte";
  import SectionLabel from "../SectionLabel.svelte";

  const propDefs = [
    {
      name: "error",
      type: "boolean",
      default: "false",
      description: "Switches border and focus ring to the error colour.",
    },
    {
      name: "disabled",
      type: "boolean",
      default: "false",
      description: "Disables the select.",
    },
    {
      name: "...props",
      type: 'ComponentProps<"select">',
      description: "All native select attributes.",
    },
  ];

  const usage = `import { Select } from "@my-memos/ui";

<Select>
  <option value="">Pick one…</option>
  <option value="a">Option A</option>
  <option value="b">Option B</option>
</Select>`;
</script>

<DemoPage {propDefs} {usage}>
  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Default</SectionLabel>
    <div style="display: flex; flex-direction: column; gap: 6px; max-width: 280px;">
      <Label for="sel-demo">Framework</Label>
      <Select id="sel-demo">
        <option value="">Select framework…</option>
        <option value="preact">Preact</option>
        <option value="react">React</option>
        <option value="solid">SolidJS</option>
        <option value="vue">Vue</option>
      </Select>
    </div>
  </section>

  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>States</SectionLabel>
    <div style="display: flex; flex-direction: column; gap: 10px; max-width: 280px;">
      <Select>
        <option>Default</option>
      </Select>
      <Select error>
        <option>Error state</option>
      </Select>
      <Select disabled>
        <option>Disabled state</option>
      </Select>
    </div>
  </section>
</DemoPage>