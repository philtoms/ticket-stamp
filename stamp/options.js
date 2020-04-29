import commandLineArgs from 'command-line-args';

export const optionDefinitions = [
  { name: 'help', alias: 'h', type: Boolean },
  { name: 'verbose', alias: 'v', type: Boolean },
  {
    name: 'ticket',
    description: 'An open Jira ticket number (uppercase)',
    alias: 't',
    type: (ticket) => ticket.replace(/[\-_]/, '').toLowerCase(),
    defaultOption: true,
  },
  {
    name: 'list',
    description: 'List ticket entries [--qa --prod]',
    alias: 'l',
    type: Boolean,
  },
  {
    name: 'update',
    description: 'Update module entry | entries (default: auto / watch)',
    alias: 'u',
    multiple: true,
    type: String,
  },
  {
    name: 'qa',
    description: 'QA ticket entries list',
    alias: 'q',
    type: Boolean,
  },
  {
    name: 'dev',
    description: 'Dev ticket entries list',
    alias: 'd',
    type: Boolean,
  },
  {
    name: 'prod',
    description: 'Prod entries list',
    alias: 'p',
    type: Boolean,
  },
  {
    name: 'promote',
    description: 'Promote a ticket entry',
    type: Boolean,
  },
];

export default commandLineArgs(optionDefinitions);
