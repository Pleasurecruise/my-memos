<script lang="ts">
  import { Clock, Type } from "@lucide/svelte";

  interface Props {
    title: string;
    text?: string;
  }

  let { title, text = "" }: Props = $props();

  const CJK_READING_SPEED = 350;
  const LATIN_READING_SPEED = 200;

  function analyzeContent(source: string): { cjk: number; latin: number } {
    const trimmed = source.trim();
    if (!trimmed) return { cjk: 0, latin: 0 };

    const cjk = Array.from(
      trimmed.matchAll(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu),
    ).length;
    const latin =
      trimmed
        .replaceAll(
          /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu,
          " ",
        )
        .match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g)?.length ?? 0;

    return { cjk, latin };
  }

  function formatCount(count: number): string {
    if (count < 1000) return String(count);
    const compact = count / 1000;
    if (Number.isInteger(compact)) return `${compact}K`;
    if (count < 10000) return `${compact.toFixed(2).replace(/\.?0+$/, "")}K`;
    return `${compact.toFixed(1).replace(/\.0$/, "")}K`;
  }

  function formatReadingTime(cjk: number, latin: number): string {
    const minutes = Math.max(1, Math.ceil(cjk / CJK_READING_SPEED + latin / LATIN_READING_SPEED));
    return `${minutes} min`;
  }

  const stats = $derived(analyzeContent(text));
  const total = $derived(stats.cjk + stats.latin);
  const contentCount = $derived(total > 0 ? formatCount(total) : "");
  const readingTime = $derived(total > 0 ? formatReadingTime(stats.cjk, stats.latin) : "");
</script>

<header class="min-w-0 flex-1">
  <h1
    class="font-medium text-xl leading-snug tracking-normal text-foreground sm:text-2xl sm:leading-tight"
  >
    {title}
  </h1>

  {#if contentCount || readingTime}
    <div
      class="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs leading-none text-muted-foreground sm:text-[0.8125rem]"
    >
      {#if contentCount}
        <span class="inline-flex items-center gap-1">
          <Type class="size-[0.8rem]" strokeWidth={1.8} />
          <span>{contentCount}</span>
        </span>
      {/if}

      {#if contentCount && readingTime}
        <span class="opacity-30">·</span>
      {/if}

      {#if readingTime}
        <span class="inline-flex items-center gap-1">
          <Clock class="size-[0.8rem]" strokeWidth={1.8} />
          <span>{readingTime}</span>
        </span>
      {/if}
    </div>
  {/if}
</header>
