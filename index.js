import { WorkerPool } from "./pool.js";

const pool = new WorkerPool({ size: 2, filename: "worker.js" });

(async () => {
  for await (const item of pool.generate()) {
    const { index, lock, status } = item.info();
    console.log(
      `[1-${new Date().getSeconds()}] Got item ${index}, status: ${status}, lock: ${lock}`
    );
    const rnd = Math.floor(Math.random() * 10 + 1);
    const seconds = rnd;
    console.log(
      `[1-${new Date().getSeconds()}] Send ${seconds} milliseconds to ${index}`
    );
    item.send(seconds);
  }
})();

(async () => {
  for await (const item of pool.generate()) {
    const { index, status, lock } = item.info();
    console.log(
      `[2-${new Date().getSeconds()}] Got item ${index}, status: ${status}, lock: ${lock}`
    );
    const rnd = Math.floor(Math.random() * 10 + 1);
    const seconds = rnd * 1_000;
    console.log(
      `[2-${new Date().getSeconds()}] Send ${seconds} milliseconds to ${index}`
    );
    item.send(seconds);
  }
})();

(async () => {
  for await (const item of pool.generate()) {
    const { index, status, lock } = item.info();
    console.log(
      `[3-${new Date().getSeconds()}] Got item ${index}, status: ${status}, lock: ${lock}`
    );
    const rnd = Math.floor(Math.random() * 10 + 1);
    const seconds = rnd * 10_000;
    console.log(
      `[3-${new Date().getSeconds()}] Send ${seconds} milliseconds to ${index}`
    );
    item.send(seconds);
  }
})();
