import path from 'path';
import fs from 'fs';

export default (plugin, paths, types) =>
  paths.reduce(
    (acc, pluginPath) =>
      acc ||
      types.reduce((acc, type) => {
        if (!acc) {
          const filePath = path.resolve(
            pluginPath,
            `${plugin.replace(`.${type}`, '')}.${type}`
          );
          return fs.existsSync(filePath) && filePath;
        }
        return acc;
      }, false),
    false
  ) || plugin;
