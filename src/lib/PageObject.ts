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
  static async read(page: PageObject) {
    const exists = await fs.exists(page.indexDocumentPath);
    if (!exists) {
      await fs.writeTextFile(page.indexDocumentPath, "", { create: true });
    }
    const data = await fs.readTextFile(page.indexDocumentPath);
    return data;
  }
  static async write(page: PageObject, text: string) {
    return await fs.writeTextFile(page.indexDocumentPath, text, {
      create: true,
    });
  }
}
