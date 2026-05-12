<script lang="ts">
  import { untrack } from "svelte";
  import { Editor } from "@tiptap/core";
  import StarterKit from "@tiptap/starter-kit";
  import { TaskList } from "@tiptap/extension-task-list";
  import { TaskItem } from "@tiptap/extension-task-item";
  import { Placeholder } from "@tiptap/extension-placeholder";
  import { Markdown } from "@tiptap/markdown";
  import { cn } from "@my-memos/ui";

  interface Props {
    value?: string;
    placeholder?: string;
    class?: string;
    onkeydown?: (e: KeyboardEvent) => void;
    ontextchange?: (value: string) => void;
  }

  let {
    value = $bindable(""),
    placeholder = "",
    class: extraClass = "",
    onkeydown,
    ontextchange,
  }: Props = $props();

  let el = $state<HTMLDivElement | undefined>(undefined);
  let editor: Editor | undefined;

  $effect(() => {
    if (!el) return;

    editor = new Editor({
      element: el,
      extensions: [
        StarterKit.configure({ link: { openOnClick: false } }),
        TaskList,
        TaskItem.configure({ nested: false }),
        Placeholder.configure({ placeholder }),
        Markdown,
      ],
      content: untrack(() => value),
      contentType: "markdown",
      editorProps: {
        attributes: { class: "tiptap-editor" },
        handleKeyDown(_view, event) {
          onkeydown?.(event);
          return false;
        },
      },
      onUpdate({ editor: ed }) {
        const md = ed.getMarkdown();
        untrack(() => {
          value = md;
        });
        ontextchange?.(md);
      },
    });

    return () => {
      editor?.destroy();
      editor = undefined;
    };
  });

  $effect(() => {
    const incoming = value;
    untrack(() => {
      if (!editor || editor.isDestroyed) return;
      if (editor.getMarkdown() === incoming) return;
      editor.commands.setContent(incoming, { emitUpdate: false, contentType: "markdown" });
    });
  });
</script>

<div class={cn("tiptap-wrapper", extraClass)} bind:this={el}></div>
