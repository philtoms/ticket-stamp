import fs from 'fs';
import path from 'path';
import log from './log';

// isolate private cache
const __CACHE = Symbol('local-cache');

globalThis[__CACHE] = globalThis[__CACHE] || {};
const cache = globalThis[__CACHE];

export default ({ entity, defaults = {}, persistDir = '' }) => {
  const persistPath = path.resolve(persistDir, `${entity}.json`);

  const persist = () =>
    persistDir &&
    fs.writeFile(
      path.resolve(persistPath),
      JSON.stringify(cache[entity]),
      (err) => {
        if (err) {
          log('localCache', err);
        }
      }
    );

  if (persistDir && fs.existsSync(persistPath))
    cache[entity] = JSON.parse(fs.readFileSync(persistPath));
  else cache[entity] = defaults;

  return {
    [entity]: {
      get: (key) => Promise.resolve(JSON.parse(cache[entity][key] || false)),
      getAll: () =>
        Promise.resolve(
          Object.entries(cache[entity]).map(([key, value]) => [
            key,
            JSON.parse(value),
          ])
        ),
      set: (key, value) =>
        Promise.resolve((cache[entity][key] = JSON.stringify(value))).then(
          persist
        ),
      remove: (ticket) => {
        delete cache[entity][ticket];
        return Promise.resolve().then(persist);
      },
    },
  };
};
