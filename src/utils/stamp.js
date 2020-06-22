import { fork } from 'child_process';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceMap = {};
let workerId = 0;

export const getService = (ticket) => {
  if (!serviceMap[ticket]) restartWorker(ticket);
  return { ...serviceMap[ticket], requestId: workerId++ };
};

export default (data, restartRequired = false) => {
  if (restartRequired && data.stage === 'dev')
    restartWorker(data.ticket, data.stage);
  return {
    user: process.env.USER,
    ...data,
  };
};

const restartWorker = (ticket) => {
  if (serviceMap[ticket]) {
    serviceMap[ticket].worker.kill();
    delete serviceMap[ticket];
  }
  serviceMap[ticket] = {
    worker: fork(path.resolve(__dirname, 'worker.js')),
    // worker: {
    //   send: ({ ticket, entry, body, requestId }) => {
    //     import(`${entry}?__iep=${ticket}`).then((module) => {
    //       serviceMap[ticket].worker.return({
    //         responseId: requestId,
    //         buffer: (module.default || module)(body),
    //       });
    //     });
    //   },
    //   on: (_, cb) => (serviceMap[ticket].worker.return = cb),
    // },
  };
};
