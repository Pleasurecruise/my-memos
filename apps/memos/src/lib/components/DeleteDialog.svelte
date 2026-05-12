<script lang="ts">
  import {
    Button,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
  } from "@my-memos/ui";

  interface DeleteDialogProps {
    open: boolean;
    isDeleting: boolean;
    title?: string;
    description?: string;
    onConfirm: () => void;
    onCancel: () => void;
  }

  let {
    open = $bindable(),
    isDeleting,
    title = "Delete this memo?",
    description = "This action cannot be undone. The memo will be permanently removed.",
    onConfirm,
    onCancel,
  }: DeleteDialogProps = $props();
</script>

<Dialog bind:open>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription>{description}</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onclick={onCancel} disabled={isDeleting}>Cancel</Button>
      <Button variant="destructive" onclick={onConfirm} disabled={isDeleting}>
        {isDeleting ? "Deleting…" : "Delete"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
