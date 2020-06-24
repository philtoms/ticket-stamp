import loader from './loader-mw';
import render from './render';
import applyDefaults from './config-defaults';

export default (config) => {
  const { cache, entry, srcPath } = applyDefaults(config);
  return { render: render(entry), resolver: loader(cache, srcPath) };
};
