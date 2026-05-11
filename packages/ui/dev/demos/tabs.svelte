<script module lang="ts">
  export const title = "Tabs";
</script>

<script lang="ts">
  import { TabsList, TabsTrigger, TabsContent } from "../../src";
  import DemoPage from "../DemoPage.svelte";
  import SectionLabel from "../SectionLabel.svelte";

  let active = $state("overview");
  let active2 = $state("account");

  const propDefs = [
    {
      name: "active",
      type: "boolean",
      default: "false",
      description: "Marks this trigger as the selected tab.",
    },
    {
      name: "...props",
      type: 'ComponentProps<"button">',
      description: "All native button attributes.",
    },
  ];

  const usage = `import { TabsList, TabsTrigger, TabsContent } from "@my-memos/ui";

<script lang="ts">
  let active = $state("a");
<${"/"}script>

<TabsList>
  <TabsTrigger active={active === "a"} onclick={() => (active = "a")}>Tab A</TabsTrigger>
  <TabsTrigger active={active === "b"} onclick={() => (active = "b")}>Tab B</TabsTrigger>
</TabsList>
<TabsContent>
  {#if active === "a"}<p>Content A</p>{/if}
  {#if active === "b"}<p>Content B</p>{/if}
</TabsContent>`;

  const basicTabs = ["overview", "analytics", "settings"];

  const disabledTabs = [
    { id: "account", label: "Account" },
    { id: "billing", label: "Billing" },
    { id: "team", label: "Team", disabled: true },
  ];
</script>

<DemoPage {propDefs} {usage}>
  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Basic</SectionLabel>
    <div>
      <TabsList>
        {#each basicTabs as id (id)}
          <TabsTrigger active={active === id} onclick={() => (active = id)}>
            {id.charAt(0).toUpperCase() + id.slice(1)}
          </TabsTrigger>
        {/each}
      </TabsList>
      <TabsContent>
        {#if active === "overview"}
          <p style="font-family: var(--font-sans); font-size: 14px; color: var(--color-muted-foreground);">
            Overview content
          </p>
        {/if}
        {#if active === "analytics"}
          <p style="font-family: var(--font-sans); font-size: 14px; color: var(--color-muted-foreground);">
            Analytics content
          </p>
        {/if}
        {#if active === "settings"}
          <p style="font-family: var(--font-sans); font-size: 14px; color: var(--color-muted-foreground);">
            Settings content
          </p>
        {/if}
      </TabsContent>
    </div>
  </section>

  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>With disabled tab</SectionLabel>
    <div>
      <TabsList>
        {#each disabledTabs as { id, label, disabled } (id)}
          <TabsTrigger
            active={active2 === id}
            {disabled}
            onclick={() => { if (!disabled) active2 = id; }}
          >
            {label}
          </TabsTrigger>
        {/each}
      </TabsList>
      <TabsContent>
        <p style="font-family: var(--font-sans); font-size: 14px; color: var(--color-muted-foreground);">
          {active2.charAt(0).toUpperCase() + active2.slice(1)} content
        </p>
      </TabsContent>
    </div>
  </section>
</DemoPage>
