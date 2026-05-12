<script module lang="ts">
  export const title = "Popover";
</script>

<script lang="ts">
  import {
    Popover, PopoverTrigger, PopoverContent,
    Button, Input, Label, Separator,
  } from "../../src";
  import DemoPage from "../DemoPage.svelte";
  import SectionLabel from "../SectionLabel.svelte";

  const propDefs = [
    {
      name: "open",
      type: "boolean",
      default: "false",
      description: "Controls visibility. Supports bind:open.",
    },
    {
      name: "side",
      type: '"top" | "bottom"',
      default: '"bottom"',
      description: "Which side the content appears on relative to the trigger.",
    },
    {
      name: "align",
      type: '"start" | "center" | "end"',
      default: '"start"',
      description: "Alignment of the content along the main axis.",
    },
  ];

  const usage = `import { Popover, PopoverTrigger, PopoverContent, Button } from "@my-memos/ui";

<Popover>
  <PopoverTrigger>
    <Button variant="outline">Open popover</Button>
  </PopoverTrigger>
  <PopoverContent>
    <p>Popover content goes here.</p>
  </PopoverContent>
</Popover>`;
</script>

<DemoPage {propDefs} {usage}>
  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Basic</SectionLabel>
    <div style="display: flex; gap: 16px; padding-bottom: 160px;">
      <Popover>
        <PopoverTrigger>
          <Button variant="outline">Open popover</Button>
        </PopoverTrigger>
        <PopoverContent>
          <p style="font-size: 13px; color: var(--color-foreground); margin: 0 0 4px;">
            Quick note
          </p>
          <p style="font-size: 12px; color: var(--color-muted-foreground); margin: 0;">
            Popovers are great for contextual info or small actions without interrupting the flow.
          </p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger>
          <Button variant="outline">Edit profile</Button>
        </PopoverTrigger>
        <PopoverContent class="w-72">
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <Label for="pop-name">Display name</Label>
              <Input id="pop-name" placeholder="Your name" />
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <Label for="pop-email">Email</Label>
              <Input id="pop-email" type="email" placeholder="you@example.com" />
            </div>
            <Button size="sm">Save changes</Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  </section>

  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Alignment</SectionLabel>
    <div style="display: flex; gap: 16px; justify-content: center; padding-bottom: 120px;">
      <Popover>
        <PopoverTrigger>
          <Button variant="secondary">Start</Button>
        </PopoverTrigger>
        <PopoverContent align="start">
          <p style="font-size: 13px; margin: 0; color: var(--color-foreground);">Aligned to start</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger>
          <Button variant="secondary">Center</Button>
        </PopoverTrigger>
        <PopoverContent align="center">
          <p style="font-size: 13px; margin: 0; color: var(--color-foreground);">Aligned to center</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger>
          <Button variant="secondary">End</Button>
        </PopoverTrigger>
        <PopoverContent align="end">
          <p style="font-size: 13px; margin: 0; color: var(--color-foreground);">Aligned to end</p>
        </PopoverContent>
      </Popover>
    </div>
  </section>
</DemoPage>