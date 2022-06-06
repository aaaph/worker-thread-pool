import { WorkerPool, IDENTITY } from "./pool.js";

const pool = new WorkerPool({ size: 25, filename: "worker.js" });

(async () => {
  for await (const item of pool.generate()) {
    const id = item[IDENTITY];
    console.log(`Got item ${id}`);
    const rnd = Math.floor(Math.random() * 10 + 1);
    const seconds = rnd * 1_000;
    console.log(`Send ${seconds} milliseconds to ${id}`);
    item.postMessage(seconds);
  }
})();
