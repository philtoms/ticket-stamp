# Ticket Stamp (B2D Demo 2)

`Ticket Stamp` is a very fast and lightweight development flow cloud service that supports ticket driven staged workflows.

## install / run

`yarn && TARGET=https://www.audiusa.com node ./index.js`

## Synopsis

`$ stamp [--ticket] TKT-NUM | tktnum`
`$ stamp [TKT-NUM] --update --list --promote --verbose`
`$ stamp --help`

## Options

```
  -h, --help
  -v, --verbose
  -t, --ticket type       An open Jira ticket number
  -l, --list              List ticket entries (default: --qa --prod)
  -u, --update string[]   Update module entry | entries
                          (default: auto / watch)
  -f, --folder string     Watch / upload folder (default: ./src)
   -q, --qa               QA ticket entries list
  -d, --dev               Dev ticket entries list
  -p, --prod              Prod entries list
  --promote               Promote a ticket entry
```
