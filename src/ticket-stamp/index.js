import express from 'express';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import bodyparser from 'body-parser';
import fileupload from 'express-fileupload';
import cache from 'iep-cache';

import middleware from '../iep-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const stamp = express();

export default (config) => {
  const { plugins, 'iep-cache': cacheOpts } = config;

  const iepMap = cache('iepMap', {
    ...cacheOpts,
    defaults: { prod: [] },
  });

  const { load, bind } = middleware({ ...config, iepMap, ctx: 'stamp' }, [
    path.resolve(__dirname, '../plugins'),
  ]);

  stamp.use(bodyparser.urlencoded({ extended: true }));
  stamp.use(bodyparser.json());
  stamp.use(fileupload());

  stamp.use((req, res, next) => {
    req.stamp = {};
    next();
  });

  // pipeline API
  const {
    list = ['list'],
    promote = ['promote'],
    revert = ['revert'],
    remove = ['remove'],
    update = ['update'],
    register = ['register'],
    ...rest
  } = plugins;

  stamp.get('/stamp/list', ...bind(list, { iepMap }));
  stamp.put('/stamp/:ticket/promote', ...bind(promote, { iepMap }));
  stamp.put('/stamp/:ticket/revert', ...bind(revert, { iepMap }));
  stamp.delete('/stamp/:ticket', ...bind(remove, { iepMap }));
  stamp.put('/stamp/:ticket', ...bind(update, { iepMap }));
  stamp.post('/stamp', ...bind(register, { iepMap }));

  load(stamp, rest, { iepMap });

  return stamp;
};
