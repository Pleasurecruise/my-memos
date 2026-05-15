<script module lang="ts">
  export const title = "Timeline";
</script>

<script lang="ts">
  import { Timeline } from "../../src";
  import type { TimelineGroup } from "../../src";
  import DemoPage from "../DemoPage.svelte";
  import SectionLabel from "../SectionLabel.svelte";

  interface Entry {
    id: string;
    time: string;
    text: string;
    tags: string[];
  }

  const groups: TimelineGroup<Entry>[] = [
    {
      key: "2026-05-14",
      heading: "today",
      subLabel: "14 May",
      isToday: true,
      items: [
        {
          id: "1",
          time: "09:12",
          text: "蘇芳色 — sappanwood rose. A Heian-era court dye. The name carries the dye process, not the colour alone.",
          tags: ["reading", "color"],
        },
        {
          id: "2",
          time: "11:34",
          text: "Token names that carry natural history rather than hex values.",
          tags: ["idea", "design"],
        },
      ],
    },
    {
      key: "2026-05-13",
      heading: "yesterday",
      subLabel: "13 May",
      isToday: false,
      items: [
        {
          id: "3",
          time: "20:05",
          text: "Finished *In Praise of Shadows*. Beauty accumulates through repetition, not display.",
          tags: ["reading"],
        },
      ],
    },
  ];
</script>

<DemoPage>
  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Timeline with day groups</SectionLabel>
    <div style="max-width: 560px;">
      <Timeline {groups}>
        {#snippet composer()}
          <div
            style="
              padding: 10px 14px; border-radius: var(--radius-md);
              border: 1px dashed var(--color-border);
              color: var(--color-muted-foreground);
              font-family: var(--font-serif); font-size: 13.5px; font-style: italic;
            "
          >
            Click to write a new entry…
          </div>
        {/snippet}

        {#snippet children(item: Entry)}
          <div>
            <p
              style="font-family: var(--font-mono); font-size: 11px; color: var(--color-muted-foreground); margin: 0 0 4px; letter-spacing: 0.04em;"
            >
              {item.time} · private
            </p>
            <div
              role="presentation"
              style="padding: 10px 12px; border-radius: var(--radius-md); border: 1px solid transparent; transition: background 100ms;"
              onmouseenter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--color-muted)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)";
              }}
              onmouseleave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.borderColor = "transparent";
              }}
            >
              <p style="font-size: 14px; line-height: 1.6; margin: 0 0 6px;">{item.text}</p>
              {#if item.tags.length}
                <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                  {#each item.tags as tag (tag)}
                    <span
                      style="
                        padding: 1px 8px; border-radius: var(--radius-full);
                        border: 1px solid color-mix(in srgb, var(--color-accent) 25%, transparent);
                        color: var(--color-accent); font-size: 11px;
                      ">#&thinsp;{tag}</span
                    >
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        {/snippet}
      </Timeline>
    </div>
  </section>
</DemoPage>
