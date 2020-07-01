import { fork } from 'child_process';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

import cache from './import-cache';
import { subscribe } from './utils/pubsub';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const workerService = path.resolve(__dirname, 'worker.js');
const loaderHooks = path.resolve(__dirname, 'loader.js');

const serviceMap = {};
let workerId = 0;

// this is a worker process
if (process.argv[1] === workerService) {
  serviceMap.process = { worker: process };
}

export default (ticket) => {
  if (!serviceMap[ticket]) restart(ticket);
  return { ...serviceMap[ticket], requestId: workerId++ };
};

export const restart = (ticket) => {
  if (serviceMap[ticket]) {
    serviceMap[ticket].worker.kill();
    delete serviceMap[ticket];
  }

  const worker = fork(workerService, {
    execArgv: [
      '--experimental-loader',
      loaderHooks,
      '--experimental-specifier-resolution=node',
      '--no-warnings',
      // '--inspect-brk=localhost:9222',
    ],
  });

  // pub-sub: subscribe to published entity updates
  subscribe('iepMap', cache('iepMap', { persist: true }).update, worker);
  subscribe('iepSrc', cache('iepSrc').update, worker);

  serviceMap[ticket] = {
    worker,
  };
};

export const workers = () =>
  Object.values(serviceMap).map(({ worker }) => worker);
