import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import express from 'express';
import compression from 'compression';
import winston from 'winston';

import iep from 'iep';
import { errorHandler } from 'iep-middleware';
import inject from './inject';
import ticketStamp from '../../../../src/ticket-stamp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const jiraPath = path.resolve(__dirname, '../../jira-connect');

const consoleTransport = new winston.transports.Console();
const myWinstonOptions = {
  transports: [consoleTransport],
};
const log = new winston.createLogger(myWinstonOptions);

export default (options) => {
  const config = { ...options, log };

  const app = express();

  app.use('/jira-connect', express.static(jiraPath));

  const { imports, proxy, render } = iep(config);

  app.use(compression());

  // ticket stamp
  app.use(ticketStamp(config));

  // iep
  app.use('/src/*', imports);
  app.use('/', proxy, render, inject);

  // end of pipeline
  app.use(errorHandler({ log }), (err, req, res, next) => {});

  const listener = app.listen(process.env.PORT || 8080, () => {
    log.info('Your app is listening on port ' + listener.address().port);
  });
};
