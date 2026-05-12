<script lang="ts">
	import { X } from "lucide-svelte";

	interface FilterBarProps {
		selectedDate: Date | undefined;
		activeTags: string[];
		onRemoveTag: (tag: string) => void;
	}

	let { selectedDate, activeTags, onRemoveTag }: FilterBarProps = $props();
</script>

{#if selectedDate || activeTags.length > 0}
	<div class="flex flex-wrap items-center gap-x-3 gap-y-2 px-1">
		{#if selectedDate}
			<p class="text-xs text-muted-foreground">
				Showing memos from
				<span class="text-accent font-medium">
					{selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
				</span>
			</p>
		{/if}
		{#if activeTags.length > 0}
			<div class="flex flex-wrap gap-1.5">
				{#each activeTags as tag (tag)}
					<button
						type="button"
						onclick={() => onRemoveTag(tag)}
						class="inline-flex items-center gap-1 rounded-full border border-accent/50 bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent hover:bg-accent/20 transition-colors"
					>
						#{tag}
						<X size={10} />
					</button>
				{/each}
			</div>
		{/if}
	</div>
{/if}