<script lang="ts">
  import { onMount } from "svelte";
  import { ArrowUp, Pencil, Eye } from "@lucide/svelte";

  interface Props {
    onedit?: () => void;
    isEditing?: boolean;
  }

  let { onedit, isEditing = false }: Props = $props();

  let progressCircle = $state<SVGCircleElement | null>(null);

  const radius = 9;
  const circumference = 2 * Math.PI * radius;

  let arrowOpacity = $state(0);
  let arrowScale = $state(0.5);
  let sideOffsetRem = $state(2.5);
  let sideLeftPx = $state(0);

  const HEADER_MAX_OFFSET_REM = 2.5;
  const SIDE_WIDTH_PX = 40;
  const SIDE_GAP_PX = 24;
  const SIDE_RIGHT_MARGIN_PX = 16;

  function updateOffset() {
    const note = document.getElementById("note");
    if (!note) return;
    const noteRect = note.getBoundingClientRect();
    const noteTop = noteRect.top;
    const headerRef = Math.max(1, note.offsetTop);
    const progress = Math.max(0, Math.min(1, noteTop / headerRef));
    sideOffsetRem = progress * HEADER_MAX_OFFSET_REM;
    sideLeftPx = Math.min(
      window.innerWidth - SIDE_WIDTH_PX - SIDE_RIGHT_MARGIN_PX,
      noteRect.right + SIDE_GAP_PX,
    );
  }

  function updateProgress() {
    const circle = progressCircle;
    if (!circle) return;

    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollable <= 0) {
      circle.style.strokeDashoffset = String(circumference);
      arrowOpacity = 0;
      arrowScale = 0.5;
      return;
    }

    const raw = Math.min(1, window.scrollY / scrollable);
    const stepped = Math.round(raw * 100) / 100;
    circle.style.strokeDashoffset = String(circumference * (1 - stepped));

    const t = Math.min(1, Math.max(0, (stepped - 0.25) / 0.5));
    arrowOpacity = t;
    arrowScale = 0.5 + t * 0.5;
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  onMount(() => {
    updateOffset();
    updateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateOffset);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateOffset);
    };
  });

  function onScroll() {
    updateOffset();
    updateProgress();
  }
</script>

<aside
  aria-label="Article actions"
  class="hidden xl:fixed xl:top-[calc(50%+var(--side-offset,0))] xl:z-20 xl:flex xl:max-h-[calc(100vh-16rem)] xl:w-10 xl:-translate-y-1/2 xl:flex-col xl:items-center xl:gap-1"
  style:left={`${sideLeftPx}px`}
  style:--side-offset={`${sideOffsetRem}rem`}
>
  <!-- reading progress -->
  <button
    type="button"
    onclick={scrollToTop}
    aria-label="Back to top"
    title="Back to top"
    class="group relative flex cursor-pointer items-center justify-center rounded-full p-1.5 text-muted-foreground transition-[color,opacity] duration-150 hover:text-foreground hover:opacity-100"
  >
    <svg width="24" height="24" viewBox="0 0 24 24" class="-rotate-90">
      <title>Reading progress</title>
      <circle
        cx="12"
        cy="12"
        r={radius}
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        class="text-border"
      />
      <circle
        bind:this={progressCircle}
        cx="12"
        cy="12"
        r={radius}
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-dasharray={circumference}
        stroke-dashoffset={circumference}
        stroke-linecap="round"
        class="text-foreground"
      />
    </svg>
    <span
      class="absolute inset-0 flex items-center justify-center text-foreground opacity-0 transition-opacity group-hover:opacity-100"
      style:opacity={arrowOpacity}
      style:scale={arrowScale}
    >
      <ArrowUp size={10} strokeWidth={2.25} />
    </span>
  </button>

  <div class="my-1 h-px w-4 bg-border"></div>

  <!-- edit / preview toggle -->
  <button
    type="button"
    onclick={onedit}
    aria-label={isEditing ? "Preview" : "Edit"}
    title={isEditing ? "Preview" : "Edit"}
    class="cursor-pointer rounded-full p-1.5 text-muted-foreground transition-[color,opacity] duration-150 hover:text-foreground hover:opacity-100"
  >
    {#if isEditing}
      <Eye size={15} strokeWidth={2.25} />
    {:else}
      <Pencil size={15} strokeWidth={2.25} />
    {/if}
  </button>
</aside>
