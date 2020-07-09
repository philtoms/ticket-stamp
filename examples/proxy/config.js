import tsConfig from '../../src/ticket-stamp/config';
import { config as iepConfig } from 'iep';

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
        method: 'POST',
        path: '/webhooks/jira',
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
      // shorthand
      promote: ['git-policy', 'promote'],
    },
  })
);
