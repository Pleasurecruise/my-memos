import { error, redirect } from "@sveltejs/kit";
import { listNoteCategories, loadNote, NoteError } from "$lib/server/notes";
import { DEFAULT_NOTE_CATEGORY } from "$lib/utils/url";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, platform, locals }) => {
  if (!locals.user) {
    redirect(302, "/");
  }
  if (!platform) {
    error(500, "Cloudflare platform bindings are unavailable.");
  }
  if (!params.slug) {
    error(404, "Note not found.");
  }

  const dependencies = {
    bucket: platform.env.MEMOS_BUCKET,
    cache: platform.env.MEMOS_CACHE,
  };
  const categories = await listNoteCategories(dependencies);
  const slug = params.slug.replace(/\.md$/i, "");

  if (slug === "new") {
    const createdAt = new Date().toISOString();
    return {
      html: "",
      toc: [],
      visualBlocks: [],
      excerpt: "",
      title: "",
      slug,
      createdAt,
      updatedAt: createdAt,
      source: "",
      editorHtml: "",
      categories,
      defaultCategory: DEFAULT_NOTE_CATEGORY,
    };
  }

  try {
    const note = await loadNote(dependencies, slug);
    return { ...note, categories, defaultCategory: DEFAULT_NOTE_CATEGORY };
  } catch (loadError) {
    if (loadError instanceof NoteError && loadError.code === "not_found") {
      error(404, loadError.message);
    }
    throw loadError;
  }
};
