import fs from 'fs';
import { dirname } from 'path';
import cache, { IEP_STR } from 'iep-cache';
import resolve from './resolver';
import cookies from './utils/cookies';

export default ({ clientEntry, log, errors, ['iep-cache']: iepCache }) => {
  const srcPath = dirname(clientEntry);
  const iepMap = cache('iepMap', iepCache);
  const iepSrc = cache('iepSrc');
  const parseCookies = cookies();

  return async (req, res, next) => {
    try {
      res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');

      const pathname = `${srcPath}/${req.params[0]}`;

      const { ticket } = parseCookies(req);

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
