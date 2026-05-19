<script lang="ts">
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
  {placeholder}
  oninput={handleInput}
  onkeydown={handleKeydown}
  class={cn("md-editor", extraClass)}
></textarea>
