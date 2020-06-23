import fs from 'fs';
import path from 'path';
import log from './log';

// isolate private cache
const __CACHE = Symbol('local-cache');

globalThis[__CACHE] = globalThis[__CACHE] || {};
const cache = globalThis[__CACHE];

export default (
  entity,
  { defaults = {}, persistRoot = '', persistKey = false } = {}
) => {
  const persistPath = (key) =>
    path.resolve(persistRoot, `${entity}.${persistKey ? key : 'json'}`);

  const persist = (key) => {
    const path = persistPath();
    if (persistRoot) {
      fs.writeFile(path, JSON.stringify(cache[entity]), (err) => {
        if (err) {
          return log('localCache', err);
        }
        if (key && cache[entity][key]) {
          const { mtime } = fs.statSync(path);
          cache[entity][key].timestamp = mtime.getTime();
        }
      });
    }
    if (key && cache[entity][key]) cache[entity][key].timestamp = Date.now();
  };

  const load = (key, timestamp) => {
    const path = persistPath();
    if (fs.existsSync(path)) {
      const data = fs.readFileSync(path, 'utf8');
      cache[entity] = JSON.parse(data);
      if (cache[entity][key])
        cache[entity][key].timestamp = timestamp || Date.now();
    } else {
      cache[entity] = defaults;
      persist();
    }
  };

  const maybeFrom = (fn) => (key) => {
    if (persistRoot && key) {
      const path = persistPath(key);
      const { mtime } = fs.statSync(path);
      const timestamp = mtime.getTime();
      if (cache[entity][key] && timestamp > cache[entity][key].timestamp) {
        load(key, timestamp);
      }
    }
    return fn(key);
  };

  if (!cache[entity]) {
    cache[entity] = defaults;
    if (persistRoot) load();
  }

  return {
    get: maybeFrom((key) => Promise.resolve(cache[entity][key] || false)),
    getAll: () => Promise.resolve(Object.entries(cache[entity])),
    set: (key, value) =>
      Promise.resolve((cache[entity][key] = value)).then(() => persist(key)),
    remove: (key) => {
      delete cache[entity][key];
      return Promise.resolve().then(() => persist(key));
    },
  };
};
