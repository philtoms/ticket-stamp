const iepMap = { prod: '[]' };

export default {
  iepMap: {
    get: (key) => Promise.resolve(JSON.parse(iepMap[key] || false)),
    getAll: () =>
      Promise.resolve(
        Object.entries(iepMap).map(([key, value]) => [key, JSON.parse(value)])
      ),
    set: (key, value) => Promise.resolve((iepMap[key] = JSON.stringify(value))),
    remove: (ticket) => {
      delete iepMap[ticket];
      return Promise.resolve();
    },
  },
};
