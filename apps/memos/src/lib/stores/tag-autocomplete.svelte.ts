function getHashContext(text: string, pos: number) {
  const before = text.slice(0, pos);
  const match = before.match(/#([\p{Letter}\p{Number}_\-/]*)$/u);
  if (!match) return null;
  return { query: match[1], start: pos - match[0].length, end: pos };
}

export function createTagAutocomplete(getTagNames: () => string[]) {
  let currentValue = $state("");
  let query = $state("");
  let open = $state(false);
  let activeIndex = $state(0);

  const suggestions = $derived.by(() => {
    const names = getTagNames();
    if (!names.length) return [];
    return query === ""
      ? names.slice(0, 8)
      : names.filter((t) => t.toLowerCase().startsWith(query.toLowerCase())).slice(0, 8);
  });

  function onValueChange(value: string): void {
    currentValue = value;
    const ctx = getHashContext(value, value.length);
    if (ctx && getTagNames().length > 0) {
      query = ctx.query;
      open = true;
      activeIndex = 0;
    } else {
      open = false;
    }
  }

  function onKeydown(e: KeyboardEvent): string | null {
    if (!open || suggestions.length === 0) return null;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % suggestions.length;
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + suggestions.length) % suggestions.length;
    } else if (e.key === "Tab") {
      e.preventDefault();
      return select(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      open = false;
    }
    return null;
  }

  function select(tag: string): string | null {
    const ctx = getHashContext(currentValue, currentValue.length);
    if (!ctx) return null;
    const inserted = `#${tag} `;
    open = false;
    return currentValue.slice(0, ctx.start) + inserted + currentValue.slice(ctx.end);
  }

  function close() {
    open = false;
  }

  return {
    get open() {
      return open;
    },
    get activeIndex() {
      return activeIndex;
    },
    get suggestions() {
      return suggestions;
    },
    onValueChange,
    onKeydown,
    select,
    close,
  };
}
