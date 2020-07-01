import fs from 'fs';
import { dirname } from 'path';
import resolve from './resolver';
import cache from './import-cache';

export default (clientEntry, log) => {
  const srcPath = dirname(clientEntry);
  const iepMap = cache('iepMap');
  const iepSrc = cache('iepSrc');

  return async (req, res) => {
    try {
      const [, ticket] = (req.cookies.stamp || '').split('=');
      const path = `${srcPath}/${req.params[0]}`;
      res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');

      const iep = (await iepMap.get(ticket)) ||
        (await iepMap.get('prod')[0]) || { map: {} };

      const cacheKey = `${ticket}.${path}`;
      const cached = await iepSrc.get(cacheKey);

      if (cached.timestamp > iep.timestamp) {
        return res.send(cached.source);
      }

      const source = fs.readFileSync(path, 'utf8');
      resolve(source, ticket, path, iep.map).then((source) => {
        res.send(source);
      });
    } catch (err) {
      log.error('resolve', err);
      res.status(500).send('Server error');
    }
  };
};
