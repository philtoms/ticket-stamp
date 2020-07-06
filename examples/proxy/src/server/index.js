import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import express from 'express';
import compression from 'compression';
import winston from 'winston';

import iep from 'iep';
import inject from './inject';
import ticketStamp from '../../../../src/ticket-stamp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const consoleTransport = new winston.transports.Console();
const myWinstonOptions = {
  transports: [consoleTransport],
};
const log = new winston.createLogger(myWinstonOptions);

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
