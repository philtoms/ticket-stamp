# Using Ticket Stamp to proxy a website

This example defers all script handling to `ticket-stamp` middleware. This pattern effectively monkey patches an existing website by routing all requests through the ticketed entry point.

## install

`yarn`

## run

`TARGET=http://mylivesite yarn start`

at the command line run `yarn stamp TKT-NUM`

`yarn stamp (or stamp --help)`<br/>
`yarn stamp [--ticket] TKT-NUM`<br/>
`yarn stamp [TKT-NUM] --update --list --promote --verbose`<br/>
