import fs from 'fs';
import { resolve } from 'path';

// isolate private cache
const __CACHE = Symbol('iep-cache');

globalThis[__CACHE] = globalThis[__CACHE] || {};
const cache = globalThis[__CACHE];

export default (
  entity,
  { defaults = {}, persistUrl, persistKey, IEP_STR } = {},
  log
) => {
  const path =
    persistUrl && resolve(persistUrl, persistKey ? '' : `${entity}.json`);

  cache[entity] = cache[entity] || {
    data: defaults,
  };

  try {
    const persistData = (persistKey) => {
      const { data } = cache[entity];
      if (persistUrl || persistKey) {
        const json = persistKey
          ? data[persistKey][IEP_STR] || JSON.stringify(data[persistKey])
          : JSON.stringify(data);

        const jsonPath = persistKey ? resolve(path, persistKey) : path;
        fs.writeFile(jsonPath, json, (err) => {
          if (err) {
            throw err;
          }
        });
      }
    };

    const loadData = () => {
      if (!cache[entity].loaded && fs.existsSync(path)) {
        const data = fs.readFileSync(path, 'utf8');
        if (data) {
          cache[entity].data = JSON.parse(data);
          cache[entity].loaded = true;
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

    // key persisted data is not loaded until demand
    if (!persistKey) loadData();

    return {
      get,
      getAll,
      set,
      remove,
      update,
    };
  } catch (err) {
    log.error('iep:local-cache', err);
    throw new Error('500');
  }
};
