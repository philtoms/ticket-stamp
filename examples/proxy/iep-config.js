import winston from 'winston';
import tsConfig from '../../src/ticket-stamp/config';
import iepConfig from '../../src/plugins/iep/config';

const consoleTransport = new winston.transports.Console();
const myWinstonOptions = {
  transports: [consoleTransport],
};
const log = new winston.createLogger(myWinstonOptions);

export default iepConfig(
  tsConfig({
    // log,
    // 'iep-cache':{
    //   'iep-persist-url: ./stamped'
    // },
    iep: {
      proxy: {
        env: '*',
        changeOrigin: true,
        headers: {
          'accept-encoding': 'identity',
        },
        target: process.env.TARGET,
      },
    },

    // stages and stage types: ticket or indexed entry point (head=0)
    stages: {
      dev: 'ticket',
      qa: 'ticket',
      prod: 'head',
    },

    plugins: {
      'jira-webhook': {
        mount: {
          method: 'POST',
          path: '/webhooks/jira',
        },
        issueKeys: {
          user: 'user.displayName',
          ticket: 'issue.key',
          done: 'issue.fields.resolutiondate',
          workflow: 'issue.fields.status.name',
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
  })
);
