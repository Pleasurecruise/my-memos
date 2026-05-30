<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { cn } from "../lib/utils";

  export interface HeatingRateDay {
    key: string;
    label?: string;
    active?: boolean;
    value?: number;
  }

  export interface HeatingRateStat {
    label: string;
    value: string | number;
  }

  export interface HeatingRateProps extends HTMLAttributes<HTMLDivElement> {
    title?: string;
    days?: HeatingRateDay[];
    stats?: HeatingRateStat[];
    max?: number;
    showRate?: boolean;
    showWeekdayLabels?: boolean;
  }

  const weekdayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];

  let {
    title = "heating rate",
    days = [],
    stats = [],
    max,
    showRate = true,
    showWeekdayLabels = true,
    class: extraClass = "",
    ...rest
  }: HeatingRateProps = $props();

  const activeDays = $derived(days.filter((day) => dayValue(day) > 0).length);
  const rate = $derived(days.length ? Math.round((activeDays / days.length) * 100) : 0);
  const maxValue = $derived(max ?? Math.max(1, ...days.map(dayValue)));

  function dayValue(day: HeatingRateDay): number {
    return Math.max(0, day.value ?? (day.active ? 1 : 0));
  }

  function level(day: HeatingRateDay): number {
    const value = dayValue(day);
    if (value <= 0) return 0;
    const ratio = value / maxValue;
    if (ratio >= 0.75) return 4;
    if (ratio >= 0.5) return 3;
    if (ratio >= 0.25) return 2;
    return 1;
  }

  function accessibleLabel(day: HeatingRateDay, index: number): string {
    const label = day.label ?? `Day ${index + 1}`;
    const value = dayValue(day);
    return `${label}: ${value}`;
  }
</script>

<div class={cn("heating-rate", extraClass)} {...rest}>
  <div class="heating-rate-head">
    <p class="heating-rate-title">{title}</p>
    {#if showRate}
      <span class="heating-rate-badge">{rate}%</span>
    {/if}
  </div>

  <div class={cn("heating-rate-calendar", showWeekdayLabels && "with-labels")}>
    {#if showWeekdayLabels}
      <div class="heating-rate-weekdays" aria-hidden="true">
        {#each weekdayLabels as label, index (index)}
          <span>{label}</span>
        {/each}
      </div>
    {/if}

    <div class="heating-rate-grid" role="list" aria-label={title}>
      {#each days as day, index (day.key)}
        <span
          role="listitem"
          class="heating-rate-cell level-{level(day)}"
          aria-label={accessibleLabel(day, index)}
        ></span>
      {/each}
    </div>
  </div>

  {#if stats.length > 0}
    <div class="heating-rate-stats">
      {#each stats as stat (stat.label)}
        <div class="heating-rate-stat">
          <span>{stat.label}</span>
          <strong>{stat.value}</strong>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .heating-rate {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-background);
    padding: 1rem;
  }

  .heating-rate-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 0.625rem;
  }

  .heating-rate-title {
    margin: 0;
    color: var(--color-muted-foreground);
    font-family: var(--font-mono);
    font-size: 0.625rem;
    text-transform: uppercase;
  }

  .heating-rate-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 2.25rem;
    height: 1.25rem;
    border: 1px solid color-mix(in srgb, var(--color-accent) 28%, transparent);
    border-radius: var(--radius-full);
    color: var(--color-accent);
    background: color-mix(in srgb, var(--color-accent) 8%, transparent);
    font-family: var(--font-mono);
    font-size: 0.6875rem;
  }

  .heating-rate-calendar {
    display: grid;
    gap: 0.375rem;
  }

  .heating-rate-calendar.with-labels {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .heating-rate-weekdays {
    display: grid;
    grid-template-rows: repeat(7, 0.75rem);
    gap: 0.25rem;
    color: var(--color-muted-foreground);
    font-family: var(--font-mono);
    font-size: 0.5625rem;
    line-height: 0.75rem;
  }

  .heating-rate-grid {
    display: grid;
    grid-auto-columns: 0.75rem;
    grid-auto-flow: column;
    grid-template-rows: repeat(7, 0.75rem);
    gap: 0.25rem;
    min-width: 0;
    overflow-x: auto;
    padding-bottom: 0.125rem;
    scrollbar-width: none;
  }

  .heating-rate-grid::-webkit-scrollbar {
    display: none;
  }

  .heating-rate-cell {
    aspect-ratio: 1;
    min-width: 0;
    border-radius: 0.1875rem;
    background: var(--color-border);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-background) 45%, transparent);
  }

  .heating-rate-cell.level-1 {
    background: color-mix(in srgb, var(--color-accent) 32%, var(--color-border));
  }

  .heating-rate-cell.level-2 {
    background: color-mix(in srgb, var(--color-accent) 55%, var(--color-border));
  }

  .heating-rate-cell.level-3 {
    background: color-mix(in srgb, var(--color-accent) 78%, var(--color-border));
  }

  .heating-rate-cell.level-4 {
    background: var(--color-accent);
  }

  .heating-rate-stats {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    margin-top: 0.875rem;
  }

  .heating-rate-stat {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.75rem;
    color: var(--color-muted-foreground);
    font-size: 0.75rem;
  }

  .heating-rate-stat strong {
    color: var(--color-foreground);
    font-family: var(--font-mono);
    font-weight: 500;
  }
</style>
