import fs from 'fs';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import ofType from '../utils/ofType';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default (plugins, ...args) => {
  const mw = Promise.all(
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

  return (req, res, next) =>
    mw.then((modules) => {
      modules.reduce((ok, module) => ok && module(req, res, next), true);
    });
};
