import ofType from './ofType';

const endOfRun = (ctx) => (req, res, next) => {
  const { status = 200, message = '', payload = message } = req.stamp[ctx];

  res.status(status).send(payload);

  next({ status, message });
};

const run = (ctx, mw) => async (req, res, next) => {
  try {
    await mw(req, res, (response) => {
      if (response) {
        const { status, message } = response;
        if (!status && message) {
          throw response;
        }
        req.stamp[ctx] = {
          ...req.stamp[ctx],
          ...response,
        };
      }
    });
    next();
  } catch (err) {
    next({
      ctx,
      message: err.stack,
      payload: err.stack,
      status: 500,
    });
  }
};

const importPlugin = (ctx, plugin, paths, options) => {
  // reduce to first found path or plugin package name
  const pluginPath = ofType(plugin, paths, ['js', 'mjs']);
  return new Promise((resolve) =>
    import(pluginPath).then((module) =>
      resolve(run(ctx, module.default(options)))
    )
  );
};

const loadAll = (ctx, pipeline, paths, options) => [
  ...pipeline.map((plugin) => {
    const module = importPlugin(ctx, plugin, paths, options);
    return (req, res, next) => module.then((mw) => mw(req, res, next));
  }),
  endOfRun(ctx),
];

export default (config, paths) => ({
  // mount and bind m/w pipelines
  load: (app, plugins, args) =>
    Object.entries(plugins).forEach(([plugin, options]) => {
      const { method, path, ...rest } = options;

      const mw = loadAll(plugin, [plugin], paths, {
        ...config,
        ...rest,
        ...args,
      });

      if (method) {
        app[method.toLowerCase()](path, ...mw);
      } else {
        app.use(path, ...mw);
      }
    }),

  // bind pre-mounted m/w pipelines
  bind: (builtin, plugins = [], args) => {
    // place built-in at end of run unless explicitly placed in config
    const pipeline = plugins.includes(builtin)
      ? plugins
      : [...plugins, builtin];

    return loadAll(builtin, pipeline, paths, { ...config, ...args });
  },
});
