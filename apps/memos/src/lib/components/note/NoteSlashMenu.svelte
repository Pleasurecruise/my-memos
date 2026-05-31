<script lang="ts">
  import type { SlashCommand } from "./slash-commands";

  interface Props {
    commands: SlashCommand[];
    position: string;
    onselect: (command: SlashCommand) => void;
  }

  let { commands, position, onselect }: Props = $props();
</script>

{#if commands.length > 0}
  <div
    class="fixed z-50 w-(--slash-menu-width) overflow-hidden rounded-md border border-border bg-background shadow-lg"
    style={position}
  >
    {#each commands as command}
      {@const Icon = command.icon}
      <button
        type="button"
        class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
        onclick={() => onselect(command)}
      >
        <Icon class="size-4 text-muted-foreground" />
        <span class="min-w-0 flex-1">
          <span class="block leading-tight">{command.title}</span>
          <span class="block truncate text-xs text-muted-foreground">{command.hint}</span>
        </span>
      </button>
    {/each}
  </div>
{/if}
