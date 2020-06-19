import fs from 'fs';
import { getService } from '../utils/stamp';

export default (iepMap, resolve) => (srcPath) => async (req, res, next) => {
  try {
    const path = `${srcPath}/${req.params[0]}`;
    if (!fs.existsSync(path)) {
      console.error(`NOT FOUND: ${req.params[0]}`);
      return next();
    }
    const [stage = 'prod', ticket] = (req.cookies.stamp || '').split('=');
    const service = getService(ticket);
    const src = service[path] || fs.readFileSync(path, 'utf8');
    const iep = (await iepMap.get(ticket)) ||
      (await iepMap.get(prod)[0]) || { map: {} };

    res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');

    if (!service[path] && iep && iep.stage === stage) {
      resolve(src, path, iep.map).then((src) => {
        service[path] = src;
        res.send(src);
      });
    } else {
      res.send(src);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};
