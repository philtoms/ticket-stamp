# Ticket Stamp

`Ticket Stamp` is a very fast and lightweight development system that supports ticket driven staged workflows. Modules under active ticket development are automatically integrated into the current production application to create a unique and isolated application entry point (IEP). Everything is live - except for the modules in the ticket.

## Features

- Ticket driven: development is completely isolated.
- Staged promotion: from `dev` into `qa`, and on to `prod` at the click of a button.
- Optimistic deployment: ticket stamped modules are immediately available for promotion
- Backed by git: synchronizes with git history for safe alternate scenarios - even in `prod`.
- Optional Jira integration for fine-grained ticket control
- Optional Slack integration to keep everyone notified

## How it works

The `Ticket Stamp` system consists of a cloud service that orchestrates the creation and delivery of [Import Maps](https://wicg.github.io/import-maps/), and a CLI tool that is used by the developer to create and operate a ticket workflow.

- Each import map is uniquely bound to a ticket and stored as an IEP (isolated entry point) in the IEP cloud service.
- The IEP is upgraded through module development
- A page url with a `?stage=ticket` query will load the IEP import map into the page response.
- The browser then resolves all of its imports through the import map.

The workflow is staged, starting at `dev` where development and testing will be undertaken, before being promoted to `qa`. The application will then be QA tested before being further promoted to `prod`. The ticket is then closed and removed from the workflow system.

All modules under ticket development are isolated from all other ticket workflows as well as any higher stages in the current workflow.

`Ticket Stamp` is designed to work with browsers that natively support [esm modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import).

## Install / run

`yarn && TARGET=https://www.audiusa.com node ./index.js`

## Synopsis

at the command line run `stamp` (or `node stamp.js`)

`$ stamp (or stamp --help)`
`$ stamp [--ticket] TKT-NUM | tktnum`
`$ stamp [TKT-NUM] --update --list --promote --verbose`

## Options

```
  -h, --help
  -v, --verbose
  -t, --ticket tkt-nnn    An open Jira ticket number
  -l, --list              List ticket entries (default: --qa --prod)
  -u, --update            Update module entry | entries (default: auto / watch)
  -f, --folder ./p/t/f    Watch / upload folder (default: ./src)
  -q, --qa                QA ticket specifier
  -d, --dev               Dev ticket specifier
  -p, --prod              Prod specifier

  --promote               Promote a ticket
  --revert                Revert a ticket (unstage)
  --close                 Close a ticket
```

## Workflow

### DEV: Stamp out a new ticket and watch for source code changes

`stamp TKT-001 --update`

This action starts a new workflow and assigns it to the ticket number `TKT-001`. The `./src` folder will be monitored for saved source code modules which will be automatically sent to the IEP service.

The IEP service will generate a new unique import-map based off the current production map but amended to include the latest uploaded module.

The IEP service guarantees that any URL with a query containing `dev=TKT-001` will receive the stamped import-map.

### DEV: Promote the ticket to QA

`stamp TKT-001 --promote`

This action first verifies that the local git HEAD is directly descended from master and that the status is clean.

The IEP service performs a similar action against the remote git repository.

When both of these checks are verified, the IEP service promotes the ticket to `qa` state. The modified application will now be available through a URL containing `qa=TKT-001`

### QA: Promote the ticket to PROD

`stamp TKT-001 --promote`

This action performs the same checks as the previous step before promoting the ticket to prod. The released application will no longer require a ticket in the URL.

The ticket resources are closed but not removed from the workflow system. Tickets can be re-opened and they can be reverted.

## Roadmap

`Ticket Stamp` is in early alpha. There are many parts missing from the bigger picture.

- Upgrade --watch for add, change, delete
- Implement IEP control panel - mainly for QA
- Remove _require only_ restriction on server side imports
- Plugin architecture - basically rewrite the whole IEP M/w to work with plugins
- Policy plugin - move all of the promote decisions out of IEP
- Authentication plugin - Integrate Github, Atlassian, etc single sign on
- Promotion plugin - orchestrate promotion through customized build steps.
- Hook plugin - Github, Jira, Slack, whatever
