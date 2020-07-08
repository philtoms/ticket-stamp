import express from 'express';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import bodyparser from 'body-parser';
import fileupload from 'express-fileupload';
import cache from 'iep-cache';

import middleware from '../utils/middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const stamp = express();

export default (config) => {
  const { log = console, plugins, 'iep-cache': cacheOpts } = config;

  const iepMap = cache('iepMap', {
    ...cacheOpts,
    defaults: { prod: [] },
  });

  const { load, bind } = middleware({ ...config, iepMap }, [
    path.resolve(__dirname, '../plugins'),
  ]);

  stamp.use(bodyparser.urlencoded({ extended: true }));
  stamp.use(bodyparser.json());
  stamp.use(fileupload());

  stamp.use((req, res, next) => {
    req.stamp = {
      promote: {},
      update: {},
      revert: {},
      remove: {},
      update: {},
      register: {},
    };
    next();
  });

  // pipeline API
  const { pipeline, ...rest } = plugins;
  stamp.get('/stamp/list', ...bind('list', pipeline.list, { iepMap }));
  stamp.put(
    '/stamp/:ticket/promote',
    ...bind('promote', pipeline.promote, { iepMap })
  );
  stamp.put(
    '/stamp/:ticket/revert',
    ...bind('revert', pipeline.revert, { iepMap })
  );
  stamp.delete(
    '/stamp/:ticket',
    ...bind('remove', pipeline.remove, { iepMap })
  );
  stamp.put('/stamp/:ticket', ...bind('update', pipeline.update, { iepMap }));
  stamp.post('/stamp', ...bind('register', pipeline.register, { iepMap }));

  load(stamp, rest, { iepMap });

  return stamp;
};
