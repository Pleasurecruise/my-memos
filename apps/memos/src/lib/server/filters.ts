export interface PageFilters {
  search: string;
  date: string;
  tags: string[];
  viewAsPublic: boolean;
  sortByUpdated: boolean;
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
  const viewAsPublic = url.searchParams.get("view") === "public";
  const sortByUpdated = url.searchParams.get("sort") === "updated";
  return { search, date, tags, viewAsPublic, sortByUpdated };
}
