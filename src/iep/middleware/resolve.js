import fs from 'fs';

export default (iepMap, serviceMap, resolve) => (srcPath) => (
  req,
  res,
  next
) => {
  const path = `${srcPath}/${req.params[0]}`;
  if (!fs.existsSync(path)) {
    console.error(`NOT FOUND: ${req.params[0]}`);
    return next();
  }
  const [stage = 'prod', ticket] = (req.cookies.stamp || '').split('=');
  const src = serviceMap[ticket][path] || fs.readFileSync(path, 'utf8');
  const iep = iepMap[ticket] || iepMap.prod[0] || { map: {} };

  res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');

  if (!serviceMap[path] && iep && iep.stage === stage) {
    resolve(src, path, iep.map).then((src) => {
      serviceMap[ticket][path] = src;
      res.send(src);
    });
  } else {
    res.send(src);
  }
};
