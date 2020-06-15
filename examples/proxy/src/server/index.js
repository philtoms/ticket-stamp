import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import express from 'express';
import compression from 'compression';
import inject from './inject';

import ticketStamp from '../../../../src/iep';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

const stampedPath = path.resolve(__dirname, '../../stamped');
const srcPath = path.resolve(__dirname, '../../src');
const iepEntry = path.resolve(__dirname, '../app/index.js');
const modPath = path.resolve(__dirname, '../../node_modules');

const { stamp } = ticketStamp({
  stampedPath,
  srcPath,
  iepEntry,
  proxy: {
    changeOrigin: true,
    headers: {
      'accept-encoding': 'identity',
    },
    target: process.env.TARGET,
  },
  inject,
});

app.use(compression());
app.use(stamp);

app.use('/node_modules', express.static(modPath));
app.use('/stamped', express.static(stampedPath));

const listener = app.listen(process.env.PORT || 8080, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
