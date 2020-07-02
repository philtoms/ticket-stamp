import log from './utils/local-log';

export default (config) => ({
  iep: { log },
  ...config,
});
