import loadPipe from './load-pipe.mjs';

export default (config, paths) => {
  // mount and bind m/w pipelines
  const load = (app, plugins, args) => {
    return Object.entries(plugins).forEach(([plugin, options]) => {
      const { method, path = '/', pipeline = [plugin], ...rest } = options;
      const pipe = bind({ pipeline, ...rest }, args);

      if (method) {
        app[method.toLowerCase()](path, ...pipe);
      } else {
        app.use(path, ...pipe);
      }
    });
  };

  // bind pre-mounted m/w pipelines
  const bind = (plugins, args) => {
    const { pipeline, ...rest } = plugins.pipeline
      ? plugins
      : { pipeline: plugins };

    return loadPipe(pipeline, paths, { ...config, ...rest, ...args });
  };

  return { load, bind };
};
