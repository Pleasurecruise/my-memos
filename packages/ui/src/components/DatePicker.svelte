<script lang="ts">
  import { ChevronLeft, ChevronRight } from "@lucide/svelte";
  import { untrack } from "svelte";
  import { cn } from "../lib/utils";

  export interface DatePickerProps {
    value?: Date;
    onChange?: (date: Date) => void;
    class?: string;
  }

  const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  let { value, onChange, class: extraClass = "" }: DatePickerProps = $props();

  const today = new Date();

  let view = $state(
    untrack(() => ({
      year: (value ?? today).getFullYear(),
      month: (value ?? today).getMonth(),
    })),
  );

  $effect(() => {
    if (value) {
      view = { year: value.getFullYear(), month: value.getMonth() };
    }
  });

  function prevMonth() {
    view =
      view.month === 0 ? { year: view.year - 1, month: 11 } : { ...view, month: view.month - 1 };
  }

  function nextMonth() {
    view =
      view.month === 11 ? { year: view.year + 1, month: 0 } : { ...view, month: view.month + 1 };
  }

  const cells = $derived.by(() => {
    const firstWeekday = new Date(view.year, view.month, 1).getDay();
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    const arr: (number | null)[] = [
      ...Array<null>(firstWeekday).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  });

  function isToday(day: number) {
    return (
      day === today.getDate() &&
      view.month === today.getMonth() &&
      view.year === today.getFullYear()
    );
  }

  function isSelected(day: number) {
    return (
      value != null &&
      day === value.getDate() &&
      view.month === value.getMonth() &&
      view.year === value.getFullYear()
    );
  }

  const navBtn = cn(
    "flex items-center justify-center w-7 h-7 rounded-md",
    "text-muted-foreground hover:text-foreground hover:bg-muted",
    "transition-colors duration-100 cursor-pointer",
  );
</script>

<div class={cn("select-none font-sans", extraClass)}>
  <div class="flex items-center justify-between mb-3">
    <button onclick={prevMonth} class={navBtn} aria-label="Previous month">
      <ChevronLeft size={14} />
    </button>
    <span class="text-sm font-medium text-foreground">
      {MONTHS[view.month]}
      {view.year}
    </span>
    <button onclick={nextMonth} class={navBtn} aria-label="Next month">
      <ChevronRight size={14} />
    </button>
  </div>

  <div class="grid grid-cols-7 mb-1">
    {#each DAY_LABELS as d (d)}
      <span
        class="flex items-center justify-center text-[0.625rem] font-medium text-muted-foreground h-7"
      >
        {d}
      </span>
    {/each}
  </div>

  <div class="grid grid-cols-7 gap-y-0.5">
    {#each cells as day, i (i)}
      {#if day === null}
        <span class="h-8"></span>
      {:else}
        {@const selected = isSelected(day)}
        {@const todayCell = isToday(day)}
        <button
          onclick={() => onChange?.(new Date(view.year, view.month, day))}
          class={cn(
            "flex items-center justify-center w-8 h-8 mx-auto rounded-full text-xs",
            "transition-colors duration-100 cursor-pointer",
            selected && "bg-accent text-accent-foreground font-semibold",
            !selected && todayCell && "text-accent font-semibold ring-1 ring-accent/40",
            !selected && !todayCell && "text-foreground hover:bg-muted",
          )}
        >
          {day}
        </button>
      {/if}
    {/each}
  </div>
</div>
