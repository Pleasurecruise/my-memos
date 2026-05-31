<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { Editor, type JSONContent } from "@tiptap/core";
  import Placeholder from "@tiptap/extension-placeholder";
  import { Table } from "@tiptap/extension-table";
  import TableCell from "@tiptap/extension-table-cell";
  import TableHeader from "@tiptap/extension-table-header";
  import TableRow from "@tiptap/extension-table-row";
  import StarterKit from "@tiptap/starter-kit";
  import { renderToMarkdown } from "@tiptap/static-renderer/pm/markdown";
  import NoteToolbar from "./NoteToolbar.svelte";
  import NoteSlashMenu from "./NoteSlashMenu.svelte";
  import { SLASH_COMMANDS, type SlashCommand } from "./slash-commands";

  interface Props {
    html: string;
    onmarkdownchange?: (value: string) => void;
  }

  let { html, onmarkdownchange }: Props = $props();

  let host = $state<HTMLElement | null>(null);
  let editor = $state<Editor | null>(null);
  let refreshKey = $state(0);
  let slashQuery = $state("");
  let slashRange = $state<{ from: number; to: number } | null>(null);
  let slashMenuPosition = $state("");

  const extensions = [
    StarterKit,
    Placeholder.configure({ placeholder: "Write your note..." }),
    Table.configure({ resizable: false }),
    TableRow,
    TableHeader,
    TableCell,
  ];

  const filteredSlashCommands = $derived.by(() => {
    const query = slashQuery.trim().toLowerCase();
    if (!query) return SLASH_COMMANDS;
    return SLASH_COMMANDS.filter((command) =>
      `${command.title} ${command.keywords}`.toLowerCase().includes(query),
    );
  });

  function markdownFromEditor(current: Editor): string {
    return renderToMarkdown({
      extensions,
      content: current.getJSON() as JSONContent,
    }).trimEnd();
  }

  function syncMarkdown() {
    if (!editor) return;
    onmarkdownchange?.(markdownFromEditor(editor));
  }

  function closeSlashMenu() {
    slashRange = null;
    slashQuery = "";
    slashMenuPosition = "";
  }

  function updateSlashMenu() {
    if (!editor) return;
    const { from, empty } = editor.state.selection;
    if (!empty) {
      closeSlashMenu();
      return;
    }

    const textBefore = editor.state.doc.textBetween(Math.max(0, from - 32), from, "\n", "\0");
    const match = textBefore.match(/(?:^|\s)\/([\p{L}\p{N}-]*)$/u);
    if (!match) {
      closeSlashMenu();
      return;
    }

    slashQuery = match[1] ?? "";
    slashRange = { from: from - slashQuery.length - 1, to: from };
  }

  function updateSlashMenuPosition() {
    if (!editor || !slashRange) {
      slashMenuPosition = "";
      return;
    }

    const coords = editor.view.coordsAtPos(slashRange.to);
    const width = Math.min(256, window.innerWidth - 16);
    const estimatedHeight = Math.min(320, filteredSlashCommands.length * 56);
    const left = Math.min(Math.max(8, coords.left), window.innerWidth - width - 8);
    const below = coords.bottom + 6;

    if (below + estimatedHeight <= window.innerHeight - 8) {
      slashMenuPosition = `left:${left}px;top:${below}px;--slash-menu-width:${width}px`;
      return;
    }

    const bottom = window.innerHeight - coords.top + 6;
    const maxAvailable = coords.top - 8 - 6;
    const clampStyle =
      maxAvailable > 0 ? `max-height:${Math.max(40, maxAvailable)}px;overflow-y:auto;` : "";
    slashMenuPosition = `left:${left}px;bottom:${bottom}px;--slash-menu-width:${width}px;${clampStyle}`;
  }

  function runSlashCommand(command: SlashCommand) {
    if (!editor || !slashRange) return;
    editor.chain().focus().deleteRange(slashRange).run();
    command.run(editor);
    closeSlashMenu();
    syncMarkdown();
  }

  $effect(() => {
    if (!slashRange || filteredSlashCommands.length === 0) return;

    updateSlashMenuPosition();
    window.addEventListener("scroll", updateSlashMenuPosition, { passive: true });
    window.addEventListener("resize", updateSlashMenuPosition);
    document.addEventListener("selectionchange", updateSlashMenuPosition);

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeSlashMenu();
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        closeSlashMenu();
      }
    }
    document.addEventListener("keydown", onKeyDown, { capture: true });

    return () => {
      window.removeEventListener("scroll", updateSlashMenuPosition);
      window.removeEventListener("resize", updateSlashMenuPosition);
      document.removeEventListener("selectionchange", updateSlashMenuPosition);
      document.removeEventListener("keydown", onKeyDown, { capture: true });
    };
  });

  onMount(() => {
    if (!host) return;

    editor = new Editor({
      element: host,
      extensions,
      content: html,
      editorProps: {
        attributes: {
          class: "note-editor__surface",
        },
      },
      onUpdate: () => {
        refreshKey++;
        updateSlashMenu();
        syncMarkdown();
      },
      onSelectionUpdate: () => {
        refreshKey++;
        updateSlashMenu();
      },
    });

    syncMarkdown();
  });

  onDestroy(() => {
    editor?.destroy();
  });

  function isActive(name: string, attrs?: Record<string, string | number>): boolean {
    void refreshKey;
    return Boolean(editor?.isActive(name, attrs));
  }
</script>

<div class="note-editor rounded-lg border border-border bg-background shadow-sm">
  <NoteToolbar {editor} {isActive} />

  <div class="relative">
    <div bind:this={host}></div>
    {#if slashRange}
      <NoteSlashMenu
        commands={filteredSlashCommands}
        position={slashMenuPosition}
        onselect={runSlashCommand}
      />
    {/if}
  </div>
</div>

<style>
  :global(.note-editor__surface) {
    min-height: 52vh;
    padding: 1rem;
    color: var(--color-foreground);
    font-family: var(--font-sans), "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
    font-size: 1rem;
    line-height: 1.65;
    outline: none;
    word-break: break-word;
    overflow-wrap: break-word;
  }

  @media (min-width: 640px) {
    :global(.note-editor__surface) {
      padding: 1.25rem;
      font-size: 1rem;
    }
  }

  :global(.note-editor__surface p) {
    margin: 1em 0;
  }

  :global(.note-editor__surface h1),
  :global(.note-editor__surface h2),
  :global(.note-editor__surface h3),
  :global(.note-editor__surface h4),
  :global(.note-editor__surface h5),
  :global(.note-editor__surface h6) {
    margin-top: 2em;
    margin-bottom: 0.6em;
    color: var(--color-foreground);
    font-family: var(--font-sans);
    font-weight: 600;
    line-height: 1.4;
  }

  :global(.note-editor__surface h1) {
    font-size: 1.75em;
  }

  :global(.note-editor__surface h2) {
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 0.3em;
    font-size: 1.375em;
  }

  :global(.note-editor__surface h3) {
    font-size: 1.2em;
  }

  :global(.note-editor__surface ul),
  :global(.note-editor__surface ol) {
    margin: 1em 0;
    padding-left: 1.6em;
  }

  :global(.note-editor__surface ul) {
    list-style-type: disc;
  }

  :global(.note-editor__surface ol) {
    list-style-type: decimal;
  }

  :global(.note-editor__surface li) {
    margin: 0.4em 0;
    line-height: 1.75;
  }

  :global(.note-editor__surface blockquote) {
    margin: 1.5em 0;
    border-left: 2px solid var(--color-muted-foreground);
    padding: 0.1em 0 0.1em 1.25em;
    color: var(--color-muted-foreground);
    font-style: italic;
  }

  :global(.note-editor__surface pre) {
    margin: 1.75em 0;
    overflow-x: auto;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-muted);
    padding: 1rem;
  }

  :global(.note-editor__surface code) {
    font-family: var(--font-mono), "Fira Code", ui-monospace, Menlo, Monaco, Consolas, monospace;
    font-size: 0.875em;
  }

  :global(.note-editor__surface :not(pre) > code) {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-muted);
    padding: 0.15em 0.4em;
  }

  :global(.note-editor__surface table) {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9em;
    margin: 1.5em 0;
  }

  :global(.note-editor__surface th),
  :global(.note-editor__surface td) {
    border: 1px solid var(--color-border);
    padding: 0.5em 0.75em;
    text-align: left;
    vertical-align: top;
  }

  :global(.note-editor__surface th) {
    background: var(--color-muted);
    font-weight: 600;
  }

  :global(.note-editor__surface hr) {
    border: none;
    border-top: 1px solid var(--color-border);
    margin: 2.5em 0;
  }

  :global(.note-editor__surface .is-editor-empty:first-child::before) {
    float: left;
    height: 0;
    color: var(--color-muted-foreground);
    content: attr(data-placeholder);
    pointer-events: none;
  }
</style>
