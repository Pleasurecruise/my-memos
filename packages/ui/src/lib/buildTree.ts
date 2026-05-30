export interface TreeNode {
  name: string;
  path: string;
  kind: "folder" | "file";
  children?: TreeNode[];
  meta?: {
    fileCount?: number;
  };
}

export interface BuildTreeOptions {
  /** Strip file extension from display names (e.g. "note.md" → "note"). */
  stripExtension?: boolean;
  /** Common prefix to strip before building the tree. */
  rootPrefix?: string;
}

interface DirNode {
  name: string;
  path: string;
  kind: "folder";
  children: Map<string, DirNode | FileNode>;
}

interface FileNode {
  name: string;
  path: string;
  kind: "file";
}

function stripName(name: string, shouldStrip: boolean): string {
  if (!shouldStrip) return name;
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(0, dot) : name;
}

function normalizePaths(paths: string[], rootPrefix?: string): string[] {
  let normalized = paths;
  if (rootPrefix) {
    const prefix = rootPrefix.endsWith("/") ? rootPrefix : rootPrefix + "/";
    normalized = paths.filter((p) => p.startsWith(prefix)).map((p) => p.slice(prefix.length));
  }
  // Deduplicate, drop empties, sort for deterministic output.
  return [...new Set(normalized)].filter((p) => p.length > 0).sort();
}

function countDescendants(nodes: TreeNode[]): number {
  let n = 0;
  for (const node of nodes) {
    if (node.kind === "file") n += 1;
    else if (node.children) n += countDescendants(node.children);
  }
  return n;
}

function dirToArray(dir: DirNode, stripExt: boolean): TreeNode[] {
  const folders: TreeNode[] = [];
  const files: TreeNode[] = [];

  for (const child of dir.children.values()) {
    if (child.kind === "folder") {
      const children = dirToArray(child as DirNode, stripExt);
      folders.push({
        name: child.name,
        path: child.path,
        kind: "folder",
        children,
        meta: { fileCount: countDescendants(children) },
      });
    } else {
      files.push({
        name: stripName(child.name, stripExt),
        path: child.path,
        kind: "file",
      });
    }
  }

  folders.sort((a, b) => a.name.localeCompare(b.name));
  files.sort((a, b) => a.name.localeCompare(b.name));

  return [...folders, ...files];
}

export function buildTree(paths: string[], options: BuildTreeOptions = {}): TreeNode[] {
  const { stripExtension = false, rootPrefix } = options;
  const normalized = normalizePaths(paths, rootPrefix);

  const root: DirNode = {
    name: "",
    path: "",
    kind: "folder",
    children: new Map(),
  };

  for (const rawPath of normalized) {
    const segments = rawPath.split("/");
    let current = root;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const isLast = i === segments.length - 1;
      const segmentPath = segments.slice(0, i + 1).join("/");

      if (isLast) {
        current.children.set(segment, {
          name: segment,
          path: segmentPath,
          kind: "file",
        });
      } else {
        let folder = current.children.get(segment);
        if (!folder) {
          folder = {
            name: segment,
            path: segmentPath,
            kind: "folder",
            children: new Map(),
          };
          current.children.set(segment, folder);
        } else if (folder.kind === "file") {
          // A file already exists at this segment — skip the conflicting folder.
          continue;
        }
        current = folder as DirNode;
      }
    }
  }

  return dirToArray(root, stripExtension);
}
