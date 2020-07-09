import cache, { IEP_STR } from 'iep-cache';
import ImportMap from '../utils/import-map';
import stamp from '../utils/stamp';

export default ({
  iepMap,
  'iep-cache': { 'cache-persist-url': stampedPath },
}) => {
  const iepRoot = '/' + stampedPath.split('/').pop();
  const stampRoot = stampedPath.replace(iepRoot, '');
  const srcMap = cache('srcMap');

  return async (req, res, next) => {
    const { ticket } = req.params;
    const { id } = req.stamp;
    const { name, type } = req.body;
    const { md5, data } = req.files.file;
    const iep = await iepMap.get(ticket);
    if (iep) {
      if (iep.stage !== 'dev') {
        return res
          .status(401)
          .send(`ticket ${ticket} is already at ${iep.stage} stage`);
      }
      const iepName = `${iepRoot}/${name}.${md5}.${type}`;
      const iepPath = `${stampRoot}${iepName}`;
      srcMap.set(iepPath, { [IEP_STR]: data });

      const alias = type === 'js' ? name : `${name}.${type}`;
      const stamped = stamp({
        ...iep,
        id,
        map: ImportMap(iep.map, alias, iepName),
        status: 'updated',
        files: [...(iep.files || []).filter((file) => file !== alias), alias],
      });
      iepMap.set(ticket, stamped);
      return next({ payload: stamped, message: stamped });
    }
    res.status(404).send(`unrecognized ticket ${ticket}`);
  };
};
