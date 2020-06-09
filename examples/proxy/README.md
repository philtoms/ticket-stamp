# Using Ticket Stamp to proxy a website

This example defers all script handling to `ticket-stamp` middleware. This pattern effectively monkey patches an existing website by routing all requests through the ticketed entry point.

## run

`TARGET=http://mylivesite` node --experimental-loader ../../src/iep/loader.js --experimental-specifier-resolution=node index.js

at the command line run `npx ticket-stamp tktnum`

`$ npx ticket-stamp (or stamp --help)`<br/>
`$ npx ticket-stamp [--ticket] TKT-NUM | tktnum`<br/>
`$ npx ticket-stamp [TKT-NUM] --update --list --promote --verbose`<br/>
