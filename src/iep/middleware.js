import fs from 'fs';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import ofType from '../utils/ofType';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const load = (plugins, ...args) =>
  Promise.all(
    plugins.map((plugin) =>
      import(
        fs.existsSync(
          path.resolve(__dirname, '../plugins', ofType(plugin, 'js'))
        )
          ? path.resolve(__dirname, '../plugins', ofType(plugin, 'js'))
          : plugin
      ).then((module) => module.default(...args))
    )
  );

export default (app, plugins, args) =>
  Promise.all(
    Object.entries(plugins).map(([plugin, options]) => {
      const {
        mount: { path, method },
        ...rest
      } = options;
      return load([plugin], { ...rest, ...args }).then((module) => {
        if (method) {
          app[method.toLowerCase()](path, module);
        } else app.use(path, module);
      });
    })
  );

export const bind = (plugins, ...args) => {
  const mw = load(plugins, ...args);

  return (req, res, next) =>
    mw.then((modules) => {
      modules.reduce((ok, module) => ok && module(req, res, next), true);
    });
};
