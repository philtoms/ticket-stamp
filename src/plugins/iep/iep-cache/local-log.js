const log = {
  info: (action, msg = '', ...args) => {
    console.log(action, msg, ...args);
    return msg;
  },

  warn: (action, msg = '', ...args) => {
    console.warn(action, msg, ...args);
    return msg;
  },

  error: (action, msg = '', ...args) => {
    console.error(action, msg, ...args);
    return msg;
  },
};

export default log;
