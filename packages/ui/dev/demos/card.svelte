<script module lang="ts">
  export const title = "Card";
</script>

<script lang="ts">
  import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../src";
  import { Button } from "../../src";
  import { Badge } from "../../src";
  import DemoPage from "../DemoPage.svelte";
  import SectionLabel from "../SectionLabel.svelte";

  const propDefs = [
    {
      name: "...props",
      type: 'ComponentProps<"div">',
      description: "All native div attributes.",
    },
  ];

  const usage = `import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@my-memos/ui";

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content goes here.</CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>`;
</script>

<DemoPage {propDefs} {usage}>
  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Basic</SectionLabel>
    <div style="display: flex; gap: 16px; flex-wrap: wrap; align-items: flex-start;">
      <Card style="width: 320px;">
        <CardHeader>
          <CardTitle>Getting started</CardTitle>
          <CardDescription>A minimal card with header and content.</CardDescription>
        </CardHeader>
        <CardContent>
          <p style="font-size: 13px; color: var(--color-muted-foreground); line-height: 1.6;">
            Cards group related information into a distinct visual container with consistent spacing
            and a subtle border.
          </p>
        </CardContent>
      </Card>

      <Card style="width: 320px;">
        <CardHeader>
          <CardTitle>With footer</CardTitle>
          <CardDescription>Card including a footer action row.</CardDescription>
        </CardHeader>
        <CardContent>
          <p style="font-size: 13px; color: var(--color-muted-foreground); line-height: 1.6;">
            Use CardFooter for confirm / cancel button pairs or supplementary links.
          </p>
        </CardContent>
        <CardFooter style="gap: 8px;">
          <Button size="sm">Confirm</Button>
          <Button size="sm" variant="ghost">Cancel</Button>
        </CardFooter>
      </Card>
    </div>
  </section>

  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Composing with other components</SectionLabel>
    <Card style="width: 320px;">
      <CardHeader>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <CardTitle>Release v1.2</CardTitle>
          <Badge variant="success">Stable</Badge>
        </div>
        <CardDescription>Shipped on May 10, 2026</CardDescription>
      </CardHeader>
      <CardContent>
        <p style="font-size: 13px; color: var(--color-muted-foreground); line-height: 1.6;">
          New component library with Card, Separator, Label, and more.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm">View changelog</Button>
      </CardFooter>
    </Card>
  </section>
</DemoPage>
