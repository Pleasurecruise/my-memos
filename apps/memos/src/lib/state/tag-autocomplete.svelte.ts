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
      ? names
      : names.filter((t) => t.toLowerCase().startsWith(query.toLowerCase()));
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
    if (e.key === "Tab") {
      e.preventDefault();
      if (suggestions.length > 0) return select(suggestions[activeIndex]);
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
    set activeIndex(v: number) {
      activeIndex = v;
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
