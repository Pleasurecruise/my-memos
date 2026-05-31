import type { Editor } from "@tiptap/core";
import type { Component } from "svelte";
import { Code2, Heading1, Heading2, List, ListOrdered, Minus, Quote, Table2 } from "@lucide/svelte";

export interface SlashCommand {
  title: string;
  hint: string;
  icon: Component;
  keywords: string;
  run: (editor: Editor) => void;
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    title: "Heading 1",
    hint: "Large section heading",
    icon: Heading1,
    keywords: "h1 heading title",
    run: (editor) => editor.chain().focus().setHeading({ level: 1 }).run(),
  },
  {
    title: "Heading 2",
    hint: "Subsection heading",
    icon: Heading2,
    keywords: "h2 heading subtitle",
    run: (editor) => editor.chain().focus().setHeading({ level: 2 }).run(),
  },
  {
    title: "Bulleted list",
    hint: "Simple unordered list",
    icon: List,
    keywords: "bullet list ul",
    run: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    title: "Numbered list",
    hint: "Ordered list",
    icon: ListOrdered,
    keywords: "number ordered list ol",
    run: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    title: "Quote",
    hint: "Indented quotation block",
    icon: Quote,
    keywords: "quote blockquote",
    run: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    title: "Code block",
    hint: "Preformatted code",
    icon: Code2,
    keywords: "code pre fenced",
    run: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    title: "Divider",
    hint: "Horizontal rule",
    icon: Minus,
    keywords: "divider hr rule",
    run: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  {
    title: "Table",
    hint: "3 by 3 table",
    icon: Table2,
    keywords: "table grid",
    run: (editor) =>
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
];
