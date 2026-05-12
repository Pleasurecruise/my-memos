import type { ToastVariant } from "@my-memos/ui";

interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
}

const toasts = $state<ToastItem[]>([]);

export function showToast(variant: ToastVariant, title: string, description?: string) {
  const id = Math.random().toString(36).slice(2, 9);
  toasts.push({ id, variant, title, description });
  setTimeout(() => dismiss(id), 4000);
}

export function dismiss(id: string) {
  const idx = toasts.findIndex((t) => t.id === id);
  if (idx !== -1) toasts.splice(idx, 1);
}

export { toasts };
