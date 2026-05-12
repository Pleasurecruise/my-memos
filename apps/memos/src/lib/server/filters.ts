export interface PageFilters {
  search: string;
  date: string;
  tags: string[];
}

export function parsePageFilters(url: URL): PageFilters {
  const date = url.searchParams.get("date")?.trim() ?? "";
  const tagsParam = url.searchParams.get("tags")?.trim() ?? "";
  const tags = tagsParam
    ? tagsParam
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
    : [];
  const search = url.searchParams.get("search")?.trim() ?? "";
  return { search, date, tags };
}
