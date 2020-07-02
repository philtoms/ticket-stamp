import middleware from './middleware';
import render from './render';
import applyDefaults from './config';

export default (config) => {
  const { serverEntry, clientEntry, log } = applyDefaults(config);
  return {
    render: render(serverEntry),
    middleware: middleware(clientEntry, log),
  };
};
