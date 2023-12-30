import { Mutex } from "async-mutex";
import { join } from "path";
import { useCallback, useSyncExternalStore } from "react";
import * as fs from "tauri-plugin-fs";

export interface IPageRefParent {
  getPathForChildPage(): string;
}

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
      map.set(child._name, child);
    }
    return map;
  };

  protected createFolderIfNotExists = async () => {
    if (!(await fs.exists(this._path))) {
      await fs.mkdir(this._path);
    }
  };

  protected fetch = async () => {
    const data = await this.fsMutex.runExclusive(async () => {
      await this.createFolderIfNotExists();
      return await fs.readDir(this._path);
    });
    const childMap = this.getTempChildMap();
    this._children = data
      .filter((child) => child.isDirectory)
      .map((child) => {
        const existingChild = childMap.get(child.name);
        if (existingChild != null) {
          return existingChild;
        } else {
          return new PageRef(child.name, this);
        }
      });
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
  private set _name(name: string) {
    if (this.__name_DO_NOT_USE !== name) {
      this.__name_DO_NOT_USE = name;
      this.notifyNameChange();
    }
  }
  rename = async (name: string) => {
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
      if (child._name === name) {
        return child;
      }
    }
    const newChild = new PageRef(name, this);
    this._children = [...(this._children ?? []), newChild];
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
    }
  };
}

export function usePageName(ref: PageRef) {
  const getName = useCallback(() => ref._name, [ref]);
  return useSyncExternalStore(ref.subscribeName, getName);
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
