import fs from 'fs';
import path from 'path';

// isolate private cache
const __CACHE = Symbol('local-cache');

globalThis[__CACHE] = globalThis[__CACHE] || {};
const cache = globalThis[__CACHE];

export default (
  entity,
  { defaults = {}, persistRoot = '', persistKey = false } = {}
) => {
  const resolvePath = (key) =>
    path.resolve(persistRoot, `${entity}.${persistKey ? key : 'json'}`);

  const persist = (key) => {
    const path = resolvePath();
    if (persistRoot) {
      fs.writeFile(path, JSON.stringify(cache[entity]), (err) => {
        if (err) {
          return console.error(err);
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
    const path = resolvePath();
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
      const path = resolvePath(key);
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
    persistRoot,
    persistKey,
    get: maybeFrom((key) => Promise.resolve(cache[entity][key] || false)),
    getAll: () => Promise.resolve(Object.entries(cache[entity])),
    set: (key, value) => {
      cache[entity][key] = value;
      return Promise.resolve().then(() => persist(key));
    },
    remove: (key) => {
      delete cache[entity][key];
      return Promise.resolve().then(() => persist(key));
    },
  };
};
