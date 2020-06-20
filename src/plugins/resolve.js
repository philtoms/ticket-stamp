import fs from 'fs';

export default (cache, resolve, persistRoot) => (srcPath) => async (
  req,
  res,
  next
) => {
  const iepMap = cache('iepMap');
  const srcMap = cache('srcMap', {
    persistRoot,
    persistKey: true,
    checkForUpdates: true,
  });

  try {
    const [, ticket] = (req.cookies.stamp || '').split('=');
    const path = `${srcPath}/${req.params[0]}`;
    const cacheKey = `${ticket}.${path.replace(/\//g, '_')}`;
    if (!fs.existsSync(path)) {
      console.error(`NOT FOUND: ${req.params[0]}`);
      return next();
    }
    let src = await srcMap.get(cacheKey);
    if (!src) {
      src = fs.readFileSync(path, 'utf8');
      const iep = (await iepMap.get(ticket)) ||
        (await iepMap.get('prod')[0]) || { map: {} };
      src = await resolve(src, path, iep.map).then((src) => {
        srcMap.set(cacheKey, src);
        return src;
      });
    }
    res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
    res.send(src);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};
