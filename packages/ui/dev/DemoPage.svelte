<script lang="ts">
	import type { Snippet } from "svelte";

	export interface PropDef {
		name: string;
		type: string;
		default?: string;
		description: string;
	}

	let { children, propDefs, usage }: {
		children: Snippet;
		propDefs?: PropDef[];
		usage?: string;
	} = $props();

	const hasDocs = $derived(!!(propDefs || usage));

	const cellStyle = "padding: 10px 20px 10px 0; border-bottom: 1px solid var(--color-border); vertical-align: top;";
</script>

<div style="display: flex; flex-direction: column;">
	<div style="display: flex; flex-direction: column; gap: 40px; padding-bottom: {hasDocs ? '64px' : '0'}">
		{@render children()}
	</div>

	{#if propDefs}
		<section style="border-top: 1px solid var(--color-border); padding-top: 48px; display: flex; flex-direction: column; gap: 16px;">
			<p style="font-family: var(--font-mono); font-size: 11px; color: var(--color-muted-foreground); letter-spacing: 0.08em; text-transform: uppercase;">Props</p>
			<table style="width: 100%; border-collapse: collapse;">
				<thead>
					<tr>
						{#each ["Prop", "Type", "Default", "Description"] as h (h)}
							<th style="{cellStyle} font-family: var(--font-mono); font-size: 11px; font-weight: 500; color: var(--color-muted-foreground); letter-spacing: 0.06em; text-transform: uppercase; text-align: left;">
								{h}
							</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each propDefs as p (p.name)}
						<tr>
							<td style="{cellStyle} font-family: var(--font-mono); font-size: 12px; color: var(--color-accent); white-space: nowrap;">{p.name}</td>
							<td style="{cellStyle} font-family: var(--font-mono); font-size: 12px; color: var(--color-foreground);">{p.type}</td>
							<td style="{cellStyle} font-family: var(--font-mono); font-size: 12px; color: var(--color-muted-foreground); white-space: nowrap;">{p.default ?? "—"}</td>
							<td style="{cellStyle} font-size: 13px; color: var(--color-foreground);">{p.description}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</section>
	{/if}

	{#if usage}
		<section style="margin-top: {propDefs ? '48px' : '0'}; {propDefs ? '' : 'border-top: 1px solid var(--color-border); padding-top: 48px;'} display: flex; flex-direction: column; gap: 16px;">
			<p style="font-family: var(--font-mono); font-size: 11px; color: var(--color-muted-foreground); letter-spacing: 0.08em; text-transform: uppercase;">Usage</p>
			<pre style="background: var(--color-muted); border: 1px solid var(--color-border); border-radius: 6px; padding: 16px 20px; font-family: var(--font-mono); font-size: 12.5px; line-height: 1.65; color: var(--color-foreground); overflow-x: auto; margin: 0;"><code>{usage.trim()}</code></pre>
		</section>
	{/if}
</div>