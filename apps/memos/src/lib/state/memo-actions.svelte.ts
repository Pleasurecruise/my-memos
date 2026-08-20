import { invalidateAll } from "$app/navigation";
import { apiDeleteMemo, apiUpdateMemo, memoSchema } from "$lib/services/memos";
import { showToast } from "$lib/state/toast.svelte";
import type { Memo, MemoVisibility } from "$lib/types";

export function createEditActions() {
  let editingId = $state<string | null>(null);
  let editContent = $state("");
  let editVisibility = $state<MemoVisibility>("private");
  let savedContent = "";
  let savedVisibility: MemoVisibility = "private";
  let isUpdating = $state(false);

  async function start(memo: Memo) {
    if (editingId === memo.id || isUpdating) return;

    if (editingId && !(await save(editingId))) return;

    const response = await fetch(`/api/memos/${memo.id}`);
    if (!response.ok) {
      showToast("error", `Failed to load memo (${response.status})`);
      return;
    }
    const latest = memoSchema.parse(await response.json());
    editingId = latest.id;
    editContent = latest.content;
    editVisibility = latest.visibility;
    savedContent = latest.content;
    savedVisibility = latest.visibility;
  }

  function cancel() {
    if (isUpdating) return;
    editingId = null;
    editContent = "";
    savedContent = "";
  }

  async function save(id: string): Promise<boolean> {
    if (editingId !== id || !editContent.trim() || isUpdating) return false;

    if (editContent === savedContent && editVisibility === savedVisibility) {
      cancel();
      return true;
    }

    isUpdating = true;
    return apiUpdateMemo(id, { content: editContent, visibility: editVisibility })
      .then(
        async () => {
          editingId = null;
          editContent = "";
          savedContent = "";
          await invalidateAll();
          showToast("success", "Memo updated");
          return true;
        },
        () => {
          showToast("error", "Failed to update memo");
          return false;
        },
      )
      .finally(() => {
        isUpdating = false;
      });
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

  function confirm() {
    if (!pendingDeleteId || isDeleting) return;
    isDeleting = true;
    apiDeleteMemo(pendingDeleteId)
      .then(async () => {
        showDeleteDialog = false;
        pendingDeleteId = null;
        await invalidateAll();
        showToast("success", "Memo deleted");
      })
      .catch((err: unknown) => {
        showToast("error", "Failed to delete memo", err instanceof Error ? err.message : undefined);
        showDeleteDialog = false;
      })
      .finally(() => {
        isDeleting = false;
      });
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

export function createPinActions() {
  let pinningId = $state<string | null>(null);

  function toggle(memo: Memo) {
    if (pinningId) return;
    pinningId = memo.id;
    const willPin = !memo.pinned;
    apiUpdateMemo(memo.id, { pinned: willPin })
      .then(async () => {
        await invalidateAll();
        showToast("success", willPin ? "Memo pinned" : "Memo unpinned");
      })
      .catch((err: unknown) => {
        showToast("error", "Failed to update memo", err instanceof Error ? err.message : undefined);
      })
      .finally(() => {
        pinningId = null;
      });
  }

  return {
    get pinningId() {
      return pinningId;
    },
    toggle,
  };
}

export function createFavoriteActions() {
  let favoritingId = $state<string | null>(null);

  function toggle(memo: Memo) {
    if (favoritingId) return;
    favoritingId = memo.id;
    const willFavorite = !memo.favorite;
    apiUpdateMemo(memo.id, { favorite: willFavorite })
      .then(
        async () => {
          await invalidateAll();
          showToast("success", willFavorite ? "Memo added to favorites" : "Memo unfavorited");
        },
        () => {
          showToast("error", "Failed to update memo");
        },
      )
      .finally(() => {
        favoritingId = null;
      });
  }

  return {
    get favoritingId() {
      return favoritingId;
    },
    toggle,
  };
}

export function createArchiveActions() {
  let archivingId = $state<string | null>(null);

  function archive(id: string) {
    if (archivingId) return;
    archivingId = id;
    apiUpdateMemo(id, { archived: true })
      .then(async () => {
        await invalidateAll();
        showToast("success", "Memo archived");
      })
      .catch((err: unknown) => {
        showToast(
          "error",
          "Failed to archive memo",
          err instanceof Error ? err.message : undefined,
        );
      })
      .finally(() => {
        archivingId = null;
      });
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

  function restore(id: string) {
    restoringId = id;
    apiUpdateMemo(id, { archived: false })
      .then(async () => {
        await invalidateAll();
        showToast("success", "Memo restored");
      })
      .catch((err: unknown) => {
        showToast(
          "error",
          "Failed to restore memo",
          err instanceof Error ? err.message : undefined,
        );
      })
      .finally(() => {
        restoringId = null;
      });
  }

  return {
    get restoringId() {
      return restoringId;
    },
    restore,
  };
}
