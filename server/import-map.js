let defaultMap = {
  imports: {
    'vh-check': '/src/vh-check.js',
    'scroll-next': '/src/scroll-next.js',
  },
};

export default (name, hashName, map = defaultMap) => {
  map = {
    ...map,
    imports: {
      ...map.imports,
      ...(hashName ? { [name]: `/modules/${hashName}` } : {}),
    },
  };
  return map;
};

export const goLive = (map) => {
  defaultMap = map;
};
