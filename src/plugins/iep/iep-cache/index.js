export const IEP_STR = Symbol('iep-str');

const args = (process.argv || []).reduce((acc, arg) => {
  const [name, value] = arg.split('=');
  return { ...acc, [name]: value };
}, {});

const fromBool = (value) =>
  ['true', 'false'].includes(value) ? JSON.parse(value) : value;

export default (entity, opts = {}) => {
  // params can come from env, opts, args or defaults - in that order
  const logPath = fromBool(
    process.env.LOG_MODULE ||
      opts['log-module'] ||
      args['log-module'] ||
      './local-log.js'
  );

  const cachePath = fromBool(
    process.env.CACHE_MODULE ||
      opts['cache-module'] ||
      args['cache-module'] ||
      './local-cache.js'
  );

  const persistUrl = fromBool(
    process.env.CACHE_PERSIST_DIR ||
      opts['cache-persist-url'] ||
      args['cache-persist-url'] ||
      ''
  );

  const persistKey = fromBool(
    process.env.CACHE_PERSIST_DIR ||
      opts['cache-persist-key'] ||
      args['cache-persist-key'] ||
      false
  );

  let loaded;
  const cache = () =>
    loaded ||
    (loaded = import(logPath)
      .then((module) => module.default || module)
      .then((log) =>
        import(cachePath).then((module) => {
          const cache = module.default || module;
          return cache(
            entity,
            {
              ...opts,
              IEP_STR,
              persistKey,
              persistUrl,
            },
            log
          );
        })
      ));

  // lazy load the cache after the pre-loader cycle has completed.
  // Otherwise the dynamic import will force create a bogus singleton.
  return {
    get: async (...args) => (await cache()).get(...args),
    getAll: async (...args) => (await cache()).getAll(...args),
    set: async (...args) => (await cache()).set(...args),
    remove: async (...args) => (await cache()).remove(...args),
    update: async (...args) => (await cache()).update(...args),
  };
};
