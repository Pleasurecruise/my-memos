<script module lang="ts">
  export interface TimelineGroup<T> {
    key: string;
    heading: string;
    subLabel: string;
    isToday?: boolean;
    items: T[];
  }
</script>

<script lang="ts" generics="T">
  import type { Snippet } from "svelte";

  interface Props {
    groups: TimelineGroup<T>[];
    composer?: Snippet;
    children: Snippet<[T]>;
    class?: string;
  }

  let { groups, composer, children, class: cls = "" }: Props = $props();
</script>

<div class="timeline {cls}">
  <div class="timeline-rail"></div>

  {#each groups as group, gi (group.key)}
    <div class="timeline-day">
      <div class="timeline-dot" class:today={group.isToday}></div>
      <div class="timeline-day-label">
        <span class="timeline-day-heading">{group.heading}</span>
        <span class="timeline-day-sub">{group.subLabel}</span>
      </div>
    </div>

    {#if gi === 0 && composer}
      <div class="timeline-entry">
        <div class="timeline-bullet accent"></div>
        <div class="timeline-entry-body">{@render composer()}</div>
      </div>
    {/if}

    {#each group.items as item}
      <div class="timeline-entry">
        <div class="timeline-bullet"></div>
        <div class="timeline-entry-body">{@render children(item)}</div>
      </div>
    {/each}
  {/each}
</div>

<style>
  .timeline {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }
  .timeline-rail {
    position: absolute;
    top: 1.5rem;
    bottom: 0.5rem;
    left: 6.5px;
    width: 1px;
    background: var(--color-border);
    z-index: 1;
  }
  .timeline-day {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    padding-top: 1rem;
    padding-bottom: 0.5rem;
  }
  .timeline-dot {
    width: 0.875rem;
    height: 0.875rem;
    border-radius: 50%;
    flex-shrink: 0;
    border: 1.5px solid var(--color-accent);
    background: var(--color-background);
    position: relative;
    z-index: 2;
  }
  .timeline-dot.today {
    background: var(--color-accent);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-accent) 15%, transparent);
  }
  .timeline-day-label {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
  }
  .timeline-day-heading {
    font-family: var(--font-serif);
    font-size: 1.0625rem;
    font-weight: 600;
    color: var(--color-foreground);
  }
  .timeline-day-sub {
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-muted-foreground);
  }
  .timeline-entry {
    display: grid;
    grid-template-columns: 0.875rem 1fr;
    gap: 1.25rem;
    align-items: flex-start;
  }
  .timeline-bullet {
    width: 0.875rem;
    height: 0.875rem;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 1.125rem;
    z-index: 2;
    flex-shrink: 0;
  }
  .timeline-bullet::after {
    content: "";
    display: block;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--color-muted-foreground);
    opacity: 0.6;
  }
  .timeline-bullet.accent::after {
    background: var(--color-accent);
    opacity: 1;
    transform: scale(1.3);
  }
  .timeline-entry-body {
    min-width: 0;
  }
</style>
