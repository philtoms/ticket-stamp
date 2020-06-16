export default (name, type) => `${name.replace(`.${type}`, '')}.${type}`;
