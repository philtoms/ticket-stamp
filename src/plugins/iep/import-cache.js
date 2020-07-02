import { resolve } from 'path';

const root = process.env.PWD;
const configPath = process.env.CONFIG || resolve(root, 'iep-config.js');

export const IEP_STR = Symbol('iep-source');

// lazy load the config after the pre-loader cycle has completed.
// Otherwise the dynamic import will force create a bogus singleton.
export default (entity, opts = {}) => {
  let loaded;
  const cache = () =>
    loaded ||
    (loaded = import(configPath).then((module) => {
      const {
        iep: { cache, persistRoot, log },
      } = module.default;
      return cache(
        entity,
        {
          ...opts,
          IEP_STR,
          persistRoot:
            process.env.CACHE || persistRoot || resolve(root, 'stamped'),
        },
        log
      );
    }));

  return {
    get: async (...args) => (await cache()).get(...args),
    getAll: async (...args) => (await cache()).getAll(...args),
    set: async (...args) => (await cache()).set(...args),
    remove: async (...args) => (await cache()).remove(...args),
    update: async (...args) => (await cache()).update(...args),
  };
};
