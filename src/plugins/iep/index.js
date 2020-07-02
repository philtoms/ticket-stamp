import middleware from './middleware';
import render from './render';
import applyDefaults from './config';

export default (config) => {
  const iepConf = applyDefaults(config);
  return {
    render: render(iepConf),
    middleware: middleware(iepConf),
  };
};
