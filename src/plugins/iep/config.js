import cache from './utils/local-cache';
import log from './utils/local-log';

export default (config) => ({
  log,
  cache,
  ...config,
});
