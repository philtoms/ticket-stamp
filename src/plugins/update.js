import cache, { IEP_STR } from 'iep-cache';
import ImportMap from '../utils/import-map';
import stamp from '../utils/stamp';

export default ({ iep: { log }, stampedPath }, iepMap) => {
  const iepRoot = '/' + stampedPath.split('/').pop();
  const stampRoot = stampedPath.replace(iepRoot, '');
  const srcMap = cache('srcMap', { 'cache-persist-key': true });
  return async (req, res) => {
    try {
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
        // fs.writeFileSync(iepPath, data);
        // Will probably split into SSR and CSR imports
        const alias = type === 'js' ? name : `${name}.${type}`;

        const stamped = stamp({
          ...iep,
          id,
          map: ImportMap(iep.map, alias, iepName),
          status: 'updated',
          files: [...(iep.files || []).filter((file) => file !== alias), alias],
        });
        iepMap.set(ticket, stamped);
        log.info('update', stamped);
        return res.status(200).send(stamped);
      }
      res.status(404).send(`unrecognized ticket ${ticket}`);
    } catch (err) {
      log.error(err);
      res.status(500).send('Server error');
    }
  };
};
