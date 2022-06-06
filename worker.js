import { parentPort, MessagePort, workerData } from "node:worker_threads";
import assert from "node:assert";
import { setTimeout } from "node:timers/promises";
const commands = {
  FREE: 0,
  ACTIVE: 1,
  ERROR: 2,
};

const readyMessage = { index: workerData.index, status: commands.FREE };
const activeMessage = { index: workerData.index, status: commands.ACTIVE };

parentPort.once("message", async (value) => {
  console.log(`first message from creator`);
  assert(value.port instanceof MessagePort);
  const { port } = value;

  port.on("message", async (data) => {
    port.postMessage(activeMessage);

    await setTimeout(data);
    port.postMessage(readyMessage);
  });

  port.postMessage(readyMessage);
});
