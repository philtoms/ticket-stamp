export default (file) => {
  const [type, ...path] = file.split('.').reverse();
  const part = path.filter(Boolean).join().split('/').reverse();
  const name = part[0] === 'index' ? part[1] : part[0];
  return [name, type, part];
};
