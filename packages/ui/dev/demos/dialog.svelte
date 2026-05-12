<script module lang="ts">
  export const title = "Dialog";
</script>

<script lang="ts">
  import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    Button,
  } from "../../src";
  import DemoPage from "../DemoPage.svelte";
  import SectionLabel from "../SectionLabel.svelte";

  let basicOpen = $state(false);
  let destructiveOpen = $state(false);

  const propDefs = [
    {
      name: "open",
      type: "boolean",
      default: "false",
      description: "Controls whether the dialog is visible. Supports bind:open.",
    },
    {
      name: "children",
      type: "Snippet",
      default: "—",
      description: "Content rendered inside the dialog root (usually DialogContent).",
    },
  ];

  const usage = `import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
  Button,
} from "@my-memos/ui";

let open = $state(false);

<Button onclick={() => open = true}>Open dialog</Button>

<Dialog bind:open>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit profile</DialogTitle>
      <DialogDescription>Make changes to your profile here.</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onclick={() => open = false}>Cancel</Button>
      <Button onclick={() => open = false}>Save changes</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`;
</script>

<DemoPage {propDefs} {usage}>
  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Basic</SectionLabel>
    <div style="display: flex; gap: 8px;">
      <Button onclick={() => (basicOpen = true)}>Open dialog</Button>
    </div>

    <Dialog bind:open={basicOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onclick={() => (basicOpen = false)}>Cancel</Button>
          <Button onclick={() => (basicOpen = false)}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </section>

  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Destructive confirmation</SectionLabel>
    <div style="display: flex; gap: 8px;">
      <Button variant="destructive" onclick={() => (destructiveOpen = true)}>Delete item</Button>
    </div>

    <Dialog bind:open={destructiveOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete item?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. The item will be permanently removed.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onclick={() => (destructiveOpen = false)}>Cancel</Button>
          <Button variant="destructive" onclick={() => (destructiveOpen = false)}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </section>
</DemoPage>