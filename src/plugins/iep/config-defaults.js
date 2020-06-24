import path from 'path';
import cache from './local-cache';
import log from './log';

const rootPath = process.env.PWD;

const entry = path.resolve(rootPath, 'src/app/index.js');
const srcPath = process.env.SRC || path.resolve(rootPath, 'src');
const stampedPath = process.env.SRC || path.resolve(rootPath, 'stamped');

export default (config) => ({
  routes: {
    stamped: '/stamped',
    src: '/src',
    ...config.routes,
  },
  rootPath,
  srcPath,
  stampedPath,
  entry,
  cache,
  log,
  ...config,
});
