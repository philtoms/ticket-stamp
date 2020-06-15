import express from 'express';
import cookieParser from 'cookie-parser';
import fileupload from 'express-fileupload';

import proxyMW from './middleware/proxy';
import listMW from './middleware/list';
import promoteMW from './middleware/promote';
import revertMW from './middleware/revert';
import resolveMW from './middleware/resolve';
import registerMW from './middleware/register';
import updateMW from './middleware/update';
import closeMW from './middleware/close';
import resolver from './resolver';

var stamp = express();

import { fork } from 'child_process';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const iepMap = { prod: [] };
const serviceMap = {};

const stampTicket = (data) => {
  restartWorker(data.ticket, data.stage);
  return {
    ...data,
    user: process.env.USER,
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

export default ({ stampDir, entry, proxy, inject }) => {
  // export a ticketed map to the application. Use prod until the ticket
  // is ready
  const validTicket = (ticket, stage) => {
    const iep = iepMap[ticket] || {};
    return (iep.stage === stage && iep) || iepMap.prod[0];
  };

  // this render function may become unnecessary when true
  // SSR import mapping is supported.
  const render = async (iep, body) => {
    return new Promise((resolve) => {
      serviceMap[iep.ticket].worker.send({ iep, entry, body });
      serviceMap[iep.ticket].worker.on('message', ({ buffer }) => {
        if (buffer) resolve(buffer);
      });
    });
  };

  stamp.use(express.urlencoded({ extended: true }));
  stamp.use(fileupload());
  stamp.use(cookieParser());

  // Stamp Cli API
  stamp.get('/stamp/list', listMW(iepMap));
  stamp.put('/stamp/:ticket/promote', promoteMW(iepMap, stampTicket));
  stamp.put('/stamp/:ticket/revert', revertMW(iepMap, stampTicket));
  stamp.put('/stamp/:ticket/close', closeMW(iepMap, stampTicket));
  stamp.put('/stamp/:ticket', updateMW(iepMap, stampTicket, stampDir));
  stamp.post('/stamp', registerMW(iepMap, stampTicket));

  if (proxy) {
    stamp.use(
      proxyMW(proxy, validTicket, (iep, body) =>
        render(iep, body).then((buffer) => {
          _end.call(res, inject(buffer));
        })
      )
    );
  }

  return {
    validTicket,
    stamp,
    render,
    resolve: resolveMW(iepMap, serviceMap, resolver),
  };
};
