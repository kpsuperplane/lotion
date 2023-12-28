import * as fs from "tauri-plugin-fs";

export default class PageObject {
  constructor(public path: string) {}
  get name() {
    const parts = this.path.split("/");
    return parts[parts.length - 1];
  }
  get indexDocumentPath() {
    return `${this.path}/${this.name}.md`;
  }
  static async rename(page: PageObject, name: string): Promise<PageObject> {
    const newPage = new PageObject(
      page.path.substring(0, page.path.lastIndexOf(page.name)) + name,
    );
    if (await fs.exists(page.indexDocumentPath)) {
      await fs.rename(page.indexDocumentPath, `${page.path}/${name}.md`, {});
    }
    await fs.rename(page.path, newPage.path, {});
    return newPage;
  }
  static async read(page: PageObject) {
    const exists = await fs.exists(page.indexDocumentPath);
    if (!exists) {
      await fs.writeTextFile(page.indexDocumentPath, "", { create: true });
    }
    const data = await fs.readTextFile(page.indexDocumentPath);
    return data;
  }
  static async write(page: PageObject, text: string) {
    await fs.truncate(page.indexDocumentPath, 0);
    await fs.writeTextFile(page.indexDocumentPath, text, {
      create: true,
    });
  }
  static async createFolder(page: PageObject) {
    if (!(await fs.exists(page.path))) {
      await fs.mkdir(page.path);
    }
  }
  static async delete(page: PageObject) {
    await fs.remove(page.path, { recursive: true });
  }
}
