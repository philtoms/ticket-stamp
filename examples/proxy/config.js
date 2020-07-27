import path from 'path';

// persist file url for srcMap persistance
const srcMapPersistUrl = path.resolve(process.env.PWD, 'iep-cache');

export default {
  // log,
  iepCache: {
    '--srcMap-entity-key': 'source',
    '--srcMap-persist-url': srcMapPersistUrl,
  },
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
      route: '/webhooks/jira',
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
};
