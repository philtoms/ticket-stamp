import { fork } from 'child_process';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const serviceMap = {};

export default (data) => {
  restartWorker(data.ticket, data.stage);
  return {
    user: process.env.USER,
    ...data,
    timestamp: Date().toString(),
  };
};

const restartWorker = (ticket, stage) => {
  if (serviceMap[ticket]) {
    serviceMap[ticket].worker.kill();
    delete serviceMap[ticket];
  }
  if (stage === 'dev') {
    serviceMap[ticket] = {
      worker: fork(path.resolve(__dirname, 'worker.js')),
    };
  }
};
