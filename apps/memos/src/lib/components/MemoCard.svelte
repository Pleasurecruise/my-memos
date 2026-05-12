<script lang="ts">
	import { isToday, isYesterday, isSameDay, format, formatDistanceToNow } from "date-fns";
	import { Badge } from "@my-memos/ui";
import type { Snippet } from "svelte";
	import { VISIBILITY_CONFIG } from "$lib/memo-config";
	import type { Memo } from "$lib/types/memos";

	interface MemoCardProps {
		memo: Memo;
		selectedDate: Date | undefined;
		hoverActions?: boolean;
		content: Snippet;
		actions?: Snippet;
	}

	let { memo, selectedDate, hoverActions = false, content, actions }: MemoCardProps = $props();

	const date = $derived(new Date(memo.createdAt));
	const vis = $derived(VISIBILITY_CONFIG[memo.visibility]);
	const VisIcon = $derived(vis.icon);
	const dateHighlight = $derived(!selectedDate || isSameDay(new Date(memo.updatedAt), selectedDate));
</script>

<article class="group relative bg-background border border-border rounded-lg px-5 py-4 shadow-xs hover:shadow-sm hover:border-border-strong transition-all duration-100">
	<div class="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
		<span>{formatDistanceToNow(date, { addSuffix: true })}</span>
		<span class="opacity-40">·</span>
		<span class="flex items-center gap-1">
			<VisIcon size={11} />
			{vis.label}
		</span>
		<span class="flex-1"></span>
		<Badge variant={dateHighlight ? "default" : "secondary"} class={dateHighlight ? "" : "opacity-50"}>
			{isToday(date) ? "Today" : isYesterday(date) ? "Yesterday" : format(date, "MMM d")}
		</Badge>
	</div>

	{@render content()}

	{#if actions}
		<div class="flex items-center gap-1 mt-4 pt-3 border-t border-border {hoverActions ? 'opacity-0 group-hover:opacity-100' : ''} transition-opacity duration-100">
			{@render actions()}
		</div>
	{/if}
</article>