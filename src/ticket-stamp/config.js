export default (config) => ({
  iepCache: {
    '--srcMap-persistance': 'key',
    ...config.iepCache,
  },
  ...config,
});
