import { invalidateAll } from "$app/navigation";
import { apiUpdateMemo, apiDeleteMemo } from "$lib/api/memos";
import { showToast } from "$lib/stores/toast.svelte";
import type { Memo, MemoVisibility } from "$lib/types";

export function createDeleteActions() {
  let pendingDeleteId = $state<string | null>(null);
  let showDeleteDialog = $state(false);
  let isDeleting = $state(false);

  function request(id: string) {
    pendingDeleteId = id;
    showDeleteDialog = true;
  }

  function cancel() {
    showDeleteDialog = false;
    pendingDeleteId = null;
  }

  async function confirm() {
    if (!pendingDeleteId || isDeleting) return;
    isDeleting = true;
    try {
      await apiDeleteMemo(pendingDeleteId);
      showDeleteDialog = false;
      pendingDeleteId = null;
      await invalidateAll();
      showToast("success", "Memo deleted");
    } catch (err) {
      showToast("error", "Failed to delete memo", err instanceof Error ? err.message : undefined);
      showDeleteDialog = false;
    } finally {
      isDeleting = false;
    }
  }

  return {
    get pendingDeleteId() {
      return pendingDeleteId;
    },
    get showDeleteDialog() {
      return showDeleteDialog;
    },
    set showDeleteDialog(v: boolean) {
      showDeleteDialog = v;
    },
    get isDeleting() {
      return isDeleting;
    },
    request,
    cancel,
    confirm,
  };
}

export function createEditActions() {
  let editingId = $state<string | null>(null);
  let editContent = $state("");
  let editVisibility = $state<MemoVisibility>("private");
  let isUpdating = $state(false);

  function start(memo: Memo) {
    editingId = memo.id;
    editContent = memo.content;
    editVisibility = memo.visibility;
  }

  function cancel() {
    editingId = null;
    editContent = "";
  }

  async function save(id: string) {
    if (!editContent.trim() || isUpdating) return;
    isUpdating = true;
    try {
      await apiUpdateMemo(id, { content: editContent, visibility: editVisibility });
      editingId = null;
      editContent = "";
      await invalidateAll();
      showToast("success", "Memo updated");
    } catch (err) {
      showToast("error", "Failed to update memo", err instanceof Error ? err.message : undefined);
    } finally {
      isUpdating = false;
    }
  }

  return {
    get editingId() {
      return editingId;
    },
    get editContent() {
      return editContent;
    },
    set editContent(v: string) {
      editContent = v;
    },
    get editVisibility() {
      return editVisibility;
    },
    set editVisibility(v: MemoVisibility) {
      editVisibility = v;
    },
    get isUpdating() {
      return isUpdating;
    },
    start,
    cancel,
    save,
  };
}

export function createPinActions() {
  let pinningId = $state<string | null>(null);

  async function toggle(memo: Memo) {
    if (pinningId) return;
    pinningId = memo.id;
    try {
      const willPin = !memo.pinned;
      await apiUpdateMemo(memo.id, { pinned: willPin });
      await invalidateAll();
      showToast("success", willPin ? "Memo pinned" : "Memo unpinned");
    } catch (err) {
      showToast("error", "Failed to update memo", err instanceof Error ? err.message : undefined);
    } finally {
      pinningId = null;
    }
  }

  return {
    get pinningId() {
      return pinningId;
    },
    toggle,
  };
}

export function createArchiveActions() {
  let archivingId = $state<string | null>(null);

  async function archive(id: string) {
    if (archivingId) return;
    archivingId = id;
    try {
      await apiUpdateMemo(id, { archived: true });
      await invalidateAll();
      showToast("success", "Memo archived");
    } catch (err) {
      showToast("error", "Failed to archive memo", err instanceof Error ? err.message : undefined);
    } finally {
      archivingId = null;
    }
  }

  return {
    get archivingId() {
      return archivingId;
    },
    archive,
  };
}

export function createRestoreActions() {
  let restoringId = $state<string | null>(null);

  async function restore(id: string) {
    restoringId = id;
    try {
      await apiUpdateMemo(id, { archived: false });
      await invalidateAll();
      showToast("success", "Memo restored");
    } catch (err) {
      showToast("error", "Failed to restore memo", err instanceof Error ? err.message : undefined);
    } finally {
      restoringId = null;
    }
  }

  return {
    get restoringId() {
      return restoringId;
    },
    restore,
  };
}
