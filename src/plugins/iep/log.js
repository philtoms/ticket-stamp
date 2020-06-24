const log = (action, msg = '', ...args) => {
  console.log(action, msg, ...args);
  return msg;
};

log.info = log;
log.warn = (action, msg = '', ...args) => {
  console.warn(action, msg, ...args);
  return msg;
};

log.error = (action, msg = '', ...args) => {
  console.error(action, msg, ...args);
  return msg;
};

export default log;
