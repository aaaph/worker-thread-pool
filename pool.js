import { join } from "node:path";
import { setImmediate } from "node:timers/promises";

import { Unit } from "./unit.js";

export class WorkerPool {
  constructor({ size, filename }) {
    this.size = size;

    const cwd = process.cwd();
    const path = join(cwd, filename);
    this.pool = [...Array(this.size).keys()].map(
      (index) => new Unit({ index, path })
    );
  }
  /**
   * @returns {Promise<Unit>}
   */
  async next() {
    if (this.size === 0) return null;
    const allocated = await this._inject();
    if (!allocated) {
      await setImmediate();
      return this.next();
    }
    return allocated;
  }
  /**
   * @returns {Promise<Unit>}
   */
  async _inject(index = 0) {
    const unit = this.pool[index];
    if (!unit) {
      await setImmediate();
      return this._inject(index);
    }
    const isFree = unit.lock === 0;
    if (!isFree) {
      await setImmediate();
      return this._inject(index >= this.size - 1 ? 0 : index + 1);
    }
    unit.allocate();
    return unit;
  }

  info() {
    const info = this.pool
      .map((x) => x.info())
      .sort((a, b) => a.lastFreeAt - b.lastFreeAt);
    return info;
  }

  async *generate() {
    while (true) {
      const next = await this.next();
      if (next) yield next;
    }
  }
}
