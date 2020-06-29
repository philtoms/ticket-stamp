export default () => {
  const local = {};
  const res = {
    local,
    status: (value) => {
      local.status = value;
      return res;
    },
    send: (value) => {
      local.body = value;
      return res;
    },
  };
  return res;
};
