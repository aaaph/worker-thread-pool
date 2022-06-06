import { Worker, SHARE_ENV, MessageChannel } from "node:worker_threads";
import { join } from "node:path";
import { setInterval } from "node:timers/promises";

export const IDENTITY = Symbol("IDENTITY");
export class WorkerPool {
  constructor({ size, filename }) {
    this.size = size;

    const cwd = process.cwd();
    const path = join(cwd, filename);
    this.pool = [...Array(this.size).keys()].map((i) =>
      this._create_worker(path, i)
    );
    this.free = new Set([]);
    this.active = new Set([]);
  }
  _create_worker(path, index) {
    const worker = new Worker(path, {
      env: SHARE_ENV,
      workerData: { index },
    });
    const { port1: second, port2: main } = new MessageChannel();
    worker.postMessage({ port: second }, [second]);

    main.on("message", (value) => {
      const { index, status } = value;
      console.log(`[${index}]: ${status}`);
      if (status === 0) {
        this.active.delete(main);
        this.free.add(main);
      }
      if (status === 1) {
        this.free.delete(main);
        this.active.add(main);
      }
    });

    worker.on("online", () => console.log(`worker with index ${index} online`));
    worker.on("exit", () => console.log(`worker with index ${index} exit`));
    worker.on("error", (err) => console.log(err));
    main[IDENTITY] = index;
    return worker;
  }

  async next() {
    if (this.size === 0) return null;
    for await (const _ of setInterval(1)) {
      const allocated = await this._inject();
      if (allocated) return allocated;
    }
  }
  async _inject() {
    const free = [...this.free.values()];
    const [first] = free;
    if (!first) return null;
    return first;
  }

  info() {
    const active = {
      idxs: [...this.active.values()].map((i) => i[IDENTITY]),
      count: this.active.size,
    };
    const free = {
      idxs: [...this.free.values()].map((x) => x[IDENTITY]),
      count: this.free.size,
    };
    return {
      active,
      free,
      isAvailable: free.count > 0,
    };
  }

  async *generate() {
    while (true) {
      const next = await this.next();
      if (next) yield next;
    }
  }
}
