# Ticket Stamp (B2D Demo 2)

`Ticket Stamp` is a very fast and lightweight development flow that supports ticket driven staged workflows. Modules under active ticket development are automatically integrated into the current production application to create a unique and isolated application entry point.

The `Ticket Stamp` system consists of a cloud service that orchestrates the creation and delivery of [Import Maps](https://wicg.github.io/import-maps/), and a CLI tool that is used by the developer to create a ticket workflow.

The workflow is staged, starting at `dev` where development and testing will be undertaken, before being promoted to `qa`. The application will then be QA tested before being further promoted to `prod`. The ticket is then closed and removed from the workflow system.

All modules under ticket development are isolated from all other ticket workflows as well as any higher stages in the current workflow.

`Ticket Stamp` is designed to work with browsers that natively support esm.

## Install / run

`yarn && TARGET=https://www.audiusa.com node ./index.js`

## Synopsis

at the command line run `stamp` (or `node stamp.js`)

`$ stamp [--ticket] TKT-NUM | tktnum`

`$ stamp [TKT-NUM] --update --list --promote --verbose`
`$ stamp --help`

## Options

```
  -h, --help
  -v, --verbose
  -t, --ticket type       An open Jira ticket number
  -l, --list              List ticket entries (default: --qa --prod)
  -u, --update string[]   Update module entry | entries (default: auto / watch)
  -f, --folder string     Watch / upload folder (default: ./src)
   -q, --qa               QA ticket entries list
  -d, --dev               Dev ticket entries list
  -p, --prod              Prod entries list
  --promote               Promote a ticket entry
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

The ticket resources are closed and removed from the workflow system.
