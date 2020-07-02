import fs from 'fs';
import { resolve } from 'path';

// isolate private cache
const __CACHE = Symbol('import-cache');

globalThis[__CACHE] = globalThis[__CACHE] || {};
const cache = globalThis[__CACHE];

export default (
  entity,
  { defaults = {}, persist, persistRoot, persistKey, IEP_STR } = {},
  log
) => {
  const persistData = (persistKey) => {
    // key persistance overrides root option
    const { persist = persistKey, path, data } = cache[entity];
    if (path && persist) {
      const json = persistKey
        ? data[persistKey][IEP_STR] || JSON.stringify(data[persistKey])
        : JSON.stringify(data);

      const jsonPath = persistKey ? resolve(path, persistKey) : path;
      fs.writeFile(jsonPath, json, (err) => {
        if (err) {
          return log.error(err);
        }
      });
    }
  };

  const loadData = () => {
    const { path } = cache[entity];
    if (path && fs.existsSync(path)) {
      const data = fs.readFileSync(path, 'utf8');
      if (data) {
        cache[entity].data = JSON.parse(data);
      }
    }
  };

  const get = (key) => cache[entity].data[key] || false;

  const getAll = () => Object.entries(cache[entity]).map(({ data }) => data);

  const set = (key, value) => {
    cache[entity].data[key] = { ...value, timestamp: Date.now() };
    persistData(persistKey && key);
  };

  const remove = (key) => {
    Reflect.deleteProperty(cache[entity], key);
    persistData(persistKey && key);
  };

  const update = (message) => {
    message.set && set(...message.set);
    message.remove && remove(...message.remove);
  };

  cache[entity] = cache[entity] || {
    data: defaults,
    persist,
    path: resolve(persistRoot, persistKey ? '' : `${entity}.json`),
  };

  // key persisted data is loaded on demand
  if (!persistKey) loadData();

  return {
    get,
    getAll,
    set,
    remove,
    update,
  };
};
