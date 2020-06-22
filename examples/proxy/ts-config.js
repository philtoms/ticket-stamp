import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import cache from '../../src/utils/local-cache';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const entry = path.resolve(__dirname, 'src/app/index.js');

export default {
  stampDir: 'stamped',
  entry,
  cache,
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
};
