import options, { optionDefinitions } from './options';
import usage from './usage';
import { register, update, list, promote, revert, close } from './api';

(async () => {
  if (options.ticket) {
    await register(options.ticket, options.verbose);
  }
  if (options.update) {
    await update(options.update, options.folder, options.verbose);
  }
  if (options.promote) {
    await promote(options.verbose);
  }
  if (options.revert) {
    await revert(options.verbose);
  }
  if (options.close) {
    await close(options.verbose);
  }
  if (options.list) {
    await list(options.prod, options.qa, options.dev, options.verbose);
  }
})();

if (options.help || Object.keys(options).length === 0) {
  console.log(usage(optionDefinitions));
}
