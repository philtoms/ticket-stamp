let defaultMap = {
  imports: {
    'vh-check': '/src/components/vh-check/index.js',
    'scroll-next': '/src/components/scroll-next/index.js',
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
