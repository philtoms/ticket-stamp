import ofType from '../utils/ofType';
import load from '../utils/load-module';

const loadAll = (plugins, ...args) =>
  Promise.all(
    plugins.map((plugin) =>
      load(['../plugins'], ofType(plugin, 'js')).then((module) =>
        module.default(...args)
      )
    )
  );

export default (app, plugins, args) =>
  Promise.all(
    Object.entries(plugins).map(([plugin, options]) => {
      const {
        mount: { path, method },
        ...rest
      } = options;
      return loadAll([plugin], { ...rest, ...args }).then((module) => {
        if (method) {
          app[method.toLowerCase()](path, module);
        } else app.use(path, module);
      });
    })
  );

export const bind = (plugins, ...args) => {
  const mw = loadAll(plugins, ...args);

  return (req, res, next) =>
    mw.then((modules) => {
      modules.reduce((ok, module) => ok && module(req, res, next), true);
    });
};
