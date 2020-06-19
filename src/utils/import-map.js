export default (map, name, hashName) => {
  map = {
    ...map,
    imports: {
      ...map.imports,
      ...(hashName ? { [name]: hashName } : {}),
    },
  };
  return map;
};
