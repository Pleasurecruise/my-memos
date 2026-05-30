<script lang="ts">
  import { cn } from "@my-memos/ui";

  interface Props {
    value?: string;
    placeholder?: string;
    class?: string;
    onkeydown?: (e: KeyboardEvent) => void;
    ontextchange?: (value: string) => void;
    onblur?: () => void;
    editorElement?: HTMLTextAreaElement | null;
  }

  let {
    value = $bindable(""),
    placeholder = "",
    class: extraClass = "",
    onkeydown,
    ontextchange,
    onblur,
    editorElement = $bindable(null),
  }: Props = $props();

  function handleInput(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    ontextchange?.(target.value);
  }

  function handleKeydown(e: KeyboardEvent) {
    onkeydown?.(e);
  }
</script>

<textarea
  bind:value
  bind:this={editorElement}
  {placeholder}
  oninput={handleInput}
  onkeydown={handleKeydown}
  {onblur}
  class={cn("md-editor", extraClass)}
></textarea>
