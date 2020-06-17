import express from 'express';
import cookieParser from 'cookie-parser';
import fileupload from 'express-fileupload';

import proxyMW from '../plugins/proxy';
import resolveMW from '../plugins/resolve';
import resolver from './resolver';
import mw from './middleware';

var stamp = express();

import { fork } from 'child_process';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default ({ stampDir, entry, proxy, inject, plugins }) => {
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

  // export a ticketed map to the application. Use prod until the ticket
  // is ready
  const validTicket = (ticket, stage) => {
    const iep = iepMap[ticket] || {};
    return (iep.stage === stage && iep) || iepMap.prod[0];
  };

  const render = (entry, inject) => (iep, body) => {
    return new Promise((resolve) => {
      const { worker } = serviceMap[iep.ticket];
      worker.send({ iep, entry, body });
      worker.on('message', ({ buffer }) => {
        if (buffer) resolve(inject(buffer));
      });
    });
  };

  stamp.use(express.urlencoded({ extended: true }));
  stamp.use(fileupload());
  stamp.use(cookieParser());
  stamp.use((req, res, next) => {
    req.stamp = {
      promote: {},
      update: {},
      revert: {},
      close: {},
      update: {},
      register: {},
    };
    next();
  });
  // Stamp Cli API
  stamp.get('/stamp/list', mw(plugins.list || ['list'], iepMap));
  stamp.put(
    '/stamp/:ticket/promote',
    mw(plugins.promote || ['promote'], iepMap, stampTicket)
  );
  stamp.put(
    '/stamp/:ticket/revert',
    mw(plugins.revert || ['revert'], iepMap, stampTicket)
  );
  stamp.put(
    '/stamp/:ticket/close',
    mw(plugins.close || ['close'], iepMap, stampTicket)
  );
  stamp.put(
    '/stamp/:ticket',
    mw(plugins.update || ['update'], iepMap, stampTicket, stampDir)
  );
  stamp.post(
    '/stamp',
    mw(plugins.register || ['register'], iepMap, stampTicket)
  );

  const renderOnEntry = render(entry, inject || ((buffer) => buffer));

  if (proxy) {
    stamp.use(proxyMW(proxy, validTicket, renderOnEntry));
  }

  return {
    validTicket,
    stamp,
    render: renderOnEntry,
    resolve: resolveMW(iepMap, serviceMap, resolver),
  };
};
