export default {
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
