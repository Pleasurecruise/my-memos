<script module lang="ts">
  export const title = "Dropdown Menu";
</script>

<script lang="ts">
  import { ChevronDown, Ellipsis, FilePlus, FolderOpen, Save, Trash2 } from "lucide-svelte";
  import {
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
    Button,
  } from "../../src";
  import DemoPage from "../DemoPage.svelte";
  import SectionLabel from "../SectionLabel.svelte";

  let lastAction = $state("");

  const propDefs = [
    {
      name: "open",
      type: "boolean",
      default: "false",
      description: "Controls visibility. Supports bind:open.",
    },
    {
      name: "align",
      type: '"start" | "center" | "end"',
      default: '"start"',
      description: "Alignment of the menu along the trigger axis.",
    },
    {
      name: "destructive",
      type: "boolean",
      default: "false",
      description: "Renders the menu item in a destructive (error) color.",
    },
  ];

  const usage = `import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
  Button,
} from "@my-memos/ui";

<DropdownMenu>
  <DropdownMenuTrigger>
    <Button variant="outline">Open menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>Account</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem onclick={() => console.log("Profile")}>Profile</DropdownMenuItem>
    <DropdownMenuItem onclick={() => console.log("Settings")}>Settings</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem destructive onclick={() => console.log("Sign out")}>Sign out</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`;
</script>

<DemoPage {propDefs} {usage}>
  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Basic</SectionLabel>
    <div style="display: flex; gap: 16px; padding-bottom: 220px;">
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant="outline">
            Options
            <ChevronDown size={13} style="opacity:0.6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onclick={() => (lastAction = "Profile")}>Profile</DropdownMenuItem>
          <DropdownMenuItem onclick={() => (lastAction = "Settings")}>Settings</DropdownMenuItem>
          <DropdownMenuItem onclick={() => (lastAction = "Billing")}>Billing</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onclick={() => (lastAction = "Sign out")}>Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant="ghost" size="icon">
            <Ellipsis size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onclick={() => (lastAction = "Edit")}>Edit</DropdownMenuItem>
          <DropdownMenuItem onclick={() => (lastAction = "Duplicate")}>Duplicate</DropdownMenuItem>
          <DropdownMenuItem onclick={() => (lastAction = "Archive")}>Archive</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onclick={() => (lastAction = "Delete")}>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    {#if lastAction}
      <p style="font-size: 12px; color: var(--color-muted-foreground); font-family: var(--font-mono);">
        Last action: <span style="color: var(--color-accent);">{lastAction}</span>
      </p>
    {/if}
  </section>

  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>With icons</SectionLabel>
    <div style="padding-bottom: 200px;">
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant="outline">
            File
            <ChevronDown size={13} style="opacity:0.6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onclick={() => (lastAction = "New file")}>
            <FilePlus size={14} />
            New file
          </DropdownMenuItem>
          <DropdownMenuItem onclick={() => (lastAction = "Open")}>
            <FolderOpen size={14} />
            Open
          </DropdownMenuItem>
          <DropdownMenuItem onclick={() => (lastAction = "Save")}>
            <Save size={14} />
            Save
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onclick={() => (lastAction = "Delete file")}>
            <Trash2 size={14} />
            Delete file
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </section>
</DemoPage>