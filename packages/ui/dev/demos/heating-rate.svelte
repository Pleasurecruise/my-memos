<script module lang="ts">
  export const title = "Heating Rate";
</script>

<script lang="ts">
  import { HeatingRate } from "../../src";
  import DemoPage from "../DemoPage.svelte";
  import SectionLabel from "../SectionLabel.svelte";

  const values = Array.from({ length: 14 * 7 }, (_, i) => {
    if ([0, 6].includes(i % 7)) return 0;
    return [0, 1, 2, 0, 3, 1, 4, 2, 0, 5][i % 10];
  });

  const days = values.map((value, i) => {
    return {
      key: `day-${i}`,
      label: `Day ${i + 1}`,
      value,
    };
  });

  const quietDays = Array.from({ length: 70 }, (_, i) => ({
    key: `quiet-${i}`,
    label: `Day ${i + 1}`,
    active: [3, 8, 13, 18, 27, 41, 49, 55, 63, 69].includes(i),
  }));

  const stats = [
    { label: "entries", value: 42 },
    { label: "tags in use", value: 11 },
    { label: "days written", value: 9 },
  ];

  const propDefs = [
    {
      name: "title",
      type: "string",
      default: '"heating rate"',
      description: "Small heading rendered above the heat cells.",
    },
    {
      name: "days",
      type: "HeatingRateDay[]",
      default: "[]",
      description: "Day cells with a stable key, optional label, active flag, or numeric value.",
    },
    {
      name: "stats",
      type: "HeatingRateStat[]",
      default: "[]",
      description: "Label/value rows rendered below the heat cells.",
    },
    {
      name: "max",
      type: "number",
      description: "Optional maximum value used to calculate cell intensity.",
    },
    {
      name: "showRate",
      type: "boolean",
      default: "true",
      description: "Show or hide the active-day percentage badge.",
    },
    {
      name: "showWeekdayLabels",
      type: "boolean",
      default: "true",
      description: "Show or hide the Monday, Wednesday, and Friday row labels.",
    },
    {
      name: "...props",
      type: 'ComponentProps<"div">',
      description: "All native div attributes.",
    },
  ];

  const usage = `import { HeatingRate } from "@my-memos/ui";

<HeatingRate
  title="last 14 weeks"
  days={days}
  stats={[
    { label: "entries", value: 42 },
    { label: "tags in use", value: 11 },
    { label: "days written", value: 9 },
  ]}
/>`;
</script>

<DemoPage {propDefs} {usage}>
  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Memo activity</SectionLabel>
    <div style="max-width: 320px;">
      <HeatingRate title="last 14 weeks" {days} {stats} />
    </div>
  </section>

  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Boolean activity</SectionLabel>
    <div style="max-width: 320px;">
      <HeatingRate title="quiet streak" days={quietDays} stats={stats.slice(0, 2)} />
    </div>
  </section>
</DemoPage>
