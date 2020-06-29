import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import express from 'express';
import compression from 'compression';

import inject from './inject';
import ticketStamp from '../../../../src/ticket-stamp';

export default (config) => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const app = express();

  const stampedPath = path.resolve(__dirname, '../../stamped');
  const modPath = path.resolve(__dirname, '../../node_modules');

  app.use(compression());
  app.use('/stamped', express.static(stampedPath));
  app.use('/node_modules', express.static(modPath));
  app.use(ticketStamp(config));
  app.use(inject);

  const listener = app.listen(process.env.PORT || 8080, () => {
    console.log('Your app is listening on port ' + listener.address().port);
  });
};
