let defaultMap = {
  imports: {},
};

export default (name, hashName, map = defaultMap) => {
  map = {
    ...map,
    imports: {
      ...map.imports,
      ...(hashName ? { [name]: `/iep/${hashName}` } : {}),
    },
  };
  return map;
};

export const goLive = (map) => {
  defaultMap = map;
};
