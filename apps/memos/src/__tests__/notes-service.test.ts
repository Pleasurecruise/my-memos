import { beforeEach, describe, expect, it, vi } from "vitest";
import { compileEditorHtml, compileMarkdown } from "$lib/server/blog/compiler";
import {
  deleteCategoryCache,
  deleteNoteCache,
  readCategoryCache,
  writeCategoryCache,
  writeNoteCache,
} from "$lib/server/notes/cache";
import {
  deleteStoredNote,
  headStoredNote,
  listStoredNotes,
  writeStoredNote,
} from "$lib/server/notes/storage";
import { createNote, listNoteCategories, updateNote } from "$lib/server/notes/service";
import { NoteError } from "$lib/server/notes/types";

vi.mock("$lib/server/blog/compiler", () => ({
  compileEditorHtml: vi.fn(),
  compileMarkdown: vi.fn(),
}));

vi.mock("$lib/server/notes/cache", () => ({
  compileNote: vi.fn(),
  deleteCategoryCache: vi.fn(),
  deleteNoteCache: vi.fn(),
  readCategoryCache: vi.fn(),
  readNoteCache: vi.fn(),
  writeCategoryCache: vi.fn(),
  writeNoteCache: vi.fn(),
}));

vi.mock("$lib/server/notes/storage", () => ({
  deleteStoredNote: vi.fn(),
  headStoredNote: vi.fn(),
  listStoredNotes: vi.fn(),
  readStoredNote: vi.fn(),
  writeStoredNote: vi.fn(),
}));

const dependencies = {
  bucket: {} as R2Bucket,
  cache: {} as KVNamespace,
};

const compiledNote = {
  html: "<p>Body</p>",
  toc: [],
  visualBlocks: [],
  excerpt: "Body",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(compileMarkdown).mockResolvedValue(compiledNote);
  vi.mocked(compileEditorHtml).mockResolvedValue("<p>Body</p>");
  vi.mocked(headStoredNote).mockResolvedValue(null);
  vi.mocked(writeStoredNote).mockResolvedValue({
    slug: "未分类类别/Hello-World",
    size: 5,
    uploadedAt: "2026-08-03T00:00:01.000Z",
    createdAt: "2026-08-03T00:00:00.000Z",
    updatedAt: "2026-08-03T00:00:00.000Z",
    title: "Hello World",
  });
});

describe("note service", () => {
  it("normalizes a new note and updates derived caches", async () => {
    const note = await createNote(dependencies, {
      body: "# Old title\n\nBody",
      title: "Hello World",
      category: "",
    });

    expect(headStoredNote).toHaveBeenCalledWith(dependencies.bucket, "未分类类别/Hello-World");
    expect(writeStoredNote).toHaveBeenCalledWith(
      dependencies.bucket,
      "未分类类别/Hello-World",
      expect.objectContaining({ source: "Body\n", title: "Hello World" }),
    );
    expect(writeNoteCache).toHaveBeenCalledWith(
      dependencies.cache,
      "未分类类别/Hello-World",
      "2026-08-03T00:00:01.000Z",
      "Hello World",
      compiledNote,
      "Body\n",
    );
    expect(deleteCategoryCache).toHaveBeenCalledWith(dependencies.cache);
    expect(note.slug).toBe("未分类类别/Hello-World");
  });

  it("rejects a duplicate before compiling or writing", async () => {
    vi.mocked(headStoredNote).mockResolvedValue({} as R2Object);

    await expect(
      createNote(dependencies, { body: "Body", title: "Existing", category: "notes" }),
    ).rejects.toEqual(expect.objectContaining<Partial<NoteError>>({ code: "already_exists" }));
    expect(compileMarkdown).not.toHaveBeenCalled();
    expect(writeStoredNote).not.toHaveBeenCalled();
  });

  it("moves the stored note and clears its old cache when the slug changes", async () => {
    const existing = {
      uploaded: new Date("2026-08-01T00:00:00.000Z"),
      customMetadata: { createdAt: "2026-07-01T00:00:00.000Z", title: "Old" },
    } as unknown as R2Object;
    vi.mocked(headStoredNote).mockResolvedValueOnce(existing).mockResolvedValueOnce(null);
    vi.mocked(writeStoredNote).mockResolvedValue({
      slug: "journal/New-Title",
      size: 5,
      uploadedAt: "2026-08-03T00:00:01.000Z",
      createdAt: "2026-07-01T00:00:00.000Z",
      updatedAt: "2026-08-03T00:00:00.000Z",
      title: "New Title",
    });

    const note = await updateNote(dependencies, "notes/Old", {
      body: "Body",
      title: "New Title",
      category: "journal",
    });

    expect(deleteStoredNote).toHaveBeenCalledWith(dependencies.bucket, "notes/Old");
    expect(deleteNoteCache).toHaveBeenCalledWith(dependencies.cache, "notes/Old");
    expect(note.slug).toBe("journal/New-Title");
    expect(note.createdAt).toBe("2026-07-01T00:00:00.000Z");
  });

  it("derives and caches unique non-default categories", async () => {
    vi.mocked(readCategoryCache).mockResolvedValue(null);
    vi.mocked(listStoredNotes).mockResolvedValue([
      {
        slug: "journal/a",
        size: 1,
        uploadedAt: "2026-08-03T00:00:00.000Z",
        createdAt: "2026-08-03T00:00:00.000Z",
        updatedAt: "2026-08-03T00:00:00.000Z",
        title: "A",
      },
      {
        slug: "journal/b",
        size: 1,
        uploadedAt: "2026-08-03T00:00:00.000Z",
        createdAt: "2026-08-03T00:00:00.000Z",
        updatedAt: "2026-08-03T00:00:00.000Z",
        title: "B",
      },
      {
        slug: "未分类类别/c",
        size: 1,
        uploadedAt: "2026-08-03T00:00:00.000Z",
        createdAt: "2026-08-03T00:00:00.000Z",
        updatedAt: "2026-08-03T00:00:00.000Z",
        title: "C",
      },
    ]);

    await expect(listNoteCategories(dependencies)).resolves.toEqual(["journal"]);
    expect(writeCategoryCache).toHaveBeenCalledWith(dependencies.cache, ["journal"]);
  });
});
