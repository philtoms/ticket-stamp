import fs from 'fs';
import path from 'path';

import ofType from './ofType';

const loadAll = (paths, plugins, config, ...args) =>
  Promise.all(
    plugins.map((plugin) => {
      // reduce to first found path or plugin package name
      const pluginPath =
        paths.reduce((acc, pluginPath) => {
          if (!acc) {
            const filePath = path.resolve(pluginPath, ofType(plugin, 'js'));
            return fs.existsSync(filePath) && filePath;
          }
          return acc;
        }, false) || plugin;
      return import(pluginPath).then((module) =>
        module.default(config, ...args)
      );
    })
  );

export default (config, paths) => ({
  // load and mount m/w pipelines
  load: (app, plugins, ...args) =>
    Promise.all(
      Object.entries(plugins).map(([plugin, options]) => {
        const {
          mount: { path, method },
          ...rest
        } = options;

        return loadAll(paths, [plugin], config, ...[rest, ...args]).then(
          (module) => {
            if (method) {
              app[method.toLowerCase()](path, module);
            } else app.use(path, module);
          }
        );
      })
    ),

  // run pre-mounted m/w pipelines to end or falsy
  bind: (builtin, plugins = [], ...args) => {
    const pipeline = plugins.includes(builtin)
      ? plugins
      : [...plugins, builtin];

    const mw = loadAll(paths, pipeline, config, ...args);

    return (req, res, next) =>
      mw.then((modules) => {
        modules.reduce((ok, module) => ok && module(req, res, next), true);
      });
  },
});
