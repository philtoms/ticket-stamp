import { fork } from 'child_process';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceMap = {};
let workerId = 0;

export default (ticket) => {
  if (!serviceMap[ticket]) restart(ticket);
  return { ...serviceMap[ticket], requestId: workerId++ };
};

export const restart = (ticket) => {
  if (serviceMap[ticket]) {
    serviceMap[ticket].worker.kill();
    delete serviceMap[ticket];
  }
  serviceMap[ticket] = {
    worker: fork(path.resolve(__dirname, 'worker.js')),
    // worker: {
    //   kill: () => {},
    //   send: ({ ticket, serverEntry, body, requestId }) => {
    //     import(`${serverEntry}?__iep=${ticket}`).then((module) => {
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
