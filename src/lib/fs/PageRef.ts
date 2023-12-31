import { Mutex } from "async-mutex";
import initEmojiRegex from "emoji-regex";
import { join } from "path";
import { useCallback, useMemo, useSyncExternalStore } from "react";
import * as fs from "tauri-plugin-fs";

export interface IPageRefParent {
  getPathForChildPage(): string;
}

const SORT_PREFIX_REGEX = /^\d+\. /;

export default class PageRef extends EventTarget implements IPageRefParent {
  public readonly isRoot;

  private __children_DO_NOT_USE: null | PageRef[] = null;
  private __content_DO_NOT_USE: null | string = null;
  private fsMutex = new Mutex();

  public constructor(
    private __name_DO_NOT_USE: string,
    private parent: IPageRefParent,
  ) {
    super();
    this.isRoot = !(this.parent instanceof PageRef);
    this.fetch();
  }

  private getTempChildMap = () => {
    const map = new Map<string, PageRef>();
    for (const child of this._children ?? []) {
      map.set(child._nameWithoutSortPrefix, child);
    }
    return map;
  };

  protected createFolderIfNotExists = async () => {
    if (!(await fs.exists(this._path))) {
      await fs.mkdir(this._path);
      if (this.parent instanceof PageRef) {
        await this.parent.readAndMaybePatchChildren();
      }
    }
  };

  protected readAndMaybePatchChildren = async () =>
    this.fsMutex.runExclusive(async () => {
      await this.createFolderIfNotExists();
      const data = await fs.readDir(this._path);
      const children = data
        .filter((item) => item.isDirectory)
        .sort((a, b) => {
          const numA = Number(a.name.match(SORT_PREFIX_REGEX)?.[0]);
          const numB = Number(b.name.match(SORT_PREFIX_REGEX)?.[0]);
          if (!isNaN(numA) && !isNaN(numB)) {
            return numA > numB ? 1 : -1;
          } else if (isNaN(numA) && !isNaN(numB)) {
            return -1;
          } else if (!isNaN(numA) && isNaN(numB)) {
            return 1;
          } else {
            return a.name > b.name ? 1 : -1;
          }
        });
      const digits = Math.max(1, Math.floor(Math.log10(children.length)) + 1);
      const childMap = this.getTempChildMap();
      return await Promise.all(
        children.map(async (childDir, idx) => {
          const nameWithoutSortPrefix = childDir.name.replace(
            SORT_PREFIX_REGEX,
            "",
          );
          const start = `${(idx + 1).toString().padStart(digits, "0")}. `;
          const expectedName = start + nameWithoutSortPrefix;

          const child =
            childMap.get(nameWithoutSortPrefix) ??
            new PageRef(childDir.name, this);

          if (child._name !== expectedName) {
            await child.renameRaw(expectedName);
          }
          return child;
        }),
      );
    });

  protected fetch = async () => {
    this._children = await this.readAndMaybePatchChildren();
    this.notifyChildrenChange();
  };

  // Path
  get _path() {
    return join(this.parent.getPathForChildPage(), this._name);
  }
  subscribePath = (callback: () => void) => {
    this.addEventListener("path:change", callback);
    return () => this.removeEventListener("path:change", callback);
  };
  getPathForChildPage = () => {
    return this._path;
  };
  private notifyPathChange = () => {
    this.dispatchEvent(new Event("path:change"));
    this._children?.map((child) => child.notifyPathChange());
  };

  // Name
  subscribeName = (callback: () => void) => {
    this.addEventListener("name:change", callback);
    return () => this.removeEventListener("name:change", callback);
  };
  get _name() {
    return this.__name_DO_NOT_USE;
  }
  get _nameWithoutSortPrefix() {
    return this._name.replace(this._sortPrefix, "");
  }
  private set _name(name: string) {
    if (this.__name_DO_NOT_USE !== name) {
      this.__name_DO_NOT_USE = name;
      this.notifyNameChange();
    }
  }
  protected renameRaw = async (name: string) => {
    if (await fs.exists(this._indexDocumentPath)) {
      await fs.rename(this._indexDocumentPath, this.getDocumentPath(name), {});
    }
    await fs.rename(
      this._path,
      join(this.parent.getPathForChildPage(), name),
      {},
    );
    this._name = name;
  };
  rename = async (emoji: null | string, name: string) => {
    await this.renameRaw(
      this._sortPrefix +
        (emoji == null ? name.trim() : `${emoji} ${name.trim()}`),
    );
  };
  private notifyNameChange = () => {
    this.dispatchEvent(new Event("name:change"));
    this.notifyPathChange();
  };

  // Children
  subscribeChildren = (callback: () => void) => {
    this.addEventListener("children:change", callback);
    return () => this.removeEventListener("children:change", callback);
  };
  get _children(): typeof this.__children_DO_NOT_USE {
    return this.__children_DO_NOT_USE;
  }
  private set _children(children: PageRef[]) {
    if (this.__children_DO_NOT_USE !== children) {
      this.__children_DO_NOT_USE = children;
      this.notifyChildrenChange();
    }
  }
  notifyChildrenChange = () => {
    this.dispatchEvent(new Event("children:change"));
  };
  createChild = (name: string) => {
    for (const child of this._children ?? []) {
      if (child._nameWithoutSortPrefix === name) {
        return child;
      }
    }
    const sortPrefix = `${(this._children ?? []).length + 1}. `;
    const newChild = new PageRef(sortPrefix + name, this);
    this._children = [...(this._children ?? []), newChild];
    this.fetch();
    return newChild;
  };

  // Content
  subscribeContent = (callback: () => void) => {
    this.addEventListener("content:change", callback);
    return () => this.removeEventListener("content:change", callback);
  };
  private getDocumentPath(filename: string) {
    return join(this._path, `${filename}.md`);
  }
  get _indexDocumentPath() {
    return this.getDocumentPath(this._name);
  }
  get _sortPrefix(): string {
    return this._name.match(SORT_PREFIX_REGEX)?.[0] ?? "";
  }
  private loadContent = async () => {
    await this.createFolderIfNotExists();
    const exists = await fs.exists(this._indexDocumentPath);
    if (!exists) {
      await fs.writeTextFile(this._indexDocumentPath, "", { create: true });
    }
    this._content = await fs.readTextFile(this._indexDocumentPath);
  };

  get _content(): typeof this.__content_DO_NOT_USE {
    this.fsMutex.runExclusive(async () => {
      if (this.__content_DO_NOT_USE === null) {
        await this.loadContent();
      }
    });
    return this.__content_DO_NOT_USE;
  }
  private set _content(content: string) {
    if (this.__content_DO_NOT_USE !== content) {
      this.__content_DO_NOT_USE = content;
      this.notifyContentChange();
    }
  }
  write = async (content: string) =>
    await this.fsMutex.runExclusive(async () => {
      await fs.truncate(this._indexDocumentPath, 0);
      await fs.writeTextFile(this._indexDocumentPath, content, {
        create: true,
      });
      this._content = content;
    });

  notifyContentChange = () => {
    this.dispatchEvent(new Event("content:change"));
  };

  delete = async () => {
    await this.fsMutex.runExclusive(async () => {
      await fs.remove(this._path, { recursive: true });
    });
    if (this.parent instanceof PageRef && this.parent._children != null) {
      this.parent._children = this.parent._children.filter(
        (child) => child != this,
      );
      await this.parent.fetch();
    }
  };
}

const emojiRegex = initEmojiRegex();
export function usePageName(ref: PageRef): {
  name: string;
  emoji: null | string;
  rawName: string;
} {
  const getName = useCallback(() => ref._nameWithoutSortPrefix, [ref]);
  const rawName = useSyncExternalStore(ref.subscribeName, getName);
  const { name, emoji } = useMemo(() => {
    const matches = rawName.match(emojiRegex);
    if (matches != null) {
      const emoji = matches[0];
      if (rawName.startsWith(emoji)) {
        return { name: rawName.replace(emoji, "").trim(), emoji };
      }
    }
    return { name: rawName, emoji: null };
  }, [rawName]);
  return { name, emoji, rawName };
}

export function usePagePath(ref: PageRef): string {
  const getPath = useCallback(() => ref._path, [ref]);
  return useSyncExternalStore(ref.subscribePath, getPath);
}

export function usePageChildren(ref: PageRef) {
  const getChildren = useCallback(() => ref._children, [ref]);
  return useSyncExternalStore(ref.subscribeChildren, getChildren);
}

export function usePageContent(ref: PageRef) {
  const getContent = useCallback(() => ref._content, [ref]);
  return useSyncExternalStore(ref.subscribeContent, getContent);
}
