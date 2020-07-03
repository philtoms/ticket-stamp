import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import express from 'express';
import compression from 'compression';
//import cookieParser from 'cookie-parser';

import inject from './inject';
import ticketStamp from '../../../../src/ticket-stamp';
import iep from '../../../../src/plugins/iep';
import log from '../../../../src/plugins/iep/utils/local-log';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default (options) => {
  const config = { ...options, log };

  const app = express();

  const stampedPath = path.resolve(__dirname, '../../stamped');
  const modPath = path.resolve(__dirname, '../../node_modules');

  const { imports, proxy, render } = iep(config);

  app.use(compression());
  // app.use(cookieParser());

  // ticket stamp
  app.use('/stamped', express.static(stampedPath));
  app.use('/node_modules', express.static(modPath));
  app.use(ticketStamp(config));

  // iep
  app.use('/src/*', imports);
  app.use('/', proxy, render, inject);

  const listener = app.listen(process.env.PORT || 8080, () => {
    console.log('Your app is listening on port ' + listener.address().port);
  });
};
