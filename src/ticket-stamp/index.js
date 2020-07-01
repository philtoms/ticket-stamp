import express from 'express';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import bodyparser from 'body-parser';
import cookieParser from 'cookie-parser';
import fileupload from 'express-fileupload';

import iep from '../plugins/iep';
import cache from '../plugins/iep/import-cache';
import proxyMW from '../plugins/proxy-mw';
import middleware from '../utils/middleware';
import tsConfig from './config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const stamp = express();

export default (options) => {
  const config = tsConfig(options);

  const {
    routes,
    plugins,
    iep: { log },
  } = config;

  const iepMap = cache('iepMap', {
    defaults: { prod: [] },
    persist: true,
  });

  const { load, bind } = middleware(config, [
    path.resolve(__dirname, '../plugins'),
  ]);

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

  const { pipeline, proxy, ...rest } = plugins;

  // Stamp Cli API
  stamp.get('/stamp/list', bind('list', pipeline.list, iepMap));
  stamp.put(
    '/stamp/:ticket/promote',
    bind('promote', pipeline.promote, iepMap)
  );
  stamp.put('/stamp/:ticket/revert', bind('revert', pipeline.revert, iepMap));
  stamp.put('/stamp/:ticket/remove', bind('remove', pipeline.remove, iepMap));
  stamp.put('/stamp/:ticket', bind('update', pipeline.update, iepMap));
  stamp.post('/stamp', bind('register', pipeline.register, iepMap));

  load(stamp, rest, iepMap).then(() => {
    // IEP middleware
    const { middleware, render } = iep(config);
    stamp.use(`${routes.src}/*`, middleware);
    if (proxy) {
      stamp.use(proxyMW({ log, cache }, proxy, render));
    }
  });

  return stamp;
};
