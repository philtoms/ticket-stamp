import fs from 'fs';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default (folders, file) =>
  [...folders, ''].reduce(
    (acc, folder) =>
      acc ||
      import(
        fs.existsSync(path.resolve(__dirname, folder, file)) &&
          path.resolve(__dirname, folder, file)
      ),
    false
  ) || import(file);
