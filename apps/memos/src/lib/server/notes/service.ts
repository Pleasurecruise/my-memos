import { compileEditorHtml, compileMarkdown, type CompiledNote } from "$lib/server/blog/compiler";
import { stripLeadingTitleHeading } from "$lib/server/blog/title";
import {
  DEFAULT_NOTE_CATEGORY,
  categoryFromSlug,
  normalizeNoteSlug,
  normalizeUrlPathSegment,
} from "$lib/utils/url";
import {
  compileNote,
  deleteCategoryCache,
  deleteNoteCache,
  readCategoryCache,
  readNoteCache,
  writeCategoryCache,
  writeNoteCache,
} from "./cache";
import {
  deleteStoredNote,
  headStoredNote,
  listStoredNotes,
  readStoredNote,
  writeStoredNote,
} from "./storage";
import { NoteError, type NoteDocument, type NoteInput, type NoteListing } from "./types";

interface NoteDependencies {
  bucket: R2Bucket;
  cache: KVNamespace;
}

function buildNoteSlug(category: string, title: string): string {
  const fileName = normalizeUrlPathSegment(title || "untitled-note") || "untitled-note";
  const normalizedCategory =
    normalizeUrlPathSegment(category || DEFAULT_NOTE_CATEGORY) || DEFAULT_NOTE_CATEGORY;
  return `${normalizedCategory}/${fileName}`;
}

function normalizeNoteSource(body: string): string {
  return `${stripLeadingTitleHeading(body).trimEnd()}\n`;
}

async function buildNoteDocument(
  compiled: CompiledNote,
  source: string,
  title: string,
  slug: string,
  createdAt: string,
  updatedAt: string,
): Promise<NoteDocument> {
  return {
    html: compiled.html,
    toc: compiled.toc,
    visualBlocks: compiled.visualBlocks,
    excerpt: compiled.excerpt,
    title,
    slug,
    createdAt,
    updatedAt,
    source,
    editorHtml: await compileEditorHtml(source),
  };
}

export async function listNotes({ bucket }: NoteDependencies): Promise<NoteListing> {
  const storedNotes = await listStoredNotes(bucket);
  const paths: string[] = [];
  const fileMeta: NoteListing["fileMeta"] = {};

  for (const note of storedNotes) {
    paths.push(note.slug);
    fileMeta[note.slug] = {
      size: note.size,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      title: note.title,
    };
  }

  return { paths, fileMeta };
}

export async function listNoteCategories({ bucket, cache }: NoteDependencies): Promise<string[]> {
  const cached = await readCategoryCache(cache);
  if (cached) return cached;

  const categories = new Set<string>();
  for (const note of await listStoredNotes(bucket)) {
    const category = categoryFromSlug(note.slug);
    if (category && category !== DEFAULT_NOTE_CATEGORY) categories.add(category);
  }

  const sortedCategories = [...categories].sort((left, right) => left.localeCompare(right));
  await writeCategoryCache(cache, sortedCategories);
  return sortedCategories;
}

export async function loadNote(
  dependencies: NoteDependencies,
  rawSlug: string,
): Promise<NoteDocument> {
  const slug = normalizeNoteSlug(rawSlug);
  if (!slug) throw new NoteError("not_found", "Note not found.");

  const storedNote = await readStoredNote(dependencies.bucket, slug);
  if (!storedNote) throw new NoteError("not_found", `Note "${slug}" not found.`);

  const cached = await readNoteCache(dependencies.cache, slug, storedNote.uploadedAt);
  if (cached) {
    const source = stripLeadingTitleHeading(cached.source);
    const compiled =
      source === cached.source
        ? cached
        : await compileNote(
            source,
            dependencies.cache,
            slug,
            storedNote.uploadedAt,
            storedNote.title,
          );
    return buildNoteDocument(
      compiled,
      source,
      storedNote.title,
      slug,
      storedNote.createdAt,
      storedNote.updatedAt,
    );
  }

  const source = stripLeadingTitleHeading(storedNote.source);
  const compiled = await compileNote(
    source,
    dependencies.cache,
    slug,
    storedNote.uploadedAt,
    storedNote.title,
  );
  return buildNoteDocument(
    compiled,
    source,
    storedNote.title,
    slug,
    storedNote.createdAt,
    storedNote.updatedAt,
  );
}

export async function createNote(
  { bucket, cache }: NoteDependencies,
  input: NoteInput,
): Promise<NoteDocument> {
  const slug = buildNoteSlug(input.category, input.title);
  if (await headStoredNote(bucket, slug)) {
    throw new NoteError("already_exists", `Note "${slug}" already exists.`);
  }

  const source = normalizeNoteSource(input.body);
  const savedAt = new Date().toISOString();
  const compiled = await compileMarkdown(source);
  const storedNote = await writeStoredNote(bucket, slug, {
    source,
    title: input.title,
    createdAt: savedAt,
    updatedAt: savedAt,
  });
  if (!storedNote) throw new NoteError("storage_failure", "Failed to create note.");

  await writeNoteCache(cache, slug, storedNote.uploadedAt, input.title, compiled, source);
  await deleteCategoryCache(cache);

  return buildNoteDocument(compiled, source, input.title, slug, savedAt, savedAt);
}

export async function updateNote(
  { bucket, cache }: NoteDependencies,
  rawSlug: string,
  input: NoteInput,
): Promise<NoteDocument> {
  const currentSlug = normalizeNoteSlug(rawSlug);
  if (!currentSlug) throw new NoteError("invalid_input", "Note path is required.");

  const existing = await headStoredNote(bucket, currentSlug);
  if (!existing) throw new NoteError("not_found", `Note "${currentSlug}" not found.`);

  const nextSlug = buildNoteSlug(input.category, input.title);
  if (nextSlug !== currentSlug && (await headStoredNote(bucket, nextSlug))) {
    throw new NoteError("already_exists", `Note "${nextSlug}" already exists.`);
  }

  const source = normalizeNoteSource(input.body);
  const savedAt = new Date().toISOString();
  const createdAt = existing.customMetadata?.createdAt ?? existing.uploaded.toISOString();
  const compiled = await compileMarkdown(source);
  const storedNote = await writeStoredNote(bucket, nextSlug, {
    source,
    title: input.title,
    createdAt,
    updatedAt: savedAt,
    customMetadata: existing.customMetadata,
  });
  if (!storedNote) throw new NoteError("storage_failure", "Failed to save note.");

  await writeNoteCache(cache, nextSlug, storedNote.uploadedAt, input.title, compiled, source);
  if (nextSlug !== currentSlug) {
    await deleteStoredNote(bucket, currentSlug);
    await deleteNoteCache(cache, currentSlug);
  }
  await deleteCategoryCache(cache);

  return buildNoteDocument(compiled, source, input.title, nextSlug, createdAt, savedAt);
}

export async function deleteNote(
  { bucket, cache }: NoteDependencies,
  rawSlug: string,
): Promise<void> {
  const slug = normalizeNoteSlug(rawSlug);
  if (!slug) throw new NoteError("invalid_input", "Note path is required.");
  if (!(await headStoredNote(bucket, slug))) {
    throw new NoteError("not_found", `Note "${slug}" not found.`);
  }

  await deleteStoredNote(bucket, slug);
  await deleteNoteCache(cache, slug);
  await deleteCategoryCache(cache);
}
