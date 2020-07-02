import fs from 'fs';
import { dirname } from 'path';
import cache, { IEP_STR } from 'iep-cache';
import resolve from './resolver';

export default ({ clientEntry, log, errors }) => {
  const srcPath = dirname(clientEntry);
  const iepMap = cache('iepMap');
  const iepSrc = cache('iepSrc');

  return async (req, res) => {
    try {
      const [, ticket] = (req.cookies.stamp || '').split('=');
      const pathname = `${srcPath}/${req.params[0]}`;
      res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');

      const iep = (await iepMap.get(ticket)) ||
        (await iepMap.get('prod')[0]) || { map: {} };

      const cacheKey = `${ticket}.${pathname}`;
      const cached = await iepSrc.get(cacheKey);

      if (cached.timestamp > iep.timestamp) {
        return res.send(cached[IEP_STR]);
      }

      const source = fs.readFileSync(pathname, 'utf8');
      resolve(source, ticket, pathname, iep.map).then((source) => {
        res.send(source);
      });
    } catch (err) {
      log.error('ts:resolve', err);
      res.status(500).send(errors.PROD_500);
    }
  };
};
