import fs from 'fs';
import path from 'path';
import log from './log';

// isolate private cache
const __CACHE = Symbol('local-cache');

globalThis[__CACHE] = globalThis[__CACHE] || { mtime: {} };
const cache = globalThis[__CACHE];

export default (
  entity,
  {
    defaults = {},
    persistRoot = '',
    persistKey = false,
    checkForUpdates = false,
  } = {}
) => {
  // modes:
  //  persistRoot only - save entity as json
  //  persistKey - save entity[key]
  const persist = (key) => {
    if (persistRoot) {
      const persistPath = path.resolve(
        persistRoot,
        `${entity}.${persistKey ? key : 'json'}`
      );

      const data = persistKey
        ? cache[entity][key]
        : JSON.stringify(cache[entity]);
      fs.writeFile(persistPath, data, (err) => {
        if (err) {
          log('localCache', err);
        }
      });
    }
  };

  const load = (key) => {
    const persistPath = path.resolve(
      persistRoot,
      `${entity}.${persistKey ? key : 'json'}`
    );

    if (fs.existsSync(persistPath)) {
      const data = fs.readFileSync(persistPath, 'utf8');
      if (persistKey) cache[entity][key] = data;
      else cache[entity] = JSON.parse(data);
    } else if (!persistKey) {
      cache[entity] = defaults;
      persist();
    }
  };

  const maybeFrom = (fn) => (key) => {
    if (checkForUpdates || (persistKey && !cache[entity][key])) {
      const persistPath = path.resolve(
        persistRoot,
        `${entity}.${persistKey ? key : 'json'}`
      );
      if (fs.existsSync(persistPath)) {
        const { mtime } = fs.statSync(persistPath);
        if (mtime.getTime() !== cache.mtime[persistPath]) {
          cache.mtime[persistPath] = mtime.getTime();
          load(key);
        }
      }
    }
    return fn(key);
  };

  if (!cache[entity]) {
    cache[entity] = defaults;
    if (persistRoot && !persistKey) load();
  }

  return {
    get: maybeFrom((key) => Promise.resolve(cache[entity][key] || false)),
    getAll: maybeFrom(() => Promise.resolve(Object.entries(cache[entity]))),
    set: (key, value) =>
      Promise.resolve((cache[entity][key] = value)).then(() => persist(key)),
    remove: (ticket) => {
      delete cache[entity][ticket];
      return Promise.resolve().then(persist);
    },
  };
};
