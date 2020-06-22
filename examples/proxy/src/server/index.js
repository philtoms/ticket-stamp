import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import express from 'express';
import compression from 'compression';

import inject from './inject';
import ticketStamp from '../../../../src/iep';
import log from '../../../../src/utils/log';

export default (config) => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const app = express();

  const stampedPath = path.resolve(__dirname, '../../stamped');
  const srcPath = process.env.SRC || path.resolve(__dirname, '../../src');
  const modPath = path.resolve(__dirname, '../../node_modules');

  const { stamp, resolve } = ticketStamp(config);

  app.use(compression());
  app.use('/stamped', express.static(stampedPath));
  app.use('/node_modules', express.static(modPath));
  app.use(stamp);
  app.use(inject);
  app.use('/src/*', resolve(srcPath));

  const listener = app.listen(process.env.PORT || 8080, () => {
    log('Your app is listening on port ' + listener.address().port);
  });
};
