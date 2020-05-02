export default (action, msg = '', ...args) => {
  console.log(action, msg, ...args);
  return msg;
};
