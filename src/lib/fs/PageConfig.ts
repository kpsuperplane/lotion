import { z } from "zod";
import PageRef from "./PageRef";
import { Mutex } from "async-mutex";
import * as fs from "tauri-plugin-fs";
import { join } from "path";

const Schema = z.object({
  sort: z.array(z.string()),
});

type TSchema = z.infer<typeof Schema>;

const DEFAULT_CONFIG: TSchema = {
  sort: [],
};

export default class PageConfig {
  private fsMutex = new Mutex();
  private cached: null | TSchema = null;
  constructor(private page: PageRef) {}
  get configFile(): string {
    return join(this.page._path, "page.lotionconfig");
  }
  private async read(): Promise<TSchema> {
    if (this.cached == null) {
      this.cached = await this.fsMutex.runExclusive(async () => {
        console.log(this.configFile);
        if (!(await fs.exists(this.configFile))) {
          await fs.writeTextFile(
            this.configFile,
            JSON.stringify(DEFAULT_CONFIG, null, 2),
            { create: true },
          );
        }
        const raw = await fs.readTextFile(this.configFile);
        try {
          return Schema.parse(JSON.parse(raw));
        } catch (e) {
          return DEFAULT_CONFIG;
        }
      });
    }
    return this.cached;
  }
  private async persist(data: Partial<TSchema>): Promise<TSchema> {
    const oldConfig = this.cached ?? DEFAULT_CONFIG;
    const newConfig = { ...oldConfig, ...data };
    if (JSON.stringify(oldConfig) !== JSON.stringify(newConfig)) {
      this.cached = newConfig;
      await this.fsMutex.runExclusive(async () => {
        await fs.truncate(this.configFile, 0);
        await fs.writeTextFile(
          this.configFile,
          JSON.stringify(this.cached, null, 2),
          { create: true },
        );
      });
    }
    return newConfig;
  }
  public async maybePersistNames(sort: string[]): Promise<void> {
    await this.persist({ sort });
  }
  public async sortEntries(entries: fs.DirEntry[]): Promise<fs.DirEntry[]> {
    const map = new Map<string, fs.DirEntry>();
    for (const entry of entries) {
      if (entry.isDirectory) {
        map.set(entry.name, entry);
      }
    }
    const sortOrder = (await this.read()).sort;
    const output: fs.DirEntry[] = [];
    for (const name of sortOrder) {
      const entry = map.get(name);
      if (entry != null) {
        output.push(entry);
        map.delete(name);
      }
    }

    const remaining = Array.from(map.values()).sort((a, b) =>
      a.name > b.name ? 1 : -1,
    );
    output.push(...remaining);
    return output;
  }
}
