import middleware from './middleware';
import render from './render';
import applyDefaults from './config';

export default (config) => {
  const { cache, serverEntry, clientEntry } = applyDefaults(config);
  return {
    render: render(serverEntry),
    middleware: middleware(cache, clientEntry),
  };
};
