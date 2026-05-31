<script lang="ts">
  import type { Editor } from "@tiptap/core";
  import type { Component } from "svelte";
  import { cn } from "@my-memos/ui";
  import {
    Bold,
    Code2,
    Heading1,
    Heading2,
    Italic,
    List,
    ListOrdered,
    Minus,
    Quote,
    Strikethrough,
    Table2,
  } from "@lucide/svelte";

  interface Props {
    editor: Editor | null;
    isActive: (name: string, attrs?: Record<string, string | number>) => boolean;
  }

  let { editor, isActive }: Props = $props();

  interface ToolbarButton {
    title: string;
    icon: Component;
    activeName?: string;
    activeAttrs?: Record<string, string | number>;
    action: (editor: Editor) => void;
  }

  const buttons: (ToolbarButton | "divider")[] = [
    {
      title: "Bold",
      icon: Bold,
      activeName: "bold",
      action: (editor) => editor.chain().focus().toggleBold().run(),
    },
    {
      title: "Italic",
      icon: Italic,
      activeName: "italic",
      action: (editor) => editor.chain().focus().toggleItalic().run(),
    },
    {
      title: "Strikethrough",
      icon: Strikethrough,
      activeName: "strike",
      action: (editor) => editor.chain().focus().toggleStrike().run(),
    },
    "divider",
    {
      title: "Heading 1",
      icon: Heading1,
      activeName: "heading",
      activeAttrs: { level: 1 },
      action: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      title: "Heading 2",
      icon: Heading2,
      activeName: "heading",
      activeAttrs: { level: 2 },
      action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      title: "Bulleted list",
      icon: List,
      activeName: "bulletList",
      action: (editor) => editor.chain().focus().toggleBulletList().run(),
    },
    {
      title: "Numbered list",
      icon: ListOrdered,
      activeName: "orderedList",
      action: (editor) => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      title: "Quote",
      icon: Quote,
      activeName: "blockquote",
      action: (editor) => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      title: "Code block",
      icon: Code2,
      activeName: "codeBlock",
      action: (editor) => editor.chain().focus().toggleCodeBlock().run(),
    },
    {
      title: "Divider",
      icon: Minus,
      action: (editor) => editor.chain().focus().setHorizontalRule().run(),
    },
    {
      title: "Table",
      icon: Table2,
      action: (editor) =>
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    },
  ];
</script>

<div
  class="flex flex-nowrap items-center gap-1 overflow-x-auto border-b border-border px-2 py-2 sm:flex-wrap"
>
  {#each buttons as button}
    {#if button === "divider"}
      <span class="mx-1 h-5 w-px bg-border"></span>
    {:else}
      <button
        type="button"
        title={button.title}
        class={cn(
          "note-editor__tool",
          button.activeName && isActive(button.activeName, button.activeAttrs) && "is-active",
        )}
        onclick={() => editor && button.action(editor)}
      >
        <button.icon class="size-4" />
      </button>
    {/if}
  {/each}
</div>

<style>
  :global(.note-editor__tool) {
    display: inline-flex;
    flex: 0 0 auto;
    width: 1.875rem;
    height: 1.875rem;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-md);
    color: var(--color-muted-foreground);
    transition:
      color 150ms,
      background-color 150ms;
  }

  :global(.note-editor__tool:hover),
  :global(.note-editor__tool.is-active) {
    background: var(--color-muted);
    color: var(--color-foreground);
  }
</style>
