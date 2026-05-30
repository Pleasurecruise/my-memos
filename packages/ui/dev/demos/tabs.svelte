<script module lang="ts">
  export const title = "Tabs";
</script>

<script lang="ts">
  import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../src";
  import DemoPage from "../DemoPage.svelte";
  import SectionLabel from "../SectionLabel.svelte";

  let active = $state("overview");
  let active2 = $state("account");

  const propDefs = [
    {
      name: "value",
      type: "string",
      default: '""',
      description: "The value of the tab this trigger represents.",
    },
    {
      name: "...props",
      type: 'ComponentProps<"button">',
      description: "All native button attributes.",
    },
  ];

  const usage = `import { Tabs, TabsList, TabsTrigger, TabsContent } from "@my-memos/ui";

<script lang="ts">
  let active = $state("a");
<${"/"}script>

<Tabs value={active} onValueChange={(v) => (active = v)}>
  <TabsList>
    <TabsTrigger value="a">Tab A</TabsTrigger>
    <TabsTrigger value="b">Tab B</TabsTrigger>
  </TabsList>
  <TabsContent value="a"><p>Content A</p></TabsContent>
  <TabsContent value="b"><p>Content B</p></TabsContent>
</Tabs>`;

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
      <Tabs value={active} onValueChange={(v) => (active = v)}>
        <TabsList>
          {#each basicTabs as id (id)}
            <TabsTrigger value={id}>
              {id.charAt(0).toUpperCase() + id.slice(1)}
            </TabsTrigger>
          {/each}
        </TabsList>
        <TabsContent value="overview">
          <p
            style="font-family: var(--font-sans); font-size: 14px; color: var(--color-muted-foreground);"
          >
            Overview content
          </p>
        </TabsContent>
        <TabsContent value="analytics">
          <p
            style="font-family: var(--font-sans); font-size: 14px; color: var(--color-muted-foreground);"
          >
            Analytics content
          </p>
        </TabsContent>
        <TabsContent value="settings">
          <p
            style="font-family: var(--font-sans); font-size: 14px; color: var(--color-muted-foreground);"
          >
            Settings content
          </p>
        </TabsContent>
      </Tabs>
    </div>
  </section>

  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>With disabled tab</SectionLabel>
    <div>
      <Tabs value={active2} onValueChange={(v) => (active2 = v)}>
        <TabsList>
          {#each disabledTabs as { id, label, disabled } (id)}
            <TabsTrigger value={id} {disabled}>
              {label}
            </TabsTrigger>
          {/each}
        </TabsList>
        {#each disabledTabs as { id } (id)}
          <TabsContent value={id}>
            <p
              style="font-family: var(--font-sans); font-size: 14px; color: var(--color-muted-foreground);"
            >
              {id.charAt(0).toUpperCase() + id.slice(1)} content
            </p>
          </TabsContent>
        {/each}
      </Tabs>
    </div>
  </section>
</DemoPage>
