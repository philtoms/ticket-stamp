import express from 'express';
import bodyparser from 'body-parser';
import cookieParser from 'cookie-parser';
import fileupload from 'express-fileupload';

import proxyMW from '../plugins/proxy';
import resolveMW from '../plugins/resolve';
import resolver from './resolver';
import load, { bind } from './middleware';
import { getService } from '../utils/stamp';

const stamp = express();
const root = process.env.PWD;

export default ({ stampDir, entry, plugins, cache }) => {
  const iepMap = cache('iepMap', {
    defaults: { prod: [] },
    persistRoot: `${root}/${stampDir}`,
  });

  // export a ticketed map to the application. Use prod until the ticket
  // is ready
  const validTicket = async (ticket, stage) => {
    const iep = (await iepMap.get(ticket)) || {};
    if (iep.stage === stage) return iep;
    return (await iepMap.get('prod'))[0];
  };

  const render = (entry) => (iep, body) => {
    return new Promise((resolve) => {
      const { worker, requestId } = getService(iep.ticket);
      worker.send({ ticket: iep.ticket, entry, body, requestId });
      worker.on('message', ({ responseId, buffer }) => {
        if (requestId === responseId) resolve(buffer);
      });
    });
  };

  stamp.use(bodyparser.urlencoded({ extended: true }));
  stamp.use(bodyparser.json());
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

  const { pipeline, proxy, ...middleware } = plugins;

  // Stamp Cli API
  stamp.get('/stamp/list', bind(pipeline.list || ['list'], iepMap));
  stamp.put(
    '/stamp/:ticket/promote',
    bind(pipeline.promote || ['promote'], iepMap)
  );
  stamp.put(
    '/stamp/:ticket/revert',
    bind(pipeline.revert || ['revert'], iepMap)
  );
  stamp.put(
    '/stamp/:ticket/remove',
    bind(pipeline.remove || ['remove'], iepMap)
  );
  stamp.put(
    '/stamp/:ticket',
    bind(pipeline.update || ['update'], iepMap, stampDir)
  );
  stamp.post('/stamp', bind(pipeline.register || ['register'], iepMap));

  const renderOnEntry = render(entry);

  load(stamp, middleware, { iepMap }).then(() => {
    if (proxy) {
      stamp.use(proxyMW(proxy, validTicket, renderOnEntry));
    }
  });

  return {
    validTicket,
    stamp,
    render: renderOnEntry,
    resolve: resolveMW(cache, resolver, stampDir),
  };
};
