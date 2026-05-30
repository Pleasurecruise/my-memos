<script module lang="ts">
  export const title = "Home Layout";
</script>

<script lang="ts">
  import SectionLabel from "../SectionLabel.svelte";

  type Variant = "old" | "new";
  let variant = $state<Variant>("new");
  const VARIANTS: Variant[] = ["old", "new"];

  /* ── sample data ── */
  const TAGS = [
    { name: "reading", count: 8 },
    { name: "idea", count: 5 },
    { name: "journal", count: 12 },
    { name: "design", count: 4 },
    { name: "color", count: 3 },
  ];

  const MEMOS = [
    {
      id: "1",
      content:
        "蘇芳色 — sappanwood rose. A Heian-era court dye extracted from *Caesalpinia sappan*. The name carries the dye process, not the colour alone.",
      tags: ["reading", "color"],
      visibility: "Private",
      pinned: true,
      createdAt: "2026-05-14T09:12:00Z",
    },
    {
      id: "2",
      content:
        "Idea: token names that carry natural history rather than hex values. Every colour a 和名, every weight a material.",
      tags: ["idea", "design"],
      visibility: "Private",
      pinned: false,
      createdAt: "2026-05-14T11:34:00Z",
    },
    {
      id: "3",
      content:
        "Finished *In Praise of Shadows*. Tanizaki's argument: beauty accumulates through repetition, not through display.",
      tags: ["reading", "journal"],
      visibility: "Private",
      pinned: false,
      createdAt: "2026-05-13T20:05:00Z",
    },
    {
      id: "4",
      content:
        "Cold soba w/ daikon, ginger, scallion. Bonito broth — lighter than December. Note: less mirin.",
      tags: ["journal"],
      visibility: "Private",
      pinned: false,
      createdAt: "2026-05-12T19:22:00Z",
    },
  ];

  /* group by date label */
  function groupByDay(memos: typeof MEMOS) {
    const map = new Map<string, typeof MEMOS>();
    for (const m of memos) {
      const k = m.createdAt.slice(0, 10);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(m);
    }
    return [...map.entries()];
  }

  function dayLabel(iso: string) {
    const d = new Date(iso);
    const today = new Date("2026-05-14");
    const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return { h: "today", sub: "14 May" };
    if (diff === 1) return { h: "yesterday", sub: "13 May" };
    return {
      h: d.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase(),
      sub: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
  }

  function timeOnly(iso: string) {
    return new Date(iso).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  const grouped = $derived(groupByDay(MEMOS));
</script>

<!-- toggle strip -->
<div style="display:flex; align-items:center; gap:12px; margin-bottom:24px;">
  <SectionLabel>Personalized Home</SectionLabel>
  <div
    style="
    display:inline-flex; padding:2px;
    background:var(--color-muted); border:1px solid var(--color-border);
    border-radius:var(--radius-md); margin-left:auto;
  "
  >
    {#each VARIANTS as v (v)}
      <button
        onclick={() => (variant = v)}
        style="
          height:26px; padding:0 14px; border-radius:3px; border:none; cursor:pointer;
          font-family:var(--font-mono); font-size:11px; letter-spacing:0.06em;
          background:{variant === v ? 'var(--color-background)' : 'transparent'};
          color:{variant === v ? 'var(--color-foreground)' : 'var(--color-muted-foreground)'};
          box-shadow:{variant === v ? 'var(--shadow-xs)' : 'none'};
          transition:background var(--duration-fast), color var(--duration-fast);
        ">{v}</button
      >
    {/each}
  </div>
</div>

<!-- preview frame -->
<div
  style="
  border:1px solid var(--color-border); border-radius:var(--radius-lg);
  overflow:hidden; background:var(--color-background);
  height:620px; position:relative;
"
>
  <!-- ══════════════════════════════════════════════════════ OLD -->
  {#if variant === "old"}
    <div style="display:flex; height:100%;">
      <!-- sidebar -->
      <aside
        style="
        width:240px; flex-shrink:0; display:flex; flex-direction:column;
        border-right:1px solid var(--color-border); overflow-y:auto; scrollbar-width:none;
      "
      >
        <!-- brand -->
        <div
          style="
          padding:18px 20px 14px; display:flex; align-items:center; gap:8px;
          font-family:var(--font-serif); font-weight:600; font-size:16.5px;
          color:var(--color-accent); letter-spacing:-0.005em;
        "
        >
          <span
            style="
            width:18px; height:18px; border-radius:var(--radius-sm);
            background:var(--color-accent); opacity:0.18; flex-shrink:0;
          "
          ></span>
          my memos
        </div>

        <!-- nav -->
        <nav style="padding:0 12px; display:flex; flex-direction:column; gap:2px;">
          {#each [["home", "Home"], ["archive", "Archive"], ["chat", "Chat"]] as [id, label]}
            <button
              style="
              display:flex; align-items:center; gap:10px; height:32px; padding:0 10px;
              border-radius:var(--radius-md); background:{id === 'home'
                ? 'color-mix(in srgb,var(--color-accent) 10%,transparent)'
                : 'transparent'};
              color:{id === 'home' ? 'var(--color-accent)' : 'var(--color-muted-foreground)'};
              border:none; cursor:pointer; font-size:13px; text-align:left;
            ">{label}</button
            >
          {/each}
        </nav>

        <!-- divider -->
        <div style="height:1px; background:var(--color-border); margin:14px 16px;"></div>

        <!-- tag list -->
        <div
          style="padding:0 14px 6px; font-family:var(--font-mono); font-size:10px; letter-spacing:0.1em; text-transform:uppercase; color:var(--color-muted-foreground);"
        >
          Tags
        </div>
        {#each TAGS as t (t.name)}
          <div
            style="
            display:flex; align-items:center; gap:10px; height:30px; padding:0 22px;
            font-size:13px; color:var(--color-muted-foreground);
          "
          >
            <span style="opacity:0.5; font-size:12px;">#</span>{t.name}
            <span style="margin-left:auto; font-size:11px; opacity:0.5;">{t.count}</span>
          </div>
        {/each}
      </aside>

      <!-- main feed -->
      <main
        class="demo-new-scroll"
        style="flex:1; overflow-y:auto; padding:24px 28px; scrollbar-width:none;"
      >
        <!-- composer card -->
        <div
          style="
          border:1px solid var(--color-border); border-radius:var(--radius-lg);
          background:var(--color-background); box-shadow:var(--shadow-xs);
          margin-bottom:20px; overflow:hidden;
        "
        >
          <div
            style="
            padding:14px; min-height:52px; font-size:14px;
            color:var(--color-muted-foreground); font-style:italic;
          "
          >
            What's on your mind? Markdown is supported.
          </div>
          <div
            style="
            display:flex; align-items:center; gap:8px; padding:8px 12px;
            border-top:1px solid var(--color-border);
          "
          >
            <button
              style="
              display:inline-flex; align-items:center; gap:5px;
              height:28px; padding:0 10px; border-radius:var(--radius-md);
              background:transparent; border:1px solid var(--color-border);
              font-size:12px; color:var(--color-muted-foreground); cursor:pointer;
            ">🔒 Private</button
            >
            <span style="flex:1;"></span>
            <span style="font-family:var(--font-mono); font-size:11px; opacity:0.45;">⌘ Enter</span>
            <button
              style="
              height:28px; padding:0 12px; border-radius:var(--radius-md);
              background:var(--color-accent); color:var(--color-accent-foreground);
              border:none; font-size:12px; font-weight:500; cursor:pointer;
            ">Save</button
            >
          </div>
        </div>

        <!-- memo cards -->
        {#each MEMOS as m (m.id)}
          <div
            style="
            border:1px solid var(--color-border); border-radius:var(--radius-lg);
            padding:14px 18px 12px; margin-bottom:12px;
            box-shadow:var(--shadow-xs); background:var(--color-background);
          "
          >
            <div
              style="
              display:flex; align-items:center; gap:8px; font-size:11.5px;
              color:var(--color-muted-foreground); margin-bottom:10px;
            "
            >
              <span style="font-family:var(--font-mono);">{timeOnly(m.createdAt)}</span>
              <span style="opacity:0.4;">·</span>
              <span>{m.visibility}</span>
              {#if m.pinned}
                <span
                  style="
                  margin-left:auto; padding:2px 8px; border-radius:var(--radius-full);
                  background:var(--color-accent); color:var(--color-accent-foreground);
                  font-size:11px; font-weight:500;
                ">pinned</span
                >
              {/if}
            </div>
            <div style="font-size:14px; line-height:1.55;">{m.content.replace(/\*/g, "")}</div>
            {#if m.tags.length}
              <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:10px;">
                {#each m.tags as t (t)}
                  <span
                    style="
                    display:inline-flex; align-items:center; gap:3px;
                    padding:1.5px 8px; border-radius:var(--radius-full);
                    border:1px solid color-mix(in srgb,var(--color-accent) 25%,transparent);
                    color:var(--color-accent); font-size:11px;
                  "><span style="opacity:0.5;">#</span>{t}</span
                  >
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </main>
    </div>

    <!-- ══════════════════════════════════════════════════════ NEW -->
  {:else}
    <div
      class="demo-new-scroll"
      style="height:100%; overflow-y:auto; background:var(--color-background); scrollbar-width:none;"
    >
      <div style="max-width:1040px; margin:0 auto; padding:28px 32px 60px;">
        <!-- masthead -->
        <div
          style="
          display:flex; align-items:flex-end; justify-content:space-between;
          gap:20px; padding-bottom:16px;
          border-bottom:1px solid var(--color-border); margin-bottom:16px;
        "
        >
          <div>
            <div
              style="
              font-family:var(--font-mono); font-size:10px; letter-spacing:0.18em;
              text-transform:uppercase; color:var(--color-muted-foreground); margin-bottom:6px;
            "
            >
              Thursday, 14 May 2026
            </div>
            <div style="display:flex; align-items:baseline; gap:12px;">
              <span
                style="
                font-family:var(--font-serif); font-weight:600; font-size:36px;
                letter-spacing:-0.015em; line-height:1; color:var(--color-foreground);
                position:relative;
              "
              >
                my memos
                <span
                  style="
                  position:absolute; left:0; bottom:-7px; height:3px; width:52px;
                  background:var(--color-accent); border-radius:2px;
                "
                ></span>
              </span>
              <span
                style="
                font-family:var(--font-serif); font-size:14px;
                color:var(--color-muted-foreground); padding-bottom:3px;
              ">私のノート</span
              >
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:6px;">
            <nav
              style="
              display:flex; gap:3px; padding-right:10px; margin-right:4px;
              border-right:1px solid var(--color-border);
            "
            >
              {#each [["home", "Home", true], ["archive", "Archive", false], ["chat", "Chat", false]] as [, label, active]}
                <button
                  style="
                  text-decoration:none; font-size:12.5px; padding:4px 9px;
                  border-radius:var(--radius-sm); border:none;
                  color:{active ? 'var(--color-accent)' : 'var(--color-muted-foreground)'};
                  background:{active
                    ? 'color-mix(in srgb,var(--color-accent) 10%,transparent)'
                    : 'transparent'};
                  cursor:pointer;
                ">{label}</button
                >
              {/each}
            </nav>
            <span
              style="
              font-family:var(--font-mono); font-size:11px;
              color:var(--color-muted-foreground);
            "
            >
              <strong style="color:var(--color-foreground);">{MEMOS.length}</strong> entries
            </span>
          </div>
        </div>

        <!-- tag strip -->
        <div
          style="
          display:flex; gap:6px; overflow-x:auto; padding-bottom:14px;
          margin-bottom:16px; border-bottom:1px solid var(--color-border);
          scrollbar-width:none;
        "
        >
          <span
            style="
            font-family:var(--font-mono); font-size:10px; letter-spacing:0.12em;
            text-transform:uppercase; color:var(--color-muted-foreground);
            padding:4px 8px 4px 0; align-self:center; flex-shrink:0;
          ">tags</span
          >
          {#each TAGS as t (t.name)}
            <span
              style="
              display:inline-flex; align-items:center; gap:4px;
              padding:3px 10px; border-radius:var(--radius-full); flex-shrink:0;
              border:1px solid color-mix(in srgb,var(--color-accent) 25%,transparent);
              color:var(--color-accent); font-size:12px; cursor:pointer;
            "
            >
              <span style="opacity:0.5;">#</span>{t.name}
              <span style="opacity:0.5; font-family:var(--font-mono); font-size:10.5px;"
                >{t.count}</span
              >
            </span>
          {/each}
        </div>

        <!-- journal grid -->
        <div style="display:grid; grid-template-columns:1fr 290px; gap:36px; align-items:start;">
          <!-- left — timeline feed -->
          <div style="position:relative; display:flex; flex-direction:column; gap:6px;">
            <!-- vertical rail -->
            <div
              style="
              position:absolute; top:24px; bottom:8px; left:6.5px; width:1px;
              background:var(--color-border); z-index:1;
            "
            ></div>

            {#each grouped as [day, items], gi (day)}
              {@const label = dayLabel(day)}
              <!-- day marker -->
              <div style="display:flex; align-items:center; gap:14px; padding:14px 0 8px;">
                <div
                  style="
                  width:14px; height:14px; border-radius:50%; flex-shrink:0; z-index:2;
                  border:1.5px solid var(--color-accent);
                  background:{label.h === 'today'
                    ? 'var(--color-accent)'
                    : 'var(--color-background)'};
                  {label.h === 'today'
                    ? 'box-shadow:0 0 0 4px color-mix(in srgb,var(--color-accent) 15%,transparent);'
                    : ''}
                "
                ></div>
                <div style="display:flex; align-items:baseline; gap:12px;">
                  <span style="font-family:var(--font-serif); font-size:17px; font-weight:600;"
                    >{label.h}</span
                  >
                  <span
                    style="
                    font-family:var(--font-mono); font-size:11px; letter-spacing:0.08em;
                    text-transform:uppercase; color:var(--color-muted-foreground);
                  ">{label.sub}</span
                  >
                </div>
              </div>

              <!-- composer (today only) -->
              {#if gi === 0}
                <div
                  style="display:grid; grid-template-columns:14px 1fr; gap:14px; align-items:flex-start;"
                >
                  <div
                    style="width:14px; height:14px; display:flex; align-items:center; justify-content:center; margin-top:18px; z-index:2;"
                  >
                    <span
                      style="width:7px; height:7px; border-radius:50%; background:var(--color-accent);"
                    ></span>
                  </div>
                  <div>
                    <div
                      style="font-family:var(--font-mono); font-size:11px; color:var(--color-muted-foreground); margin-bottom:4px;"
                    >
                      now · drafting
                    </div>
                    <div
                      style="
                      padding:12px 16px; border-radius:var(--radius-md);
                      border:1px solid var(--color-border);
                      color:var(--color-muted-foreground);
                      font-family:var(--font-serif); font-size:14px; font-style:italic;
                      cursor:text;
                    "
                    >
                      <span style="color:var(--color-accent); margin-right:5px;">✎</span>
                      A line for the notebook — click to write…
                    </div>
                  </div>
                </div>
              {/if}

              <!-- entries -->
              {#each items as m (m.id)}
                <div
                  style="display:grid; grid-template-columns:14px 1fr; gap:14px; align-items:flex-start;"
                >
                  <div
                    style="width:14px; height:14px; display:flex; align-items:center; justify-content:center; margin-top:18px; z-index:2;"
                  >
                    <span
                      style="width:7px; height:7px; border-radius:50%; background:var(--color-muted-foreground); opacity:0.6;"
                    ></span>
                  </div>
                  <div>
                    <div
                      style="font-family:var(--font-mono); font-size:11px; color:var(--color-muted-foreground); margin-bottom:4px; letter-spacing:0.04em;"
                    >
                      {timeOnly(m.createdAt)} · {m.visibility}
                    </div>
                    <div
                      style="
                      padding:12px 14px; border-radius:var(--radius-md);
                      background:transparent; margin-left:-14px;
                      transition:background var(--duration-fast);
                    "
                    >
                      {#if m.pinned}
                        <span
                          style="
                          display:inline-flex; align-items:center; gap:3px; margin-bottom:6px;
                          font-family:var(--font-mono); font-size:10px; text-transform:uppercase; letter-spacing:0.08em;
                          color:var(--color-accent); padding:1px 6px; border-radius:var(--radius-sm);
                          border:1px solid color-mix(in srgb,var(--color-accent) 30%,transparent);
                        ">★ pinned</span
                        >
                      {/if}
                      <div style="font-size:14px; line-height:1.6;">
                        {m.content.replace(/\*/g, "")}
                      </div>
                      {#if m.tags.length}
                        <div style="display:flex; flex-wrap:wrap; gap:5px; margin-top:8px;">
                          {#each m.tags as t (t)}
                            <span
                              style="
                              padding:1.5px 8px; border-radius:var(--radius-full);
                              border:1px solid color-mix(in srgb,var(--color-accent) 25%,transparent);
                              color:var(--color-accent); font-size:11px;
                            ">#&thinsp;{t}</span
                            >
                          {/each}
                        </div>
                      {/if}
                    </div>
                  </div>
                </div>
              {/each}
            {/each}
          </div>

          <!-- right — sticky rail -->
          <div style="position:sticky; top:28px; display:flex; flex-direction:column; gap:16px;">
            <!-- quiet thought -->
            <div
              style="
              border:1px solid var(--color-border); border-radius:var(--radius-lg);
              background:var(--color-muted); padding:16px 18px;
            "
            >
              <p
                style="
                font-family:var(--font-mono); font-size:10.5px; letter-spacing:0.1em;
                text-transform:uppercase; color:var(--color-muted-foreground); margin:0 0 8px;
              "
              >
                quiet thought
              </p>
              <p
                style="
                font-family:var(--font-serif); font-style:italic; font-size:14px;
                line-height:1.5; margin:0;
              "
              >
                Beauty that accumulates through repetition, not through display.
              </p>
              <span
                style="
                display:block; font-size:11.5px; color:var(--color-muted-foreground); margin-top:8px;
              ">蘇芳色 — suou-iro</span
              >
            </div>

            <!-- streak -->
            <div
              style="
              border:1px solid var(--color-border); border-radius:var(--radius-lg);
              background:var(--color-background); padding:16px 18px;
            "
            >
              <p
                style="
                font-family:var(--font-mono); font-size:10.5px; letter-spacing:0.1em;
                text-transform:uppercase; color:var(--color-muted-foreground); margin:0 0 10px;
              "
              >
                last 14 days
              </p>
              <div style="display:flex; gap:3px; flex-wrap:wrap;">
                {#each Array.from({ length: 14 }, (_, i) => i < 9) as active, i (i)}
                  <span
                    style="
                    width:14px; height:14px; border-radius:3px;
                    background:{active ? 'var(--color-accent)' : 'var(--color-border)'};
                  "
                  ></span>
                {/each}
              </div>
              <div style="display:flex; flex-direction:column; gap:5px; margin-top:14px;">
                {#each [["entries", MEMOS.length], ["tags in use", TAGS.length], ["days written", grouped.length]] as [lbl, val]}
                  <div style="display:flex; justify-content:space-between; font-size:12.5px;">
                    <span style="color:var(--color-muted-foreground);">{lbl}</span>
                    <span style="font-family:var(--font-mono);">{val}</span>
                  </div>
                {/each}
              </div>
            </div>

            <!-- search -->
            <div
              style="
              border:1px solid var(--color-border); border-radius:var(--radius-lg);
              background:var(--color-background); padding:16px 18px;
            "
            >
              <p
                style="
                font-family:var(--font-mono); font-size:10.5px; letter-spacing:0.1em;
                text-transform:uppercase; color:var(--color-muted-foreground); margin:0 0 8px;
              "
              >
                find
              </p>
              <div style="position:relative;">
                <span
                  style="
                  position:absolute; left:10px; top:50%; transform:translateY(-50%);
                  color:var(--color-muted-foreground); font-size:13px;
                ">⌕</span
                >
                <input
                  placeholder="Search…"
                  style="
                    height:34px; width:100%; box-sizing:border-box;
                    border:1px solid var(--color-border); border-radius:var(--radius-md);
                    background:var(--color-muted); color:var(--color-foreground);
                    padding:0 10px 0 28px; font-family:var(--font-sans); font-size:13px;
                    outline:none;
                  "
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- diff callout -->
<div
  style="
  margin-top:24px; display:grid; grid-template-columns:1fr 1fr; gap:16px;
"
>
  {#each [{ label: "old", items: ["240 px 固定 sidebar", "垂直 tag 列表", "顶部 composer 卡片", "卡片列表", "纯 sans 正文"] }, { label: "new", items: ["无 sidebar — masthead 横跨全宽", "横向 tag 滚动条", "composer 嵌入 today 节点", "timeline 纵轴日志布局", "右侧 sticky rail (引言 / streak / search)"] }] as { label, items }}
    <div
      style="
      border:1px solid {label === 'new'
        ? 'color-mix(in srgb,var(--color-accent) 35%,transparent)'
        : 'var(--color-border)'};
      border-radius:var(--radius-lg); padding:16px 18px;
      background:{label === 'new'
        ? 'color-mix(in srgb,var(--color-accent) 5%,transparent)'
        : 'var(--color-muted)'};
    "
    >
      <p
        style="
        font-family:var(--font-mono); font-size:10px; letter-spacing:0.12em;
        text-transform:uppercase; color:{label === 'new'
          ? 'var(--color-accent)'
          : 'var(--color-muted-foreground)'};
        margin:0 0 10px;
      "
      >
        {label}
      </p>
      <ul style="margin:0; padding-left:16px; display:flex; flex-direction:column; gap:5px;">
        {#each items as it (it)}
          <li style="font-size:13px; color:var(--color-foreground); line-height:1.5;">{it}</li>
        {/each}
      </ul>
    </div>
  {/each}
</div>

<style>
  .demo-new-scroll::-webkit-scrollbar {
    display: none;
  }
</style>
