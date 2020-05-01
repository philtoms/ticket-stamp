export default (fns) => (data) => fns.reduce((acc, fn) => fn(acc), data);
