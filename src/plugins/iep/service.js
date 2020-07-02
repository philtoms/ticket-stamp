import { fork } from 'child_process';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import cache from 'iep-cache';

import { subscribe } from './utils/pubsub';

const root = process.env.PWD;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const workerService = path.resolve(__dirname, 'worker.js');
const loaderHooks = path.resolve(__dirname, 'loader.js');

const serviceMap = {};
let workerSequenceNo = 0;

// this is a worker process
if (process.argv.includes(workerService)) {
  serviceMap.process = { worker: process };
}

export default (ticket, conf) => {
  if (!serviceMap[ticket]) restart(ticket, conf);
  return { ...serviceMap[ticket], requestId: workerSequenceNo++ };
};

export const restart = (ticket, conf) => {
  if (serviceMap[ticket]) {
    serviceMap[ticket].worker.kill();
    delete serviceMap[ticket];
  }

  const worker = fork(
    workerService,
    [`cache-persist-url=${conf['cache-persist-url']}`],
    {
      execArgv: [
        '--experimental-loader',
        loaderHooks,
        '--experimental-specifier-resolution=node',
        '--no-warnings',
        // '--inspect-brk=localhost:9222',
      ],
    }
  );

  // pub-sub: subscribe to published entity updates
  subscribe(
    'iepMap',
    cache('iepMap', { 'cache-persist-url': conf['cache-persist-url'] }).update,
    worker
  );
  subscribe('iepSrc', cache('iepSrc').update, worker);

  serviceMap[ticket] = {
    worker,
  };
};

export const workers = () =>
  Object.values(serviceMap).map(({ worker }) => worker);
