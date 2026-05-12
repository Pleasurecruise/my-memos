export interface PageFilters {
  search: string;
  date: string;
  tags: string[];
}

export function parsePageFilters(url: URL, options: { includeSearch?: boolean } = {}): PageFilters {
  const date = url.searchParams.get("date")?.trim() ?? "";
  const tagsParam = url.searchParams.get("tags")?.trim() ?? "";
  const tags = tagsParam
    ? tagsParam
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
    : [];
  const search = options.includeSearch ? (url.searchParams.get("search")?.trim() ?? "") : "";
  return { search, date, tags };
}
