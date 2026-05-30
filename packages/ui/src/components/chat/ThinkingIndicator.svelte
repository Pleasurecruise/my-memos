<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { THINKING_VERBS } from "../../lib/thinking-verbs";

  let index = $state(Math.floor(Math.random() * THINKING_VERBS.length));
  let timer: ReturnType<typeof setInterval>;

  onMount(() => {
    timer = setInterval(() => {
      index = (index + 1) % THINKING_VERBS.length;
    }, 2000);
  });

  onDestroy(() => clearInterval(timer));
</script>

<span class="thinking" aria-label="Thinking" role="status">
  {THINKING_VERBS[index]}…
</span>

<style>
  .thinking {
    font-size: 13px;
    color: var(--color-muted-foreground);
    font-family: var(--font-sans);
    animation: fade 0.3s ease;
  }

  @keyframes fade {
    from {
      opacity: 0.3;
    }
    to {
      opacity: 1;
    }
  }
</style>
