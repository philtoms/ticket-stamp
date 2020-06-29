const pick = (obj, [head, ...tail]) => {
  if (obj) {
    if (Array.isArray(obj[head])) {
      return obj[head].reduce(
        (acc, part) => (acc === undefined ? pick(part, tail) : acc),
        undefined
      );
    }
    return tail.length ? pick(obj[head], tail) : obj[head];
  }
};

export default (obj, path) => pick(obj, path.split('/'));
