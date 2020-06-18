import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import express from 'express';
import compression from 'compression';
import inject from './inject';

import ticketStamp from '../../../../src/iep';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

const stampDir = path.resolve(__dirname, '../../stamped');
const srcPath = process.env.SRC || path.resolve(__dirname, '../../src');
const entry = path.resolve(__dirname, '../app/index.js');
const modPath = path.resolve(__dirname, '../../node_modules');

const { stamp, resolve } = ticketStamp({
  stampDir,
  entry,
  inject,
  plugins: {
    proxy: {
      changeOrigin: true,
      headers: {
        'accept-encoding': 'identity',
      },
      target: process.env.TARGET,
    },
    jira: {
      mount: {
        method: 'POST',
        path: '/webhooks/jira',
      },
      issueKeys: {
        user: 'user/displayName',
        ticket: 'issue/key',
        done: 'issue/fields/resolutiondate',
        workflow: 'issue/fields/status/name',
      },
      workflowMap: {
        Backlog: 'dev',
        'Selected for Development': 'dev',
        'In Progress': 'qa',
        Done: 'prod',
      },
    },
    pipeline: {
      promote: ['git-policy', 'promote'],
    },
  },
});

app.use(compression());
app.use(stamp);
app.use(['/src/*', '/static/*'], resolve(srcPath));
app.use('/stamped', express.static(stampDir));
app.use('/node_modules', express.static(modPath));

const listener = app.listen(process.env.PORT || 8080, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
