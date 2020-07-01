import fs from 'fs';
import { resolve } from 'path';

// isolate private cache
const __CACHE = Symbol('import-cache');

globalThis[__CACHE] = globalThis[__CACHE] || {};
const cache = globalThis[__CACHE];

const persistData = (entity) => {
  const { persist, path, data } = cache[entity];
  if (persist && path) {
    fs.writeFile(path, JSON.stringify(data), (err) => {
      if (err) {
        return console.error(err);
      }
    });
  }
};

const loadData = (entity) => {
  const { path } = cache[entity];
  if (path && fs.existsSync(path)) {
    const data = fs.readFileSync(path, 'utf8');
    if (data) {
      cache[entity].data = JSON.parse(data);
    }
  }
};

export default (entity, { defaults = {}, persist, persistRoot } = {}) => {
  const get = (key) => cache[entity].data[key] || false;

  const getAll = () => Object.entries(cache[entity]).map(({ data }) => data);

  const set = (key, value) => {
    cache[entity].data[key] = { ...value, timestamp: Date.now() };
    persistData(entity);
  };

  const remove = (key) => {
    Reflect.deleteProperty(cache[entity], key);
    persistData(entity);
  };

  const update = (message) => {
    message.set && set(...message.set);
    message.remove && remove(...message.remove);
  };

  cache[entity] = cache[entity] || {
    data: defaults,
    persist,
    path: resolve(persistRoot, `${entity}.json`),
  };

  loadData(entity);

  return {
    persistRoot,
    get,
    getAll,
    set,
    remove,
    update,
  };
};
