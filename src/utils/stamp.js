import { fork } from 'child_process';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceMap = {};

export const getService = (ticket) => {
  if (!serviceMap[ticket]) restartWorker(ticket);
  return serviceMap[ticket];
};

export default (data, restartRequired = false) => {
  if (restartRequired && data.stage === 'dev')
    restartWorker(data.ticket, data.stage);
  return {
    user: process.env.USER,
    ...data,
    timestamp: Date().toString(),
  };
};

const restartWorker = (ticket) => {
  if (serviceMap[ticket]) {
    serviceMap[ticket].worker.kill();
    delete serviceMap[ticket];
  }
  serviceMap[ticket] = {
    worker: fork(path.resolve(__dirname, 'worker.js')),
  };
};
