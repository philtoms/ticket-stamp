import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import express from 'express';
import compression from 'compression';

import inject from './inject';
import ticketStamp from '../../../../src/iep';

export default (config) => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const app = express();

  const srcPath = process.env.SRC || path.resolve(__dirname, '../../src');
  const modPath = path.resolve(__dirname, '../../node_modules');

  const { stamp, resolve } = ticketStamp({
    inject,
    ...config,
  });

  app.use(compression());
  app.use(stamp);
  app.use('/stamped', express.static(config.stampDir));
  app.use(['/src/*', '/static/*'], resolve(srcPath));
  app.use('/node_modules', express.static(modPath));

  const listener = app.listen(process.env.PORT || 8080, () => {
    console.log('Your app is listening on port ' + listener.address().port);
  });
};
