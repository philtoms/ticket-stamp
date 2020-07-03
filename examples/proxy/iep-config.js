import winston from 'winston';
import tsConfig from '../../src/ticket-stamp/config';

const consoleTransport = new winston.transports.Console();
const myWinstonOptions = {
  transports: [consoleTransport],
};
const log = new winston.createLogger(myWinstonOptions);

// const rootPath = process.env.PWD;

// const serverEntry =
//   process.env.SERVER_ENTRY || path.resolve(rootPath, 'src/app/index.js');
// const clientEntry =
//   process.env.CLIENT_ENTRY || path.resolve(rootPath, 'src/index.js');
// const stampedPath =
//   process.env.STAMPED_PATH || path.resolve(rootPath, 'stamped');

export default tsConfig({
  // log,
  iep: {
    proxy: {
      changeOrigin: true,
      headers: {
        'accept-encoding': 'identity',
      },
      target: process.env.TARGET,
    },
  },
  plugins: {
    'jira-webhook': {
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
