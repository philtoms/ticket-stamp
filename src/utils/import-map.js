let defaultMap = {
  imports: {},
};

export default (name, hashName, map = defaultMap) => {
  map = {
    ...map,
    imports: {
      ...map.imports,
      ...(hashName ? { [name]: `/stamped/${hashName}` } : {}),
    },
  };
  return map;
};
