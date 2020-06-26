import fs from 'fs';
import ImportMap from '../utils/import-map';
import stamp from '../utils/stamp';

export default ({ rootPath, stampDir, log }, iepMap) => async (req, res) => {
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
      const iepName = `${stampDir}/${name}.${md5}.${type}`;
      const iepPath = `${rootPath}${iepName}`;
      fs.writeFileSync(iepPath, data);
      // Will probably split into SSR and CSR imports
      const alias = type === 'js' ? name : `${name}.${type}`;

      const stamped = stamp(
        {
          ...iep,
          id,
          map: ImportMap(iep.map, alias, iepName),
          status: 'updated',
          files: [...(iep.files || []).filter((file) => file !== alias), alias],
        },
        true // restart worker to generate new import-map on next request
      );
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
