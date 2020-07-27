export default (config) => ({
  ...config,
  iepCache: {
    '--srcMap-persistance': 'key',
    ...config.iepCache,
  },
});
