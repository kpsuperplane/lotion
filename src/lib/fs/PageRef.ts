import { Mutex } from "async-mutex";
import initEmojiRegex from "emoji-regex";
import { join } from "path";
import { useCallback, useMemo, useSyncExternalStore } from "react";
import * as fs from "tauri-plugin-fs";

export interface IPageRefParent {
  getPathForChildPage(): string;
}
export default class PageRef extends EventTarget implements IPageRefParent {
  static Event = Object.freeze({
    CONTENT_CHANGE: "content:change",
    NAME_CHANGE: "name:change",
    CHILDREN_CHANGE: "children:change",
    PATH_CHANGE: "path:change",
  });

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
      map.set(child._name, child);
    }
    return map;
  };

  protected createFolderIfNotExists = async () => {
    if (!(await fs.exists(this._path))) {
      await fs.mkdir(this._path);
      if (this.parent instanceof PageRef) {
        await this.parent.readChildren();
      }
    }
  };

  protected readChildren = async () =>
    this.fsMutex.runExclusive(async () => {
      await this.createFolderIfNotExists();
      const data = await fs.readDir(this._path);
      const children = data.filter((item) => item.isDirectory);
      const childMap = this.getTempChildMap();
      return await Promise.all(
        children.map(
          async ({ name }) => childMap.get(name) ?? new PageRef(name, this),
        ),
      );
    });

  protected fetch = async () => {
    this._children = await this.readChildren();
  };

  // Path
  get _path() {
    return join(this.parent.getPathForChildPage(), this._name);
  }
  subscribePath = (callback: () => void) => {
    this.addEventListener(PageRef.Event.PATH_CHANGE, callback);
    return () => this.removeEventListener(PageRef.Event.PATH_CHANGE, callback);
  };
  getPathForChildPage = () => {
    return this._path;
  };
  private notifyPathChange = () => {
    this.dispatchEvent(new Event(PageRef.Event.PATH_CHANGE));
    this._children?.map((child) => child.notifyPathChange());
  };

  // Name
  subscribeName = (callback: () => void) => {
    this.addEventListener(PageRef.Event.NAME_CHANGE, callback);
    return () => this.removeEventListener(PageRef.Event.NAME_CHANGE, callback);
  };
  get _name() {
    return this.__name_DO_NOT_USE;
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
      emoji == null ? name.trim() : `${emoji} ${name.trim()}`,
    );
  };
  private notifyNameChange = () => {
    this.dispatchEvent(new Event(PageRef.Event.NAME_CHANGE));
    this.notifyPathChange();
  };

  subscribeChildren = (callback: () => void) => {
    this.addEventListener(PageRef.Event.CHILDREN_CHANGE, callback);
    return () =>
      this.removeEventListener(PageRef.Event.CHILDREN_CHANGE, callback);
  };
  get _children(): typeof this.__children_DO_NOT_USE {
    return this.__children_DO_NOT_USE;
  }
  private set _children(children: PageRef[]) {
    if (this.__children_DO_NOT_USE !== children) {
      this.__children_DO_NOT_USE = children.sort((a, b) =>
        a._name > b._name ? 1 : -1,
      );
      this.notifyChildrenChange();
    }
  }
  notifyChildrenChange = () => {
    this.dispatchEvent(new Event(PageRef.Event.CHILDREN_CHANGE));
  };
  createChild = (name: string) => {
    for (const child of this._children ?? []) {
      if (child._name === name) {
        return child;
      }
    }
    const newChild = new PageRef(name, this);
    this._children = [...(this._children ?? []), newChild];
    this.fetch();
    return newChild;
  };

  // Content
  subscribeContent = (callback: () => void) => {
    this.addEventListener(PageRef.Event.CONTENT_CHANGE, callback);
    return () =>
      this.removeEventListener(PageRef.Event.CONTENT_CHANGE, callback);
  };
  private getDocumentPath(filename: string) {
    return join(this._path, `${filename}.md`);
  }
  get _indexDocumentPath() {
    return this.getDocumentPath(this._name);
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
    this.dispatchEvent(new Event(PageRef.Event.CONTENT_CHANGE));
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
  const getName = useCallback(() => ref._name, [ref]);
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
