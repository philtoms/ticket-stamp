import express from 'express';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import bodyparser from 'body-parser';
import fileupload from 'express-fileupload';
import cache from 'iep-cache';
import middleware from 'iep-middleware';
import config from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const stamp = express();

export default (_opts) => {
  const opts = config(_opts);
  const { plugins, iepCache } = opts;

  const iepMap = cache('iepMap', {
    ...iepCache,
    defaults: { prod: [] },
  });

  const paths = [path.resolve(__dirname, '../plugins')];
  const { load, bind } = middleware({
    ...opts,
    iepMap,
    paths,
    ctx: 'stamp',
  });

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
