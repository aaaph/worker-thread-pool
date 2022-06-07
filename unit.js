import { Worker, SHARE_ENV, MessageChannel } from "node:worker_threads";

export class Unit {
  constructor({ path, index }) {
    this.lock = 1;
    this.index = index;
    this.worker = new Worker(path, {
      env: SHARE_ENV,
      workerData: { index },
    });

    const { port1, port2 } = new MessageChannel();
    this.worker.postMessage({ port: port1 }, [port1]);
    this.port = port2;
    this.port.on("message", (value) => {
      const { index, status } = value;
      //   console.log(`[${index}]: ${status}`);
      this.lock = status;
      if (this.lock === 0) this.lastFreeAt = new Date();
    });
    this.lastFreeAt = null;
    this.worker.on("online", () =>
      console.log(`worker with index ${index} online`)
    );
    this.worker.on("exit", () =>
      console.log(`worker with index ${index} exit`)
    );
    this.worker.on("error", (err) => console.log(err));
  }

  async send(data) {
    this.port.postMessage(data);
  }
  info() {
    const { index, lock, lastFreeAt } = this;
    let status;
    if (lock === 0) status = "FREE";
    if (lock === 1) status = "ALLOCATED";
    if (lock === 2) status = "ACTIVE";
    return { index, status, lastFreeAt, lock };
  }
  allocate() {
    this.lock = 1;
  }
}
